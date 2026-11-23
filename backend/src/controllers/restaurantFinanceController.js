import { getOrCreateWallet, getWalletDetailsService } from '../services/walletService.js';
import { Settlement } from '../models/Settlement.js';
import { PlatformInvoice } from '../models/PlatformInvoice.js';
import { getSubscriptionStatusService } from '../services/subscriptionService.js';
import { generateSettlementReport, convertReportToCSV } from '../services/reportService.js';

export const getRestaurantFinanceOverview = async (req, res, next) => {
  try {
    const restaurantId = req.restaurant?._id || req.user?.restaurantId;
    const [wallet, subscriptionStatus, recentSettlements] = await Promise.all([
      getOrCreateWallet(restaurantId),
      getSubscriptionStatusService(restaurantId),
      Settlement.find({ restaurantId, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    res.json({
      success: true,
      wallet: {
        currentBalance: wallet.currentBalance,
        pendingBalance: wallet.pendingBalance,
        settledBalance: wallet.settledBalance,
        lifetimeEarnings: wallet.lifetimeEarnings,
        lifetimeCommission: wallet.lifetimeCommission,
        lifetimeGatewayFees: wallet.lifetimeGatewayFees,
        lastSettlementAt: wallet.lastSettlementAt,
      },
      subscription: subscriptionStatus,
      recentSettlements,
    });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantSettlements = async (req, res, next) => {
  try {
    const restaurantId = req.restaurant?._id || req.user?.restaurantId;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { restaurantId, isDeleted: { $ne: true } };
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));

    const [settlements, total] = await Promise.all([
      Settlement.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Settlement.countDocuments(query),
    ]);

    res.json({
      success: true,
      settlements,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantInvoices = async (req, res, next) => {
  try {
    const restaurantId = req.restaurant?._id || req.user?.restaurantId;
    const invoices = await PlatformInvoice.find({ restaurantId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, invoices });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantTransactions = async (req, res, next) => {
  try {
    const restaurantId = req.restaurant?._id || req.user?.restaurantId;
    const result = await getWalletDetailsService(restaurantId, req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const exportRestaurantSettlementReport = async (req, res, next) => {
  try {
    const restaurantId = req.restaurant?._id || req.user?.restaurantId;
    const { timeframe = 'monthly', startDate, endDate } = req.query;

    const report = await generateSettlementReport({
      timeframe,
      restaurantId,
      startDate,
      endDate,
    });

    const csv = convertReportToCSV(report.records || []);
    res.header('Content-Type', 'text/csv');
    res.attachment(`settlement_report_${Date.now()}.csv`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

