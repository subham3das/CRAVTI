import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import {
  createManualOrderService,
  getManualOrdersService,
  getManualOrderByIdService,
  updateManualOrderService,
  markManualOrderPaidService,
  cancelManualOrderService,
  printManualOrderReceiptService,
} from '../services/manualOrderService.js';

/**
 * @desc Create a new manual POS bill (Draft, Generated, or Mark Paid)
 * @route POST /api/manual-orders
 * @access Private (Owner, Manager, Cashier)
 */
export const createManualOrder = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant?._id || req.user?.restaurantId;
  const result = await createManualOrderService({
    restaurantId,
    user: req.user,
    payload: req.body,
  });

  const order = result?.order || result;
  return sendSuccess(
    res,
    result.message || 'Manual order processed successfully',
    { order, receipt: result.receipt },
    HTTP_STATUS.CREATED,
    { order, receipt: result.receipt }
  );
});

/**
 * @desc Get list of manual orders with timeframe and status filtering
 * @route GET /api/manual-orders
 * @access Private (Owner, Manager, Cashier)
 */
export const getManualOrders = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant?._id || req.user?.restaurantId;
  const result = await getManualOrdersService(restaurantId, req.query);

  return sendSuccess(res, 'Manual orders retrieved successfully', result, HTTP_STATUS.OK);
});

/**
 * @desc Get single manual order details by ID
 * @route GET /api/manual-orders/:id
 * @access Private (Owner, Manager, Cashier)
 */
export const getManualOrderById = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant?._id || req.user?.restaurantId;
  const order = await getManualOrderByIdService(restaurantId, req.params.id);

  return sendSuccess(res, 'Manual order retrieved successfully', { order }, HTTP_STATUS.OK);
});

/**
 * @desc Update a manual order / bill (items, customer details, discount, etc.)
 * @route PATCH /api/manual-orders/:id
 * @access Private (Owner, Manager, Cashier)
 */
export const updateManualOrder = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant?._id || req.user?.restaurantId;
  const result = await updateManualOrderService({
    restaurantId,
    user: req.user,
    orderId: req.params.id,
    payload: req.body,
  });

  const order = result?.order || result;
  return sendSuccess(
    res,
    result?.message || 'Manual order updated successfully',
    { order },
    HTTP_STATUS.OK,
    { order }
  );
});

/**
 * @desc Mark manual order as paid (Cash, UPI, Card, Split)
 * @route PATCH /api/manual-orders/:id/pay
 * @access Private (Owner, Manager, Cashier)
 */
export const markManualOrderPaid = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant?._id || req.user?.restaurantId;
  const { paymentMethod, splitPayments } = req.body;

  const result = await markManualOrderPaidService({
    restaurantId,
    user: req.user,
    orderId: req.params.id,
    paymentMethod,
    splitPayments,
  });

  const order = result?.order || result;
  return sendSuccess(
    res,
    result?.message || 'Bill settled successfully',
    { order, receipt: result?.receipt },
    HTTP_STATUS.OK,
    { order, receipt: result?.receipt }
  );
});

/**
 * @desc Cancel a manual order / bill
 * @route DELETE /api/manual-orders/:id
 * @access Private (Owner, Manager, Cashier)
 */
export const cancelManualOrder = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant?._id || req.user?.restaurantId;
  const { reason } = req.body || {};

  const result = await cancelManualOrderService({
    restaurantId,
    user: req.user,
    orderId: req.params.id,
    reason: reason || req.query.reason || 'Cancelled by staff',
  });

  return sendSuccess(res, result.message || 'Manual order cancelled successfully', result, HTTP_STATUS.OK);
});

/**
 * @desc Get thermal/browser receipt format for manual order
 * @route POST /api/manual-orders/:id/print
 * @access Private (Owner, Manager, Cashier)
 */
export const printManualOrderReceipt = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurant?._id || req.user?.restaurantId;
  const result = await printManualOrderReceiptService({
    restaurantId,
    orderId: req.params.id,
  });

  return sendSuccess(res, 'Receipt prepared for printing', result, HTTP_STATUS.OK);
});

