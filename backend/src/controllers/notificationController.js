import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  getRestaurantNotificationsService,
  markRestaurantNotificationReadService,
  markAllRestaurantNotificationsReadService,
} from '../services/notificationService.js';

export const getRestaurantNotifications = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId || req.restaurant?._id;
  const result = await getRestaurantNotificationsService(restaurantId, req.query);

  return sendSuccess(res, 'Notifications retrieved', result);
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId || req.restaurant?._id;
  const result = await markRestaurantNotificationReadService(req.params.id, restaurantId);

  return sendSuccess(res, 'Notification marked as read', result);
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId || req.restaurant?._id;
  const result = await markAllRestaurantNotificationsReadService(restaurantId);

  return sendSuccess(res, 'All notifications marked as read', result);
});

