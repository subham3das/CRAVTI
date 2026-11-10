import crypto from 'crypto';
import mongoose from 'mongoose';
import { Payment } from '../models/Payment.js';
import { Order } from '../models/Order.js';
import { Receipt } from '../models/Receipt.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { RestaurantNotification } from '../models/RestaurantNotification.js';
import { generateReceiptSnapshot } from './orderService.js';
import { emitSyncEvent, emitToOrder } from '../config/socket.js';
import SOCKET_EVENTS from '../constants/socketEvents.js';
import env from '../config/env.js';

/**
 * Secure timing-safe cryptographic comparison
 */
export const safeCompare = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Validates the Razorpay HMAC SHA256 Webhook Signature
 */
export const verifyRazorpayWebhookSignature = ({ rawBody, signature, secret }) => {
  const webhookSecret = secret || env.RAZORPAY_WEBHOOK_SECRET?.trim() || process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    const error = new Error('Razorpay webhook secret is not configured on server.');
    error.statusCode = 500;
    throw error;
  }

  if (!signature) {
    const error = new Error('Missing x-razorpay-signature header.');
    error.statusCode = 400;
    throw error;
  }

  // Ensure rawBody is a Buffer or string
  const payloadBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody || '', 'utf8');

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payloadBuffer)
    .digest('hex');

  const isValid = safeCompare(expectedSignature, signature);
  if (!isValid) {
    const error = new Error('Invalid webhook cryptographic signature.');
    error.statusCode = 400;
    throw error;
  }

  return true;
};

/**
 * Creates In-App Notification for Restaurant Staff
 */
const notifyRestaurant = async ({ restaurantId, type, title, message, link = '/orders' }) => {
  if (!restaurantId) return;
  try {
    await RestaurantNotification.create({
      restaurantId,
      type: type || 'PAYMENT',
      title,
      message,
      link,
    });
  } catch (err) {
    console.warn(`[Razorpay Webhook] Failed to save restaurant notification: ${err.message}`);
  }
};

/**
 * Core Production Razorpay Webhook Processor
 */
export const processRazorpayWebhook = async ({ rawBody, signature, headers = {}, startTime = Date.now() }) => {
  // 1. Signature Verification
  let isValid = false;
  try {
    isValid = verifyRazorpayWebhookSignature({ rawBody, signature });
    console.log('[Razorpay Webhook] Verification result: VALID');
  } catch (sigErr) {
    console.warn(`[Razorpay Webhook] Verification result: INVALID (${sigErr.message})`);
    throw sigErr;
  }

  // 2. Parse Raw JSON Body
  let eventData = {};
  try {
    const jsonString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
    eventData = JSON.parse(jsonString);
  } catch (parseErr) {
    console.error(`[Razorpay Webhook] Malformed JSON payload: ${parseErr.message}`);
    const err = new Error('Malformed JSON payload received in webhook.');
    err.statusCode = 400;
    throw err;
  }

  const event = eventData.event || 'unknown';
  const eventId =
    eventData.id ||
    headers['x-razorpay-event-id'] ||
    `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const payload = eventData.payload || {};

  // Extract core entity nodes
  const paymentEntity = payload.payment?.entity || null;
  const orderEntity = payload.order?.entity || null;
  const refundEntity = payload.refund?.entity || null;

  // Extract notes and metadata
  const notes = paymentEntity?.notes || orderEntity?.notes || {};
  const rzpPaymentId = paymentEntity?.id || refundEntity?.payment_id || '';
  const rzpOrderId = orderEntity?.id || paymentEntity?.order_id || '';
  const orderId = notes.orderId || notes.order_id || '';
  const restaurantId = notes.restaurantId || notes.restaurant_id || '';
  const tableId = notes.tableId || notes.table_id || '';
  const guestSessionId = notes.guestSessionId || notes.guest_session_id || notes.guestId || '';

  // Log Webhook Received (Standard Logging Requirement)
  console.log(`[Razorpay Webhook] Webhook received: Event=${event}, EventID=${eventId}`);
  console.log(`[Razorpay Webhook] Payment ID: ${rzpPaymentId || 'N/A'}, Order ID: ${orderId || rzpOrderId || 'N/A'}, Restaurant ID: ${restaurantId || 'N/A'}`);

  // 3. Idempotency Check & Audit Log Initiation
  let auditLog = await WebhookEvent.findOne({ eventId });
  if (auditLog && auditLog.processingStatus === 'processed') {
    console.log(`[Razorpay Webhook] Duplicate event detected (${eventId}). Returning 200 OK.`);
    return {
      status: 'ok',
      message: 'Duplicate event already processed',
      duplicate: true,
      eventId,
      event,
    };
  }

  if (!auditLog) {
    try {
      auditLog = await WebhookEvent.create({
        eventId,
        eventType: event,
        receivedAt: new Date(),
        payload: eventData,
        processingStatus: 'processing',
        paymentId: rzpPaymentId,
        orderId: orderId || rzpOrderId,
        restaurantId: restaurantId || null,
        tableId: tableId || null,
        guestSessionId: guestSessionId || '',
        verificationResult: 'VALID',
      });
    } catch (createErr) {
      // If unique index collision occurred concurrently
      if (createErr.code === 11000) {
        console.log(`[Razorpay Webhook] Concurrent duplicate detected for event ${eventId}`);
        return {
          status: 'ok',
          message: 'Concurrent duplicate event already processed',
          duplicate: true,
          eventId,
          event,
        };
      }
      console.warn(`[Razorpay Webhook] Audit log creation warning: ${createErr.message}`);
    }
  }

  let processingResult = '';
  let responsePayload = { status: 'ok', event, eventId };

  try {
    switch (event) {
      // ==========================================
      // EVENT: payment.authorized
      // ==========================================
      case 'payment.authorized': {
        if (paymentEntity) {
          const payment = await Payment.findOne({
            $or: [
              { razorpayOrderId: rzpOrderId },
              { razorpayPaymentId: rzpPaymentId },
              ...(orderId ? [{ orderId }] : []),
            ],
          });

          if (payment) {
            payment.status = 'authorized';
            if (rzpPaymentId) {
              payment.razorpayPaymentId = rzpPaymentId;
              payment.paymentId = rzpPaymentId;
            }
            if (paymentEntity.method) payment.method = paymentEntity.method;
            payment.auditHistory.push({
              action: 'WEBHOOK_PAYMENT_AUTHORIZED',
              status: 'authorized',
              actor: 'razorpay_webhook',
              timestamp: new Date(),
              details: {
                eventId,
                amount: paymentEntity.amount / 100,
                method: paymentEntity.method,
              },
            });
            await payment.save();
          }
        }
        processingResult = 'Payment authorized recorded successfully.';
        break;
      }

      // ==========================================
      // EVENTS: payment.captured, order.paid
      // ==========================================
      case 'payment.captured':
      case 'order.paid': {
        const amountPaise = paymentEntity?.amount || orderEntity?.amount_paid || 0;
        const amountRupees = amountPaise / 100;
        const method = paymentEntity?.method || 'online';
        const feeRupees = (paymentEntity?.fee || 0) / 100;
        const taxRupees = (paymentEntity?.tax || 0) / 100;
        const capturedDate = paymentEntity?.captured_at
          ? new Date(paymentEntity.captured_at * 1000)
          : new Date();

        // 1. Locate or Upsert Payment Document
        let payment = await Payment.findOne({
          $or: [
            ...(rzpOrderId ? [{ razorpayOrderId: rzpOrderId }] : []),
            ...(rzpPaymentId ? [{ razorpayPaymentId: rzpPaymentId }, { paymentId: rzpPaymentId }] : []),
            ...(orderId ? [{ orderId }] : []),
          ],
        });

        // 2. Locate Matching Order Document
        let order = null;
        if (orderId) {
          order = await Order.findById(orderId);
        }
        if (!order && payment?.orderId) {
          order = await Order.findById(payment.orderId);
        }
        if (!order && rzpOrderId) {
          order = await Order.findOne({
            $or: [
              { 'metadata.razorpayOrderId': rzpOrderId },
              { 'notes.razorpayOrderId': rzpOrderId },
            ],
          });
        }

        const effectiveRestaurantId =
          restaurantId || order?.restaurantId || payment?.restaurantId || null;
        const effectiveTableId = tableId || order?.tableId || payment?.tableId || null;
        const effectiveGuestSessionId =
          guestSessionId || order?.guestId || order?.sessionId || payment?.guestSessionId || '';

        const validRestaurantId =
          effectiveRestaurantId && mongoose.Types.ObjectId.isValid(effectiveRestaurantId)
            ? effectiveRestaurantId
            : null;
        const validOrderId =
          order?._id || (orderId && mongoose.Types.ObjectId.isValid(orderId) ? orderId : null);
        const validTableId =
          effectiveTableId && mongoose.Types.ObjectId.isValid(effectiveTableId)
            ? effectiveTableId
            : null;

        if (!payment) {
          payment = new Payment({
            restaurantId: validRestaurantId,
            orderId: validOrderId,
            razorpayOrderId: rzpOrderId || `order_webhook_${Date.now()}`,
            razorpayPaymentId: rzpPaymentId,
            paymentId: rzpPaymentId,
            amount: amountRupees || order?.grandTotal || 0,
            currency: paymentEntity?.currency || 'INR',
            status: 'captured',
            method,
            fee: feeRupees,
            tax: taxRupees,
            bank: paymentEntity?.bank || '',
            email: paymentEntity?.email || '',
            phone: paymentEntity?.contact || '',
            capturedAt: capturedDate,
            tableId: validTableId,
            guestSessionId: effectiveGuestSessionId,
            auditHistory: [],
            refundHistory: [],
          });
        } else {
          payment.status = 'captured';
          payment.razorpayPaymentId = rzpPaymentId || payment.razorpayPaymentId;
          payment.paymentId = rzpPaymentId || payment.paymentId;
          payment.method = method;
          payment.fee = feeRupees || payment.fee;
          payment.tax = taxRupees || payment.tax;
          payment.capturedAt = capturedDate;
          if (paymentEntity?.bank) payment.bank = paymentEntity.bank;
          if (paymentEntity?.email) payment.email = paymentEntity.email;
          if (paymentEntity?.contact) payment.phone = paymentEntity.contact;
          if (validTableId && !payment.tableId) payment.tableId = validTableId;
          if (effectiveGuestSessionId && !payment.guestSessionId) {
            payment.guestSessionId = effectiveGuestSessionId;
          }
          if (validRestaurantId && !payment.restaurantId) {
            payment.restaurantId = validRestaurantId;
          }
          if (validOrderId && !payment.orderId) {
            payment.orderId = validOrderId;
          }
        }

        payment.auditHistory.push({
          action: event === 'order.paid' ? 'WEBHOOK_ORDER_PAID' : 'WEBHOOK_PAYMENT_CAPTURED',
          status: 'captured',
          actor: 'razorpay_webhook',
          timestamp: new Date(),
          details: {
            eventId,
            rzpPaymentId,
            rzpOrderId,
            amount: amountRupees,
            fee: feeRupees,
            tax: taxRupees,
            method,
          },
        });

        // 3. Update Order State
        let receipt = null;
        if (order) {
          order.paymentStatus = 'paid_online';
          order.paymentMethod = method || 'online';
          order.cashierStatus = 'paid';
          order.status = 'completed'; // Transitions order to completed per Craviti dining workflow

          order.statusHistory.push({
            status: 'completed',
            timestamp: new Date(),
            updatedBy: 'razorpay_webhook',
            note: `Payment of INR ${order.grandTotal} captured via Razorpay Webhook (${rzpPaymentId || eventId})`,
          });
          await order.save();

          // 4. Generate Immutable Receipt if Missing
          receipt = await Receipt.findOne({ orderId: order._id });
          if (!receipt) {
            try {
              receipt = await generateReceiptSnapshot(order._id);
            } catch (rcptErr) {
              console.warn(`[Razorpay Webhook] Receipt generation warning: ${rcptErr.message}`);
            }
          }

          if (receipt && !payment.receiptId) {
            payment.receiptId = receipt._id;
          }

          // 5. Real-Time Socket Broadcasts
          emitSyncEvent({
            event: SOCKET_EVENTS.PAYMENT_SUCCESS,
            restaurantId: order.restaurantId,
            data: {
              orderId: order._id,
              orderNumber: order.orderNumber,
              amount: order.grandTotal,
              paymentMethod: method,
              razorpayPaymentId: rzpPaymentId,
              source: 'webhook',
            },
          });

          emitSyncEvent({
            event: SOCKET_EVENTS.ORDER_PAID,
            restaurantId: order.restaurantId,
            data: {
              orderId: order._id,
              orderNumber: order.orderNumber,
              amount: order.grandTotal,
              tableNumber: order.tableNumber,
            },
          });

          emitSyncEvent({
            event: SOCKET_EVENTS.ORDER_UPDATED,
            restaurantId: order.restaurantId,
            data: {
              orderId: order._id,
              status: order.status,
              paymentStatus: 'paid_online',
            },
          });

          if (receipt) {
            emitSyncEvent({
              event: SOCKET_EVENTS.RECEIPT_GENERATED,
              restaurantId: order.restaurantId,
              data: {
                orderId: order._id,
                receiptId: receipt._id,
                receiptNumber: receipt.receiptNumber,
              },
            });
          }

          emitToOrder(order._id.toString(), 'order-paid', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            paymentStatus: 'paid_online',
            receiptId: receipt?._id,
          });

          // 6. Push In-App Restaurant Notification
          await notifyRestaurant({
            restaurantId: order.restaurantId,
            type: 'PAYMENT',
            title: `Payment Received: Order #${order.orderNumber}`,
            message: `Customer paid INR ${order.grandTotal} via ${method.toUpperCase()} (${rzpPaymentId || 'Online'}).`,
            link: '/orders',
          });
        }

        await payment.save();
        processingResult = `Payment ${rzpPaymentId} captured for Order ${order?.orderNumber || orderId || 'N/A'}`;
        break;
      }

      // ==========================================
      // EVENT: payment.failed
      // ==========================================
      case 'payment.failed': {
        const failureReason =
          paymentEntity?.error_description ||
          paymentEntity?.error_reason ||
          paymentEntity?.error_code ||
          'Payment transaction declined by gateway';

        const payment = await Payment.findOne({
          $or: [
            ...(rzpOrderId ? [{ razorpayOrderId: rzpOrderId }] : []),
            ...(rzpPaymentId ? [{ razorpayPaymentId: rzpPaymentId }] : []),
            ...(orderId ? [{ orderId }] : []),
          ],
        });

        if (payment) {
          payment.status = 'failed';
          payment.failureReason = failureReason;
          if (rzpPaymentId) {
            payment.razorpayPaymentId = rzpPaymentId;
            payment.paymentId = rzpPaymentId;
          }
          payment.auditHistory.push({
            action: 'WEBHOOK_PAYMENT_FAILED',
            status: 'failed',
            actor: 'razorpay_webhook',
            timestamp: new Date(),
            details: {
              eventId,
              errorCode: paymentEntity?.error_code,
              errorDescription: paymentEntity?.error_description,
              errorSource: paymentEntity?.error_source,
              errorStep: paymentEntity?.error_step,
            },
          });
          await payment.save();
        }

        // Note in Order status history if order exists
        let order = null;
        if (orderId) order = await Order.findById(orderId);
        else if (payment?.orderId) order = await Order.findById(payment.orderId);

        if (order && order.paymentStatus !== 'paid_online') {
          order.statusHistory.push({
            status: order.status,
            timestamp: new Date(),
            updatedBy: 'razorpay_webhook',
            note: `Payment attempt failed: ${failureReason} (${rzpPaymentId})`,
          });
          await order.save();

          emitSyncEvent({
            event: SOCKET_EVENTS.PAYMENT_FAILED,
            restaurantId: order.restaurantId,
            data: {
              orderId: order._id,
              orderNumber: order.orderNumber,
              reason: failureReason,
              razorpayPaymentId: rzpPaymentId,
            },
          });

          emitToOrder(order._id.toString(), 'payment-failed', {
            orderId: order._id,
            reason: failureReason,
          });
        }

        processingResult = `Payment failure recorded: ${failureReason}`;
        break;
      }

      // ==========================================
      // EVENTS: refund.created, refund.processed
      // ==========================================
      case 'refund.created':
      case 'refund.processed': {
        const refundId = refundEntity?.id || '';
        const refundAmount = (refundEntity?.amount || 0) / 100;
        const refundDate = refundEntity?.created_at
          ? new Date(refundEntity.created_at * 1000)
          : new Date();
        const refundReason = refundEntity?.notes?.reason || 'Webhook processed refund';

        const payment = await Payment.findOne({
          $or: [
            ...(rzpPaymentId ? [{ razorpayPaymentId: rzpPaymentId }, { paymentId: rzpPaymentId }] : []),
            ...(rzpOrderId ? [{ razorpayOrderId: rzpOrderId }] : []),
          ],
        });

        if (payment) {
          payment.status = 'refunded';
          payment.refundId = refundId;
          payment.refundAmount = refundAmount;
          payment.refundDate = refundDate;

          payment.refundHistory.push({
            refundId,
            amount: refundAmount,
            status: refundEntity?.status || 'processed',
            reason: refundReason,
            createdAt: refundDate,
          });

          payment.auditHistory.push({
            action: event === 'refund.created' ? 'WEBHOOK_REFUND_CREATED' : 'WEBHOOK_REFUND_PROCESSED',
            status: 'refunded',
            actor: 'razorpay_webhook',
            timestamp: new Date(),
            details: {
              eventId,
              refundId,
              amount: refundAmount,
              status: refundEntity?.status,
            },
          });
          await payment.save();

          if (payment.orderId) {
            const order = await Order.findById(payment.orderId);
            if (order) {
              order.paymentStatus = 'refunded';
              order.statusHistory.push({
                status: 'refunded',
                timestamp: new Date(),
                updatedBy: 'razorpay_webhook',
                note: `Refund of INR ${refundAmount} processed (${refundId})`,
              });
              await order.save();

              emitSyncEvent({
                event: SOCKET_EVENTS.PAYMENT_REFUNDED,
                restaurantId: payment.restaurantId,
                data: {
                  paymentId: payment._id,
                  orderId: payment.orderId,
                  refundId,
                  amount: refundAmount,
                },
              });
            }
          }
        }

        processingResult = `Refund ${refundId} of INR ${refundAmount} recorded.`;
        break;
      }

      // ==========================================
      // DEFAULT: Safely ignore unknown/unhandled events
      // ==========================================
      default: {
        processingResult = `Unhandled event "${event}" safely ignored.`;
        console.log(`[Razorpay Webhook] ${processingResult}`);
        break;
      }
    }

    // 4. Update Audit Log upon Successful Processing
    const durationMs = Date.now() - startTime;
    if (auditLog) {
      auditLog.processingStatus = event.startsWith('payment.') || event.startsWith('order.') || event.startsWith('refund.') ? 'processed' : 'ignored';
      auditLog.processingResult = processingResult;
      auditLog.paymentId = rzpPaymentId;
      auditLog.orderId = orderId || rzpOrderId;
      auditLog.restaurantId = restaurantId || null;
      auditLog.durationMs = durationMs;
      await auditLog.save();
    }

    console.log(`[Razorpay Webhook] Processing result: status=processed, message=${processingResult} (took ${durationMs}ms)`);

    return {
      status: 'ok',
      message: processingResult,
      event,
      eventId,
      durationMs,
    };
  } catch (procErr) {
    console.error(`[Razorpay Webhook] Error during event processing: ${procErr.message}`);
    if (auditLog) {
      auditLog.processingStatus = 'failed';
      auditLog.errorMessage = procErr.message;
      auditLog.durationMs = Date.now() - startTime;
      await auditLog.save().catch(() => {});
    }
    throw procErr;
  }
};

export default {
  verifyRazorpayWebhookSignature,
  processRazorpayWebhook,
};
