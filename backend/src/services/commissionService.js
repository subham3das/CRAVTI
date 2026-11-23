import mongoose from 'mongoose';
import { CommissionHistory } from '../models/CommissionHistory.js';
import { Restaurant } from '../models/Restaurant.js';
import { getPlatformFinanceSettings, updatePlatformFinanceSettings } from './platformSettingsService.js';
import { logFinanceAudit } from './auditService.js';

/**
 * Get effective commission rates and platform fee settings
 */
export const getEffectiveCommissionRates = async (restaurantId = null) => {
  const platformSettings = await getPlatformFinanceSettings();

  let restaurantCommission = platformSettings.defaultCommission;
  let restaurant = null;

  if (restaurantId) {
    restaurant = await Restaurant.findById(restaurantId).select('name commissionRate');
    if (restaurant && typeof restaurant.commissionRate === 'number') {
      restaurantCommission = restaurant.commissionRate;
    }
  }

  return {
    commissionRate: restaurantCommission,
    isCustom: restaurant && typeof restaurant.commissionRate === 'number',
    defaultCommission: platformSettings.defaultCommission,
    defaultGst: platformSettings.defaultGst,
    gatewayFeePercent: platformSettings.gatewayFeePercent,
    platformFee: platformSettings.platformFee,
    convenienceFee: platformSettings.convenienceFee,
    settlementCycle: platformSettings.settlementCycle,
    restaurantName: restaurant?.name || null,
  };
};

/**
 * Update commission rate for a specific restaurant or update platform default
 */
export const updateCommissionRateService = async ({
  restaurantId = null, // null for platform default
  newRate,
  reason,
  effectiveDate = new Date(),
  admin = null,
  ip = '127.0.0.1',
}) => {
  if (newRate === undefined || isNaN(Number(newRate)) || Number(newRate) < 0 || Number(newRate) > 100) {
    throw new Error('Commission rate must be a valid percentage between 0 and 100.');
  }
  if (!reason || reason.trim().length < 3) {
    throw new Error('A detailed reason is mandatory for changing commission rates.');
  }

  const rate = Math.round(Number(newRate) * 100) / 100;
  let oldRate = 0;
  let targetName = 'Global Platform Default';

  if (restaurantId) {
    const restId = new mongoose.Types.ObjectId(restaurantId);
    const restaurant = await Restaurant.findById(restId);
    if (!restaurant) {
      throw new Error('Restaurant not found.');
    }
    oldRate = typeof restaurant.commissionRate === 'number' ? restaurant.commissionRate : 5.0;
    targetName = restaurant.name;

    restaurant.commissionRate = rate;
    await restaurant.save();
  } else {
    const platformSettings = await getPlatformFinanceSettings();
    oldRate = platformSettings.defaultCommission;
    await updatePlatformFinanceSettings({ defaultCommission: rate }, admin);
  }

  // Create immutable Commission History record
  const history = new CommissionHistory({
    restaurantId: restaurantId ? new mongoose.Types.ObjectId(restaurantId) : null,
    oldRate,
    newRate: rate,
    reason: reason.trim(),
    effectiveDate: effectiveDate || new Date(),
    adminId: admin?._id || admin?.id || null,
    adminEmail: admin?.email || 'admin@craviti.com',
  });
  await history.save();

  // Audit log
  await logFinanceAudit({
    action: 'commission_changed',
    restaurantId,
    admin,
    ip,
    reason: `Commission changed from ${oldRate}% to ${rate}% for ${targetName}: ${reason}`,
    metadata: {
      oldRate,
      newRate: rate,
      target: targetName,
      effectiveDate,
    },
  });

  return { success: true, oldRate, newRate: rate, history };
};

/**
 * Get commission update history
 */
export const getCommissionHistoryService = async ({ restaurantId = null, page = 1, limit = 20 } = {}) => {
  const query = {};
  if (restaurantId) {
    query.restaurantId = new mongoose.Types.ObjectId(restaurantId);
  }

  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));

  const [history, total] = await Promise.all([
    CommissionHistory.find(query)
      .populate('restaurantId', 'name email')
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    CommissionHistory.countDocuments(query),
  ]);

  return {
    history,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
};

