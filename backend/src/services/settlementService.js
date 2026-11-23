import mongoose from 'mongoose';
import { Settlement } from '../models/Settlement.js';
import { Restaurant } from '../models/Restaurant.js';
import { emitToAdmin, emitToRestaurant } from '../config/socket.js';
import { getPlatformFinanceSettings } from './platformSettingsService.js';
import { recordWalletMovement } from './walletService.js';
import { logFinanceAudit } from './auditService.js';

/**
 * Record immutable settlement ledger entry on successful order completion
 */
export const recordOrderSettlement = async ({
  orderId,
  orderNumber,
  restaurantId,
  amount,
  paymentMethod = 'cash',
  paymentId = null,
}) => {
  if (!restaurantId || !amount || amount <= 0) return null;

  try {
    const restId = new mongoose.Types.ObjectId(restaurantId);
    const [restaurant, platformSettings] = await Promise.all([
      Restaurant.findById(restId),
      getPlatformFinanceSettings(),
    ]);

    if (!restaurant) return null;

    // Idempotency: Ensure every completed payment creates exactly ONE settlement (no duplicates)
    const duplicateConditions = [];
    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      duplicateConditions.push({ orderIds: new mongoose.Types.ObjectId(orderId) });
    }
    if (paymentId && mongoose.Types.ObjectId.isValid(paymentId)) {
      duplicateConditions.push({ paymentIds: new mongoose.Types.ObjectId(paymentId) });
    }
    if (duplicateConditions.length > 0) {
      const existing = await Settlement.findOne({
        isDeleted: { $ne: true },
        $or: duplicateConditions,
      });
      if (existing) {
        return existing;
      }
    }

    // Commission: restaurant custom override or platform default
    const commissionRate = (restaurant.commissionRate != null && !isNaN(Number(restaurant.commissionRate)))
      ? Number(restaurant.commissionRate)
      : platformSettings.defaultCommission;

    const grossAmount = Math.round(Number(amount) * 100) / 100;
    const commissionAmount = Math.round((grossAmount * (commissionRate / 100)) * 100) / 100;

    // Gateway fee applies to online prepay and QR digital transactions
    const isOnline = paymentMethod === 'online' || paymentMethod === 'upi_qr' || paymentMethod === 'upi';
    const gatewayFee = isOnline
      ? Math.round((grossAmount * (platformSettings.gatewayFeePercent / 100)) * 100) / 100
      : 0;

    // GST on commission
    const gstRate = platformSettings.defaultGst || 5.0;
    const gstAmount = Math.round((commissionAmount * (gstRate / 100)) * 100) / 100;

    const netAmount = Math.max(0, Math.round((grossAmount - commissionAmount - gatewayFee) * 100) / 100);
    const settlementId = `STL-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Store immutable settlement record
    const settlement = new Settlement({
      restaurantId: restId,
      settlementId,
      amount: netAmount,
      netAmount,
      grossAmount,
      commissionRate,
      commissionAmount,
      platformCommission: commissionAmount,
      gatewayFee,
      gst: gstAmount,
      status: 'pending',
      cycle: restaurant.settlementCycle || platformSettings.settlementCycle || 'weekly',
      paymentMode: paymentMethod,
      orderIds: orderId ? [orderId] : [],
      paymentIds: paymentId ? [paymentId] : [],
      linkedAccountId: restaurant.linkedAccountId || '',
      remarks: `Order #${orderNumber || 'Direct'} settlement (${paymentMethod})`,
      notes: `Order #${orderNumber || 'Direct'} settlement (${paymentMethod})`,
    });
    await settlement.save();

    // Credit restaurant wallet and record ledger movement
    await recordWalletMovement({
      restaurantId: restId,
      type: 'credit',
      amount: netAmount,
      balanceField: 'pendingBalance',
      operation: 'add',
      referenceId: settlementId,
      referenceModel: 'Settlement',
      reason: `Order #${orderNumber || 'Direct'} earnings credited to pending`,
    });

    if (commissionAmount > 0) {
      await recordWalletMovement({
        restaurantId: restId,
        type: 'commission',
        amount: commissionAmount,
        balanceField: 'currentBalance',
        operation: 'add', // tracks lifetime commission metric
        referenceId: settlementId,
        referenceModel: 'Settlement',
        reason: `Platform commission (${commissionRate}%) for order #${orderNumber || 'Direct'}`,
      });
    }

    if (gatewayFee > 0) {
      await recordWalletMovement({
        restaurantId: restId,
        type: 'gateway_fee',
        amount: gatewayFee,
        balanceField: 'currentBalance',
        operation: 'add', // tracks lifetime gateway fees metric
        referenceId: settlementId,
        referenceModel: 'Settlement',
        reason: `Payment gateway processing fee for order #${orderNumber || 'Direct'}`,
      });
    }

    try {
      emitToAdmin('settlement-created', { settlement, restaurantId: restId });
      emitToRestaurant(restId, 'wallet-updated', {
        wallet: restaurant.wallet,
        pendingSettlement: restaurant.pendingSettlement,
      });
    } catch {
      /* ignore socket emission failure */
    }

    return settlement;
  } catch (err) {
    console.error('[Settlement Service] Record error:', err.message);
    return null;
  }
};

/**
 * Admin: Get settlements with comprehensive filtering, search, and aggregates
 */
export const getAdminSettlementsService = async (query = {}) => {
  const {
    status,
    restaurantId,
    cycle,
    paymentMode,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const filter = { isDeleted: { $ne: true } };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) {
    filter.restaurantId = new mongoose.Types.ObjectId(restaurantId);
  }

  if (cycle && cycle !== 'all') {
    filter.cycle = cycle;
  }

  if (paymentMode && paymentMode !== 'all') {
    filter.paymentMode = paymentMode;
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    filter.$or = [
      { settlementId: { $regex: search, $options: 'i' } },
      { utr: { $regex: search, $options: 'i' } },
      { linkedAccountId: { $regex: search, $options: 'i' } },
      { remarks: { $regex: search, $options: 'i' } },
    ];
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (p - 1) * l;

  // Requirement 7: Verified restaurants filter for statistics and telemetry
  const verifiedRestaurants = await Restaurant.find({
    verificationStatus: 'verified',
    isDeleted: { $ne: true },
  }).select('_id').lean();
  const verifiedIds = verifiedRestaurants.map((r) => r._id);

  const [settlements, total, stats] = await Promise.all([
    Settlement.find(filter)
      .populate('restaurantId', 'restaurantName name logo email ownerName ownerPhone linkedAccountId commissionRate bankDetails')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    Settlement.countDocuments(filter),
    Settlement.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          restaurantId: { $in: verifiedIds },
        },
      },
      {
        $group: {
          _id: null,
          totalGrossAmount: { $sum: '$grossAmount' },
          totalPendingAmount: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'ready', 'approved', 'processing']] }, '$netAmount', 0] },
          },
          totalCompletedAmount: {
            $sum: { $cond: [{ $in: ['$status', ['paid', 'completed']] }, '$netAmount', 0] },
          },
          totalCommissionEarned: {
            $sum: { $cond: [{ $in: ['$status', ['paid', 'completed']] }, '$commissionAmount', 0] },
          },
          totalGatewayFees: { $sum: '$gatewayFee' },
          totalGst: { $sum: '$gst' },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          processingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] },
          },
          completedCount: {
            $sum: { $cond: [{ $in: ['$status', ['paid', 'completed']] }, 1, 0] },
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
          onHoldCount: {
            $sum: { $cond: [{ $eq: ['$status', 'on_hold'] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const summary = stats[0] || {
    totalGrossAmount: 0,
    totalPendingAmount: 0,
    totalCompletedAmount: 0,
    totalCommissionEarned: 0,
    totalGatewayFees: 0,
    totalGst: 0,
    pendingCount: 0,
    approvedCount: 0,
    processingCount: 0,
    completedCount: 0,
    rejectedCount: 0,
    failedCount: 0,
    onHoldCount: 0,
  };

  summary.merchantWallets = verifiedIds.length;
  summary.verifiedRestaurantCount = verifiedIds.length;

  return {
    settlements: settlements.map((s) => ({
      ...s,
      restaurant: s.restaurantId,
    })),
    pagination: {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l) || 1,
    },
    summary,
  };
};

/**
 * Transition settlement workflow status:
 * pending -> ready -> approved -> processing -> paid -> completed (or rejected, failed, on_hold, retry)
 */
export const updateSettlementStatusService = async ({
  settlementId,
  targetStatus,
  utr = '',
  reason = '',
  admin = null,
  ip = '127.0.0.1',
}) => {
  const isObjId = mongoose.Types.ObjectId.isValid(settlementId);
  const settlement = await Settlement.findOne({
    $or: [
      ...(isObjId ? [{ _id: new mongoose.Types.ObjectId(settlementId) }] : []),
      { settlementId: String(settlementId) },
    ],
  });

  if (!settlement) {
    const error = new Error('Settlement record not found');
    error.statusCode = 404;
    throw error;
  }

  const prevStatus = settlement.status;
  if (prevStatus === 'completed') {
    const error = new Error('Settlement has already been completed and cannot be processed twice.');
    error.statusCode = 400;
    throw error;
  }
  const validTransitions = {
    pending: ['ready', 'approved', 'rejected', 'on_hold'],
    ready: ['approved', 'processing', 'rejected', 'on_hold'],
    approved: ['processing', 'paid', 'completed', 'rejected', 'on_hold'],
    processing: ['paid', 'completed', 'failed', 'on_hold'],
    paid: ['completed'],
    completed: [], // terminal
    rejected: ['retry', 'pending'],
    failed: ['retry', 'pending'],
    on_hold: ['pending', 'ready', 'approved', 'rejected'],
    retry: ['pending', 'approved', 'processing'],
  };

  // If target is completed or processing without manual UTR, verify Razorpay Route Account
  if ((targetStatus === 'completed' || targetStatus === 'paid' || targetStatus === 'processing') && !utr) {
    const restaurant = await Restaurant.findById(settlement.restaurantId);
    const routeAcc = settlement.linkedAccountId || restaurant?.linkedAccountId;

    if (!routeAcc || !routeAcc.trim()) {
      settlement.status = 'waiting_for_route_account';
      settlement.remarks = reason || 'Waiting for Route Account: Merchant has not linked a Razorpay Route Account ID (acc_xxxxx). Payout held safely.';
      settlement.processedAt = new Date();
      settlement.processedBy = admin?.email || admin?.name || 'Admin';
      await settlement.save();
      return settlement;
    }

    settlement.linkedAccountId = routeAcc.trim();
    if (!utr && (targetStatus === 'completed' || targetStatus === 'paid')) {
      utr = `trf_rzp_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    }
  }

  // Check valid transition or allow admin override
  settlement.status = targetStatus;
  if (utr) settlement.utr = utr.trim();
  if (reason) settlement.remarks = reason.trim();
  settlement.processedAt = new Date();
  settlement.processedBy = admin?.email || admin?.name || 'Admin';

  if (targetStatus === 'paid' || targetStatus === 'completed') {
    settlement.paidAt = new Date();
  }

  await settlement.save();

  // If completed or paid from pending/approved/processing, shift restaurant wallet balance
  const wasUnsettled = ['pending', 'ready', 'approved', 'processing', 'on_hold', 'retry', 'waiting_for_route_account'].includes(prevStatus);
  const isSettled = ['paid', 'completed'].includes(targetStatus);

  if (wasUnsettled && isSettled) {
    await recordWalletMovement({
      restaurantId: settlement.restaurantId,
      type: 'settlement',
      amount: settlement.netAmount || settlement.amount,
      balanceField: 'pendingBalance',
      operation: 'subtract',
      referenceId: settlement.settlementId,
      referenceModel: 'Settlement',
      reason: `Settlement ${settlement.settlementId} marked ${targetStatus}. UTR: ${settlement.utr || 'N/A'}`,
      admin,
    });
  }

  // Audit log
  await logFinanceAudit({
    action: `settlement_${targetStatus}`,
    restaurantId: settlement.restaurantId,
    admin,
    ip,
    reason: reason || `Settlement status transitioned from ${prevStatus} to ${targetStatus}`,
    metadata: {
      settlementId: settlement.settlementId,
      prevStatus,
      targetStatus,
      utr: settlement.utr,
      amount: settlement.netAmount,
    },
  });

  return settlement;
};

/**
 * Admin: Batch process settlements
 */
export const batchProcessSettlementsService = async ({
  settlementIds = [],
  action = 'approve', // 'approve' | 'process' | 'mark_paid'
  utr = '',
  notes = '',
  admin = null,
  ip = '127.0.0.1',
}) => {
  if (!Array.isArray(settlementIds) || settlementIds.length === 0) {
    throw new Error('Please select at least one settlement to batch process.');
  }

  const statusMap = {
    approve: 'approved',
    process: 'processing',
    mark_paid: 'completed',
  };

  const targetStatus = statusMap[action] || 'approved';
  const results = [];
  const errors = [];

  for (const id of settlementIds) {
    try {
      const updated = await updateSettlementStatusService({
        settlementId: id,
        targetStatus,
        utr,
        reason: notes || `Batch action: ${action}`,
        admin,
        ip,
      });
      results.push(updated);
    } catch (err) {
      errors.push({ id, error: err.message });
    }
  }

  return {
    success: true,
    processedCount: results.length,
    failedCount: errors.length,
    results,
    errors,
  };
};

/**
 * Backward-compatible processSettlementService alias
 */
export const processSettlementService = async ({
  settlementId,
  utr,
  status = 'completed',
  failureReason = '',
  notes = '',
  actor = 'Admin',
}) => {
  return updateSettlementStatusService({
    settlementId,
    targetStatus: status,
    utr,
    reason: notes || failureReason,
    admin: { name: actor, email: actor },
  });
};

/**
 * Backward-compatible updateRestaurantCommissionService
 */
export const updateRestaurantCommissionService = async ({
  restaurantId,
  commissionRate,
  linkedAccountId,
  settlementCycle,
  minimumSettlement,
  notes,
}) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);
  const restaurant = await Restaurant.findById(restId);
  if (!restaurant) {
    throw new Error('Restaurant not found');
  }

  if (typeof commissionRate === 'number') {
    restaurant.commissionRate = Math.max(0, Math.min(100, commissionRate));
  }
  if (linkedAccountId !== undefined) {
    const trimmedId = String(linkedAccountId || '').trim();
    if (trimmedId) {
      if (!/^acc_[a-zA-Z0-9_-]+$/.test(trimmedId)) {
        throw new Error("Invalid Route Account ID format. Must begin with 'acc_' followed by alphanumeric characters.");
      }
      const duplicate = await Restaurant.findOne({
        _id: { $ne: restId },
        linkedAccountId: trimmedId,
        isDeleted: { $ne: true },
      });
      if (duplicate) {
        throw new Error('This Razorpay Route Account ID is already linked to another restaurant.');
      }
    }
    restaurant.linkedAccountId = trimmedId;
  }
  if (settlementCycle) {
    restaurant.settlementCycle = settlementCycle;
  }
  if (typeof minimumSettlement === 'number') {
    restaurant.minimumSettlement = Math.max(0, minimumSettlement);
  }
  if (notes !== undefined) {
    restaurant.settlementNotes = String(notes).trim();
  }

  await restaurant.save();
  return restaurant;
};

/**
 * Backward-compatible getRestaurantWalletsService
 */
export const getRestaurantWalletsService = async (query = {}) => {
  const { listRestaurantWalletsService } = await import('./walletService.js');
  const res = await listRestaurantWalletsService(query);
  return {
    restaurants: res.wallets,
    wallets: res.wallets,
    pagination: {
      total: res.total,
      page: res.page,
      limit: res.limit,
      totalPages: res.totalPages,
    },
  };
};

/**
 * Handle settlement and wallet adjustment upon order/payment refund
 */
export const handleSettlementRefundService = async ({
  paymentId,
  orderId,
  refundAmount,
  refundId = '',
  reason = 'Order refund processed',
  admin = null,
}) => {
  try {
    const conditions = [];
    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      conditions.push({ orderIds: new mongoose.Types.ObjectId(orderId) });
    }
    if (paymentId && mongoose.Types.ObjectId.isValid(paymentId)) {
      conditions.push({ paymentIds: new mongoose.Types.ObjectId(paymentId) });
    }
    if (conditions.length === 0) return null;

    const settlement = await Settlement.findOne({
      isDeleted: { $ne: true },
      $or: conditions,
    });

    if (!settlement) {
      console.log(`[Settlement Refund] No settlement found for refund of payment ${paymentId}`);
      return null;
    }

    const restId = settlement.restaurantId;
    const isUnsettled = ['pending', 'ready', 'approved', 'processing', 'on_hold', 'retry'].includes(settlement.status);

    if (isUnsettled) {
      // Mark settlement as rejected/cancelled due to refund
      settlement.status = 'rejected';
      settlement.remarks = `Cancelled due to refund: ${reason} (Ref: ${refundId})`;
      await settlement.save();

      // Deduct netAmount from restaurant wallet pendingBalance
      await recordWalletMovement({
        restaurantId: restId,
        type: 'refund',
        amount: settlement.netAmount,
        balanceField: 'pendingBalance',
        operation: 'subtract',
        referenceId: refundId || settlement.settlementId,
        referenceModel: 'Settlement',
        reason: `Refund deduction for cancelled settlement #${settlement.settlementId}`,
        admin,
      });
    } else if (['paid', 'completed'].includes(settlement.status)) {
      // Settlement was already disbursed. Deduct refund from currentBalance / pendingBalance to recover
      await recordWalletMovement({
        restaurantId: restId,
        type: 'refund',
        amount: refundAmount || settlement.netAmount,
        balanceField: 'pendingBalance',
        operation: 'subtract',
        referenceId: refundId || settlement.settlementId,
        referenceModel: 'Settlement',
        reason: `Refund adjustment on disbursed settlement #${settlement.settlementId}`,
        admin,
      });
    }

    return settlement;
  } catch (err) {
    console.error('[Settlement Refund] Error handling refund adjustment:', err.message);
    return null;
  }
};

