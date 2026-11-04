import mongoose from 'mongoose';
import {
  getRestaurantSettingsService,
  updateRestaurantSettingsService,
  getBusinessHoursService,
  updateBusinessHoursService,
  getPaymentSettingsService,
  updatePaymentSettingsService,
} from '../services/settingsService.js';
import { generateReceiptSnapshot } from '../services/orderService.js';
import { Receipt } from '../models/Receipt.js';
import { Order } from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import { emitSyncEvent } from '../config/socket.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await getRestaurantSettingsService(req.restaurantId);
  return sendSuccess(res, 'Settings fetched successfully', { settings }, HTTP_STATUS.OK, { settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await updateRestaurantSettingsService(req.restaurantId, req.body);
  emitSyncEvent({
    event: SOCKET_EVENTS.RESTAURANT_SETTINGS_UPDATED,
    restaurantId: req.restaurantId,
    data: { settings },
  });
  return sendSuccess(res, 'Restaurant settings updated successfully', { settings }, HTTP_STATUS.OK, { settings });
});

export const getBusinessHours = asyncHandler(async (req, res) => {
  const data = await getBusinessHoursService(req.restaurantId);
  return sendSuccess(res, 'Business hours fetched successfully', data, HTTP_STATUS.OK, { data });
});

export const updateBusinessHours = asyncHandler(async (req, res) => {
  const data = await updateBusinessHoursService(req.restaurantId, req.body);
  emitSyncEvent({
    event: SOCKET_EVENTS.RESTAURANT_SETTINGS_UPDATED,
    restaurantId: req.restaurantId,
    data: { businessHours: data },
  });
  return sendSuccess(res, 'Business hours and schedule updated successfully', data, HTTP_STATUS.OK, { data });
});

export const getPaymentSettings = asyncHandler(async (req, res) => {
  const payments = await getPaymentSettingsService(req.restaurantId);
  return sendSuccess(res, 'Payment settings fetched successfully', { payments }, HTTP_STATUS.OK, { payments });
});

export const updatePaymentSettings = asyncHandler(async (req, res) => {
  const payments = await updatePaymentSettingsService(req.restaurantId, req.body);
  emitSyncEvent({
    event: SOCKET_EVENTS.RESTAURANT_SETTINGS_UPDATED,
    restaurantId: req.restaurantId,
    data: { payments },
  });
  return sendSuccess(res, 'Payment settings updated successfully', { payments }, HTTP_STATUS.OK, { payments });
});

export const getReceiptByOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  let receipt = await Receipt.findOne({
    $or: [{ orderId }, { orderNumber: orderId }],
    restaurantId: req.restaurantId,
    isDeleted: { $ne: true },
  }).lean();

  if (!receipt) {
    const orderQuery = mongoose.Types.ObjectId.isValid(orderId)
      ? { _id: orderId, restaurantId: req.restaurantId, isDeleted: false }
      : { orderNumber: orderId, restaurantId: req.restaurantId, isDeleted: false };
    const order = await Order.findOne(orderQuery);

    if (order && order.status === 'completed') {
      receipt = await generateReceiptSnapshot(order._id);
      if (receipt && receipt.toObject) {
        receipt = receipt.toObject();
      }
    }
  }

  if (!receipt) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Receipt not found' });
  }

  return sendSuccess(res, 'Receipt fetched successfully', { receipt }, HTTP_STATUS.OK, { receipt });
});
