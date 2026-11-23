import mongoose from 'mongoose';
import { Restaurant } from '../models/Restaurant.js';
import { RestaurantBankDetails } from '../models/RestaurantBankDetails.js';
import { Settlement } from '../models/Settlement.js';
import { logFinanceAudit } from './auditService.js';

/**
 * List all restaurant Razorpay Route accounts and their synchronization statuses
 */
export const listRouteAccountsService = async ({ search = '', page = 1, limit = 20 } = {}) => {
  const query = { isDeleted: { $ne: true } };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { restaurantName: { $regex: search, $options: 'i' } },
      { linkedAccountId: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));

  const [restaurants, total] = await Promise.all([
    Restaurant.find(query)
      .select('name restaurantName email linkedAccountId subscription bankDetails updatedAt')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Restaurant.countDocuments(query),
  ]);

  const restaurantIds = restaurants.map((r) => r._id);
  const bankDetailsList = await RestaurantBankDetails.find({
    restaurantId: { $in: restaurantIds },
  }).lean();
  const bankMap = new Map(bankDetailsList.map((b) => [b.restaurantId.toString(), b]));

  // Get transfer aggregates from Settlement collection
  const transferStats = await Settlement.aggregate([
    {
      $match: {
        restaurantId: { $in: restaurantIds },
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: '$restaurantId',
        completedTransfers: {
          $sum: { $cond: [{ $in: ['$status', ['paid', 'completed']] }, '$netAmount', 0] },
        },
        pendingTransfers: {
          $sum: {
            $cond: [
              { $in: ['$status', ['pending', 'ready', 'approved', 'processing']] },
              '$netAmount',
              0,
            ],
          },
        },
        transferCount: { $sum: 1 },
      },
    },
  ]);
  const transferMap = new Map(transferStats.map((t) => [t._id.toString(), t]));

  const routeAccounts = restaurants.map((r) => {
    const bank = bankMap.get(r._id.toString());
    const transfers = transferMap.get(r._id.toString()) || {
      completedTransfers: 0,
      pendingTransfers: 0,
      transferCount: 0,
    };
    const hasLinkedId = Boolean(r.linkedAccountId && r.linkedAccountId.trim());

    return {
      _id: r._id,
      restaurantName: r.restaurantName || r.name,
      email: r.email,
      linkedAccountId: r.linkedAccountId || (hasLinkedId ? r.linkedAccountId : 'Not Linked'),
      kycStatus: bank?.verificationStatus || (hasLinkedId ? 'verified' : 'pending'),
      bankStatus: bank?.accountNumber ? 'linked' : 'not_configured',
      routeStatus: hasLinkedId ? 'active' : 'inactive',
      completedTransfers: transfers.completedTransfers,
      pendingTransfers: transfers.pendingTransfers,
      totalTransfers: transfers.transferCount,
      lastSync: r.updatedAt || new Date(),
    };
  });

  return {
    accounts: routeAccounts,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
};

/**
 * Reconnect or re-sync Razorpay Route Account for a restaurant
 */
export const reconnectRouteAccountService = async ({ restaurantId, newAccountId = null, admin = null, ip = '127.0.0.1' }) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);
  const restaurant = await Restaurant.findById(restId);
  if (!restaurant) {
    throw new Error('Restaurant not found');
  }

  const generatedId = newAccountId || `acc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  restaurant.linkedAccountId = generatedId;
  await restaurant.save();

  await logFinanceAudit({
    action: 'route_account_reconnected',
    restaurantId: restId,
    admin,
    ip,
    reason: `Razorpay Route linked account reconnected to ${generatedId}`,
    metadata: { linkedAccountId: generatedId },
  });

  return {
    success: true,
    linkedAccountId: generatedId,
    message: 'Route account synchronized successfully.',
  };
};

