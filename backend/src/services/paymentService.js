import crypto from 'crypto';
import { getRazorpayInstance, isRazorpayConfigured } from '../config/razorpay.js';
import env from '../config/env.js';
import { Payment } from '../models/Payment.js';
import { Order } from '../models/Order.js';
import { Restaurant } from '../models/Restaurant.js';
import { FeatureFlags } from '../models/FeatureFlags.js';
import { generateReceiptSnapshot } from './orderService.js';
import { emitSyncEvent, emitToOrder } from '../config/socket.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { createRestaurantNotification, createAdminNotification } from './notificationService.js';

/**
 * Constant helper for timing-safe string comparison
 */
const safeCompare = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * 1. Create Razorpay Payment Order
 * Checks feature flags, restaurant payment enabled, and initializes order with Razorpay.
 */
export const createPaymentOrderService = async ({
  orderId,
  customerEmail = '',
  customerPhone = '',
  guestSessionId = '',
}) => {
  const order = await Order.findById(orderId);
  if (!order || order.isDeleted) {
    const error = new Error('Order not found or has been cancelled.');
    error.statusCode = 404;
    throw error;
  }

  const restaurant = await Restaurant.findById(order.restaurantId);
  if (!restaurant || restaurant.isDeleted) {
    const error = new Error('Restaurant not found or is currently suspended.');
    error.statusCode = 404;
    throw error;
  }

  // Feature Flag Validation
  const flags = await FeatureFlags.findOne({ restaurantId: restaurant._id });
  const isOnlinePaymentEnabled =
    flags?.onlinePaymentsEnabled !== false &&
    flags?.onlinePaymentEnabled !== false &&
    restaurant.paymentEnabled === true;

  if (!isOnlinePaymentEnabled) {
    const error = new Error('Online payments are currently disabled for this restaurant. Please pay via Cash/Counter.');
    error.statusCode = 403;
    throw error;
  }

  if (!isRazorpayConfigured()) {
    const error = new Error('Payment gateway is currently offline (credentials not configured in .env).');
    error.statusCode = 503;
    throw error;
  }

  const razorpay = getRazorpayInstance();
  const amountInPaise = Math.max(100, Math.round(order.grandTotal * 100)); // Minimum 100 paise (₹1)

  // Call Razorpay API to create order
  const rzpOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: order.orderNumber,
    notes: {
      orderId: order._id.toString(),
      restaurantId: restaurant._id.toString(),
      orderNumber: order.orderNumber,
      tableNumber: String(order.tableNumber),
    },
  });

  // Record or update Payment model in MongoDB
  let payment = await Payment.findOne({ orderId: order._id, status: 'created' });
  if (!payment) {
    payment = new Payment({
      restaurantId: restaurant._id,
      orderId: order._id,
      guestSessionId: guestSessionId || order.guestId || '',
      razorpayOrderId: rzpOrder.id,
      amount: order.grandTotal,
      currency: 'INR',
      status: 'created',
      email: customerEmail || order.customerEmail || '',
      phone: customerPhone || order.customerPhone || '',
      notes: rzpOrder.notes,
      metadata: {
        razorpayOrder: rzpOrder,
        mode: env.RAZORPAY_MODE || 'test',
      },
      auditHistory: [
        {
          action: 'CREATE_ORDER',
          status: 'created',
          actor: 'customer',
          timestamp: new Date(),
          details: { razorpayOrderId: rzpOrder.id, amountInPaise },
        },
      ],
    });
  } else {
    payment.razorpayOrderId = rzpOrder.id;
    payment.amount = order.grandTotal;
    payment.metadata = {
      razorpayOrder: rzpOrder,
      mode: env.RAZORPAY_MODE || 'test',
    };
    payment.auditHistory.push({
      action: 'RECREATE_ORDER',
      status: 'created',
      actor: 'customer',
      timestamp: new Date(),
      details: { razorpayOrderId: rzpOrder.id, amountInPaise },
    });
  }

  await payment.save();

  // Socket notification
  emitSyncEvent({
    event: SOCKET_EVENTS.PAYMENT_CREATED,
    restaurantId: restaurant._id,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.grandTotal,
      razorpayOrderId: rzpOrder.id,
    },
  });

  return {
    razorpayOrderId: rzpOrder.id,
    amount: order.grandTotal,
    amountInPaise,
    currency: 'INR',
    keyId: env.RAZORPAY_KEY_ID?.trim() || '',
    orderId: order._id,
    orderNumber: order.orderNumber,
    restaurantName: restaurant.restaurantName,
    description: `Order #${order.orderNumber} - Table ${order.tableNumber}`,
    prefill: {
      name: order.customerName || 'Guest',
      email: customerEmail || '',
      contact: customerPhone || order.customerPhone || '',
    },
  };
};

/**
 * 2. Verify Razorpay Payment Signature
 * Cryptographically verifies HMAC SHA-256 signature.
 * On success, completes order, marks cashier status paid, and generates receipt snapshot.
 */
export const verifyPaymentService = async ({
  orderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    const error = new Error('Incomplete payment verification payload.');
    error.statusCode = 400;
    throw error;
  }

  const keySecret = env.RAZORPAY_KEY_SECRET?.trim();
  if (!keySecret) {
    const error = new Error('Razorpay secret key is not configured on the server.');
    error.statusCode = 500;
    throw error;
  }

  // Verify HMAC-SHA256 signature
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  const isValid = safeCompare(expectedSignature, razorpaySignature);
  if (!isValid) {
    // Record failed payment attempt
    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      {
        $set: { status: 'failed', razorpayPaymentId, razorpaySignature },
        $push: {
          auditHistory: {
            action: 'VERIFY_FAILED',
            status: 'failed',
            actor: 'system',
            timestamp: new Date(),
            details: { reason: 'Invalid cryptographic signature' },
          },
        },
      }
    );

    const error = new Error('Invalid payment signature. Payment could not be verified.');
    error.statusCode = 400;
    throw error;
  }

  // Find payment and order
  const payment = await Payment.findOne({ razorpayOrderId });
  const order = await Order.findById(orderId || payment?.orderId);

  if (!order) {
    const error = new Error('Order associated with this payment was not found.');
    error.statusCode = 404;
    throw error;
  }

  // Idempotency: If already paid, return existing state
  if (payment && payment.status === 'captured' && order.paymentStatus === 'paid_online') {
    const receipt = await generateReceiptSnapshot(order._id);
    return {
      verified: true,
      message: 'Payment was already verified and processed.',
      order,
      payment,
      receipt,
    };
  }

  // Fetch payment details from Razorpay to capture method/bank
  let method = 'online';
  let email = '';
  let phone = '';
  let bank = '';
  try {
    const razorpay = getRazorpayInstance();
    const rzpPayment = await razorpay.payments.fetch(razorpayPaymentId);
    if (rzpPayment) {
      method = rzpPayment.method || 'online';
      email = rzpPayment.email || '';
      phone = rzpPayment.contact || '';
      bank = rzpPayment.bank || rzpPayment.wallet || rzpPayment.vpa || '';
    }
  } catch (err) {
    console.warn('[Razorpay] Could not fetch payment metadata from gateway:', err.message);
  }

  // Update Payment Record
  if (payment) {
    payment.status = 'captured';
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.method = method;
    payment.email = email || payment.email;
    payment.phone = phone || payment.phone;
    payment.bank = bank || payment.bank;
    payment.auditHistory.push({
      action: 'PAYMENT_SUCCESS',
      status: 'captured',
      actor: 'razorpay_verification',
      timestamp: new Date(),
      details: { razorpayPaymentId, method, bank },
    });
    await payment.save();
  }

  // Update Order State
  order.paymentStatus = 'paid_online';
  order.paymentMethod = method || 'online';
  order.cashierStatus = 'paid';
  order.status = 'completed'; // Completes order and triggers receipt download eligibility
  order.statusHistory.push({
    status: 'completed',
    timestamp: new Date(),
    updatedBy: 'razorpay',
    note: `Online payment of INR ${order.grandTotal} captured (${razorpayPaymentId})`,
  });
  await order.save();

  // Generate Immutable Receipt Snapshot
  const receipt = await generateReceiptSnapshot(order._id);
  if (receipt && payment) {
    payment.receiptId = receipt._id;
    await payment.save();
  }

  // Socket Dispatches (Real-time sync to Restaurant, Admin, and Customer)
  emitSyncEvent({
    event: SOCKET_EVENTS.PAYMENT_SUCCESS,
    restaurantId: order.restaurantId,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.grandTotal,
      paymentMethod: method,
      razorpayPaymentId,
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
      status: 'completed',
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

  // Create In-App Notification
  await createRestaurantNotification({
    restaurantId: order.restaurantId,
    type: 'PAYMENT',
    title: `Payment Received: Order #${order.orderNumber}`,
    message: `Customer paid INR ${order.grandTotal} via ${method.toUpperCase()} (${razorpayPaymentId}).`,
    link: '/orders',
  });

  return {
    verified: true,
    message: 'Payment verified and captured successfully.',
    order,
    payment,
    receipt,
  };
};

/**
 * 3. Process Refund for a Payment
 */
export const refundPaymentService = async ({
  paymentId,
  amount,
  reason = 'Customer requested refund',
  actor = 'admin',
}) => {
  const payment = await Payment.findById(paymentId);
  if (!payment || payment.isDeleted) {
    const error = new Error('Payment record not found.');
    error.statusCode = 404;
    throw error;
  }

  if (payment.status !== 'captured') {
    const error = new Error(`Cannot refund payment in status "${payment.status}".`);
    error.statusCode = 400;
    throw error;
  }

  const refundAmount = amount ? Number(amount) : payment.amount;
  if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > payment.amount) {
    const error = new Error('Invalid refund amount.');
    error.statusCode = 400;
    throw error;
  }

  const razorpay = getRazorpayInstance();
  const rzpRefund = await razorpay.payments.refund(payment.razorpayPaymentId, {
    amount: Math.round(refundAmount * 100),
    notes: { reason, actor },
  });

  payment.status = 'refunded';
  payment.refundHistory.push({
    refundId: rzpRefund.id,
    amount: refundAmount,
    status: rzpRefund.status || 'processed',
    reason,
    createdAt: new Date(),
  });
  payment.auditHistory.push({
    action: 'REFUND_PROCESSED',
    status: 'refunded',
    actor,
    timestamp: new Date(),
    details: { refundId: rzpRefund.id, refundAmount, reason },
  });
  await payment.save();

  // Update associated Order
  const order = await Order.findById(payment.orderId);
  if (order) {
    order.paymentStatus = 'refunded';
    order.statusHistory.push({
      status: 'refunded',
      timestamp: new Date(),
      updatedBy: actor,
      note: `Refund of INR ${refundAmount} processed (${rzpRefund.id})`,
    });
    await order.save();
  }

  emitSyncEvent({
    event: SOCKET_EVENTS.PAYMENT_REFUNDED,
    restaurantId: payment.restaurantId,
    data: {
      paymentId: payment._id,
      orderId: payment.orderId,
      refundId: rzpRefund.id,
      amount: refundAmount,
    },
  });

  return {
    success: true,
    message: 'Refund processed successfully.',
    payment,
    refund: rzpRefund,
  };
};

/**
 * 4. Verify and Handle Razorpay Webhooks
 */
export const handleRazorpayWebhookService = async ({ rawBody, signature }) => {
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    const error = new Error('Razorpay webhook secret not configured.');
    error.statusCode = 500;
    throw error;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (!safeCompare(expectedSignature, signature)) {
    const error = new Error('Invalid webhook cryptographic signature.');
    error.statusCode = 400;
    throw error;
  }

  const eventData = JSON.parse(rawBody.toString('utf8'));
  const event = eventData.event;
  const payload = eventData.payload;

  console.log(`[Razorpay Webhook] Received event: ${event}`);

  switch (event) {
    case 'payment.captured': {
      const paymentEntity = payload.payment.entity;
      const rzpOrderId = paymentEntity.order_id;
      const rzpPaymentId = paymentEntity.id;

      const payment = await Payment.findOne({ razorpayOrderId: rzpOrderId });
      if (payment && payment.status !== 'captured') {
        payment.status = 'captured';
        payment.razorpayPaymentId = rzpPaymentId;
        payment.method = paymentEntity.method || 'online';
        payment.auditHistory.push({
          action: 'WEBHOOK_PAYMENT_CAPTURED',
          status: 'captured',
          actor: 'razorpay_webhook',
          timestamp: new Date(),
          details: paymentEntity,
        });
        await payment.save();

        const order = await Order.findById(payment.orderId);
        if (order && order.paymentStatus !== 'paid_online') {
          order.paymentStatus = 'paid_online';
          order.cashierStatus = 'paid';
          order.status = 'completed';
          await order.save();
          await generateReceiptSnapshot(order._id);
        }
      }
      break;
    }

    case 'payment.failed': {
      const paymentEntity = payload.payment.entity;
      const rzpOrderId = paymentEntity.order_id;

      await Payment.findOneAndUpdate(
        { razorpayOrderId: rzpOrderId },
        {
          $set: { status: 'failed', razorpayPaymentId: paymentEntity.id },
          $push: {
            auditHistory: {
              action: 'WEBHOOK_PAYMENT_FAILED',
              status: 'failed',
              actor: 'razorpay_webhook',
              timestamp: new Date(),
              details: { errorCode: paymentEntity.error_code, description: paymentEntity.error_description },
            },
          },
        }
      );
      break;
    }

    case 'refund.processed': {
      const refundEntity = payload.refund.entity;
      const rzpPaymentId = refundEntity.payment_id;

      const payment = await Payment.findOne({ razorpayPaymentId: rzpPaymentId });
      if (payment && payment.status !== 'refunded') {
        payment.status = 'refunded';
        payment.refundHistory.push({
          refundId: refundEntity.id,
          amount: refundEntity.amount / 100,
          status: 'processed',
          reason: refundEntity.notes?.reason || 'Webhook processed refund',
          createdAt: new Date(),
        });
        await payment.save();
      }
      break;
    }

    default:
      console.log(`[Razorpay Webhook] Unhandled event: ${event}`);
  }

  return { received: true, event };
};

/**
 * 5. Fetch Single Payment Record
 */
export const fetchPaymentService = async (paymentId) => {
  const payment = await Payment.findById(paymentId)
    .populate('restaurantId', 'restaurantName logo address phone')
    .populate('orderId')
    .populate('receiptId');

  if (!payment) {
    const error = new Error('Payment not found.');
    error.statusCode = 404;
    throw error;
  }

  return payment;
};

/**
 * 6. Fetch Admin Payments List with Analytics
 */
export const fetchAdminPaymentsService = async (query = {}) => {
  const { page = 1, limit = 20, status, search, restaurantId } = query;
  const filter = { isDeleted: false };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (restaurantId) {
    filter.restaurantId = restaurantId;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total, statsAgg] = await Promise.all([
    Payment.find(filter)
      .populate('restaurantId', 'restaurantName slug')
      .populate('orderId', 'orderNumber tableNumber items grandTotal')
      .populate('receiptId', 'receiptNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),

    Payment.countDocuments(filter),

    Payment.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          capturedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'captured'] }, 1, 0] },
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
          refundedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] },
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'captured'] }, '$amount', 0] },
          },
        },
      },
    ]),
  ]);

  const stats = statsAgg[0] || {
    totalPayments: 0,
    capturedPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    totalRevenue: 0,
  };

  const successRate = stats.totalPayments > 0
    ? Math.round((stats.capturedPayments / stats.totalPayments) * 100)
    : 100;

  return {
    payments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)) || 1,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
    metrics: {
      totalPayments: stats.totalPayments,
      capturedPayments: stats.capturedPayments,
      failedPayments: stats.failedPayments,
      refundedPayments: stats.refundedPayments,
      totalRevenue: stats.totalRevenue,
      successRate,
    },
  };
};

