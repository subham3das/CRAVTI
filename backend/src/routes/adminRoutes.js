import { Router } from 'express';
import {
  adminLogin,
  getAdminProfile,
  getAdminDashboard,
  getRestaurants,
  verifyRestaurant,
  toggleRestaurantStatus,
  getAdminOrders,
  getPlatformAnalytics,
  getSystemSettings,
  updateSystemSettings,
  getAdminFeatureFlags,
  toggleAdminFeatureFlag,
  getActivityLogs,
  getAdmins,
  createAdmin,
  globalSearch,
  getRestaurantDetailsFull,
  updateRestaurantVerification,
  updateRestaurantBankStatus,
  getRestaurantBankDetailsAdmin,
  approveRestaurantBankDetails,
  rejectRestaurantBankDetails,
  requestChangesRestaurantBankDetails,
  executeRestaurantQuickAction,
  getRestaurantMenuFull,
  getRestaurantTablesFull,
  getRestaurantOrdersFull,
  getRestaurantAnalyticsFull,
  getRestaurantActivityTimeline,
  updateRestaurantAdminSettings,
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  getRestaurantSupportSession,
  getAdminLoginHistory,
  getBusinessDashboard,
  getPlatformRevenueStats,
  getPlatformSubscriptions,
  updateRestaurantSubscription,
  getPlatformInvoices,
  generatePlatformInvoice,
  getSupportTickets,
  createSupportTicket,
  replySupportTicket,
  updateSupportTicketStatus,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncementStatus,
  exportPlatformData,
  getSecurityOverview,
  getPlatformBackups,
  triggerPlatformBackup,
  getSystemHealth,
  getRealtimeActivityFeed,
  getComprehensivePlatformAnalytics,
} from '../controllers/adminController.js';
import { getAdminPayments, refundPayment } from '../controllers/paymentController.js';
import { adminProtect, requireAdminRole, requirePermission } from '../middleware/adminAuthMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { ADMIN_ROLES, PERMISSIONS } from '../constants/adminConstants.js';

const router = Router();

// ==========================================
// Public Admin Authentication Routes
// ==========================================
router.post('/auth/login', authLimiter, adminLogin);

// ==========================================
// Protected Admin Panel Routes
// ==========================================
router.use(adminProtect);

router.get('/auth/me', getAdminProfile);

// Phase 3 Module 1: Upgraded Platform Business Dashboard
router.get('/dashboard', getBusinessDashboard);

// Global Categorized Search (Module 8)
router.get('/search', globalSearch);

// Notification Center (Module 7)
router.get('/notifications', getAdminNotifications);
router.patch('/notifications/mark-all-read', markAllAdminNotificationsRead);
router.patch('/notifications/:id/read', markAdminNotificationRead);

// Platform Revenue Center (Module 2)
router.get('/revenue', requirePermission(PERMISSIONS.ANALYTICS_VIEW), getPlatformRevenueStats);

// Payments Center (Phase 5)
router.get('/payments', requirePermission(PERMISSIONS.ANALYTICS_VIEW), getAdminPayments);
router.post('/payments/refund', requirePermission(PERMISSIONS.ANALYTICS_VIEW), refundPayment);

// Restaurant Subscriptions (Module 3)
router.get('/subscriptions', requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE), getPlatformSubscriptions);
router.patch('/subscriptions/:restaurantId', requirePermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE), updateRestaurantSubscription);

// Billing & Invoices Center (Module 4)
router.get('/billing/invoices', requirePermission(PERMISSIONS.BILLING_VIEW), getPlatformInvoices);
router.post('/billing/invoices/:restaurantId', requirePermission(PERMISSIONS.BILLING_VIEW), generatePlatformInvoice);

// Support Ticket System (Module 5)
router.get('/support/tickets', requirePermission(PERMISSIONS.SUPPORT_MANAGE), getSupportTickets);
router.post('/support/tickets', requirePermission(PERMISSIONS.SUPPORT_MANAGE), createSupportTicket);
router.post('/support/tickets/:ticketId/reply', requirePermission(PERMISSIONS.SUPPORT_MANAGE), replySupportTicket);
router.patch('/support/tickets/:ticketId/status', requirePermission(PERMISSIONS.SUPPORT_MANAGE), updateSupportTicketStatus);

// Announcement Center (Module 6)
router.get('/announcements', requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE), getAnnouncements);
router.post('/announcements', requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE), createAnnouncement);
router.patch('/announcements/:id/status', requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE), updateAnnouncementStatus);

// Export Center (Module 9)
router.get('/export', requirePermission(PERMISSIONS.ANALYTICS_VIEW), exportPlatformData);

// Security Center (Module 11)
router.get('/security/overview', requirePermission(PERMISSIONS.SECURITY_MANAGE), getSecurityOverview);
router.get('/login-history', requirePermission(PERMISSIONS.AUDIT_VIEW), getAdminLoginHistory);

// Backup & Restore (Module 12)
router.get('/backups', requirePermission(PERMISSIONS.BACKUP_MANAGE), getPlatformBackups);
router.post('/backups/trigger', requirePermission(PERMISSIONS.BACKUP_MANAGE), triggerPlatformBackup);

// System Health Diagnostics (Module 13)
router.get('/health', getSystemHealth);

// Activity Center (Module 14)
router.get('/activity-feed', requirePermission(PERMISSIONS.AUDIT_VIEW), getRealtimeActivityFeed);
router.get('/activity-logs', requirePermission(PERMISSIONS.AUDIT_VIEW), getActivityLogs);

// Comprehensive Platform Analytics (Module 15)
router.get('/platform-analytics', requirePermission(PERMISSIONS.ANALYTICS_VIEW), getComprehensivePlatformAnalytics);
router.get('/analytics', requirePermission(PERMISSIONS.ANALYTICS_VIEW), getPlatformAnalytics);

// Support Mode Impersonation (Super Admin Only)
router.post('/support/impersonate/:restaurantId', requireAdminRole(ADMIN_ROLES.SUPER_ADMIN), getRestaurantSupportSession);

// Restaurants Core & Listing
router.get('/restaurants', requirePermission(PERMISSIONS.RESTAURANT_VIEW), getRestaurants);
router.patch('/restaurants/:id/verify', requirePermission(PERMISSIONS.RESTAURANT_VERIFY), verifyRestaurant);
router.patch('/restaurants/:id/status', requirePermission(PERMISSIONS.RESTAURANT_SUSPEND), toggleRestaurantStatus);

// Restaurant Operations Center - 10 Dedicated Tabs
router.get('/restaurants/:id', requirePermission(PERMISSIONS.RESTAURANT_VIEW), getRestaurantDetailsFull);
router.patch('/restaurants/:id/verification', requirePermission(PERMISSIONS.RESTAURANT_VERIFY), updateRestaurantVerification);
router.patch('/restaurants/:id/bank', requirePermission(PERMISSIONS.RESTAURANT_VERIFY), updateRestaurantBankStatus);
// Phase 4.1: Dedicated Bank Verification Integration Endpoints
router.get('/restaurants/:id/bank-details', requirePermission(PERMISSIONS.RESTAURANT_VERIFY), getRestaurantBankDetailsAdmin);
router.patch('/restaurants/:id/bank-details/approve', requirePermission(PERMISSIONS.RESTAURANT_VERIFY), approveRestaurantBankDetails);
router.patch('/restaurants/:id/bank-details/reject', requirePermission(PERMISSIONS.RESTAURANT_VERIFY), rejectRestaurantBankDetails);
router.patch('/restaurants/:id/bank-details/request-changes', requirePermission(PERMISSIONS.RESTAURANT_VERIFY), requestChangesRestaurantBankDetails);
router.patch('/restaurants/:id/quick-action', requirePermission(PERMISSIONS.RESTAURANT_SUSPEND), executeRestaurantQuickAction);
router.get('/restaurants/:id/menu', requirePermission(PERMISSIONS.RESTAURANT_VIEW), getRestaurantMenuFull);
router.get('/restaurants/:id/tables', requirePermission(PERMISSIONS.RESTAURANT_VIEW), getRestaurantTablesFull);
router.get('/restaurants/:id/orders', requirePermission(PERMISSIONS.ORDERS_VIEW), getRestaurantOrdersFull);
router.get('/restaurants/:id/analytics', requirePermission(PERMISSIONS.ANALYTICS_VIEW), getRestaurantAnalyticsFull);
router.get('/restaurants/:id/timeline', requirePermission(PERMISSIONS.RESTAURANT_VIEW), getRestaurantActivityTimeline);
router.patch('/restaurants/:id/settings', requirePermission(PERMISSIONS.SETTINGS_EDIT), updateRestaurantAdminSettings);

// Orders Management
router.get('/orders', requirePermission(PERMISSIONS.ORDERS_VIEW), getAdminOrders);

// Feature Flags
router.get('/feature-flags', requirePermission(PERMISSIONS.SETTINGS_VIEW), getAdminFeatureFlags);
router.post('/feature-flags/toggle', requirePermission(PERMISSIONS.SETTINGS_EDIT), toggleAdminFeatureFlag);

// System Settings (Module 10)
router.get('/settings', requirePermission(PERMISSIONS.SETTINGS_VIEW), getSystemSettings);
router.put('/settings', requireRoleOrSuperAdmin(ADMIN_ROLES.SUPER_ADMIN), updateSystemSettings);

// Admin Team Management (Super Admin only)
router.get('/admins', requireAdminRole(ADMIN_ROLES.SUPER_ADMIN), getAdmins);
router.post('/admins', requireAdminRole(ADMIN_ROLES.SUPER_ADMIN), createAdmin);

function requireRoleOrSuperAdmin(role) {
  return requireAdminRole(role);
}

export default router;
