/**
 * Centralized Admin Constants for Craviti Platform
 */

export const ADMIN_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SUPPORT: 'SUPPORT',
  FINANCE: 'FINANCE',
  VIEWER: 'VIEWER',
};

export const ADMIN_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
};

export const PERMISSIONS = {
  RESTAURANT_VIEW: 'restaurant.view',
  RESTAURANT_EDIT: 'restaurant.edit',
  RESTAURANT_VERIFY: 'restaurant.verify',
  RESTAURANT_SUSPEND: 'restaurant.suspend',
  RESTAURANT_DELETE: 'restaurant.delete',
  FEATURE_FLAGS_EDIT: 'featureflags.edit',
  ANALYTICS_VIEW: 'analytics.view',
  ORDERS_VIEW: 'orders.view',
  ORDERS_REFUND: 'orders.refund',
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  SUBSCRIPTIONS_MANAGE: 'subscriptions.manage',
  BILLING_VIEW: 'billing.view',
  SUPPORT_MANAGE: 'support.manage',
  ANNOUNCEMENTS_MANAGE: 'announcements.manage',
  SECURITY_MANAGE: 'security.manage',
  BACKUP_MANAGE: 'backup.manage',
  ADMINS_MANAGE: 'admins.manage',
  SUPPORT_IMPERSONATE: 'support.impersonate',
  AUDIT_VIEW: 'audit.view',
};

export const DEFAULT_ROLE_PERMISSIONS = {
  [ADMIN_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ADMIN_ROLES.ADMIN]: [
    PERMISSIONS.RESTAURANT_VIEW,
    PERMISSIONS.RESTAURANT_EDIT,
    PERMISSIONS.RESTAURANT_VERIFY,
    PERMISSIONS.RESTAURANT_SUSPEND,
    PERMISSIONS.FEATURE_FLAGS_EDIT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
    PERMISSIONS.SUBSCRIPTIONS_MANAGE,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.SUPPORT_MANAGE,
    PERMISSIONS.ANNOUNCEMENTS_MANAGE,
    PERMISSIONS.AUDIT_VIEW,
  ],
  [ADMIN_ROLES.SUPPORT]: [
    PERMISSIONS.RESTAURANT_VIEW,
    PERMISSIONS.RESTAURANT_VERIFY,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.SUPPORT_MANAGE,
  ],
  [ADMIN_ROLES.FINANCE]: [
    PERMISSIONS.RESTAURANT_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.SUBSCRIPTIONS_MANAGE,
    PERMISSIONS.BILLING_VIEW,
  ],
  [ADMIN_ROLES.VIEWER]: [
    PERMISSIONS.RESTAURANT_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
};

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  CHANGES_REQUESTED: 'changes_requested',
};

export const BANK_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  VERIFIED: 'approved', // backward compatibility alias
  CHANGES_REQUESTED: 'changes_requested',
  REJECTED: 'rejected',
};

export const NOTIFICATION_TYPES = {
  NEW_RESTAURANT: 'NEW_RESTAURANT',
  VERIFICATION_PENDING: 'VERIFICATION_PENDING',
  BANK_SUBMITTED: 'BANK_SUBMITTED',
  RESTAURANT_SUSPENDED: 'RESTAURANT_SUSPENDED',
  PAYMENT_DISABLED: 'PAYMENT_DISABLED',
  FEATURE_ENABLED: 'FEATURE_ENABLED',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SUBSCRIPTION_EXPIRING: 'SUBSCRIPTION_EXPIRING',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  SUPPORT_REPLY: 'SUPPORT_REPLY',
  PLATFORM_UPDATE: 'PLATFORM_UPDATE',
  VERIFICATION_REQUIRED: 'VERIFICATION_REQUIRED',
};

export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  FAILED_LOGIN: 'FAILED_LOGIN',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  CREATE_ADMIN: 'CREATE_ADMIN',
  UPDATE_ADMIN_ROLE: 'UPDATE_ADMIN_ROLE',
  DELETE_ADMIN: 'DELETE_ADMIN',
  VERIFY_RESTAURANT: 'VERIFY_RESTAURANT',
  REJECT_RESTAURANT: 'REJECT_RESTAURANT',
  UNDER_REVIEW_RESTAURANT: 'UNDER_REVIEW_RESTAURANT',
  REQUEST_CHANGES_RESTAURANT: 'REQUEST_CHANGES_RESTAURANT',
  APPROVE_BANK: 'APPROVE_BANK',
  REJECT_BANK: 'REJECT_BANK',
  REQUEST_BANK_CHANGES: 'REQUEST_BANK_CHANGES',
  TOGGLE_RESTAURANT_STATUS: 'TOGGLE_RESTAURANT_STATUS',
  TOGGLE_RESTAURANT_PAYMENT: 'TOGGLE_RESTAURANT_PAYMENT',
  TOGGLE_RESTAURANT_QR: 'TOGGLE_RESTAURANT_QR',
  UPDATE_GLOBAL_SETTINGS: 'UPDATE_GLOBAL_SETTINGS',
  UPDATE_RESTAURANT_SETTINGS: 'UPDATE_RESTAURANT_SETTINGS',
  TOGGLE_FEATURE_FLAG: 'TOGGLE_FEATURE_FLAG',
  EXPORT_DATA: 'EXPORT_DATA',
  SUPPORT_IMPERSONATE: 'SUPPORT_IMPERSONATE',
  SUBSCRIPTION_UPGRADE: 'SUBSCRIPTION_UPGRADE',
  SUBSCRIPTION_DOWNGRADE: 'SUBSCRIPTION_DOWNGRADE',
  SUBSCRIPTION_SUSPEND: 'SUBSCRIPTION_SUSPEND',
  SUBSCRIPTION_RENEW: 'SUBSCRIPTION_RENEW',
  SUBSCRIPTION_EXPIRE: 'SUBSCRIPTION_EXPIRE',
  SUPPORT_TICKET_REPLY: 'SUPPORT_TICKET_REPLY',
  SUPPORT_TICKET_STATUS: 'SUPPORT_TICKET_STATUS',
  SEND_ANNOUNCEMENT: 'SEND_ANNOUNCEMENT',
  TRIGGER_BACKUP: 'TRIGGER_BACKUP',
  RESTORE_BACKUP: 'RESTORE_BACKUP',
};

// Phase 3: SaaS Subscription Plans
export const SUBSCRIPTION_PLANS = {
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired',
  TRIAL: 'trial',
};

export const PLAN_CONFIG = {
  [SUBSCRIPTION_PLANS.STARTER]: {
    name: 'Starter Plan',
    maxTables: 5,
    maxMenuItems: 30,
    priceMonthly: 0,
    commissionPercent: 5.0,
    features: {
      analyticsAccess: false,
      onlinePayments: true,
      customBranding: false,
      qrOrdering: true,
      prioritySupport: false,
      receiptBranding: false,
      multipleStaffAccounts: false,
    },
  },
  [SUBSCRIPTION_PLANS.PROFESSIONAL]: {
    name: 'Professional Plan',
    maxTables: 25,
    maxMenuItems: 150,
    priceMonthly: 699, // Launch Offer (Regular ₹1,500)
    commissionPercent: 2.5,
    features: {
      analyticsAccess: true,
      onlinePayments: true,
      customBranding: true,
      qrOrdering: true,
      prioritySupport: true,
      receiptBranding: true,
      multipleStaffAccounts: true,
    },
  },
  [SUBSCRIPTION_PLANS.ENTERPRISE]: {
    name: 'Enterprise Plan',
    maxTables: 100,
    maxMenuItems: 1000,
    priceMonthly: 3999,
    commissionPercent: 1.0,
    features: {
      analyticsAccess: true,
      onlinePayments: true,
      customBranding: true,
      qrOrdering: true,
      prioritySupport: true,
      receiptBranding: true,
      multipleStaffAccounts: true,
    },
  },
};

// Phase 3: Support Tickets
export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const TICKET_CATEGORY = {
  PAYMENTS: 'payments',
  VERIFICATION: 'verification',
  MENU: 'menu',
  ORDERS: 'orders',
  QR: 'qr',
  BUG: 'bug',
  SUGGESTION: 'suggestion',
};

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

// Phase 3: Announcements
export const ANNOUNCEMENT_TYPES = {
  PLATFORM_UPDATE: 'platform_update',
  MAINTENANCE: 'maintenance',
  OFFER: 'offer',
  FEATURE_RELEASE: 'feature_release',
  EMERGENCY: 'emergency',
};

export const ANNOUNCEMENT_AUDIENCE = {
  EVERYONE: 'everyone',
  SPECIFIC_RESTAURANT: 'specific_restaurant',
  SPECIFIC_PLAN: 'specific_plan',
};

// Phase 3: Invoicing
export const INVOICE_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes lock
