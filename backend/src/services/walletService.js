import mongoose from 'mongoose';
import { Wallet } from '../models/Wallet.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { Restaurant } from '../models/Restaurant.js';
import { RestaurantUser } from '../models/RestaurantUser.js';
import { getPlatformFinanceSettings } from './platformSettingsService.js';
import { logFinanceAudit } from './auditService.js';

/**
 * Get or initialize a restaurant's dedicated wallet
 */
export const getOrCreateWallet = async (restaurantId) => {
  if (!restaurantId) return null;
  const restId = new mongoose.Types.ObjectId(restaurantId);

  let wallet = await Wallet.findOne({ restaurantId: restId });
  if (!wallet) {
    try {
      const restaurant = await Restaurant.findById(restId);
      const existingWallet = restaurant?.wallet || {};

      wallet = await Wallet.create({
        restaurantId: restId,
        currentBalance: existingWallet.pendingBalance || 0,
        pendingBalance: existingWallet.pendingBalance || 0,
        settledBalance: existingWallet.paidBalance || 0,
        lifetimeEarnings: existingWallet.lifetimeEarnings || 0,
        lifetimeCommission: 0,
        lifetimeGatewayFees: 0,
      });
    } catch (err) {
      if (err.code === 11000) {
        wallet = await Wallet.findOne({ restaurantId: restId });
      } else {
        throw err;
      }
    }
  }
  return wallet;
};

/**
 * Record a wallet transaction and atomically update wallet balances
 */
export const recordWalletMovement = async ({
  restaurantId,
  type, // 'credit' | 'debit' | 'adjustment' | 'refund' | 'subscription' | 'settlement' | 'commission' | 'gateway_fee'
  amount,
  balanceField = 'currentBalance', // 'currentBalance' | 'pendingBalance' | 'settledBalance'
  operation = 'add', // 'add' | 'subtract'
  referenceId = '',
  referenceModel = '',
  reason,
  admin = null,
}) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);
  await getOrCreateWallet(restId);

  const numAmount = Math.round(Number(amount) * 100) / 100;
  const incUpdate = {};
  const setUpdate = {};

  if (type === 'commission') {
    incUpdate['lifetimeCommission'] = numAmount;
  } else if (type === 'gateway_fee') {
    incUpdate['lifetimeGatewayFees'] = numAmount;
  } else if (type === 'settlement') {
    incUpdate['pendingBalance'] = -numAmount;
    incUpdate['currentBalance'] = -numAmount;
    incUpdate['settledBalance'] = numAmount;
    setUpdate['lastSettlementAt'] = new Date();
  } else if (type === 'credit') {
    if (operation === 'add') {
      incUpdate['pendingBalance'] = numAmount;
      incUpdate['currentBalance'] = numAmount;
      incUpdate['lifetimeEarnings'] = numAmount;
    } else {
      incUpdate['pendingBalance'] = -numAmount;
      incUpdate['currentBalance'] = -numAmount;
    }
  } else {
    // refund, adjustment, debit, generic credit
    const delta = operation === 'add' ? numAmount : -numAmount;
    if (balanceField === 'settledBalance') {
      incUpdate['settledBalance'] = delta;
    } else {
      incUpdate['pendingBalance'] = delta;
      incUpdate['currentBalance'] = delta;
    }
  }

  // Atomic findOneAndUpdate prevents race conditions under high concurrency
  const updatedWallet = await Wallet.findOneAndUpdate(
    { restaurantId: restId },
    {
      $inc: incUpdate,
      ...(Object.keys(setUpdate).length > 0 ? { $set: setUpdate } : {}),
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // Guarantee balances never go below zero
  if (updatedWallet.pendingBalance < 0 || updatedWallet.currentBalance < 0) {
    await Wallet.updateOne(
      { _id: updatedWallet._id },
      {
        $max: { pendingBalance: 0, currentBalance: 0 },
      }
    );
    if (updatedWallet.pendingBalance < 0) updatedWallet.pendingBalance = 0;
    if (updatedWallet.currentBalance < 0) updatedWallet.currentBalance = 0;
  }

  const closingBalance = updatedWallet.currentBalance;
  let openingBalance = closingBalance;
  if (['credit', 'refund', 'adjustment', 'settlement'].includes(type)) {
    openingBalance = operation === 'add'
      ? Math.round((closingBalance - numAmount) * 100) / 100
      : Math.round((closingBalance + numAmount) * 100) / 100;
  }

  // Create immutable ledger entry
  const transaction = new WalletTransaction({
    restaurantId: restId,
    walletId: updatedWallet._id,
    type,
    amount: numAmount,
    openingBalance,
    closingBalance,
    referenceId: referenceId || '',
    referenceModel: referenceModel || '',
    reason: reason || `${type} transaction of ₹${numAmount}`,
    createdBy: admin?.email || admin?.name || 'system',
    adminId: admin?._id || admin?.id || null,
  });
  await transaction.save();

  // Backward-compatible synchronization with Restaurant.wallet
  await Restaurant.findByIdAndUpdate(restId, {
    $set: {
      'wallet.pendingBalance': updatedWallet.pendingBalance,
      'wallet.paidBalance': updatedWallet.settledBalance,
      'wallet.lifetimeEarnings': updatedWallet.lifetimeEarnings,
      pendingSettlement: updatedWallet.pendingBalance,
      totalSettled: updatedWallet.settledBalance,
    },
  });

  return { wallet: updatedWallet, transaction };
};

/**
 * Adjust wallet balance manually by Admin with reason and audit log
 */
export const adjustWalletBalanceService = async ({
  restaurantId,
  amount,
  type = 'adjustment', // 'credit' | 'debit' | 'adjustment'
  reason,
  admin,
  ip = '127.0.0.1',
}) => {
  if (!restaurantId || amount === undefined || isNaN(Number(amount))) {
    throw new Error('Valid restaurant ID and numeric amount are required.');
  }
  if (!reason || reason.trim().length < 3) {
    throw new Error('A detailed reason is mandatory for manual balance adjustments.');
  }

  const numAmount = Math.abs(Number(amount));
  const isCredit = Number(amount) > 0;

  const result = await recordWalletMovement({
    restaurantId,
    type: 'adjustment',
    amount: numAmount,
    balanceField: 'currentBalance',
    operation: isCredit ? 'add' : 'subtract',
    reason: `Manual Adjustment by ${admin?.name || 'Admin'}: ${reason}`,
    admin,
  });

  // Also adjust pending balance if requested or keeping in sync
  const wallet = await Wallet.findOne({ restaurantId });
  if (wallet) {
    if (isCredit) {
      wallet.pendingBalance = Math.round((wallet.pendingBalance + numAmount) * 100) / 100;
    } else {
      wallet.pendingBalance = Math.max(0, Math.round((wallet.pendingBalance - numAmount) * 100) / 100);
    }
    await wallet.save();
  }

  // Audit log
  await logFinanceAudit({
    action: 'wallet_adjusted',
    restaurantId,
    admin,
    ip,
    reason,
    metadata: {
      adjustmentAmount: amount,
      closingBalance: result.wallet.currentBalance,
      transactionId: result.transaction._id,
    },
  });

  return result;
};

/**
 * Get wallet details and transaction history for a restaurant
 */
export const getWalletDetailsService = async (restaurantId, { page = 1, limit = 20 } = {}) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);
  const wallet = await getOrCreateWallet(restId);

  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));

  const [transactions, totalTransactions] = await Promise.all([
    WalletTransaction.find({ restaurantId: restId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    WalletTransaction.countDocuments({ restaurantId: restId }),
  ]);

  return {
    wallet,
    transactions,
    totalTransactions,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalTransactions / Number(limit)) || 1,
  };
};

/**
 * List all verified restaurant wallets for Admin with search, auto-initialization, and filtering
 */
export const listRestaurantWalletsService = async ({ search = '', page = 1, limit = 20 } = {}) => {
  const platformSettings = await getPlatformFinanceSettings();
  const defaultCommission = platformSettings?.defaultCommission ?? 5.0;

  // Requirement 2 & 9: Filter ONLY verified and non-suspended restaurants at database level
  const query = {
    isDeleted: { $ne: true },
    verificationStatus: 'verified',
    status: { $ne: 'suspended' },
  };

  // Requirement 3: Search by Restaurant Name, Owner Name, Restaurant ID, Email
  if (search && search.trim()) {
    const term = search.trim();
    const searchRegex = { $regex: term, $options: 'i' };
    const orConditions = [
      { restaurantName: searchRegex },
      { ownerName: searchRegex },
      { ownerPhone: searchRegex },
      { slug: searchRegex },
    ];

    if (mongoose.Types.ObjectId.isValid(term)) {
      orConditions.push({ _id: new mongoose.Types.ObjectId(term) });
    }

    // Match users with this email to find their restaurants
    const matchedUsers = await RestaurantUser.find({ email: searchRegex }).select('_id').lean();
    if (matchedUsers.length > 0) {
      orConditions.push({ createdBy: { $in: matchedUsers.map((u) => u._id) } });
    }

    query.$or = orConditions;
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (p - 1) * l;

  // Requirement 10: Populate only required fields for high performance
  const [restaurants, total] = await Promise.all([
    Restaurant.find(query)
      .select('restaurantName ownerName ownerPhone logo verificationStatus wallet commissionRate linkedAccountId settlementCycle minimumSettlement settlementNotes createdBy subscription slug createdAt')
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    Restaurant.countDocuments(query),
  ]);

  const restaurantIds = restaurants.map((r) => r._id);
  const existingWallets = await Wallet.find({ restaurantId: { $in: restaurantIds } }).lean();
  const walletMap = new Map(existingWallets.map((w) => [w.restaurantId.toString(), w]));

  // Requirement 6: Wallet auto-initialization for verified restaurants
  const enriched = await Promise.all(
    restaurants.map(async (r) => {
      let w = walletMap.get(r._id.toString());
      if (!w) {
        // Auto-initialize dedicated wallet in database if missing
        w = await Wallet.create({
          restaurantId: r._id,
          currentBalance: r.wallet?.pendingBalance || 0,
          pendingBalance: r.wallet?.pendingBalance || 0,
          settledBalance: r.wallet?.paidBalance || r.totalSettled || 0,
          lifetimeEarnings: r.wallet?.lifetimeEarnings || 0,
          lifetimeCommission: 0,
          lifetimeGatewayFees: 0,
        }).then((doc) => doc.toObject());
      }

      const effectiveCommission = typeof r.commissionRate === 'number'
        ? r.commissionRate
        : defaultCommission;

      const formattedId = r.slug ? r.slug.toUpperCase() : `REST-${r._id.toString().slice(-5).toUpperCase()}`;

      return {
        _id: r._id,
        restaurantId: formattedId,
        restaurantName: r.restaurantName || 'Unnamed Restaurant',
        name: r.restaurantName || 'Unnamed Restaurant', // alias for backward-compatibility
        ownerName: r.ownerName || 'Unknown Owner',
        ownerPhone: r.ownerPhone || '--',
        email: r.createdBy?.email || '',
        logo: r.logo || { url: '', public_id: '' },
        verificationStatus: r.verificationStatus || 'verified',
        subscriptionStatus: r.subscription?.status || 'trial',
        planName: r.subscription?.planName || 'Free Trial',
        commissionRate: effectiveCommission,
        settlementCycle: r.settlementCycle || 'weekly',
        linkedAccountId: r.linkedAccountId || '--',
        minimumSettlement: r.minimumSettlement || 500,
        settlementNotes: r.settlementNotes || '',
        currentBalance: w?.currentBalance ?? r.wallet?.pendingBalance ?? 0,
        pendingBalance: w?.pendingBalance ?? r.wallet?.pendingBalance ?? 0,
        settledBalance: w?.settledBalance ?? r.wallet?.paidBalance ?? 0,
        paidBalance: w?.settledBalance ?? r.wallet?.paidBalance ?? 0, // alias
        lifetimeEarnings: w?.lifetimeEarnings ?? r.wallet?.lifetimeEarnings ?? 0,
        lastSettlementAt: w?.lastSettlementAt || null,
        createdAt: r.createdAt,
      };
    })
  );

  return {
    wallets: enriched,
    restaurants: enriched, // alias for settlements controller compatibility
    total,
    page: p,
    limit: l,
    totalPages: Math.ceil(total / l) || 1,
  };
};

