import {
  FiGrid,
  FiShoppingBag,
  FiCheckCircle,
  FiTrendingUp,
  FiCreditCard,
  FiFlag,
  FiActivity,
  FiHelpCircle,
  FiSliders,
  FiUsers,
  FiUser,
  FiShield,
  FiBox,
  FiDollarSign,
  FiFileText,
  FiBell,
  FiLock,
  FiCpu,
  FiDatabase,
  FiDownload,
  FiLayers,
} from 'react-icons/fi';

export const ADMIN_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SUPPORT: 'SUPPORT',
  FINANCE: 'FINANCE',
  VIEWER: 'VIEWER',
};

export const ROLE_COLORS = {
  SUPER_ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
  ADMIN: 'bg-blue-50 text-blue-700 border-blue-200',
  SUPPORT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FINANCE: 'bg-amber-50 text-amber-700 border-amber-200',
  VIEWER: 'bg-slate-50 text-slate-700 border-slate-200',
};

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  CHANGES_REQUESTED: 'changes_requested',
};

export const VERIFICATION_BADGES = {
  pending: { label: 'Pending Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  under_review: { label: 'Under Review', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  verified: { label: 'Verified & Approved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Application Rejected', color: 'bg-red-50 text-red-700 border-red-200' },
  changes_requested: { label: 'Changes Requested', color: 'bg-orange-50 text-orange-700 border-orange-200' },
};

export const BANK_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  VERIFIED: 'approved',
  CHANGES_REQUESTED: 'changes_requested',
  REJECTED: 'rejected',
};

export const PERMISSIONS = {
  RESTAURANT_VIEW: 'restaurant.view',
  RESTAURANT_VERIFY: 'restaurant.verify',
  RESTAURANT_SUSPEND: 'restaurant.suspend',
  ORDERS_VIEW: 'orders.view',
  ORDERS_REFUND: 'orders.refund',
  ANALYTICS_VIEW: 'analytics.view',
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  SUBSCRIPTIONS_MANAGE: 'subscriptions.manage',
  BILLING_VIEW: 'billing.view',
  SUPPORT_MANAGE: 'support.manage',
  ANNOUNCEMENTS_MANAGE: 'announcements.manage',
  SECURITY_MANAGE: 'security.manage',
  BACKUP_MANAGE: 'backup.manage',
  AUDIT_VIEW: 'audit.view',
  SUPPORT_ACCESS: 'support.access',
  ADMINS_MANAGE: 'admins.manage',
};

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
  starter: {
    name: 'Starter Plan',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    maxTables: 5,
    maxMenuItems: 30,
    priceMonthly: 0,
    commissionPercent: 5.0,
  },
  professional: {
    name: 'Professional Plan',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    maxTables: 25,
    maxMenuItems: 150,
    priceMonthly: 1499,
    commissionPercent: 2.5,
  },
  enterprise: {
    name: 'Enterprise Plan',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    maxTables: 100,
    maxMenuItems: 1000,
    priceMonthly: 3999,
    commissionPercent: 1.0,
  },
};

export const SIDEBAR_NAV_ITEMS = [
  { path: '/', label: 'Platform Dashboard', icon: FiGrid },
  { path: '/revenue', label: 'Platform Revenue', icon: FiDollarSign },
  { path: '/payments', label: 'Payments', icon: FiCreditCard },
  { path: '/restaurants', label: 'Restaurants', icon: FiBox },
  { path: '/verification', label: 'Verification', icon: FiCheckCircle },
  { path: '/subscriptions', label: 'Subscriptions', icon: FiLayers },
  { path: '/billing', label: 'Billing Center', icon: FiFileText },
  { path: '/orders', label: 'Live Orders', icon: FiShoppingBag },
  { path: '/analytics', label: 'Analytics', icon: FiTrendingUp },
  { path: '/support', label: 'Support Tickets', icon: FiHelpCircle },
  { path: '/announcements', label: 'Announcements', icon: FiBell },
  { path: '/export', label: 'Export Center', icon: FiDownload },
  { path: '/feature-flags', label: 'Feature Flags', icon: FiFlag },
  { path: '/security', label: 'Security Center', icon: FiLock },
  { path: '/health', label: 'System Health', icon: FiCpu },
  { path: '/backup', label: 'Backup & Restore', icon: FiDatabase },
  { path: '/activity-logs', label: 'Activity Logs', icon: FiActivity },
  { path: '/settings', label: 'System Settings', icon: FiSliders },
  { path: '/admins', label: 'Admins Team', icon: FiUsers },
  { path: '/profile', label: 'Profile', icon: FiUser },
];
