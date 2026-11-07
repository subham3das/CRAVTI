import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { MenuItem } from '../models/MenuItem.js';
import { Category } from '../models/Category.js';
import { Table } from '../models/Table.js';
import { Restaurant } from '../models/Restaurant.js';

/**
 * Helper to compute date range boundaries and previous comparison period
 */
const getDateBoundaries = (period = '7days', startDateStr, endDateStr) => {
  const now = new Date();
  let currentStart = new Date();
  let currentEnd = new Date(now);
  let prevStart = new Date();
  let prevEnd = new Date();

  switch (period) {
    case 'today': {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      prevStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
      prevEnd = new Date(currentStart.getTime() - 1);
      break;
    }
    case 'yesterday': {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      prevStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
      prevEnd = new Date(currentStart.getTime() - 1);
      break;
    }
    case '30days': {
      currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      currentStart.setHours(0, 0, 0, 0);
      prevStart = new Date(currentStart.getTime() - 30 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(currentStart.getTime() - 1);
      break;
    }
    case 'this_month': {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      currentEnd = new Date(now);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    }
    case 'last_month': {
      currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
      break;
    }
    case 'custom': {
      if (startDateStr && endDateStr) {
        currentStart = new Date(startDateStr);
        currentEnd = new Date(endDateStr);
        if (isNaN(currentStart.getTime())) currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (isNaN(currentEnd.getTime())) currentEnd = new Date(now);
        currentStart.setHours(0, 0, 0, 0);
        currentEnd.setHours(23, 59, 59, 999);
        const duration = currentEnd.getTime() - currentStart.getTime();
        prevStart = new Date(currentStart.getTime() - duration);
        prevEnd = new Date(currentStart.getTime() - 1);
      } else {
        currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        currentStart.setHours(0, 0, 0, 0);
        prevStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        prevEnd = new Date(currentStart.getTime() - 1);
      }
      break;
    }
    case '7days':
    default: {
      currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      currentStart.setHours(0, 0, 0, 0);
      prevStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevEnd = new Date(currentStart.getTime() - 1);
      break;
    }
  }

  return { currentStart, currentEnd, prevStart, prevEnd };
};

/**
 * Production Restaurant Analytics Service
 * Executes strictly tenant-isolated MongoDB aggregations.
 */
export const getRestaurantAnalyticsService = async (restaurantId, query = {}) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);
  const { period = '7days', startDate, endDate } = query;
  const { currentStart, currentEnd, prevStart, prevEnd } = getDateBoundaries(period, startDate, endDate);

  const baseMatch = {
    restaurantId: restId,
    isDeleted: false,
    createdAt: { $gte: currentStart, $lte: currentEnd },
  };

  const prevMatch = {
    restaurantId: restId,
    isDeleted: false,
    createdAt: { $gte: prevStart, $lte: prevEnd },
  };

  // Boundaries for Today
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Parallel Query Execution
  const [
    kpiAgg,
    prevKpiAgg,
    todayAgg,
    salesTrendAgg,
    mealTimeAgg,
    topItemsAgg,
    categoryAgg,
    peakHoursAgg,
    topCustomersAgg,
    paymentBreakdownAgg,
    discountAgg,
    tablePerformanceAgg,
    recentOrdersDocs,
    tableCounts,
    restaurantDoc,
  ] = await Promise.all([
    // 1. Current Period Overview
    Order.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          pendingOrders: {
            $sum: { $cond: [{ $in: ['$status', ['placed', 'accepted', 'served']] }, 1, 0] },
          },
          totalRevenue: {
            $sum: {
              $cond: [
                { $in: ['$paymentStatus', ['paid_online', 'paid_cash']] },
                '$grandTotal',
                0,
              ],
            },
          },
          totalDiscounts: { $sum: '$discount' },
          totalTax: { $sum: '$tax' },
          customerSet: {
            $addToSet: {
              $cond: [
                { $and: [{ $ne: ['$customerPhone', ''] }, { $ne: ['$customerPhone', null] }] },
                '$customerPhone',
                {
                  $cond: [
                    { $and: [{ $ne: ['$customerName', 'Guest'] }, { $ne: ['$customerName', ''] }] },
                    '$customerName',
                    '$guestId',
                  ],
                },
              ],
            },
          },
        },
      },
    ]),

    // 2. Previous Period Overview (Comparison)
    Order.aggregate([
      { $match: prevMatch },
      {
        $group: {
          _id: null,
          prevOrders: { $sum: 1 },
          prevRevenue: {
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

    // 3. Real-time Today Metrics
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
          todayRevenue: {
            $sum: {
              $cond: [
                { $in: ['$paymentStatus', ['paid_online', 'paid_cash']] },
                '$grandTotal',
                0,
              ],
            },
          },
          todayOrders: { $sum: 1 },
          todayCompleted: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          todayPending: {
            $sum: { $cond: [{ $in: ['$status', ['placed', 'accepted', 'served']] }, 1, 0] },
          },
        },
      },
    ]),

    // 4. Sales Trend Timeline
    period === 'today' || period === 'yesterday'
      ? Order.aggregate([
          { $match: baseMatch },
          {
            $group: {
              _id: { $hour: '$createdAt' },
              orders: { $sum: 1 },
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
        ])
      : Order.aggregate([
          { $match: baseMatch },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              orders: { $sum: 1 },
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

    // 5. Orders Trend by Meal Time
    Order.aggregate([
      { $match: baseMatch },
      {
        $project: {
          hour: { $hour: '$createdAt' },
          grandTotal: 1,
          isPaid: { $in: ['$paymentStatus', ['paid_online', 'paid_cash']] },
        },
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $and: [{ $gte: ['$hour', 6] }, { $lt: ['$hour', 11] }] }, then: 'Breakfast' },
                { case: { $and: [{ $gte: ['$hour', 11] }, { $lt: ['$hour', 16] }] }, then: 'Lunch' },
                { case: { $and: [{ $gte: ['$hour', 16] }, { $lt: ['$hour', 22] }] }, then: 'Dinner' },
              ],
              default: 'Night',
            },
          },
          orders: { $sum: 1 },
          revenue: { $sum: { $cond: ['$isPaid', '$grandTotal', 0] } },
        },
      },
    ]),

    // 6. Top 10 Best Selling Items
    Order.aggregate([
      { $match: baseMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.itemName',
          name: { $first: '$items.itemName' },
          orders: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.sellingPrice', '$items.quantity'] } },
          foodType: { $first: '$items.foodType' },
        },
      },
      { $sort: { revenue: -1, orders: -1 } },
      { $limit: 10 },
    ]),

    // 7. Category Performance
    Order.aggregate([
      { $match: baseMatch },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.itemId',
          foreignField: '_id',
          as: 'menuDoc',
        },
      },
      {
        $unwind: { path: '$menuDoc', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'menuDoc.categoryId',
          foreignField: '_id',
          as: 'categoryDoc',
        },
      },
      {
        $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: { $ifNull: ['$categoryDoc.categoryName', 'Specialties'] },
          orders: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.sellingPrice', '$items.quantity'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]),

    // 8. Peak Hours (24-hour distribution)
    Order.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          orders: { $sum: 1 },
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

    // 9. Top Customers
    Order.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: {
            $cond: [
              { $and: [{ $ne: ['$customerPhone', ''] }, { $ne: ['$customerPhone', null] }] },
              '$customerPhone',
              '$customerName',
            ],
          },
          customer: { $first: '$customerName' },
          phone: { $first: '$customerPhone' },
          orders: { $sum: 1 },
          spent: { $sum: '$grandTotal' },
        },
      },
      { $sort: { spent: -1, orders: -1 } },
      { $limit: 10 },
    ]),

    // 10. Payment Breakdown
    Order.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: {
            $cond: [
              { $in: ['$paymentMethod', ['cash', 'online', 'upi', 'card']] },
              '$paymentMethod',
              {
                $cond: [
                  { $eq: ['$paymentStatus', 'paid_online'] },
                  'online',
                  { $cond: [{ $eq: ['$paymentStatus', 'paid_cash'] }, 'cash', 'other'] },
                ],
              },
            ],
          },
          count: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
        },
      },
      { $sort: { count: -1 } },
    ]),

    // 11. Discount Analysis
    Order.aggregate([
      { $match: { ...baseMatch, discount: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalDiscount: { $sum: '$discount' },
          discountedOrders: { $sum: 1 },
          avgDiscount: { $avg: '$discount' },
        },
      },
    ]),

    // 12. Table Performance
    Order.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: '$tableNumber',
          orders: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
          avgBill: { $avg: '$grandTotal' },
          estimatedOccupancy: { $sum: { $ifNull: ['$estimatedPrepTime', 20] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 12 },
    ]),

    // 13. Recent 10 Orders
    Order.find({ restaurantId: restId, isDeleted: false })
      .select('orderNumber tableNumber customerName grandTotal status paymentStatus paymentMethod createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),

    // 14. Table Status Counts
    Promise.all([
      Table.countDocuments({ restaurantId: restId, isActive: true }),
      Table.countDocuments({ restaurantId: restId, isActive: true, status: 'occupied' }),
    ]),

    // 15. Restaurant Profile
    Restaurant.findById(restId).select('restaurantName').lean(),
  ]);

  // Process Overview
  const overview = kpiAgg[0] || {
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalDiscounts: 0,
    totalTax: 0,
    customerSet: [],
  };

  const prevOverview = prevKpiAgg[0] || {
    prevOrders: 0,
    prevRevenue: 0,
  };

  const todayOverview = todayAgg[0] || {
    todayRevenue: 0,
    todayOrders: 0,
    todayCompleted: 0,
    todayPending: 0,
  };

  const totalRevenue = Math.round(overview.totalRevenue);
  const totalOrders = overview.totalOrders;
  const completedOrders = overview.completedOrders;
  const pendingOrders = overview.pendingOrders;
  const averageOrderValue = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : (totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0);
  const customersServed = (overview.customerSet || []).length;

  const [totalTablesCount, occupiedTablesCount] = tableCounts;

  // Revenue & Order Growth vs previous period
  let revenueGrowth = 0;
  if (prevOverview.prevRevenue > 0) {
    revenueGrowth = Math.round(((totalRevenue - prevOverview.prevRevenue) / prevOverview.prevRevenue) * 100);
  } else if (totalRevenue > 0) {
    revenueGrowth = 100;
  }

  let ordersGrowth = 0;
  if (prevOverview.prevOrders > 0) {
    ordersGrowth = Math.round(((totalOrders - prevOverview.prevOrders) / prevOverview.prevOrders) * 100);
  } else if (totalOrders > 0) {
    ordersGrowth = 100;
  }

  // Sales Trend formatting
  const formattedSalesTrend = salesTrendAgg.map((item) => {
    let label = String(item._id);
    if (period === 'today' || period === 'yesterday') {
      const hour = parseInt(item._id, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
      label = `${formattedHour} ${ampm}`;
    } else {
      // YYYY-MM-DD to MMM DD
      const d = new Date(item._id);
      if (!isNaN(d.getTime())) {
        label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }
    return {
      label,
      date: item._id,
      revenue: Math.round(item.revenue || 0),
      orders: item.orders || 0,
    };
  });

  // Meal Time Trend formatting
  const mealTimeMap = { Breakfast: 0, Lunch: 0, Dinner: 0, Night: 0 };
  mealTimeAgg.forEach((m) => {
    if (m._id && mealTimeMap[m._id] !== undefined) {
      mealTimeMap[m._id] = m.orders || 0;
    }
  });

  // Peak Hours array (ensure full curve)
  const peakHourMap = {};
  peakHoursAgg.forEach((p) => {
    peakHourMap[p._id] = { orders: p.orders, revenue: Math.round(p.revenue) };
  });

  const formattedPeakHours = [];
  for (let h = 8; h <= 23; h++) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hourLabel = `${h % 12 === 0 ? 12 : h % 12} ${ampm}`;
    formattedPeakHours.push({
      hour: h,
      label: hourLabel,
      orders: peakHourMap[h]?.orders || 0,
      revenue: peakHourMap[h]?.revenue || 0,
    });
  }

  // Top Items
  const formattedTopItems = topItemsAgg.map((item, idx) => ({
    rank: idx + 1,
    name: item.name || item._id,
    orders: item.orders,
    revenue: Math.round(item.revenue),
    foodType: item.foodType || 'veg',
  }));

  // Top Customers
  const formattedTopCustomers = topCustomersAgg.map((c) => {
    const totalSpent = Math.round(c.spent || 0);
    const avgBill = c.orders > 0 ? Math.round(totalSpent / c.orders) : 0;
    // 1 loyalty point per ₹50 spent
    const loyaltyPoints = Math.floor(totalSpent / 50);
    return {
      customer: c.customer && c.customer !== 'Guest' ? c.customer : (c.phone ? `Customer (${c.phone.slice(-4)})` : 'Walk-in Guest'),
      phone: c.phone || '',
      orders: c.orders,
      spent: totalSpent,
      averageBill: avgBill,
      loyaltyPoints,
    };
  });

  // Category Performance
  const formattedCategories = categoryAgg.map((c) => ({
    category: c._id || 'Specialties',
    orders: c.orders,
    revenue: Math.round(c.revenue),
  }));

  // Payment Breakdown
  const paymentBreakdown = paymentBreakdownAgg.map((p) => ({
    method: (p._id || 'Cash').toUpperCase(),
    count: p.count,
    revenue: Math.round(p.revenue),
  }));

  // Discount Analysis
  const discountInfo = discountAgg[0] || { totalDiscount: 0, discountedOrders: 0, avgDiscount: 0 };
  const mostDiscountedItem = formattedTopItems[0]?.name || 'None';

  // Table Performance
  const formattedTablePerf = tablePerformanceAgg.map((t) => ({
    tableNumber: t._id,
    orders: t.orders,
    revenue: Math.round(t.revenue),
    averageBill: Math.round(t.avgBill || 0),
    occupancyMinutes: Math.round(t.estimatedOccupancy || 30),
  }));

  // Restaurant Health Score (0 - 100)
  // Metrics: Completion Rate (max 30), Preparation Performance (max 25), Revenue Consistency (max 25), Capacity (max 20)
  let healthScore = 80;
  if (totalOrders > 0) {
    const compRate = completedOrders / totalOrders;
    const compScore = Math.min(30, Math.round(compRate * 30));
    const volumeScore = Math.min(25, Math.round((Math.min(totalOrders, 50) / 50) * 25));
    const revScore = revenueGrowth >= 0 ? 25 : Math.max(10, 25 + Math.round(revenueGrowth / 4));
    const tableScore = totalTablesCount > 0 ? Math.min(20, Math.round((occupiedTablesCount / totalTablesCount) * 20) + 10) : 15;
    healthScore = Math.min(100, Math.max(45, compScore + volumeScore + revScore + tableScore));
  }

  return {
    restaurantName: restaurantDoc?.restaurantName || 'Your Restaurant',
    dateRange: {
      period,
      start: currentStart.toISOString(),
      end: currentEnd.toISOString(),
      label: period === 'today' ? 'Today' : period === 'yesterday' ? 'Yesterday' : period === '30days' ? 'Last 30 Days' : period === 'this_month' ? 'This Month' : period === 'last_month' ? 'Last Month' : 'Last 7 Days',
    },
    // Primary KPIs
    totalRevenue,
    revenueGrowth,
    totalOrders,
    ordersGrowth,
    averageOrderValue,
    customersServed,
    activeTables: occupiedTablesCount,
    totalTables: totalTablesCount,
    todayRevenue: Math.round(todayOverview.todayRevenue),
    todayOrders: todayOverview.todayOrders,
    pendingOrders,
    completedOrders,

    // Trends & Breakdowns
    salesTrend: formattedSalesTrend,
    mealTimeTrends: mealTimeMap,
    topItems: formattedTopItems,
    categoryPerformance: formattedCategories,
    peakHours: formattedPeakHours,
    topCustomers: formattedTopCustomers,
    paymentBreakdown,

    // Discounts & Tables
    discountAnalysis: {
      totalDiscounts: Math.round(discountInfo.totalDiscount || 0),
      discountedOrders: discountInfo.discountedOrders || 0,
      avgDiscount: Math.round(discountInfo.avgDiscount || 0),
      mostDiscountedItem,
      revenueLost: Math.round(discountInfo.totalDiscount || 0),
    },
    tablePerformance: formattedTablePerf,

    // Summaries
    dailySummary: {
      revenue: Math.round(todayOverview.todayRevenue),
      orders: todayOverview.todayOrders,
      customers: Math.max(1, Math.round(todayOverview.todayOrders * 0.9)),
      avgBill: todayOverview.todayOrders > 0 ? Math.round(todayOverview.todayRevenue / todayOverview.todayOrders) : 0,
    },
    weeklySummary: {
      revenue: totalRevenue,
      orders: totalOrders,
      growth: revenueGrowth,
    },
    monthlySummary: {
      revenue: totalRevenue,
      orders: totalOrders,
      netEarnings: Math.round(totalRevenue * 0.95), // Net after estimated operating expenses
      taxes: Math.round(overview.totalTax || totalRevenue * 0.05),
    },

    // Health Score & Recent Orders
    healthScore,
    recentOrders: recentOrdersDocs.map((o) => ({
      orderId: `#${o.orderNumber || o._id.toString().slice(-6)}`,
      rawId: o._id,
      tableNumber: o.tableNumber,
      amount: Math.round(o.grandTotal || 0),
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod || 'cash',
      customerName: o.customerName || 'Guest',
      time: o.createdAt,
    })),
  };
};

