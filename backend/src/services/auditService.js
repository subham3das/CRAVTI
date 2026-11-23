import { FinanceAuditLog } from '../models/FinanceAuditLog.js';

/**
 * Log any finance-related action
 */
export const logFinanceAudit = async ({
  action,
  restaurantId = null,
  admin = null,
  ip = '127.0.0.1',
  userAgent = '',
  reason = '',
  metadata = {},
}) => {
  try {
    const log = new FinanceAuditLog({
      action,
      restaurantId,
      adminId: admin?._id || admin?.id || null,
      adminName: admin?.name || 'System / Admin',
      adminEmail: admin?.email || '',
      ip: ip || '127.0.0.1',
      userAgent: userAgent || '',
      reason: reason || action,
      metadata,
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to log finance audit event:', error.message);
    return null;
  }
};

/**
 * Fetch finance audit logs with filters and pagination
 */
export const getFinanceAuditLogs = async ({
  action = '',
  restaurantId = '',
  adminId = '',
  startDate = '',
  endDate = '',
  page = 1,
  limit = 25,
}) => {
  const query = {};

  if (action) {
    query.action = action;
  }

  if (restaurantId) {
    query.restaurantId = restaurantId;
  }

  if (adminId) {
    query.adminId = adminId;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));

  const [logs, total] = await Promise.all([
    FinanceAuditLog.find(query)
      .populate('restaurantId', 'name email slug')
      .populate('adminId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    FinanceAuditLog.countDocuments(query),
  ]);

  return {
    logs,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
};

