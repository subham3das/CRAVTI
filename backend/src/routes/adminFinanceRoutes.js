import { Router } from 'express';
import { adminProtect } from '../middleware/adminAuthMiddleware.js';
import {
  getOverview,
  getWallets,
  getWalletLedger,
  adjustWallet,
  getSettlements,
  updateSettlementStatus,
  batchProcessSettlements,
  getSubscriptions,
  pauseSubscription,
  resumeSubscription,
  renewSubscription,
  cancelSubscription,
  getSubscriptionHistory,
  getCommissionRules,
  updateCommissionRule,
  getCommissionHistory,
  getRouteAccounts,
  reconnectRouteAccount,
  getReports,
  exportReportCSV,
  getAuditLogs,
  getSettings,
  updateSettings,
} from '../controllers/adminFinanceController.js';

const router = Router();

// Protect all admin finance routes
router.use(adminProtect);

// 1. Overview
router.get('/overview', getOverview);

// 2. Restaurant Wallets
router.get('/wallets', getWallets);
router.get('/wallets/:restaurantId/ledger', getWalletLedger);
router.post('/wallets/adjust', adjustWallet);

// 3. Settlement Center
router.get('/settlements', getSettlements);
router.patch('/settlements/:settlementId/status', updateSettlementStatus);
router.post('/settlements/batch-process', batchProcessSettlements);

// 4. Subscriptions
router.get('/subscriptions', getSubscriptions);
router.post('/subscriptions/pause', pauseSubscription);
router.post('/subscriptions/resume', resumeSubscription);
router.post('/subscriptions/renew', renewSubscription);
router.post('/subscriptions/cancel', cancelSubscription);
router.get('/subscriptions/history', getSubscriptionHistory);

// 5. Commission Rules
router.get('/commission-rules', getCommissionRules);
router.put('/commission-rules', updateCommissionRule);
router.get('/commission-history', getCommissionHistory);

// 6. Razorpay Route Accounts
router.get('/route-accounts', getRouteAccounts);
router.post('/route-accounts/reconnect', reconnectRouteAccount);

// 7. Reports
router.get('/reports', getReports);
router.get('/reports/export', exportReportCSV);

// 8. Audit Logs
router.get('/audit-logs', getAuditLogs);

// Platform Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;

