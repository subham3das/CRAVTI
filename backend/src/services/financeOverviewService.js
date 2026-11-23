import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Settlement } from '../models/Settlement.js';
import { Restaurant } from '../models/Restaurant.js';
import { PlatformInvoice } from '../models/PlatformInvoice.js';
import { Wallet } from '../models/Wallet.js';

export const getFinanceOverviewService = async () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    orderAggregates,
    todayOrderAggregates,
    settlementAggregates,
    subscriptionAggregates,
    restaurantStatusCounts,
    dailyGmvChart,
    settlementTrendChart,
  ] = await Promise.all([
    // Total GMV across all completed/paid orders
    Order.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          paymentStatus: { $in: ['paid', 'completed'] },
        },
      },
      {
        $group: {
          _id: null,
          totalGMV: { $sum: '$totalAmount' },
          refunds: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'refunded'] }, '$totalAmount', 0] },
          },
        },
      },
    ]),

    // Today's GMV
    Order.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          paymentStatus: { $in: ['paid', 'completed'] },
          createdAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          todayGMV: { $sum: '$totalAmount' },
        },
      },
    ]),

    // Settlement balances, counts and commissions
    Settlement.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          pendingAmount: {
            $sum: {
              $cond: [
                { $in: ['$status', ['pending', 'ready', 'approved', 'on_hold', 'retry', 'waiting_for_route_account']] },
                '$netAmount',
                0,
              ],
            },
          },
          pendingCount: {
            $sum: {
              $cond: [
                { $in: ['$status', ['pending', 'ready', 'approved', 'on_hold', 'retry', 'waiting_for_route_account']] },
                1,
                0,
              ],
            },
          },
          processingAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'processing'] }, '$netAmount', 0],
            },
          },
          processingCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'processing'] }, 1, 0],
            },
          },
          completedAmount: {
            $sum: {
              $cond: [{ $in: ['$status', ['paid', 'completed']] }, '$netAmount', 0],
            },
          },
          completedCount: {
            $sum: {
              $cond: [{ $in: ['$status', ['paid', 'completed']] }, 1, 0],
            },
          },
          commissionEarned: {
            $sum: {
              $cond: [{ $in: ['$status', ['paid', 'completed']] }, '$platformCommission', 0],
            },
          },
          pendingCommission: {
            $sum: {
              $cond: [
                { $in: ['$status', ['pending', 'ready', 'approved', 'processing', 'on_hold', 'retry', 'waiting_for_route_account']] },
                '$platformCommission',
                0,
              ],
            },
          },
          monthlyCommission: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$createdAt', monthStart] },
                    { $in: ['$status', ['paid', 'completed']] },
                  ],
                },
                '$platformCommission',
                0,
              ],
            },
          },
          todayCommission: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$createdAt', todayStart] },
                    { $in: ['$status', ['paid', 'completed']] },
                  ],
                },
                '$platformCommission',
                0,
              ],
            },
          },
          totalCommission: {
            $sum: '$platformCommission',
          },
          gatewayFees: { $sum: '$gatewayFee' },
        },
      },
    ]),

    // Subscription Revenue from PlatformInvoice (all-time, monthly, today)
    PlatformInvoice.aggregate([
      {
        $match: {
          status: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          totalSubRevenue: { $sum: '$totalAmount' },
          monthlySubRevenue: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', monthStart] }, '$totalAmount', 0],
            },
          },
          todaySubRevenue: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', todayStart] }, '$totalAmount', 0],
            },
          },
        },
      },
    ]),

    // Restaurant counts by subscription status
    Restaurant.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$subscription.status',
          count: { $sum: 1 },
        },
      },
    ]),

    // Daily GMV past 7 days
    Order.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          paymentStatus: { $in: ['paid', 'completed'] },
          createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          gmv: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Settlement Trend past 7 days
    Settlement.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          settled: {
            $sum: { $cond: [{ $in: ['$status', ['paid', 'completed']] }, '$netAmount', 0] },
          },
          pending: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'processing', 'waiting_for_route_account']] }, '$netAmount', 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const totalGMV = orderAggregates[0]?.totalGMV || 0;
  const refunds = orderAggregates[0]?.refunds || 0;
  const todayGMV = todayOrderAggregates[0]?.todayGMV || 0;

  const pendingAmount = settlementAggregates[0]?.pendingAmount || 0;
  const pendingCount = settlementAggregates[0]?.pendingCount || 0;
  const processingAmount = settlementAggregates[0]?.processingAmount || 0;
  const processingCount = settlementAggregates[0]?.processingCount || 0;
  const completedAmount = settlementAggregates[0]?.completedAmount || 0;
  const completedCount = settlementAggregates[0]?.completedCount || 0;

  const commissionEarned = settlementAggregates[0]?.commissionEarned || 0;
  const pendingCommission = settlementAggregates[0]?.pendingCommission || 0;
  const monthlyCommission = settlementAggregates[0]?.monthlyCommission || 0;
  const todayCommission = settlementAggregates[0]?.todayCommission || 0;
  const totalCommission = settlementAggregates[0]?.totalCommission || (commissionEarned + pendingCommission);

  const gatewayFees = settlementAggregates[0]?.gatewayFees || Math.round(totalGMV * 0.02 * 100) / 100;
  const settlementCharges = completedCount * 5; // standard ₹5 IMPS/NEFT transfer charge per settlement
  const refundCharges = Math.round(refunds * 0.02 * 100) / 100;

  const totalSubRevenue = subscriptionAggregates[0]?.totalSubRevenue || 0;
  const monthlySubscriptionRevenue = subscriptionAggregates[0]?.monthlySubRevenue || 0;
  const todaySubRevenue = subscriptionAggregates[0]?.todaySubRevenue || 0;

  const restCounts = {
    total: 0,
    active: 0,
    trial: 0,
    expired: 0,
    pending: 0,
    cancelled: 0,
  };

  restaurantStatusCounts.forEach((r) => {
    const s = r._id || 'trial';
    if (restCounts[s] !== undefined) {
      restCounts[s] = r.count;
    }
    restCounts.total += r.count;
  });

  // MRR & ARR calculations
  const defaultMonthlyRate = 699;
  const mrr = restCounts.active * defaultMonthlyRate + (monthlySubscriptionRevenue > 0 ? monthlySubscriptionRevenue : 0);
  const arr = mrr * 12;

  // Platform Revenues
  const todayRevenue = todayCommission + todaySubRevenue;
  const monthlyRevenue = monthlyCommission + monthlySubscriptionRevenue;
  const totalRevenue = totalCommission + totalSubRevenue;
  const netRevenue = monthlyRevenue;

  return {
    // Structured Sections for Enterprise POS Finance Dashboard
    platformRevenue: {
      todayRevenue,
      monthlyRevenue,
      totalRevenue,
      todayGMV,
      totalGMV,
    },
    platformCommission: {
      commissionEarned,
      pendingCommission,
      totalCommission,
      monthlyCommission,
    },
    razorpayFees: {
      gatewayCharges: gatewayFees,
      settlementCharges,
      refundCharges,
      totalRefunds: refunds,
    },
    settlementSummary: {
      pending: { amount: pendingAmount, count: pendingCount },
      processing: { amount: processingAmount, count: processingCount },
      completed: { amount: completedAmount, count: completedCount },
    },
    subscriptionSummary: {
      active: restCounts.active,
      trial: restCounts.trial,
      expired: restCounts.expired,
      mrr,
      arr,
      monthlyRevenue: monthlySubscriptionRevenue,
      totalRevenue: totalSubRevenue,
    },
    // Backward-compatible KPIs object
    kpis: {
      totalGMV,
      todayGMV,
      pendingSettlement: pendingAmount + processingAmount,
      completedSettlement: completedAmount,
      monthlyCommission,
      monthlySubscriptionRevenue,
      gatewayFees,
      totalRestaurants: restCounts.total,
      activeSubscriptions: restCounts.active,
      trialRestaurants: restCounts.trial,
      expiredRestaurants: restCounts.expired,
      refunds,
      netRevenue,
    },
    // Monthly Visualizations and Charts
    charts: {
      dailyGmv: dailyGmvChart.map((d) => ({ date: d._id, gmv: d.gmv, orders: d.orders })),
      settlementTrend: settlementTrendChart.map((s) => ({ date: s._id, settled: s.settled, pending: s.pending })),
      monthlyRevenueBreakdown: [
        { name: 'Commissions', value: monthlyCommission },
        { name: 'Subscriptions', value: monthlySubscriptionRevenue },
      ],
      subscriptionGrowth: [
        { label: 'Active', count: restCounts.active },
        { label: 'Trial', count: restCounts.trial },
        { label: 'Expired', count: restCounts.expired },
      ],
    },
  };
};

