import mongoose from 'mongoose';
import { Settlement } from '../models/Settlement.js';
import { Restaurant } from '../models/Restaurant.js';
import { PlatformInvoice } from '../models/PlatformInvoice.js';
import { Order } from '../models/Order.js';

/**
 * Helper to compute date range from timeframe string
 */
const getDateRange = (timeframe = 'monthly', customStart = null, customEnd = null) => {
  if (customStart && customEnd) {
    return { start: new Date(customStart), end: new Date(customEnd) };
  }

  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  switch (timeframe) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      start.setDate(now.getDate() - 7);
      break;
    case 'yearly':
      start.setFullYear(now.getFullYear() - 1);
      break;
    case 'monthly':
    default:
      start.setMonth(now.getMonth() - 1);
      break;
  }

  return { start, end };
};

/**
 * Generate Settlement Report
 */
export const generateSettlementReport = async ({
  timeframe = 'monthly',
  restaurantId = null,
  startDate = null,
  endDate = null,
}) => {
  const { start, end } = getDateRange(timeframe, startDate, endDate);
  const match = {
    isDeleted: { $ne: true },
    createdAt: { $gte: start, $lte: end },
  };

  if (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) {
    match.restaurantId = new mongoose.Types.ObjectId(restaurantId);
  }

  const settlements = await Settlement.find(match)
    .populate('restaurantId', 'name restaurantName email linkedAccountId')
    .sort({ createdAt: -1 })
    .lean();

  const summary = settlements.reduce(
    (acc, s) => {
      acc.totalGross += s.grossAmount || 0;
      acc.totalNetPayable += s.netAmount || s.amount || 0;
      acc.totalCommission += s.platformCommission || s.commissionAmount || 0;
      acc.totalGatewayFee += s.gatewayFee || 0;
      acc.totalGst += s.gst || 0;
      acc.count += 1;
      return acc;
    },
    { totalGross: 0, totalNetPayable: 0, totalCommission: 0, totalGatewayFee: 0, totalGst: 0, count: 0 }
  );

  return {
    reportType: 'settlement',
    timeframe,
    startDate: start,
    endDate: end,
    summary,
    records: settlements.map((s) => ({
      settlementId: s.settlementId,
      restaurant: s.restaurantId?.restaurantName || s.restaurantId?.name || 'Unknown',
      grossAmount: s.grossAmount,
      commissionRate: `${s.commissionRate}%`,
      platformCommission: s.platformCommission || s.commissionAmount,
      gatewayFee: s.gatewayFee,
      gst: s.gst,
      netAmount: s.netAmount || s.amount,
      status: s.status,
      cycle: s.cycle,
      paymentMode: s.paymentMode,
      utr: s.utr || '--',
      createdAt: s.createdAt,
      paidAt: s.paidAt || '--',
    })),
  };
};

/**
 * Generate Commission Report
 */
export const generateCommissionReport = async ({
  timeframe = 'monthly',
  restaurantId = null,
  startDate = null,
  endDate = null,
}) => {
  const { start, end } = getDateRange(timeframe, startDate, endDate);
  const match = {
    isDeleted: { $ne: true },
    createdAt: { $gte: start, $lte: end },
  };

  if (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) {
    match.restaurantId = new mongoose.Types.ObjectId(restaurantId);
  }

  const settlements = await Settlement.find(match)
    .populate('restaurantId', 'name restaurantName')
    .sort({ createdAt: -1 })
    .lean();

  const restaurantMap = new Map();

  settlements.forEach((s) => {
    const rId = s.restaurantId?._id?.toString() || 'unknown';
    const rName = s.restaurantId?.restaurantName || s.restaurantId?.name || 'Unknown';
    if (!restaurantMap.has(rId)) {
      restaurantMap.set(rId, {
        restaurantId: rId,
        restaurantName: rName,
        totalOrders: 0,
        grossVolume: 0,
        commissionEarned: 0,
        gstCollected: 0,
      });
    }
    const item = restaurantMap.get(rId);
    item.totalOrders += 1;
    item.grossVolume += s.grossAmount || 0;
    item.commissionEarned += s.platformCommission || s.commissionAmount || 0;
    item.gstCollected += s.gst || 0;
  });

  const records = Array.from(restaurantMap.values());
  const totals = records.reduce(
    (acc, r) => {
      acc.totalOrders += r.totalOrders;
      acc.totalGrossVolume += r.grossVolume;
      acc.totalCommissionEarned += r.commissionEarned;
      acc.totalGstCollected += r.gstCollected;
      return acc;
    },
    { totalOrders: 0, totalGrossVolume: 0, totalCommissionEarned: 0, totalGstCollected: 0 }
  );

  return {
    reportType: 'commission',
    timeframe,
    startDate: start,
    endDate: end,
    totals,
    records,
  };
};

/**
 * Generate Subscription Report
 */
export const generateSubscriptionReport = async ({
  timeframe = 'monthly',
  startDate = null,
  endDate = null,
}) => {
  const { start, end } = getDateRange(timeframe, startDate, endDate);

  const invoices = await PlatformInvoice.find({
    createdAt: { $gte: start, $lte: end },
  })
    .populate('restaurantId', 'name restaurantName email')
    .sort({ createdAt: -1 })
    .lean();

  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  return {
    reportType: 'subscription',
    timeframe,
    startDate: start,
    endDate: end,
    totalRevenue,
    totalInvoices: invoices.length,
    records: invoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      restaurant: inv.restaurantId?.restaurantName || inv.restaurantId?.name || 'Unknown',
      planName: inv.planName,
      amount: inv.totalAmount,
      status: inv.status,
      paymentMethod: inv.paymentMethod,
      transactionId: inv.transactionId || '--',
      date: inv.invoiceDate || inv.createdAt,
    })),
  };
};

/**
 * Generate Gateway Fee & GST Reports
 */
export const generateTaxAndFeesReport = async ({
  reportType = 'gst', // 'gst' | 'gateway_fee'
  timeframe = 'monthly',
  startDate = null,
  endDate = null,
}) => {
  const { start, end } = getDateRange(timeframe, startDate, endDate);

  const settlements = await Settlement.find({
    isDeleted: { $ne: true },
    createdAt: { $gte: start, $lte: end },
  })
    .populate('restaurantId', 'name restaurantName')
    .sort({ createdAt: -1 })
    .lean();

  let totalTax = 0;
  let totalFees = 0;

  const records = settlements.map((s) => {
    totalTax += s.gst || 0;
    totalFees += s.gatewayFee || 0;
    return {
      settlementId: s.settlementId,
      restaurant: s.restaurantId?.restaurantName || s.restaurantId?.name || 'Unknown',
      grossAmount: s.grossAmount,
      platformCommission: s.platformCommission || s.commissionAmount,
      gatewayFee: s.gatewayFee,
      gst: s.gst,
      paymentMode: s.paymentMode,
      date: s.createdAt,
    };
  });

  return {
    reportType,
    timeframe,
    startDate: start,
    endDate: end,
    totalTax,
    totalFees,
    records,
  };
};

/**
 * Convert tabular records to CSV format
 */
export const convertReportToCSV = (records = [], fields = []) => {
  if (!records.length) return '';

  const headers = fields.length ? fields : Object.keys(records[0]);
  const rows = records.map((rec) => {
    return headers
      .map((h) => {
        let val = rec[h];
        if (val === undefined || val === null) val = '';
        if (val instanceof Date) val = val.toISOString().split('T')[0];
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

