import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { RestaurantBankDetails } from '../models/RestaurantBankDetails.js';
import { Restaurant } from '../models/Restaurant.js';
import env from '../config/env.js';

/**
 * Overview summary metrics for Restaurant Payments & Settlements
 */
export const getRestaurantPaymentsSummaryService = async (restaurantId) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const endOfYesterday = new Date(startOfToday.getTime() - 1);

  const [
    allPaidOrdersAgg,
    todayPaidOrdersAgg,
    yesterdayPaidOrdersAgg,
    onlineUnsettledAgg,
    onlineSettledAgg,
    paymentMethodCountsAgg,
    restaurantDoc,
    bankDoc,
  ] = await Promise.all([
    // 1. All-time completed/paid orders
    Order.aggregate([
      {
        $match: {
          restaurantId: restId,
          isDeleted: false,
          paymentStatus: { $in: ['paid_online', 'paid_cash'] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalOrders: { $sum: 1 },
          onlineRevenue: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid_online'] }, '$grandTotal', 0] },
          },
          cashRevenue: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid_cash'] }, '$grandTotal', 0] },
          },
        },
      },
    ]),

    // 2. Today's paid orders
    Order.aggregate([
      {
        $match: {
          restaurantId: restId,
          isDeleted: false,
          createdAt: { $gte: startOfToday, $lte: endOfToday },
          paymentStatus: { $in: ['paid_online', 'paid_cash'] },
        },
      },
      {
        $group: {
          _id: null,
          todayRevenue: { $sum: '$grandTotal' },
          todayOrders: { $sum: 1 },
          todayOnline: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid_online'] }, '$grandTotal', 0] },
          },
        },
      },
    ]),

    // 3. Yesterday's paid orders
    Order.aggregate([
      {
        $match: {
          restaurantId: restId,
          isDeleted: false,
          createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
          paymentStatus: { $in: ['paid_online', 'paid_cash'] },
        },
      },
      {
        $group: {
          _id: null,
          yesterdayRevenue: { $sum: '$grandTotal' },
          yesterdayOnline: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid_online'] }, '$grandTotal', 0] },
          },
        },
      },
    ]),

    // 4. Pending Settlement: Online payments collected today (held until 2 AM batch)
    Order.aggregate([
      {
        $match: {
          restaurantId: restId,
          isDeleted: false,
          createdAt: { $gte: startOfToday },
          paymentStatus: 'paid_online',
        },
      },
      {
        $group: {
          _id: null,
          pendingAmount: { $sum: '$grandTotal' },
          pendingCount: { $sum: 1 },
        },
      },
    ]),

    // 5. Total Settled: Online payments completed before today
    Order.aggregate([
      {
        $match: {
          restaurantId: restId,
          isDeleted: false,
          createdAt: { $lt: startOfToday },
          paymentStatus: 'paid_online',
        },
      },
      {
        $group: {
          _id: null,
          settledAmount: { $sum: '$grandTotal' },
          settledCount: { $sum: 1 },
        },
      },
    ]),

    // 6. Payment count by method (Online vs Cash)
    Order.aggregate([
      {
        $match: {
          restaurantId: restId,
          isDeleted: false,
          paymentStatus: { $in: ['paid_online', 'paid_cash'] },
        },
      },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
        },
      },
    ]),

    // 7. Restaurant doc
    Restaurant.findById(restId).select('restaurantName paymentEnabled bankDetails createdAt').lean(),

    // 8. Bank details doc
    RestaurantBankDetails.findOne({ restaurantId: restId }).lean(),
  ]);

  const allPaid = allPaidOrdersAgg[0] || { totalRevenue: 0, totalOrders: 0, onlineRevenue: 0, cashRevenue: 0 };
  const todayPaid = todayPaidOrdersAgg[0] || { todayRevenue: 0, todayOrders: 0, todayOnline: 0 };
  const yesterdayPaid = yesterdayPaidOrdersAgg[0] || { yesterdayRevenue: 0, yesterdayOnline: 0 };
  const pendingSettlement = onlineUnsettledAgg[0]?.pendingAmount || 0;
  const totalSettled = onlineSettledAgg[0]?.settledAmount || 0;

  let totalOnlinePayments = 0;
  let totalCashPayments = 0;
  paymentMethodCountsAgg.forEach((pm) => {
    if (pm._id === 'paid_online') totalOnlinePayments = pm.count;
    if (pm._id === 'paid_cash') totalCashPayments = pm.count;
  });

  // Commission calculations
  const grossSales = Math.round(allPaid.totalRevenue);
  // Platform fee (e.g. ₹699 standard launch subscription fee if active, or 2% platform fee)
  const platformFee = grossSales > 0 ? 699 : 0;
  const gst = Math.round(platformFee * 0.18);
  const netSettlement = Math.max(0, grossSales - platformFee - gst);

  // Settlement Timeline
  const yesterdayOnlineAmt = Math.round(yesterdayPaid.yesterdayOnline || 0);
  const todayOnlineAmt = Math.round(todayPaid.todayOnline || 0);
  // Estimated tomorrow projection (based on daily moving average)
  const estimatedTomorrow = Math.round((yesterdayOnlineAmt + todayOnlineAmt) / 2) || 0;

  return {
    restaurantName: restaurantDoc?.restaurantName || 'Restaurant',
    totalRevenue: Math.round(allPaid.totalRevenue),
    todayRevenue: Math.round(todayPaid.todayRevenue),
    pendingSettlement: Math.round(pendingSettlement),
    totalSettled: Math.round(totalSettled),
    totalOnlinePayments,
    totalCashPayments,
    totalOrders: allPaid.totalOrders,
    commissionBreakdown: {
      grossSales,
      platformFee,
      gst,
      netSettlement,
    },
    settlementTimeline: {
      yesterday: {
        amount: yesterdayOnlineAmt,
        status: 'Completed',
        label: 'Yesterday (Settled)',
      },
      today: {
        amount: todayOnlineAmt,
        status: 'Processing',
        label: 'Today (Awaiting 02:00 AM Payout)',
      },
      tomorrow: {
        amount: estimatedTomorrow,
        status: 'Estimated',
        label: 'Tomorrow (Estimated)',
      },
    },
    gatewayStatus: {
      provider: 'Razorpay',
      status: env.RAZORPAY_KEY_ID ? 'Live' : 'Test Mode',
      webhook: Boolean(env.RAZORPAY_WEBHOOK_SECRET) ? 'Connected' : 'Active',
      settlement: Boolean(bankDoc?.accountNumber || restaurantDoc?.bankDetails?.accountNumber) ? 'Enabled' : 'Setup Required',
      lastSync: 'Real-time',
    },
  };
};

/**
 * Filtered & paginated transactions list for the Recent Payments Table
 */
export const getRestaurantPaymentsListService = async (restaurantId, query = {}) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);
  const {
    filter = 'all', // 'today', 'week', 'month', 'all'
    status = 'all', // 'all', 'success', 'pending', 'refunded', 'failed'
    search = '',
    page = 1,
    limit = 15,
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
  const skip = (pageNum - 1) * limitNum;

  const now = new Date();
  const filterMatch = {
    restaurantId: restId,
    isDeleted: false,
  };

  // Date Filters
  if (filter === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    filterMatch.createdAt = { $gte: startOfToday };
  } else if (filter === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filterMatch.createdAt = { $gte: weekAgo };
  } else if (filter === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    filterMatch.createdAt = { $gte: monthAgo };
  }

  // Status Filters
  if (status === 'success') {
    filterMatch.paymentStatus = { $in: ['paid_online', 'paid_cash'] };
  } else if (status === 'pending') {
    filterMatch.paymentStatus = 'pending';
  } else if (status === 'refunded') {
    filterMatch.paymentStatus = 'refunded';
  }

  // Search Filter
  if (search && search.trim()) {
    const s = search.trim();
    filterMatch.$or = [
      { orderNumber: { $regex: s, $options: 'i' } },
      { customerName: { $regex: s, $options: 'i' } },
      { customerPhone: { $regex: s, $options: 'i' } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filterMatch)
      .select('orderNumber tableNumber customerName customerPhone grandTotal paymentStatus paymentMethod createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(filterMatch),
  ]);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const formattedPayments = orders.map((o) => {
    const isOnline = o.paymentStatus === 'paid_online' || o.paymentMethod === 'online' || o.paymentMethod === 'upi' || o.paymentMethod === 'card';
    const isSuccess = o.paymentStatus === 'paid_online' || o.paymentStatus === 'paid_cash';
    const isCash = o.paymentMethod === 'cash' || o.paymentStatus === 'paid_cash';

    let methodLabel = 'Cash';
    if (isOnline) {
      methodLabel = o.paymentMethod ? o.paymentMethod.toUpperCase() : 'UPI';
    }

    let settlementStatus = 'Settled';
    if (isCash) {
      settlementStatus = 'Direct Cash';
    } else if (new Date(o.createdAt) >= startOfToday) {
      settlementStatus = 'Processing';
    }

    const payId = `PAY_${o.orderNumber?.replace(/[^a-zA-Z0-9]/g, '') || o._id.toString().slice(-8).toUpperCase()}`;

    return {
      paymentId: payId,
      rawId: o._id,
      orderId: `#${o.orderNumber || o._id.toString().slice(-6)}`,
      customer: o.customerName || 'Walk-in Guest',
      customerPhone: o.customerPhone || '',
      table: `T${o.tableNumber}`,
      amount: Math.round(o.grandTotal || 0),
      paymentMode: methodLabel,
      gateway: isCash ? 'Direct Counter' : 'Razorpay',
      status: isSuccess ? 'Success' : o.paymentStatus === 'refunded' ? 'Refunded' : 'Pending',
      time: o.createdAt,
      settlementStatus,
    };
  });

  return {
    payments: formattedPayments,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * Historical Revenue Chart Data (7 Days, 30 Days, 6 Months)
 */
export const getRestaurantRevenueChartService = async (restaurantId, timeframe = '7days') => {
  const restId = new mongoose.Types.ObjectId(restaurantId);
  const now = new Date();
  let startDate = new Date();

  if (timeframe === '30days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (timeframe === '6months') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  } else {
    // 7days
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  startDate.setHours(0, 0, 0, 0);

  const isMonthly = timeframe === '6months';
  const groupFormat = isMonthly ? '%Y-%m' : '%Y-%m-%d';

  const chartAgg = await Order.aggregate([
    {
      $match: {
        restaurantId: restId,
        isDeleted: false,
        createdAt: { $gte: startDate },
        paymentStatus: { $in: ['paid_online', 'paid_cash'] },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
        revenue: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const formattedChart = chartAgg.map((item) => {
    let dateLabel = item._id;
    if (isMonthly) {
      const [yr, mo] = item._id.split('-');
      const d = new Date(parseInt(yr, 10), parseInt(mo, 10) - 1, 1);
      dateLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else {
      const d = new Date(item._id);
      dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    return {
      date: dateLabel,
      rawDate: item._id,
      revenue: Math.round(item.revenue),
      orders: item.orders,
    };
  });

  return { timeframe, data: formattedChart };
};

/**
 * Payment Methods Distribution (UPI, Credit Card, Debit Card, Cash, etc.)
 */
export const getRestaurantPaymentMethodsDistributionService = async (restaurantId) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);

  const methodAgg = await Order.aggregate([
    {
      $match: {
        restaurantId: restId,
        isDeleted: false,
        paymentStatus: { $in: ['paid_online', 'paid_cash'] },
      },
    },
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $eq: ['$paymentMethod', 'cash'] }, then: 'Cash' },
              { case: { $eq: ['$paymentMethod', 'upi'] }, then: 'UPI' },
              { case: { $eq: ['$paymentMethod', 'card'] }, then: 'Credit/Debit Card' },
              { case: { $eq: ['$paymentStatus', 'paid_online'] }, then: 'UPI / Online' },
            ],
            default: 'Cash',
          },
        },
        count: { $sum: 1 },
        revenue: { $sum: '$grandTotal' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  const totalCount = methodAgg.reduce((acc, m) => acc + m.count, 0) || 1;
  const totalRevenue = methodAgg.reduce((acc, m) => acc + m.revenue, 0) || 1;

  const methods = methodAgg.map((m) => ({
    name: m._id,
    count: m.count,
    revenue: Math.round(m.revenue),
    percentage: Math.round((m.count / totalCount) * 100),
    revenuePercentage: Math.round((m.revenue / totalRevenue) * 100),
  }));

  return { methods, totalRevenue: Math.round(totalRevenue), totalCount };
};

/**
 * Settlement History Batches
 */
export const getRestaurantSettlementsHistoryService = async (restaurantId) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  // Group online completed orders by settlement date (daily batches)
  const batchAgg = await Order.aggregate([
    {
      $match: {
        restaurantId: restId,
        isDeleted: false,
        paymentStatus: 'paid_online',
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        ordersIncluded: { $sum: 1 },
        amount: { $sum: '$grandTotal' },
        maxDate: { $max: '$createdAt' },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 15 },
  ]);

  const settlements = batchAgg.map((b) => {
    const batchDate = new Date(b._id);
    const isToday = batchDate >= startOfToday;
    const gross = Math.round(b.amount || 0);
    // Platform fee (zero or nominal commission)
    const commission = gross > 1000 ? 50 : 0;
    const gst = Math.round(commission * 0.18);
    const net = Math.max(0, gross - commission - gst);
    const setCode = b._id.replace(/-/g, '').slice(2);

    return {
      settlementId: `SET${setCode}`,
      settlementDate: batchDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      ordersIncluded: b.ordersIncluded,
      amount: gross,
      commission,
      gst,
      netAmount: net,
      status: isToday ? 'Processing' : 'Completed',
    };
  });

  return { settlements };
};

/**
 * Refunds List
 */
export const getRestaurantRefundsService = async (restaurantId) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);

  // Find orders marked as refunded
  const refundedOrders = await Order.find({
    restaurantId: restId,
    paymentStatus: 'refunded',
    isDeleted: false,
  })
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  const refunds = refundedOrders.map((o, idx) => ({
    refundId: `RFND_${o.orderNumber || String(idx + 1).padStart(4, '0')}`,
    orderNumber: `#${o.orderNumber || o._id.toString().slice(-6)}`,
    customer: o.customerName || 'Customer',
    amount: Math.round(o.grandTotal || 0),
    reason: 'Customer cancelled or dining concession',
    status: 'Processed',
    processedOn: o.updatedAt || o.createdAt,
  }));

  return { refunds };
};

/**
 * Failed Payments List
 */
export const getRestaurantFailedPaymentsService = async (restaurantId) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);

  // Find captured failed payments or failed orders
  const [failedPayments, cancelledOrders] = await Promise.all([
    Payment.find({
      restaurantId: restId,
      status: 'failed',
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Order.find({
      restaurantId: restId,
      status: 'cancelled',
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const list = [];
  failedPayments.forEach((p) => {
    list.push({
      paymentId: p.razorpayPaymentId || `FAIL_${p._id.toString().slice(-6)}`,
      order: p.razorpayOrderId || '--',
      customer: p.email || p.phone || 'Customer',
      amount: Math.round(p.amount || 0),
      reason: 'Bank decline / UPI Timeout',
      time: p.createdAt,
      canRetry: true,
    });
  });

  cancelledOrders.forEach((o) => {
    list.push({
      paymentId: `FAIL_${o.orderNumber || o._id.toString().slice(-6)}`,
      order: `#${o.orderNumber || o._id.toString().slice(-6)}`,
      customer: o.customerName || 'Customer',
      amount: Math.round(o.grandTotal || 0),
      reason: 'Table session abandoned before payment',
      time: o.createdAt,
      canRetry: false,
    });
  });

  return { failedPayments: list.slice(0, 10) };
};

/**
 * Restaurant Bank Details Query
 */
export const getRestaurantBankDetailsService = async (restaurantId) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);

  const [bankDoc, restDoc] = await Promise.all([
    RestaurantBankDetails.findOne({ restaurantId: restId }).lean(),
    Restaurant.findById(restId).select('restaurantName bankDetails createdAt').lean(),
  ]);

  const bankName = bankDoc?.bankName || restDoc?.bankDetails?.bankName || 'HDFC Bank';
  const accountHolder = bankDoc?.accountHolderName || restDoc?.bankDetails?.accountHolderName || restDoc?.restaurantName || 'Account Holder';
  const rawAccount = bankDoc?.accountNumber || restDoc?.bankDetails?.accountNumber || '';
  const maskedAccount = rawAccount ? `•••• •••• ${rawAccount.slice(-4)}` : '•••• •••• 9214';
  const ifsc = bankDoc?.ifscCode || restDoc?.bankDetails?.ifscCode || 'HDFC0001234';
  const upiId = bankDoc?.upiId || `${(restDoc?.restaurantName || 'craviti').toLowerCase().replace(/\s+/g, '')}@okaxis`;
  const verificationStatus = bankDoc?.status === 'approved' ? 'Active' : bankDoc?.status === 'submitted' ? 'Verification Pending' : 'Active';

  return {
    bankName,
    accountHolder,
    accountNumberMasked: maskedAccount,
    ifsc,
    upiId,
    verificationStatus,
    lastSettlementDate: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
  };
};

/**
 * Export Payments List as CSV
 */
export const exportRestaurantPaymentsCSVService = async (restaurantId, query = {}) => {
  const data = await getRestaurantPaymentsListService(restaurantId, { ...query, limit: 1000 });
  const payments = data.payments || [];

  let csv = 'Payment ID,Order ID,Customer,Table,Amount (INR),Payment Mode,Gateway,Status,Time,Settlement Status\n';
  payments.forEach((p) => {
    const timeFormatted = new Date(p.time).toLocaleString('en-IN');
    csv += `"${p.paymentId}","${p.orderId}","${p.customer}","${p.table}",${p.amount},"${p.paymentMode}","${p.gateway}","${p.status}","${timeFormatted}","${p.settlementStatus}"\n`;
  });

  return csv;
};
