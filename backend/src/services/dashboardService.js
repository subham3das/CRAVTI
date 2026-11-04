import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { MenuItem } from '../models/MenuItem.js';
import { Category } from '../models/Category.js';
import { Table } from '../models/Table.js';
import { Restaurant } from '../models/Restaurant.js';
import { RestaurantBankDetails } from '../models/RestaurantBankDetails.js';

/**
 * Service to aggregate production live metrics for the Restaurant Dashboard.
 * Strictly tenant-isolated to restaurantId with parallel Promise.all execution.
 */
export const getRestaurantDashboardService = async (restaurantId, user = null) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);

  // Time boundaries: Today and Yesterday (Server local boundaries)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const endOfYesterday = new Date(startOfToday.getTime() - 1);

  // Parallel Query Execution
  const [
    todayOrdersAgg,
    yesterdayOrdersAgg,
    kitchenMetricsAgg,
    menuMetricsAgg,
    tableMetricsAgg,
    restaurantDoc,
    bankDetailsDoc,
    popularItemsAgg,
    recentOrdersDocs,
    hourlyTrafficAgg,
  ] = await Promise.all([
    // 1. Today's Orders & Revenue Aggregation
    Order.aggregate([
      {
        $match: {
          restaurantId: restId,
          isDeleted: false,
          createdAt: { $gte: startOfToday, $lte: endOfToday },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          pendingOrders: {
            $sum: { $cond: [{ $in: ['$status', ['placed', 'accepted']] }, 1, 0] },
          },
          todayRevenue: {
            $sum: {
              $cond: [
                { $in: ['$paymentStatus', ['paid_online', 'paid_cash']] },
                '$grandTotal',
                0,
              ],
            },
          },
        },
      },
    ]),

    // 2. Yesterday's Orders & Revenue (for Growth calculation)
    Order.aggregate([
      {
        $match: {
          restaurantId: restId,
          isDeleted: false,
          createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
        },
      },
      {
        $group: {
          _id: null,
          yesterdayOrders: { $sum: 1 },
          yesterdayRevenue: {
            $sum: {
              $cond: [
                { $in: ['$paymentStatus', ['paid_online', 'paid_cash']] },
                '$grandTotal',
                0,
              ],
            },
          },
        },
      },
    ]),

    // 3. Live Kitchen Operations & Prep Time Aggregation
    Order.aggregate([
      {
        $match: {
          restaurantId: restId,
          isDeleted: false,
        },
      },
      {
        $facet: {
          activeCounts: [
            {
              $group: {
                _id: null,
                activeOrders: {
                  $sum: { $cond: [{ $in: ['$status', ['placed', 'accepted']] }, 1, 0] },
                },
                served: {
                  $sum: { $cond: [{ $eq: ['$status', 'served'] }, 1, 0] },
                },
                pendingCash: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$paymentMethod', 'cash'] },
                          { $eq: ['$paymentStatus', 'pending'] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          prepTimeSamples: [
            {
              $match: {
                createdAt: { $gte: startOfToday },
                status: { $in: ['served', 'completed'] },
                'statusHistory.status': 'accepted',
              },
            },
            { $limit: 50 },
            {
              $project: {
                statusHistory: 1,
              },
            },
          ],
        },
      },
    ]),

    // 4. Menu Catalog Metrics
    Promise.all([
      MenuItem.countDocuments({ restaurantId: restId, isDeleted: false }),
      Category.countDocuments({ restaurantId: restId, isDeleted: false }),
      MenuItem.countDocuments({ restaurantId: restId, isDeleted: false, popular: true }),
      MenuItem.countDocuments({ restaurantId: restId, isDeleted: false, availability: 'out_of_stock' }),
    ]),

    // 5. Table & QR Metrics
    Promise.all([
      Table.countDocuments({ restaurantId: restId, isActive: true }),
      Table.countDocuments({ restaurantId: restId, isActive: true, status: 'available' }),
      Table.countDocuments({ restaurantId: restId, isActive: true, status: 'occupied' }),
      Table.countDocuments({ restaurantId: restId, isActive: true, qrCode: { $ne: '' } }),
    ]),

    // 6. Restaurant Profile Data
    Restaurant.findById(restId).lean(),

    // 7. Settlement & Bank Verification Data
    RestaurantBankDetails.findOne({ restaurantId: restId }).lean(),

    // 8. Popular Items (Top 5 Sold)
    Order.aggregate([
      { $match: { restaurantId: restId, isDeleted: false } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.itemId',
          name: { $first: '$items.itemName' },
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.sellingPrice', '$items.quantity'] } },
          image: { $first: '$items.image' },
          foodType: { $first: '$items.foodType' },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 },
    ]),

    // 9. Recent 10 Orders
    Order.find({ restaurantId: restId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),

    // 10. Hourly Traffic Curve for Today
    Order.aggregate([
      {
        $match: {
          restaurantId: restId,
          isDeleted: false,
          createdAt: { $gte: startOfToday, $lte: endOfToday },
        },
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          ordersCount: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $in: ['$paymentStatus', ['paid_online', 'paid_cash']] },
                '$grandTotal',
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Process Overview
  const todayStats = todayOrdersAgg[0] || {
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    todayRevenue: 0,
  };

  const yesterdayStats = yesterdayOrdersAgg[0] || {
    yesterdayOrders: 0,
    yesterdayRevenue: 0,
  };

  const todayOrders = todayStats.totalOrders;
  const completedOrders = todayStats.completedOrders;
  const pendingOrders = todayStats.pendingOrders;
  const todayRevenue = todayStats.todayRevenue;

  const yesterdayOrders = yesterdayStats.yesterdayOrders;
  const yesterdayRevenue = yesterdayStats.yesterdayRevenue;

  // Completion Rate
  const completionRate = todayOrders > 0
    ? Math.round((completedOrders / todayOrders) * 100)
    : 0;

  // Growth calculation
  let ordersChangeStr = '0% vs yesterday';
  if (yesterdayOrders === 0) {
    ordersChangeStr = todayOrders > 0 ? '+100% from yesterday' : '0% from yesterday';
  } else {
    const change = Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100);
    ordersChangeStr = `${change >= 0 ? '+' : ''}${change}% from yesterday`;
  }

  let revenueChangeStr = '0% vs yesterday';
  if (yesterdayRevenue === 0) {
    revenueChangeStr = todayRevenue > 0 ? '+100% vs yesterday' : '0% vs yesterday';
  } else {
    const rChange = Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);
    revenueChangeStr = `${rChange >= 0 ? '+' : ''}${rChange}% vs yesterday`;
  }

  // Process Kitchen Operations
  const kitchenCounts = kitchenMetricsAgg[0]?.activeCounts[0] || {
    activeOrders: 0,
    served: 0,
    pendingCash: 0,
  };

  // Average Preparation Time Calculation (servedAt - acceptedAt in minutes)
  let avgPrepTimeMinutes = 0;
  const samples = kitchenMetricsAgg[0]?.prepTimeSamples || [];
  if (samples.length > 0) {
    let totalMinutes = 0;
    let validSampleCount = 0;

    for (const order of samples) {
      const history = order.statusHistory || [];
      const accepted = history.find((h) => h.status === 'accepted');
      const served = history.find((h) => h.status === 'served' || h.status === 'completed');

      if (accepted?.timestamp && served?.timestamp) {
        const diffMs = new Date(served.timestamp).getTime() - new Date(accepted.timestamp).getTime();
        const diffMins = Math.round(diffMs / (1000 * 60));
        if (diffMins > 0 && diffMins < 180) {
          totalMinutes += diffMins;
          validSampleCount++;
        }
      }
    }

    if (validSampleCount > 0) {
      avgPrepTimeMinutes = Math.round(totalMinutes / validSampleCount);
    }
  }

  // Process Menu Catalog
  const [totalDishes, categoriesCount, popularCount, outOfStockCount] = menuMetricsAgg;

  // Process Tables & QR
  const [totalTables, availableTables, occupiedTables, qrGenerated] = tableMetricsAgg;

  // Calculate Dynamic Profile Completion (12 core fields)
  const profileFields = [
    { name: 'Restaurant Name', valid: Boolean(restaurantDoc?.restaurantName?.trim()) },
    { name: 'Logo', valid: Boolean(restaurantDoc?.logo?.url?.trim()) },
    { name: 'Banner', valid: Boolean(restaurantDoc?.coverImage?.url?.trim()) },
    { name: 'Description', valid: Boolean(restaurantDoc?.description?.trim()) },
    { name: 'Phone', valid: Boolean(restaurantDoc?.ownerPhone?.trim()) },
    { name: 'Email', valid: Boolean((user?.email || restaurantDoc?.ownerEmail || '').trim()) },
    { name: 'Address', valid: Boolean(restaurantDoc?.address?.street?.trim() && restaurantDoc?.address?.city?.trim()) },
    { name: 'Operating Hours', valid: Boolean(restaurantDoc?.timing?.openingTime?.trim() && restaurantDoc?.timing?.closingTime?.trim()) },
    { name: 'Cuisine / Menu', valid: categoriesCount > 0 || Boolean(restaurantDoc?.cuisine?.trim()) },
    { name: 'Bank Details', valid: Boolean(bankDetailsDoc?.accountNumber?.trim() || restaurantDoc?.bankDetails?.accountNumber?.trim()) },
    { name: 'GST', valid: Boolean(restaurantDoc?.taxInfo?.gstNumber?.trim()) },
    { name: 'FSSAI', valid: Boolean(restaurantDoc?.taxInfo?.fssaiNumber?.trim()) },
  ];

  const completedFields = profileFields.filter((f) => f.valid).length;
  const totalFields = profileFields.length;
  const profilePercentage = Math.round((completedFields / totalFields) * 100);
  const missingFields = profileFields.filter((f) => !f.valid).map((f) => f.name);

  // Settlement Details
  const bankStatus = bankDetailsDoc?.status || restaurantDoc?.bankDetails?.status || 'draft';
  const settlement = {
    status: bankStatus,
    bankVerified: bankStatus === 'approved',
    kycStatus: bankStatus,
    bankName: bankDetailsDoc?.bankName || restaurantDoc?.bankDetails?.bankName || '',
    accountNumberMasked: bankDetailsDoc?.accountNumber
      ? `•••• ${bankDetailsDoc.accountNumber.slice(-4)}`
      : restaurantDoc?.bankDetails?.accountNumber
      ? `•••• ${restaurantDoc.bankDetails.accountNumber.slice(-4)}`
      : '',
    cancelledCheque: Boolean(bankDetailsDoc?.canceledCheque?.url),
    submittedAt: bankDetailsDoc?.submittedAt || null,
    approvedAt: bankDetailsDoc?.approvedAt || null,
    approvedByName: bankDetailsDoc?.approvedByName || '',
    updatedAt: bankDetailsDoc?.updatedAt || null,
    changeRequestReason: bankStatus === 'changes_requested' ? bankDetailsDoc?.rejectionReason || '' : '',
    rejectionReason: bankStatus === 'rejected' ? bankDetailsDoc?.rejectionReason || '' : '',
    version: bankDetailsDoc?.version || 1,
  };

  // Recent Orders Formatted
  const recentOrders = recentOrdersDocs.map((o) => {
    const itemsSummary = (o.items || [])
      .map((i) => `${i.quantity}x ${i.itemName || i.name || 'Item'}`)
      .join(', ');

    return {
      id: `#${o.orderNumber || o._id.toString().slice(-6)}`,
      rawId: o._id,
      orderNumber: o.orderNumber,
      table: `Table ${o.tableNumber < 10 ? '0' + o.tableNumber : o.tableNumber}`,
      items: itemsSummary || 'No items listed',
      total: o.grandTotal || 0,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      guest: o.customerName || 'Guest',
      time: o.createdAt,
      createdAt: o.createdAt,
    };
  });

  // Popular Items
  const popularItems = popularItemsAgg.map((item) => ({
    _id: item._id,
    name: item.name || 'Menu Dish',
    quantitySold: item.quantitySold || 0,
    revenue: item.revenue || 0,
    image: item.image || '',
    foodType: item.foodType || 'veg',
  }));

  // Hourly Traffic Histogram (12 slots from 11h to 22h, or actual aggregated hours)
  const hourlyMap = new Map();
  for (const h of hourlyTrafficAgg) {
    hourlyMap.set(h._id, h.ordersCount);
  }

  const hoursToDisplay = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const maxHourlyCount = Math.max(...hoursToDisplay.map((h) => hourlyMap.get(h) || 0), 1);

  const hourlyTraffic = hoursToDisplay.map((hour) => {
    const count = hourlyMap.get(hour) || 0;
    const heightPercent = count === 0 ? 8 : Math.round((count / maxHourlyCount) * 90) + 10;
    return {
      hour: `${hour}h`,
      count,
      heightPercent,
    };
  });

  return {
    overview: {
      todayOrders,
      pendingOrders,
      completedOrders,
      todayRevenue,
      completionRate,
      growth: {
        ordersChange: ordersChangeStr,
        revenueChange: revenueChangeStr,
      },
    },
    kitchen: {
      activeOrders: kitchenCounts.activeOrders,
      served: kitchenCounts.served,
      pendingCash: kitchenCounts.pendingCash,
      avgPreparationTime: avgPrepTimeMinutes,
    },
    menu: {
      totalItems: totalDishes,
      categoriesCount,
      popularCount,
      outOfStockCount,
    },
    tables: {
      total: totalTables,
      available: availableTables,
      occupied: occupiedTables,
      qrGenerated,
    },
    profile: {
      percentage: profilePercentage,
      completedFields,
      totalFields,
      missing: missingFields,
    },
    settlement,
    growth: {
      todayOrders,
      yesterdayOrders,
      ordersChangeStr,
      todayRevenue,
      yesterdayRevenue,
      revenueChangeStr,
    },
    popularItems,
    recentOrders,
    hourlyTraffic,
    restaurant: {
      _id: restaurantDoc?._id,
      restaurantName: restaurantDoc?.restaurantName || '',
      paymentEnabled: restaurantDoc?.paymentEnabled === true,
      qrEnabled: restaurantDoc?.qrEnabled !== false,
      verificationStatus: restaurantDoc?.verificationStatus || 'pending',
    },
  };
};

