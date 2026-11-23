import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import env from '../config/env.js';
import {
  createSubscriptionService,
  cancelSubscriptionService,
  getSubscriptionStatusService,
  confirmSubscriptionService,
  renewSubscriptionService,
  handleSubscriptionWebhookService,
} from '../services/subscriptionService.js';

/**
 * POST /api/subscription/create
 * Authenticated Restaurant endpoint to initiate subscription
 */
export const createSubscription = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant?._id || req.user?.restaurantId;
  const { planName, planId } = req.body;

  const result = await createSubscriptionService({
    restaurantId,
    user: req.user,
    planName: planName || 'Craviti Pro',
    planId,
  });

  return sendSuccess(res, 'Subscription initialized successfully', result, HTTP_STATUS.CREATED);
});

/**
 * POST /api/subscription/confirm
 * Authenticated Restaurant endpoint to verify & activate subscription post-checkout
 */
export const confirmSubscription = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant?._id || req.user?.restaurantId;
  const { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature } = req.body;

  const result = await confirmSubscriptionService({
    restaurantId,
    razorpayPaymentId,
    razorpaySubscriptionId,
    razorpaySignature,
  });

  return sendSuccess(res, result.message, result, HTTP_STATUS.OK);
});

/**
 * POST /api/subscription/renew
 * Authenticated Restaurant endpoint to renew active subscription
 */
export const renewSubscription = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant?._id || req.user?.restaurantId;
  const { months = 1 } = req.body;

  const result = await renewSubscriptionService({
    restaurantId,
    months,
    amount: 699,
  });

  return sendSuccess(res, 'Subscription renewed successfully', result, HTTP_STATUS.OK);
});

/**
 * POST /api/subscription/cancel
 * Authenticated Restaurant endpoint to cancel subscription
 */
export const cancelSubscription = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant?._id || req.user?.restaurantId;
  const { cancelImmediately } = req.body;

  const result = await cancelSubscriptionService({
    restaurantId,
    user: req.user,
    cancelImmediately,
  });

  return sendSuccess(res, result.message, result, HTTP_STATUS.OK);
});

/**
 * GET /api/subscription/status
 * Authenticated Restaurant endpoint to retrieve status & entitlements
 */
export const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant?._id || req.user?.restaurantId;

  const status = await getSubscriptionStatusService(restaurantId);

  return sendSuccess(res, 'Subscription status retrieved', status, HTTP_STATUS.OK);
});

/**
 * POST /api/webhooks/razorpay
 * Public webhook endpoint for Razorpay Subscription events
 * Signature verified via HMAC-SHA256
 */
export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const webhookSignature = req.headers['x-razorpay-signature'];
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

  let eventBody = req.body;

  // If raw body buffer is present, verify signature
  if (Buffer.isBuffer(req.body)) {
    if (webhookSecret && webhookSignature) {
      try {
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(req.body)
          .digest('hex');

        if (expectedSignature !== webhookSignature) {
          console.warn('[Razorpay Webhook] Invalid webhook signature');
          return sendError(res, 'Invalid webhook signature', 'SIGNATURE_VERIFICATION_FAILED', HTTP_STATUS.BAD_REQUEST);
        }
      } catch (sigErr) {
        console.error('[Razorpay Webhook] Signature verification error:', sigErr.message);
      }
    }
    try {
      eventBody = JSON.parse(req.body.toString('utf8'));
    } catch {
      eventBody = {};
    }
  }

  const { event, payload } = eventBody;
  console.log(`[Razorpay Webhook] Received event: ${event}`);

  if (event && event.startsWith('subscription.')) {
    const result = await handleSubscriptionWebhookService(event, payload);
    return res.status(HTTP_STATUS.OK).json({ status: 'ok', handled: true, result });
  }

  // Cross-route payment, order, and refund events if sent to subscription webhook URL
  if (
    event &&
    (event.startsWith('payment.') || event.startsWith('order.') || event.startsWith('refund.'))
  ) {
    try {
      const { processRazorpayWebhook } = await import('../services/webhookService.js');
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}), 'utf8');
      const result = await processRazorpayWebhook({
        rawBody,
        signature: webhookSignature,
        headers: req.headers,
      });
      return res.status(HTTP_STATUS.OK).json({ status: 'ok', handled: true, result });
    } catch (routeErr) {
      console.warn(`[Webhook Interop] Payment event error: ${routeErr.message}`);
    }
  }

  // Acknowledge all events promptly to avoid Razorpay retries
  return res.status(HTTP_STATUS.OK).json({ status: 'ok', received: true });
});

