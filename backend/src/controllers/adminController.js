import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import {
  adminGetRestaurantBankDetailsService,
  adminApproveBankDetailsService,
  adminRejectBankDetailsService,
  adminRequestChangesBankDetailsService,
} from '../services/bankDetailsService.js';
import {
  loginAdminService,
  getDashboardStatsService,
  getRestaurantsService,
  getAdminOrdersService,
  getPlatformAnalyticsService,
  getSystemSettingsService,
  updateSystemSettingsService,
  getAdminFeatureFlagsService,
  toggleAdminFeatureFlagService,
  getActivityLogsService,
  getAdminsService,
  createAdminService,
  updateAdminProfileService,
  updateAdminStatusService,
  updateAdminRoleService,
  inviteAdminService,
  enhancedGlobalSearchService,
  getRestaurantDetailsFullService,
  updateRestaurantVerificationWorkflowService,
  updateRestaurantBankStatusService,
  restaurantQuickActionService,
  getRestaurantMenuFullService,
  getRestaurantTablesFullService,
  getRestaurantOrdersFullService,
  getRestaurantAnalyticsFullService,
  getRestaurantActivityTimelineService,
  updateRestaurantSettingsByAdminService,
  getAdminNotificationsService,
  markAdminNotificationReadService,
  markAllAdminNotificationsReadService,
  getRestaurantSupportSessionService,
  getAdminLoginHistoryService,
  getBusinessDashboardStatsService,
  getPlatformRevenueStatsService,
  getPlatformSubscriptionsService,
  updateRestaurantSubscriptionService,
  getPlatformInvoicesService,
  generatePlatformInvoiceService,
  getSupportTicketsService,
  createSupportTicketService,
  replySupportTicketService,
  updateSupportTicketStatusService,
  getAnnouncementsService,
  createAnnouncementService,
  updateAnnouncementStatusService,
  exportPlatformDataService,
  getSecurityOverviewService,
  getPlatformBackupsService,
  triggerPlatformBackupService,
  getSystemHealthService,
  getRealtimeActivityFeedService,
  getComprehensivePlatformAnalyticsService,
} from '../services/adminService.js';

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const userAgent = req.headers['user-agent'] || '';

  const result = await loginAdminService({ email, password, ip, userAgent });
  return sendSuccess(res, 'Login successful', result, HTTP_STATUS.OK, result);
});

export const getAdminProfile = asyncHandler(async (req, res) => {
  const admin = {
    _id: req.admin._id,
    id: req.admin._id,
    name: req.admin.name,
    email: req.admin.email,
    role: req.admin.role,
    avatar: req.admin.avatar,
    lastLogin: req.admin.lastLogin,
    status: req.admin.status,
  };
  const payload = { admin, user: admin };
  return sendSuccess(res, 'Admin profile retrieved', payload, HTTP_STATUS.OK, payload);
});

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const stats = await getDashboardStatsService();
  return sendSuccess(res, 'Dashboard statistics loaded', stats, HTTP_STATUS.OK, stats);
});

export const getRestaurants = asyncHandler(async (req, res) => {
  const data = await getRestaurantsService(req.query);
  return sendSuccess(res, 'Restaurants loaded', data, HTTP_STATUS.OK, data);
});

export const verifyRestaurant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const restaurant = await updateRestaurantVerificationWorkflowService(id, { status, reviewNotes: reason }, req.admin);
  return sendSuccess(res, `Restaurant status updated to ${status}`, { restaurant }, HTTP_STATUS.OK, { restaurant });
});

export const toggleRestaurantStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isDeleted, reason } = req.body;
  const action = isDeleted ? 'suspend' : 'reactivate';
  const restaurant = await restaurantQuickActionService(id, action, reason, req.admin);
  return sendSuccess(res, `Restaurant ${isDeleted ? 'disabled' : 'enabled'} successfully`, { restaurant }, HTTP_STATUS.OK, { restaurant });
});

export const getAdminOrders = asyncHandler(async (req, res) => {
  const data = await getAdminOrdersService(req.query);
  return sendSuccess(res, 'Orders loaded successfully', data, HTTP_STATUS.OK, data);
});

export const getPlatformAnalytics = asyncHandler(async (req, res) => {
  const analytics = await getPlatformAnalyticsService();
  return sendSuccess(res, 'Analytics loaded successfully', { analytics }, HTTP_STATUS.OK, { analytics });
});

export const getSystemSettings = asyncHandler(async (req, res) => {
  const settings = await getSystemSettingsService();
  return sendSuccess(res, 'System settings loaded', { settings }, HTTP_STATUS.OK, { settings });
});

export const updateSystemSettings = asyncHandler(async (req, res) => {
  const settings = await updateSystemSettingsService(req.body, req.admin);
  return sendSuccess(res, 'System settings updated successfully', { settings }, HTTP_STATUS.OK, { settings });
});

export const getAdminFeatureFlags = asyncHandler(async (req, res) => {
  const flags = await getAdminFeatureFlagsService();
  return sendSuccess(res, 'Feature flags loaded', { flags }, HTTP_STATUS.OK, { flags });
});

export const toggleAdminFeatureFlag = asyncHandler(async (req, res) => {
  const { key, value } = req.body;
  const flags = await toggleAdminFeatureFlagService(key, value, req.admin);
  return sendSuccess(res, `Feature flag ${key} updated`, { flags }, HTTP_STATUS.OK, { flags });
});

export const getActivityLogs = asyncHandler(async (req, res) => {
  const data = await getActivityLogsService(req.query);
  return sendSuccess(res, 'Activity logs loaded', data, HTTP_STATUS.OK, data);
});

export const getAdmins = asyncHandler(async (req, res) => {
  const admins = await getAdminsService();
  return sendSuccess(res, 'Admins loaded', { admins }, HTTP_STATUS.OK, { admins });
});

export const createAdmin = asyncHandler(async (req, res) => {
  const admin = await createAdminService(req.body, req.admin);
  return sendSuccess(res, 'Admin account created successfully', { admin }, HTTP_STATUS.CREATED, { admin });
});

export const updateAdminProfile = asyncHandler(async (req, res) => {
  const admin = await updateAdminProfileService(req.admin._id, req.body);
  const payload = { admin, user: admin };
  return sendSuccess(res, 'Admin profile updated successfully', payload, HTTP_STATUS.OK, payload);
});

export const updateAdminStatus = asyncHandler(async (req, res) => {
  const result = await updateAdminStatusService(req.params.id, req.body.status, req.admin);
  return sendSuccess(res, 'Admin status updated successfully', result, HTTP_STATUS.OK, result);
});

export const updateAdminRole = asyncHandler(async (req, res) => {
  const result = await updateAdminRoleService(req.params.id, req.body.role, req.admin);
  return sendSuccess(res, 'Admin role updated successfully', result, HTTP_STATUS.OK, result);
});

export const inviteAdmin = asyncHandler(async (req, res) => {
  const result = await inviteAdminService(req.body, req.admin);
  return sendSuccess(res, 'Admin invited successfully', result, HTTP_STATUS.CREATED, result);
});

export const globalSearch = asyncHandler(async (req, res) => {
  const results = await enhancedGlobalSearchService(req.query.q || '');
  return sendSuccess(res, 'Search completed', results, HTTP_STATUS.OK, results);
});

// Phase 2: Restaurant Operations Center
export const getRestaurantDetailsFull = asyncHandler(async (req, res) => {
  const data = await getRestaurantDetailsFullService(req.params.id);
  return sendSuccess(res, 'Restaurant details loaded successfully', data, HTTP_STATUS.OK, data);
});

export const updateRestaurantVerification = asyncHandler(async (req, res) => {
  const restaurant = await updateRestaurantVerificationWorkflowService(req.params.id, req.body, req.admin);
  return sendSuccess(res, 'Restaurant verification status updated', { restaurant }, HTTP_STATUS.OK, { restaurant });
});

export const updateRestaurantBankStatus = asyncHandler(async (req, res) => {
  const restaurant = await updateRestaurantBankStatusService(req.params.id, req.body, req.admin);
  return sendSuccess(res, 'Restaurant bank details updated', { restaurant }, HTTP_STATUS.OK, { restaurant });
});

export const getRestaurantBankDetailsAdmin = asyncHandler(async (req, res) => {
  const data = await adminGetRestaurantBankDetailsService(req.params.id);
  return sendSuccess(res, 'Restaurant bank details loaded', data, HTTP_STATUS.OK, data);
});

export const approveRestaurantBankDetails = asyncHandler(async (req, res) => {
  const reqMeta = {
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    browser: req.headers['user-agent'] || '',
  };
  const data = await adminApproveBankDetailsService(req.params.id, req.admin, reqMeta);
  return sendSuccess(res, 'Bank details approved successfully', data, HTTP_STATUS.OK, data);
});

export const rejectRestaurantBankDetails = asyncHandler(async (req, res) => {
  const reqMeta = {
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    browser: req.headers['user-agent'] || '',
  };
  const data = await adminRejectBankDetailsService(req.params.id, req.body, req.admin, reqMeta);
  return sendSuccess(res, 'Bank details rejected', data, HTTP_STATUS.OK, data);
});

export const requestChangesRestaurantBankDetails = asyncHandler(async (req, res) => {
  const reqMeta = {
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    browser: req.headers['user-agent'] || '',
  };
  const data = await adminRequestChangesBankDetailsService(req.params.id, req.body, req.admin, reqMeta);
  return sendSuccess(res, 'Changes requested for bank details', data, HTTP_STATUS.OK, data);
});

export const executeRestaurantQuickAction = asyncHandler(async (req, res) => {
  const { action, reason } = req.body;
  const restaurant = await restaurantQuickActionService(req.params.id, action, reason, req.admin);
  return sendSuccess(res, `Action ${action} executed successfully`, { restaurant }, HTTP_STATUS.OK, { restaurant });
});

export const getRestaurantMenuFull = asyncHandler(async (req, res) => {
  const data = await getRestaurantMenuFullService(req.params.id);
  return sendSuccess(res, 'Restaurant menu loaded', data, HTTP_STATUS.OK, data);
});

export const getRestaurantTablesFull = asyncHandler(async (req, res) => {
  const data = await getRestaurantTablesFullService(req.params.id);
  return sendSuccess(res, 'Restaurant tables loaded', data, HTTP_STATUS.OK, data);
});

export const getRestaurantOrdersFull = asyncHandler(async (req, res) => {
  const data = await getRestaurantOrdersFullService(req.params.id, req.query);
  return sendSuccess(res, 'Restaurant orders loaded', data, HTTP_STATUS.OK, data);
});

export const getRestaurantAnalyticsFull = asyncHandler(async (req, res) => {
  const data = await getRestaurantAnalyticsFullService(req.params.id);
  return sendSuccess(res, 'Restaurant analytics loaded', data, HTTP_STATUS.OK, data);
});

export const getRestaurantActivityTimeline = asyncHandler(async (req, res) => {
  const data = await getRestaurantActivityTimelineService(req.params.id);
  return sendSuccess(res, 'Activity timeline loaded', data, HTTP_STATUS.OK, data);
});

export const updateRestaurantAdminSettings = asyncHandler(async (req, res) => {
  const data = await updateRestaurantSettingsByAdminService(req.params.id, req.body, req.admin);
  return sendSuccess(res, 'Restaurant settings updated', data, HTTP_STATUS.OK, data);
});

// Phase 2: Notifications Center
export const getAdminNotifications = asyncHandler(async (req, res) => {
  const data = await getAdminNotificationsService(req.query);
  return sendSuccess(res, 'Notifications retrieved', data, HTTP_STATUS.OK, data);
});

export const markAdminNotificationRead = asyncHandler(async (req, res) => {
  const notification = await markAdminNotificationReadService(req.params.id, req.admin._id);
  return sendSuccess(res, 'Notification marked as read', { notification }, HTTP_STATUS.OK, { notification });
});

export const markAllAdminNotificationsRead = asyncHandler(async (req, res) => {
  await markAllAdminNotificationsReadService(req.admin._id);
  return sendSuccess(res, 'All notifications marked as read', null, HTTP_STATUS.OK);
});

// Phase 2: Support Mode ("View As Restaurant")
export const getRestaurantSupportSession = asyncHandler(async (req, res) => {
  const data = await getRestaurantSupportSessionService(req.params.restaurantId, req.admin);
  return sendSuccess(res, 'Support session established', data, HTTP_STATUS.OK, data);
});

// Phase 2: Login History
export const getAdminLoginHistory = asyncHandler(async (req, res) => {
  const data = await getAdminLoginHistoryService(req.query);
  return sendSuccess(res, 'Login history loaded', data, HTTP_STATUS.OK, data);
});

// Phase 3: Platform Operations & Business Management
export const getBusinessDashboard = asyncHandler(async (req, res) => {
  const stats = await getBusinessDashboardStatsService();
  return sendSuccess(res, 'Business dashboard statistics loaded', stats, HTTP_STATUS.OK, stats);
});

export const getPlatformRevenueStats = asyncHandler(async (req, res) => {
  console.log('[Revenue] Controller Entered: getPlatformRevenueStats - Query:', req.query);
  try {
    const data = await getPlatformRevenueStatsService(req.query);
    console.log('[Revenue] Response Sent: 200 OK');
    return sendSuccess(res, 'Platform revenue metrics loaded', data, HTTP_STATUS.OK, data);
  } catch (error) {
    console.error('[Revenue Controller Error]:', error.stack || error);
    const fallbackData = {
      grossRevenue: 0,
      commissionRevenue: 0,
      restaurantPayouts: 0,
      subscriptionRevenue: 0,
      monthlyRevenue: 0,
      todayRevenue: 0,
      pendingSettlements: 0,
      refunds: 0,
      chart: [],
      topRestaurants: [],
      lowestRestaurants: [],
      platformGrossRevenue: 0,
      restaurantNetRevenue: 0,
      refundsTotal: 0,
      trend: [],
      topEarningRestaurants: [],
      lowestPerformingRestaurants: [],
    };
    return sendSuccess(res, 'Platform revenue metrics loaded (fallback)', fallbackData, HTTP_STATUS.OK, fallbackData);
  }
});

export const getPlatformSubscriptions = asyncHandler(async (req, res) => {
  const data = await getPlatformSubscriptionsService(req.query);
  return sendSuccess(res, 'Subscriptions loaded', data, HTTP_STATUS.OK, data);
});

export const updateRestaurantSubscription = asyncHandler(async (req, res) => {
  const sub = await updateRestaurantSubscriptionService(req.params.restaurantId, req.body, req.admin);
  return sendSuccess(res, 'Subscription updated successfully', { subscription: sub }, HTTP_STATUS.OK, { subscription: sub });
});

export const getPlatformInvoices = asyncHandler(async (req, res) => {
  const data = await getPlatformInvoicesService(req.query);
  return sendSuccess(res, 'Invoices loaded', data, HTTP_STATUS.OK, data);
});

export const generatePlatformInvoice = asyncHandler(async (req, res) => {
  const invoice = await generatePlatformInvoiceService(req.params.restaurantId, req.body, req.admin);
  return sendSuccess(res, 'Invoice created', { invoice }, HTTP_STATUS.CREATED, { invoice });
});

export const getSupportTickets = asyncHandler(async (req, res) => {
  const data = await getSupportTicketsService(req.query);
  return sendSuccess(res, 'Support tickets loaded', data, HTTP_STATUS.OK, data);
});

export const createSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await createSupportTicketService(req.body, req.admin);
  return sendSuccess(res, 'Support ticket created', { ticket }, HTTP_STATUS.CREATED, { ticket });
});

export const replySupportTicket = asyncHandler(async (req, res) => {
  const ticket = await replySupportTicketService(req.params.ticketId, req.body, req.admin);
  return sendSuccess(res, 'Reply added to ticket', { ticket }, HTTP_STATUS.OK, { ticket });
});

export const updateSupportTicketStatus = asyncHandler(async (req, res) => {
  const ticket = await updateSupportTicketStatusService(req.params.ticketId, req.body, req.admin);
  return sendSuccess(res, 'Ticket status updated', { ticket }, HTTP_STATUS.OK, { ticket });
});

export const getAnnouncements = asyncHandler(async (req, res) => {
  const data = await getAnnouncementsService(req.query);
  return sendSuccess(res, 'Announcements loaded', data, HTTP_STATUS.OK, data);
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await createAnnouncementService(req.body, req.admin);
  return sendSuccess(res, 'Announcement created', { announcement }, HTTP_STATUS.CREATED, { announcement });
});

export const updateAnnouncementStatus = asyncHandler(async (req, res) => {
  const announcement = await updateAnnouncementStatusService(req.params.id, req.body.status, req.admin);
  return sendSuccess(res, 'Announcement status updated', { announcement }, HTTP_STATUS.OK, { announcement });
});

export const exportPlatformData = asyncHandler(async (req, res) => {
  const data = await exportPlatformDataService(req.query);
  return sendSuccess(res, 'Export generated successfully', data, HTTP_STATUS.OK, data);
});

export const getSecurityOverview = asyncHandler(async (req, res) => {
  const data = await getSecurityOverviewService();
  return sendSuccess(res, 'Security overview loaded', data, HTTP_STATUS.OK, data);
});

export const getPlatformBackups = asyncHandler(async (req, res) => {
  const data = await getPlatformBackupsService();
  return sendSuccess(res, 'Backups loaded', data, HTTP_STATUS.OK, data);
});

export const triggerPlatformBackup = asyncHandler(async (req, res) => {
  const backup = await triggerPlatformBackupService(req.admin);
  return sendSuccess(res, 'Platform backup generated', { backup }, HTTP_STATUS.CREATED, { backup });
});

export const getSystemHealth = asyncHandler(async (req, res) => {
  const data = await getSystemHealthService();
  return sendSuccess(res, 'System health diagnostics loaded', data, HTTP_STATUS.OK, data);
});

export const getRealtimeActivityFeed = asyncHandler(async (req, res) => {
  const data = await getRealtimeActivityFeedService();
  return sendSuccess(res, 'Activity feed loaded', data, HTTP_STATUS.OK, data);
});

export const getComprehensivePlatformAnalytics = asyncHandler(async (req, res) => {
  const data = await getComprehensivePlatformAnalyticsService();
  return sendSuccess(res, 'Platform analytics loaded', data, HTTP_STATUS.OK, data);
});

