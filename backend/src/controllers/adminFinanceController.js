import { getFinanceOverviewService } from '../services/financeOverviewService.js';
import {
  listRestaurantWalletsService,
  adjustWalletBalanceService,
  getWalletDetailsService,
} from '../services/walletService.js';
import {
  getAdminSettlementsService,
  updateSettlementStatusService,
  batchProcessSettlementsService,
} from '../services/settlementService.js';
import {
  getAdminSubscriptionsListService,
  pauseSubscriptionService,
  resumeSubscriptionService,
  renewSubscriptionService,
  cancelSubscriptionService,
  getSubscriptionHistoryService,
} from '../services/subscriptionService.js';
import {
  getEffectiveCommissionRates,
  updateCommissionRateService,
  getCommissionHistoryService,
} from '../services/commissionService.js';
import {
  listRouteAccountsService,
  reconnectRouteAccountService,
} from '../services/routeAccountService.js';
import {
  generateSettlementReport,
  generateCommissionReport,
  generateSubscriptionReport,
  generateTaxAndFeesReport,
  convertReportToCSV,
} from '../services/reportService.js';
import { getFinanceAuditLogs, logFinanceAudit } from '../services/auditService.js';
import {
  getPlatformFinanceSettings,
  updatePlatformFinanceSettings,
} from '../services/platformSettingsService.js';

export const getOverview = async (req, res, next) => {
  try {
    const data = await getFinanceOverviewService();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getWallets = async (req, res, next) => {
  try {
    const result = await listRestaurantWalletsService(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getWalletLedger = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const result = await getWalletDetailsService(restaurantId, req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const adjustWallet = async (req, res, next) => {
  try {
    const { restaurantId, amount, type, reason } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const result = await adjustWalletBalanceService({
      restaurantId,
      amount,
      type,
      reason,
      admin: req.user,
      ip,
    });
    res.json({ success: true, message: 'Wallet balance adjusted successfully', ...result });
  } catch (error) {
    next(error);
  }
};

export const getSettlements = async (req, res, next) => {
  try {
    const result = await getAdminSettlementsService(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const updateSettlementStatus = async (req, res, next) => {
  try {
    const { settlementId } = req.params;
    const { targetStatus, utr, reason } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const settlement = await updateSettlementStatusService({
      settlementId,
      targetStatus,
      utr,
      reason,
      admin: req.user,
      ip,
    });
    res.json({ success: true, message: `Settlement marked as ${targetStatus}`, settlement });
  } catch (error) {
    next(error);
  }
};

export const batchProcessSettlements = async (req, res, next) => {
  try {
    const { settlementIds, action, utr, notes } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const result = await batchProcessSettlementsService({
      settlementIds,
      action,
      utr,
      notes,
      admin: req.user,
      ip,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptions = async (req, res, next) => {
  try {
    const result = await getAdminSubscriptionsListService(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const pauseSubscription = async (req, res, next) => {
  try {
    const { restaurantId, reason } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const result = await pauseSubscriptionService({
      restaurantId,
      reason,
      admin: req.user,
      ip,
    });
    res.json({ success: true, message: 'Subscription paused successfully', ...result });
  } catch (error) {
    next(error);
  }
};

export const resumeSubscription = async (req, res, next) => {
  try {
    const { restaurantId, reason } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const result = await resumeSubscriptionService({
      restaurantId,
      reason,
      admin: req.user,
      ip,
    });
    res.json({ success: true, message: 'Subscription resumed successfully', ...result });
  } catch (error) {
    next(error);
  }
};

export const renewSubscription = async (req, res, next) => {
  try {
    const { restaurantId, months, amount } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const result = await renewSubscriptionService({
      restaurantId,
      months,
      amount,
      admin: req.user,
      ip,
    });
    res.json({ success: true, message: 'Subscription renewed successfully', ...result });
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const { restaurantId, cancelImmediately } = req.body;
    const result = await cancelSubscriptionService({
      restaurantId,
      user: req.user,
      cancelImmediately,
    });
    res.json({ success: true, message: 'Subscription cancelled successfully', ...result });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionHistory = async (req, res, next) => {
  try {
    const result = await getSubscriptionHistoryService(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getCommissionRules = async (req, res, next) => {
  try {
    const { restaurantId } = req.query;
    const rates = await getEffectiveCommissionRates(restaurantId);
    res.json({ success: true, ...rates });
  } catch (error) {
    next(error);
  }
};

export const updateCommissionRule = async (req, res, next) => {
  try {
    const { restaurantId, newRate, reason, effectiveDate } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const result = await updateCommissionRateService({
      restaurantId,
      newRate,
      reason,
      effectiveDate,
      admin: req.user,
      ip,
    });
    res.json({ success: true, message: 'Commission updated successfully', ...result });
  } catch (error) {
    next(error);
  }
};

export const getCommissionHistory = async (req, res, next) => {
  try {
    const result = await getCommissionHistoryService(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getRouteAccounts = async (req, res, next) => {
  try {
    const result = await listRouteAccountsService(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const reconnectRouteAccount = async (req, res, next) => {
  try {
    const { restaurantId, newAccountId } = req.body;
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const result = await reconnectRouteAccountService({
      restaurantId,
      newAccountId,
      admin: req.user,
      ip,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const { type = 'settlement', timeframe = 'monthly', restaurantId, startDate, endDate } = req.query;

    let data;
    switch (type) {
      case 'settlement':
        data = await generateSettlementReport({ timeframe, restaurantId, startDate, endDate });
        break;
      case 'commission':
        data = await generateCommissionReport({ timeframe, restaurantId, startDate, endDate });
        break;
      case 'subscription':
        data = await generateSubscriptionReport({ timeframe, startDate, endDate });
        break;
      case 'gst':
      case 'gateway_fee':
        data = await generateTaxAndFeesReport({ reportType: type, timeframe, startDate, endDate });
        break;
      default:
        data = await generateSettlementReport({ timeframe, restaurantId, startDate, endDate });
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const exportReportCSV = async (req, res, next) => {
  try {
    const { type = 'settlement', timeframe = 'monthly', restaurantId, startDate, endDate } = req.query;

    let report;
    switch (type) {
      case 'settlement':
        report = await generateSettlementReport({ timeframe, restaurantId, startDate, endDate });
        break;
      case 'commission':
        report = await generateCommissionReport({ timeframe, restaurantId, startDate, endDate });
        break;
      case 'subscription':
        report = await generateSubscriptionReport({ timeframe, startDate, endDate });
        break;
      case 'gst':
      case 'gateway_fee':
        report = await generateTaxAndFeesReport({ reportType: type, timeframe, startDate, endDate });
        break;
      default:
        report = await generateSettlementReport({ timeframe, restaurantId, startDate, endDate });
    }

    const csv = convertReportToCSV(report.records || []);
    res.header('Content-Type', 'text/csv');
    res.attachment(`craviti_${type}_report_${Date.now()}.csv`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const result = await getFinanceAuditLogs(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (req, res, next) => {
  try {
    const settings = await getPlatformFinanceSettings();
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const settings = await updatePlatformFinanceSettings(req.body, req.user);
    await logFinanceAudit({
      action: 'settings_updated',
      admin: req.user,
      ip,
      reason: 'Finance Platform Settings updated',
      metadata: req.body,
    });
    res.json({ success: true, message: 'Platform settings updated successfully', settings });
  } catch (error) {
    next(error);
  }
};

