/**
 * Centralized Socket.IO Event Constants for Craviti Platform (Phase 4.2)
 */

export const SOCKET_EVENTS = {
  // Restaurant lifecycle & verification
  RESTAURANT_UPDATED: 'restaurant.updated',
  RESTAURANT_APPROVED: 'restaurant.approved',
  RESTAURANT_REJECTED: 'restaurant.rejected',
  RESTAURANT_SETTINGS_UPDATED: 'restaurant.settings.updated',
  RESTAURANT_BANK_UPDATED: 'restaurant.bank.updated',
  RESTAURANT_VERIFICATION_UPDATED: 'restaurant.verification.updated',
  RESTAURANT_SUBSCRIPTION_UPDATED: 'restaurant.subscription.updated',
  RESTAURANT_FEATURE_UPDATED: 'restaurant.feature.updated',

  // Operations & Menu
  MENU_UPDATED: 'menu.updated',
  CATEGORY_UPDATED: 'category.updated',
  TABLE_UPDATED: 'table.updated',
  QR_UPDATED: 'qr.updated',

  // Orders & Receipts
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_PAID: 'order.paid',
  RECEIPT_GENERATED: 'receipt.generated',

  // Payments (Phase 5)
  PAYMENT_CREATED: 'payment.created',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',

  // Support & Announcements
  SUPPORT_CREATED: 'support.created',
  SUPPORT_REPLY: 'support.reply',
  ANNOUNCEMENT_CREATED: 'announcement.created',
  NOTIFICATION_CREATED: 'notification.created',

  // Platform & Maintenance
  PLATFORM_SETTINGS_UPDATED: 'platform.settings.updated',
  MAINTENANCE_ENABLED: 'maintenance.enabled',
  MAINTENANCE_DISABLED: 'maintenance.disabled',
};

export default SOCKET_EVENTS;

