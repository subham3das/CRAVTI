import { RestaurantSettings } from '../models/RestaurantSettings.js';
import { Restaurant } from '../models/Restaurant.js';
import { emitToRestaurant } from '../config/socket.js';

/**
 * Get or initialize settings for a restaurant
 */
export const getRestaurantSettingsService = async (restaurantId) => {
  let settings = await RestaurantSettings.findOne({ restaurantId });

  if (!settings) {
    settings = await RestaurantSettings.create({
      restaurantId,
    });
  }

  // Also include general restaurant profile info for unified settings view
  const restaurant = await Restaurant.findById(restaurantId)
    .select('restaurantName email phone address logo coverImage fssaiNumber gstNumber')
    .lean();

  return {
    ...settings.toObject(),
    restaurantProfile: restaurant || {},
  };
};

/**
 * Update general restaurant settings
 */
export const updateRestaurantSettingsService = async (restaurantId, data = {}) => {
  const {
    currency,
    timezone,
    language,
    estimatedPreparationTime,
    gstEnabled,
    gstPercentage,
    serviceChargeEnabled,
    serviceChargeType,
    serviceChargeValue,
    autoCompleteOrder,
    autoLockServedOrder,
    restaurantStatus,
    acceptOrders,
    receiptPrefix,
    receiptFooter,
    notificationSound,
    desktopNotification,
    notificationVolume,
    restaurantProfile,
  } = data;

  // Validations
  if (gstPercentage !== undefined) {
    const num = Number(gstPercentage);
    if (isNaN(num) || num < 0 || num > 100) {
      const err = new Error('GST percentage must be between 0 and 100');
      err.statusCode = 400;
      throw err;
    }
  }

  if (serviceChargeType === 'percentage' && serviceChargeValue !== undefined) {
    const num = Number(serviceChargeValue);
    if (isNaN(num) || num < 0 || num > 100) {
      const err = new Error('Service charge percentage cannot exceed 100%');
      err.statusCode = 400;
      throw err;
    }
  }

  if (receiptPrefix && receiptPrefix.length > 5) {
    const err = new Error('Receipt prefix cannot exceed 5 characters');
    err.statusCode = 400;
    throw err;
  }

  const updateFields = {};
  if (currency !== undefined) updateFields.currency = currency;
  if (timezone !== undefined) updateFields.timezone = timezone;
  if (language !== undefined) updateFields.language = language;
  if (estimatedPreparationTime !== undefined) updateFields.estimatedPreparationTime = Number(estimatedPreparationTime);
  if (gstEnabled !== undefined) updateFields.gstEnabled = Boolean(gstEnabled);
  if (gstPercentage !== undefined) updateFields.gstPercentage = Number(gstPercentage);
  if (serviceChargeEnabled !== undefined) updateFields.serviceChargeEnabled = Boolean(serviceChargeEnabled);
  if (serviceChargeType !== undefined) updateFields.serviceChargeType = serviceChargeType;
  if (serviceChargeValue !== undefined) updateFields.serviceChargeValue = Number(serviceChargeValue);
  if (autoCompleteOrder !== undefined) updateFields.autoCompleteOrder = Boolean(autoCompleteOrder);
  if (autoLockServedOrder !== undefined) updateFields.autoLockServedOrder = Boolean(autoLockServedOrder);
  if (restaurantStatus !== undefined) updateFields.restaurantStatus = restaurantStatus;
  if (acceptOrders !== undefined) updateFields.acceptOrders = Boolean(acceptOrders);
  if (receiptPrefix !== undefined) updateFields.receiptPrefix = receiptPrefix.toUpperCase().trim();
  if (receiptFooter !== undefined) updateFields.receiptFooter = receiptFooter;
  if (notificationSound !== undefined) updateFields.notificationSound = Boolean(notificationSound);
  if (desktopNotification !== undefined) updateFields.desktopNotification = Boolean(desktopNotification);
  if (notificationVolume !== undefined) updateFields.notificationVolume = Number(notificationVolume);

  const updatedSettings = await RestaurantSettings.findOneAndUpdate(
    { restaurantId },
    {
      $set: updateFields,
      $inc: { settingsVersion: 1 },
    },
    { new: true, upsert: true }
  );

  // Sync general profile fields to Restaurant collection if provided
  if (restaurantProfile && typeof restaurantProfile === 'object') {
    const restUpdate = {};
    if (restaurantProfile.restaurantName) restUpdate.restaurantName = restaurantProfile.restaurantName.trim();
    if (restaurantProfile.phone) restUpdate.phone = restaurantProfile.phone.trim();
    if (restaurantProfile.address) restUpdate.address = restaurantProfile.address;
    if (restaurantProfile.gstNumber !== undefined) restUpdate.gstNumber = restaurantProfile.gstNumber.trim();
    if (restaurantProfile.fssaiNumber !== undefined) restUpdate.fssaiNumber = restaurantProfile.fssaiNumber.trim();

    if (Object.keys(restUpdate).length > 0) {
      await Restaurant.findByIdAndUpdate(restaurantId, { $set: restUpdate });
    }
  }

  // Socket notification to restaurant dashboard
  try {
    emitToRestaurant(restaurantId, 'settings-updated', updatedSettings);
  } catch (err) {
    console.warn('Socket notification error:', err.message);
  }

  const latestRestaurant = await Restaurant.findById(restaurantId)
    .select('restaurantName email phone address logo coverImage fssaiNumber gstNumber')
    .lean();

  return {
    ...updatedSettings.toObject(),
    restaurantProfile: latestRestaurant || {},
  };
};

/**
 * Get Business Hours & Operating Status
 */
export const getBusinessHoursService = async (restaurantId) => {
  let settings = await RestaurantSettings.findOne({ restaurantId }).select(
    'businessHours restaurantStatus acceptOrders estimatedPreparationTime'
  );

  if (!settings) {
    settings = await RestaurantSettings.create({ restaurantId });
  }

  return {
    businessHours: settings.businessHours,
    restaurantStatus: settings.restaurantStatus,
    acceptOrders: settings.acceptOrders,
    estimatedPreparationTime: settings.estimatedPreparationTime,
  };
};

/**
 * Update Business Hours & Schedule
 */
export const updateBusinessHoursService = async (restaurantId, payload = {}) => {
  const { businessHours, restaurantStatus, acceptOrders } = payload;

  if (businessHours && Array.isArray(businessHours)) {
    // Validate each day's openTime < closeTime when isOpen is true
    for (const daySchedule of businessHours) {
      if (daySchedule.isOpen && daySchedule.openTime && daySchedule.closeTime) {
        if (daySchedule.openTime >= daySchedule.closeTime) {
          const err = new Error(
            `For ${daySchedule.day}, opening time (${daySchedule.openTime}) must be earlier than closing time (${daySchedule.closeTime})`
          );
          err.statusCode = 400;
          throw err;
        }
      }
    }
  }

  const updateFields = {};
  if (businessHours !== undefined) updateFields.businessHours = businessHours;
  if (restaurantStatus !== undefined) updateFields.restaurantStatus = restaurantStatus;
  if (acceptOrders !== undefined) updateFields.acceptOrders = Boolean(acceptOrders);

  const updated = await RestaurantSettings.findOneAndUpdate(
    { restaurantId },
    {
      $set: updateFields,
      $inc: { settingsVersion: 1 },
    },
    { new: true, upsert: true }
  );

  try {
    emitToRestaurant(restaurantId, 'settings-updated', updated);
  } catch (err) {
    console.warn('Socket notification error:', err.message);
  }

  return {
    businessHours: updated.businessHours,
    restaurantStatus: updated.restaurantStatus,
    acceptOrders: updated.acceptOrders,
  };
};

/**
 * Get Payment Methods Configuration
 */
export const getPaymentSettingsService = async (restaurantId) => {
  let settings = await RestaurantSettings.findOne({ restaurantId }).select('payments');

  if (!settings) {
    settings = await RestaurantSettings.create({ restaurantId });
  }

  return settings.payments;
};

/**
 * Update Payment Methods Configuration
 */
export const updatePaymentSettingsService = async (restaurantId, payments = {}) => {
  const updated = await RestaurantSettings.findOneAndUpdate(
    { restaurantId },
    {
      $set: { payments },
      $inc: { settingsVersion: 1 },
    },
    { new: true, upsert: true }
  );

  try {
    emitToRestaurant(restaurantId, 'settings-updated', updated);
  } catch (err) {
    console.warn('Socket notification error:', err.message);
  }

  return updated.payments;
};

