import { RestaurantNotification } from '../models/RestaurantNotification.js';
import { AdminNotification } from '../models/AdminNotification.js';
import { emitToRestaurant, emitToAdmin } from '../config/socket.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { logger } from '../utils/logger.js';

/**
 * Create a restaurant notification and dispatch real-time socket event
 */
export const createRestaurantNotification = async ({
  restaurantId,
  type = 'GENERAL',
  title,
  message,
  link = '',
  metadata = {},
}) => {
  try {
    const notification = await RestaurantNotification.create({
      restaurantId,
      type,
      title,
      message,
      link,
      metadata,
    });

    // Real-time Socket.IO dispatch
    emitToRestaurant(restaurantId, SOCKET_EVENTS.NOTIFICATION_CREATED, {
      notification,
      restaurantId: restaurantId.toString(),
      type: 'RESTAURANT',
    });

    return notification;
  } catch (err) {
    logger.warn(`Failed to create restaurant notification: ${err.message}`);
    return null;
  }
};

/**
 * Create an admin notification and dispatch real-time socket event
 */
export const createAdminNotification = async ({
  type,
  title,
  message,
  restaurantId = null,
  link = '',
}) => {
  try {
    const notification = await AdminNotification.create({
      type,
      title,
      message,
      restaurantId,
      link,
    });

    // Real-time Socket.IO dispatch to admin room
    emitToAdmin(SOCKET_EVENTS.NOTIFICATION_CREATED, {
      notification,
      restaurantId: restaurantId ? restaurantId.toString() : null,
      type: 'ADMIN',
    });

    return notification;
  } catch (err) {
    logger.warn(`Failed to create admin notification: ${err.message}`);
    return null;
  }
};

/**
 * Get restaurant notifications with unread count
 */
export const getRestaurantNotificationsService = async (restaurantId, options = {}) => {
  const limit = Math.min(Math.max(parseInt(options.limit || 20, 10), 1), 100);

  const [notifications, unreadCount] = await Promise.all([
    RestaurantNotification.find({ restaurantId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    RestaurantNotification.countDocuments({ restaurantId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
  };
};

/**
 * Mark a single restaurant notification read
 */
export const markRestaurantNotificationReadService = async (notificationId, restaurantId) => {
  const notification = await RestaurantNotification.findOneAndUpdate(
    { _id: notificationId, restaurantId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  const unreadCount = await RestaurantNotification.countDocuments({
    restaurantId,
    isRead: false,
  });

  return { notification, unreadCount };
};

/**
 * Mark all restaurant notifications read
 */
export const markAllRestaurantNotificationsReadService = async (restaurantId) => {
  await RestaurantNotification.updateMany(
    { restaurantId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return { unreadCount: 0 };
};

