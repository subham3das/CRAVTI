import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import {
  createPaymentOrderService,
  verifyPaymentService,
  refundPaymentService,
  handleRazorpayWebhookService,
  fetchPaymentService,
  fetchAdminPaymentsService,
} from '../services/paymentService.js';
import { isRazorpayConfigured, getRazorpayInstance } from '../config/razorpay.js';
import env from '../config/env.js';

/**
 * POST /api/payment/create-order
 * Customer creates Razorpay payment order for their active order or PREPAY cart checkout
 */
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const {
    orderId,
    customerEmail,
    customerPhone,
    guestSessionId,
    restaurantSlug,
    tableIdentifier,
    guestId,
    deviceId,
    sessionId,
    customerName,
    items,
  } = req.body;

  if (!orderId && (!restaurantSlug || !items || !items.length)) {
    return sendError(
      res,
      'Either orderId or (restaurantSlug and items) is required to initialize payment',
      'Missing required payment order fields',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const orderData = await createPaymentOrderService({
    orderId,
    customerEmail,
    customerPhone,
    guestSessionId,
    restaurantSlug,
    tableIdentifier,
    guestId,
    deviceId,
    sessionId,
    customerName,
    items,
  });

  return sendSuccess(res, 'Payment order created successfully', orderData, HTTP_STATUS.CREATED);
});

/**
 * POST /api/payment/verify
 * Cryptographic HMAC signature verification
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const result = await verifyPaymentService({
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  return sendSuccess(res, 'Payment verified successfully', result, HTTP_STATUS.OK);
});

/**
 * POST /api/payments/webhook
 * POST /api/payment/webhook
 * Razorpay automated webhook receiver (Public route - protected exclusively by HMAC SHA256 signature)
 */
export const handlePaymentWebhook = async (req, res) => {
  const startTime = Date.now();
  const signature = req.headers['x-razorpay-signature'];

  if (!signature) {
    console.warn('[Razorpay Webhook] Rejected: Missing x-razorpay-signature header');
    return res.status(400).json({
      success: false,
      message: 'Missing x-razorpay-signature header',
    });
  }

  // Raw body required for cryptographic HMAC verification
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : req.rawBody || Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}), 'utf8');

  try {
    const result = await handleRazorpayWebhookService({
      rawBody,
      signature,
      headers: req.headers,
      startTime,
    });

    return res.status(200).json({
      status: 'ok',
      ...result,
    });
  } catch (err) {
    console.error(`[Razorpay Webhook] Processing error: ${err.message}`);
    const statusCode = err.statusCode === 500 ? 500 : 400;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Webhook verification failed',
    });
  }
};

// Export alias razorpayWebhook matching user's exact specification
export const razorpayWebhook = handlePaymentWebhook;

/**
 * GET /api/payment/gateway-status
 * Restaurant Panel Settings status query
 */
export const getGatewayStatus = asyncHandler(async (req, res) => {
  const configured = isRazorpayConfigured();
  const keyId = env.RAZORPAY_KEY_ID?.trim() || '';
  const maskedKey = keyId.length > 8 ? `${keyId.slice(0, 8)}••••••••` : 'Not Configured';

  return sendSuccess(res, 'Payment gateway configuration loaded', {
    gateway: 'Razorpay',
    status: configured ? 'Connected' : 'Not Configured',
    environment: (env.RAZORPAY_MODE || 'test').toUpperCase(),
    merchantKeyMasked: maskedKey,
    webhook: Boolean(env.RAZORPAY_WEBHOOK_SECRET?.trim()) ? 'Connected' : 'Pending Setup',
    isConfigured: configured,
  });
});

/**
 * POST /api/payment/test-connection
 * Connection test for Restaurant / Admin panel
 */
export const testGatewayConnection = asyncHandler(async (req, res) => {
  if (!isRazorpayConfigured()) {
    return sendError(
      res,
      'Razorpay credentials are not configured in backend/.env',
      'Missing keys',
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }

  try {
    const razorpay = getRazorpayInstance();
    // Fetch payments list with limit 1 as a lightweight health check ping
    await razorpay.payments.all({ count: 1 });
    return sendSuccess(res, 'Razorpay Connection Test Passed (200 OK)', {
      gateway: 'Razorpay',
      status: 'PASS',
      environment: env.RAZORPAY_MODE || 'test',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return sendError(
      res,
      `Razorpay Gateway Connection Test Failed: ${err.message}`,
      err.message,
      HTTP_STATUS.BAD_REQUEST,
      { status: 'FAIL', error: err.message }
    );
  }
});

/**
 * GET /api/payment/:paymentId
 * Retrieve single payment transaction details
 */
export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await fetchPaymentService(req.params.paymentId);
  return sendSuccess(res, 'Payment details retrieved', { payment });
});

/**
 * POST /api/payment/refund
 * Process payment refund (Admin or Authorized Restaurant)
 */
export const refundPayment = asyncHandler(async (req, res) => {
  const { paymentId, amount, reason } = req.body;
  if (!paymentId) {
    return sendError(res, 'Payment ID is required', 'Missing paymentId', HTTP_STATUS.BAD_REQUEST);
  }

  const actor = req.admin?.email || req.user?.email || 'admin';
  const result = await refundPaymentService({
    paymentId,
    amount,
    reason,
    actor,
  });

  return sendSuccess(res, 'Refund processed successfully', result);
});

/**
 * GET /api/payment/admin/all
 * Admin Payments Center with Metrics and Pagination
 */
export const getAdminPayments = asyncHandler(async (req, res) => {
  const data = await fetchAdminPaymentsService(req.query);
  return sendSuccess(res, 'Admin payments loaded successfully', data);
});

