import mongoose from 'mongoose';
import {
  getCustomerMenuService,
  getActiveCustomerOrderService,
  placeOrderService,
  getOrderByIdService,
  updateOrderStatusService,
  updatePaymentStatusService,
  getLiveOrdersService,
  getHistoricalOrdersService,
  getOrderMetricsService,
  softDeleteOrderService,
  generateReceiptSnapshot,
} from '../services/orderService.js';
import { Receipt } from '../models/Receipt.js';
import { Order } from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';

export const getCustomerMenu = asyncHandler(async (req, res) => {
  const { restaurantSlug, tableId, qrToken: paramToken } = req.params;
  const { guestId, deviceId, token, qrToken: queryToken } = req.query;
  const resolvedToken = paramToken || token || queryToken || '';
  const data = await getCustomerMenuService(restaurantSlug, tableId, guestId, deviceId, resolvedToken);
  return sendSuccess(res, 'Menu loaded successfully', data, HTTP_STATUS.OK, { data });
});

export const getActiveCustomerOrder = asyncHandler(async (req, res) => {
  const { restaurantSlug, tableId } = req.params;
  const { guestId, deviceId } = req.query;
  const order = await getActiveCustomerOrderService({
    restaurantSlug,
    tableIdentifier: tableId,
    guestId,
    deviceId,
  });
  return sendSuccess(res, 'Active order fetched', { order }, HTTP_STATUS.OK, { order });
});

export const placeOrder = asyncHandler(async (req, res) => {
  const result = await placeOrderService(req.body);
  return sendSuccess(
    res,
    result.appended ? 'Additional items added to your active order' : 'Order placed successfully',
    { order: result.order, appended: result.appended, guestId: result.guestId },
    HTTP_STATUS.CREATED,
    { order: result.order, appended: result.appended, guestId: result.guestId }
  );
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await getOrderByIdService(req.params.id);
  return sendSuccess(res, 'Order details fetched', { order }, HTTP_STATUS.OK, { order });
});

export const getOrderReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { orderId: id, isDeleted: { $ne: true } }
    : { orderNumber: id, isDeleted: { $ne: true } };

  let receipt = await Receipt.findOne(query).lean();

  if (!receipt) {
    const orderQuery = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id, isDeleted: false }
      : { orderNumber: id, isDeleted: false };
    const order = await Order.findOne(orderQuery);

    if (order && order.status === 'completed') {
      receipt = await generateReceiptSnapshot(order._id);
      if (receipt && receipt.toObject) {
        receipt = receipt.toObject();
      }
    }
  }

  if (!receipt) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Receipt not found or order not yet completed',
    });
  }

  return sendSuccess(res, 'Receipt fetched successfully', { receipt }, HTTP_STATUS.OK, { receipt });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const updatedBy = req.user ? `${req.user.role || 'staff'}:${req.user._id}` : 'staff';
  const { status, note } = req.body;
  const order = await updateOrderStatusService(req.params.id, status, updatedBy, note);
  return sendSuccess(res, 'Order status updated', { order }, HTTP_STATUS.OK, { order });
});

export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const updatedBy = req.user ? `${req.user.role || 'staff'}:${req.user._id}` : 'cashier';
  const { paymentStatus, paymentMethod, note } = req.body;
  const order = await updatePaymentStatusService(req.params.id, paymentStatus, paymentMethod, updatedBy, note);
  return sendSuccess(res, 'Payment status updated', { order }, HTTP_STATUS.OK, { order });
});

export const getLiveOrders = asyncHandler(async (req, res) => {
  const orders = await getLiveOrdersService(req.restaurantId, req.query);
  return sendSuccess(res, 'Live orders fetched', { orders }, HTTP_STATUS.OK, { orders });
});

export const getHistoricalOrders = asyncHandler(async (req, res) => {
  const data = await getHistoricalOrdersService(req.restaurantId, req.query);
  return sendSuccess(res, 'Historical orders fetched', data, HTTP_STATUS.OK, { data });
});

export const getOrderMetrics = asyncHandler(async (req, res) => {
  const metrics = await getOrderMetricsService(req.restaurantId);
  return sendSuccess(res, 'Order metrics fetched', { metrics }, HTTP_STATUS.OK, { metrics });
});

export const softDeleteOrder = asyncHandler(async (req, res) => {
  const result = await softDeleteOrderService(req.params.id, req.restaurantId, req.user._id);
  return sendSuccess(res, 'Order deleted successfully', result, HTTP_STATUS.OK, result);
});
