import api from './api';

export const loginAdminApi = (data) =>
  api.post('/auth/login', data).then((res) => res.data);

export const fetchAdminProfileApi = () =>
  api.get('/auth/me').then((res) => res.data);

export const fetchDashboardStatsApi = () =>
  api.get('/dashboard').then((res) => res.data);

export const fetchRestaurantsApi = (params = {}) =>
  api.get('/restaurants', { params }).then((res) => res.data);

export const verifyRestaurantApi = (id, status, reason = '') =>
  api.patch(`/restaurants/${id}/verify`, { status, reason }).then((res) => res.data);

export const toggleRestaurantStatusApi = (id, isDeleted, reason = '') =>
  api.patch(`/restaurants/${id}/status`, { isDeleted, reason }).then((res) => res.data);

export const fetchAdminOrdersApi = (params = {}) =>
  api.get('/orders', { params }).then((res) => res.data);

export const fetchPlatformAnalyticsApi = () =>
  api.get('/analytics').then((res) => res.data);

export const fetchSystemSettingsApi = () =>
  api.get('/settings').then((res) => res.data);

export const updateSystemSettingsApi = (data) =>
  api.put('/settings', data).then((res) => res.data);

export const fetchFeatureFlagsApi = () =>
  api.get('/feature-flags').then((res) => res.data);

export const toggleFeatureFlagApi = (key, value) =>
  api.post('/feature-flags/toggle', { key, value }).then((res) => res.data);

export const fetchActivityLogsApi = (params = {}) =>
  api.get('/activity-logs', { params }).then((res) => res.data);

export const fetchAdminsApi = () =>
  api.get('/admins').then((res) => res.data);

export const createAdminApi = (data) =>
  api.post('/admins', data).then((res) => res.data);

export const globalSearchApi = (q) =>
  api.get('/search', { params: { q } }).then((res) => res.data);

// ==========================================
// Phase 2: Operations Center APIs
// ==========================================

// 1. Restaurant Details (Full View)
export const fetchRestaurantDetailsFullApi = (id) =>
  api.get(`/restaurants/${id}`).then((res) => res.data);

export const updateRestaurantVerificationApi = (id, data) =>
  api.patch(`/restaurants/${id}/verification`, data).then((res) => res.data);

export const updateRestaurantBankStatusApi = (id, data) =>
  api.patch(`/restaurants/${id}/bank`, data).then((res) => res.data);

// Phase 4.1 Dedicated Bank Verification APIs
export const fetchRestaurantBankDetailsFullApi = (id) =>
  api.get(`/restaurants/${id}/bank-details`).then((res) => res.data);

export const approveRestaurantBankDetailsApi = (id) =>
  api.patch(`/restaurants/${id}/bank-details/approve`).then((res) => res.data);

export const rejectRestaurantBankDetailsApi = (id, reason) =>
  api.patch(`/restaurants/${id}/bank-details/reject`, { reason }).then((res) => res.data);

export const requestChangesRestaurantBankDetailsApi = (id, reason) =>
  api.patch(`/restaurants/${id}/bank-details/request-changes`, { reason }).then((res) => res.data);

export const executeRestaurantQuickActionApi = (id, action, reason = '') =>
  api.patch(`/restaurants/${id}/quick-action`, { action, reason }).then((res) => res.data);

export const fetchRestaurantMenuFullApi = (id) =>
  api.get(`/restaurants/${id}/menu`).then((res) => res.data);

export const fetchRestaurantTablesFullApi = (id) =>
  api.get(`/restaurants/${id}/tables`).then((res) => res.data);

export const fetchRestaurantOrdersFullApi = (id, params = {}) =>
  api.get(`/restaurants/${id}/orders`, { params }).then((res) => res.data);

export const fetchRestaurantAnalyticsFullApi = (id) =>
  api.get(`/restaurants/${id}/analytics`).then((res) => res.data);

export const fetchRestaurantTimelineApi = (id) =>
  api.get(`/restaurants/${id}/timeline`).then((res) => res.data);

export const updateRestaurantAdminSettingsApi = (id, data) =>
  api.patch(`/restaurants/${id}/settings`, data).then((res) => res.data);

// 2. Notification Center
export const fetchAdminNotificationsApi = (params = {}) =>
  api.get('/notifications', { params }).then((res) => res.data);

export const markAdminNotificationReadApi = (id) =>
  api.patch(`/notifications/${id}/read`).then((res) => res.data);

export const markAllAdminNotificationsReadApi = () =>
  api.patch('/notifications/mark-all-read').then((res) => res.data);

// 3. Support Mode ("View As Restaurant")
export const impersonateRestaurantSupportApi = (restaurantId) =>
  api.post(`/support/impersonate/${restaurantId}`).then((res) => res.data);

// 4. Login History & Security
export const fetchAdminLoginHistoryApi = (params = {}) =>
  api.get('/login-history', { params }).then((res) => res.data);

// ==========================================
// Phase 3: Platform Management & Operations APIs
// ==========================================

// 1. Business Dashboard
export const fetchBusinessDashboardApi = () =>
  api.get('/dashboard').then((res) => res.data);

// 2. Platform Revenue
export const fetchPlatformRevenueApi = (params = {}) =>
  api.get('/revenue', { params }).then((res) => res.data);

// 3. Subscriptions
export const fetchSubscriptionsApi = (params = {}) =>
  api.get('/subscriptions', { params }).then((res) => res.data);

export const updateRestaurantSubscriptionApi = (restaurantId, data) =>
  api.patch(`/subscriptions/${restaurantId}`, data).then((res) => res.data);

// 4. Billing & Invoices
export const fetchPlatformInvoicesApi = (params = {}) =>
  api.get('/billing/invoices', { params }).then((res) => res.data);

export const generatePlatformInvoiceApi = (restaurantId, data) =>
  api.post(`/billing/invoices/${restaurantId}`, data).then((res) => res.data);

// 5. Support Tickets
export const fetchSupportTicketsApi = (params = {}) =>
  api.get('/support/tickets', { params }).then((res) => res.data);

export const createSupportTicketApi = (data) =>
  api.post('/support/tickets', data).then((res) => res.data);

export const replySupportTicketApi = (ticketId, data) =>
  api.post(`/support/tickets/${ticketId}/reply`, data).then((res) => res.data);

export const updateSupportTicketStatusApi = (ticketId, data) =>
  api.patch(`/support/tickets/${ticketId}/status`, data).then((res) => res.data);

// 6. Announcements
export const fetchAnnouncementsApi = (params = {}) =>
  api.get('/announcements', { params }).then((res) => res.data);

export const createAnnouncementApi = (data) =>
  api.post('/announcements', data).then((res) => res.data);

export const updateAnnouncementStatusApi = (id, status) =>
  api.patch(`/announcements/${id}/status`, { status }).then((res) => res.data);

// 9. Export Center
export const exportPlatformDataApi = (params = {}) =>
  api.get('/export', { params }).then((res) => res.data);

// 11. Security Center
export const fetchSecurityOverviewApi = () =>
  api.get('/security/overview').then((res) => res.data);

// 12. Backup & Restore
export const fetchPlatformBackupsApi = () =>
  api.get('/backups').then((res) => res.data);

export const triggerPlatformBackupApi = () =>
  api.post('/backups/trigger').then((res) => res.data);

// 15. Payments Center (Phase 5)
export const fetchAdminPaymentsApi = (params = {}) =>
  api.get('/payments', { params }).then((res) => res.data);

export const refundAdminPaymentApi = (data) =>
  api.post('/payments/refund', data).then((res) => res.data);

export const fetchPaymentDetailsApi = (paymentId) =>
  api.get(`/payments/${paymentId}`).then((res) => res.data);

// 13. System Health
export const fetchSystemHealthApi = () =>
  api.get('/health').then((res) => res.data);

// 14. Activity Center
export const fetchActivityFeedApi = () =>
  api.get('/activity-feed').then((res) => res.data);

// 15. Comprehensive Platform Analytics
export const fetchComprehensivePlatformAnalyticsApi = () =>
  api.get('/platform-analytics').then((res) => res.data);
