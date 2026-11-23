import mongoose from 'mongoose';
import { Restaurant } from '../models/Restaurant.js';
import { Subscription } from '../models/Subscription.js';
import { PlatformInvoice } from '../models/PlatformInvoice.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { SubscriptionHistory } from '../models/SubscriptionHistory.js';
import { logFinanceAudit } from './auditService.js';
import { calculateSubscriptionState } from '../utils/subscriptionUtils.js';
import { getRazorpayInstance, isRazorpayConfigured } from '../config/razorpay.js';
import { emitToRestaurant } from '../config/socket.js';
import env from '../config/env.js';

/**
 * 1. Create a Razorpay Subscription for Restaurant
 */
export const createSubscriptionService = async ({
  restaurantId,
  user,
  planName = 'Craviti Pro',
  planId,
}) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);
  const restaurant = await Restaurant.findById(restId);

  if (!restaurant || restaurant.isDeleted) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }

  const effectivePlanId = planId || env.RAZORPAY_BASIC_PLAN_ID;
  if (!effectivePlanId) {
    const error = new Error('RAZORPAY_BASIC_PLAN_ID is not configured in .env');
    error.statusCode = 400;
    throw error;
  }

  let razorpaySubscription = null;
  let customerId = restaurant.subscription?.razorpayCustomerId || '';

  if (isRazorpayConfigured()) {
    const rzp = getRazorpayInstance();

    // Create or retrieve Razorpay customer
    if (!customerId) {
      try {
        const customer = await rzp.customers.create({
          name: restaurant.ownerName || restaurant.restaurantName,
          contact: restaurant.ownerPhone || '',
          notes: {
            restaurantId: restaurant._id.toString(),
            restaurantName: restaurant.restaurantName,
          },
        });
        customerId = customer.id;
        restaurant.subscription.razorpayCustomerId = customerId;
      } catch (custErr) {
        console.warn('[Subscription] Razorpay customer creation note:', custErr.message);
      }
    }

    // Create Subscription on Razorpay
    try {
      razorpaySubscription = await rzp.subscriptions.create({
        plan_id: effectivePlanId,
        customer_notify: 1,
        total_count: 12, // 12 billing cycles (monthly)
        notes: {
          restaurantId: restaurant._id.toString(),
          restaurantName: restaurant.restaurantName,
          ownerName: restaurant.ownerName,
        },
      });
    } catch (rzpSubErr) {
      console.error('[Subscription] Failed to create Razorpay subscription:', rzpSubErr);
      const error = new Error(rzpSubErr.error?.description || rzpSubErr.message || 'Failed to initialize subscription with Razorpay');
      error.statusCode = 400;
      throw error;
    }
  } else {
    // Local dev mock mode if Razorpay credentials are not set
    const mockId = `sub_mock_${Date.now()}`;
    const baseClientUrl = env.CLIENT_URL || env.FRONTEND_URL || '';
    razorpaySubscription = {
      id: mockId,
      plan_id: effectivePlanId,
      status: 'created',
      short_url: `${baseClientUrl}/subscription?mock_sub=${mockId}`,
    };
  }

  // Update Restaurant subscription record
  restaurant.subscription = {
    ...restaurant.subscription,
    planName: 'Craviti Pro',
    planId: effectivePlanId,
    razorpayCustomerId: customerId,
    razorpaySubscriptionId: razorpaySubscription.id,
    status: 'pending',
  };
  await restaurant.save();

  // Upsert Subscription model
  await Subscription.findOneAndUpdate(
    { restaurantId: restaurant._id },
    {
      $set: {
        plan: 'Craviti Pro',
        planId: effectivePlanId,
        razorpayCustomerId: customerId,
        razorpaySubscriptionId: razorpaySubscription.id,
        status: 'pending',
        priceMonthly: 699,
      },
    },
    { upsert: true, new: true }
  );

  return {
    success: true,
    subscriptionId: razorpaySubscription.id,
    planId: effectivePlanId,
    keyId: env.RAZORPAY_KEY_ID,
    shortUrl: razorpaySubscription.short_url,
    amount: 699, // Craviti Pro plan ₹699/month
    currency: 'INR',
    restaurantName: restaurant.restaurantName,
    ownerName: restaurant.ownerName,
    ownerPhone: restaurant.ownerPhone,
  };
};

/**
 * 2. Cancel Active Subscription
 */
export const cancelSubscriptionService = async ({ restaurantId, user, cancelImmediately = false }) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);
  const restaurant = await Restaurant.findById(restId);

  if (!restaurant || restaurant.isDeleted) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }

  const subId = restaurant.subscription?.razorpaySubscriptionId;
  if (subId && isRazorpayConfigured()) {
    try {
      const rzp = getRazorpayInstance();
      await rzp.subscriptions.cancel(subId, !cancelImmediately);
    } catch (err) {
      console.warn('[Subscription] Razorpay cancel note:', err.message);
    }
  }

  restaurant.subscription.status = 'cancelled';
  await restaurant.save();

  await Subscription.findOneAndUpdate(
    { restaurantId: restId },
    { $set: { status: 'cancelled' } }
  );

  try {
    emitToRestaurant(restId, 'subscription-updated', {
      status: 'cancelled',
      subscription: restaurant.subscription,
    });
  } catch {
    /* ignore socket note */
  }

  return {
    success: true,
    message: 'Subscription cancelled successfully.',
    subscription: restaurant.subscription,
  };
};

/**
 * 3. Get Complete Subscription Status & Entitlements
 */
export const getSubscriptionStatusService = async (restaurantId) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);
  const restaurant = await Restaurant.findById(restId).lean();

  if (!restaurant || restaurant.isDeleted) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }

  const canonicalState = calculateSubscriptionState(restaurant.subscription, restaurant.createdAt);

  // Fetch billing history / platform invoices
  const billingHistory = await PlatformInvoice.find({ restaurantId: restId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return {
    ...canonicalState,
    subscription: canonicalState,
    features: [
      'Unlimited QR Codes',
      'Unlimited Tables',
      'Digital Menu',
      'Customer QR Ordering',
      'Manual POS Billing',
      'Kitchen Order Management',
      'Table Management',
      'Order Management',
      'Payment Management',
      'Analytics Dashboard',
      'Receipt Generation',
      'Restaurant Finance Dashboard',
      'Restaurant Settlement History',
      'Priority Support',
      'Future Updates Included',
    ],
    billingHistory: billingHistory.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      amount: inv.totalAmount,
      status: inv.status,
      date: inv.invoiceDate || inv.createdAt,
      paidAt: inv.paidAt,
      pdfUrl: inv.invoicePdfUrl || '',
    })),
  };
};

/**
 * 4. Confirm / Complete Subscription Checkout
 * Handles instant post-checkout activation and generates invoice
 */
export const confirmSubscriptionService = async ({
  restaurantId,
  razorpayPaymentId,
  razorpaySubscriptionId,
  razorpaySignature,
}) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);
  const restaurant = await Restaurant.findById(restId);

  if (!restaurant || restaurant.isDeleted) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  const subEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  restaurant.subscription = {
    ...restaurant.subscription,
    planName: 'Craviti Pro',
    planId: restaurant.subscription?.planId || env.RAZORPAY_BASIC_PLAN_ID,
    razorpaySubscriptionId: razorpaySubscriptionId || restaurant.subscription?.razorpaySubscriptionId || `sub_${Date.now()}`,
    lastPaymentId: razorpayPaymentId || `pay_${Date.now()}`,
    status: 'active',
    subscriptionStart: now,
    subscriptionEnd: subEnd,
    nextBillingDate: subEnd,
  };
  await restaurant.save();

  await Subscription.findOneAndUpdate(
    { restaurantId: restId },
    {
      $set: {
        plan: 'Craviti Pro',
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: subEnd,
        priceMonthly: 699,
        razorpaySubscriptionId: restaurant.subscription.razorpaySubscriptionId,
      },
    },
    { upsert: true }
  );

  // Generate platform invoice
  try {
    await PlatformInvoice.create({
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      restaurantId: restId,
      planName: 'Craviti Pro',
      totalAmount: 699,
      status: 'paid',
      invoiceDate: now,
      paidAt: now,
      paymentMethod: 'razorpay',
      transactionId: razorpayPaymentId || '',
    });
  } catch (invErr) {
    console.warn('[Subscription Confirm] Invoice creation note:', invErr.message);
  }

  // Record audit history
  try {
    await SubscriptionHistory.create({
      restaurantId: restId,
      planId: restaurant.subscription.planId || '',
      planName: 'Craviti Pro',
      eventType: 'activated',
      amount: 699,
      notes: `Subscription activated for ₹699. Next billing: ${subEnd.toISOString().split('T')[0]}`,
      performedBy: restaurant.ownerName || 'Merchant',
    });
  } catch (histErr) {
    console.warn('[Subscription Confirm] History record note:', histErr.message);
  }

  try {
    emitToRestaurant(restId, 'subscription-updated', {
      status: 'active',
      subscription: restaurant.subscription,
    });
  } catch {
    /* ignore socket note */
  }

  return {
    success: true,
    message: 'Craviti Pro subscription activated successfully!',
    subscription: restaurant.subscription,
  };
};

/**
 * 5. Process Razorpay Subscription Webhooks
 * Handles:
 *  - subscription.activated
 *  - subscription.charged
 *  - subscription.pending
 *  - subscription.halted
 *  - subscription.cancelled
 *  - subscription.resumed
 */
export const handleSubscriptionWebhookService = async (event, payload) => {
  const entity = payload?.subscription?.entity || payload?.subscription || {};
  const payment = payload?.payment?.entity || payload?.payment || {};
  const subId = entity.id;

  console.log(`[Subscription Webhook] Processing event "${event}" for Subscription ID: ${subId}`);

  // Record raw webhook event for audit
  try {
    await WebhookEvent.create({
      eventId: payload.event_id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventType: event,
      payload,
      status: 'processed',
    });
  } catch (e) {
    console.warn('[Subscription Webhook] Audit event save note:', e.message);
  }

  if (!subId) {
    console.warn('[Subscription Webhook] Missing subscription ID in payload');
    return { success: false, message: 'Missing subscription ID' };
  }

  // Find Restaurant by razorpaySubscriptionId or notes.restaurantId
  let restaurant = await Restaurant.findOne({
    'subscription.razorpaySubscriptionId': subId,
  });

  if (!restaurant && entity.notes?.restaurantId) {
    restaurant = await Restaurant.findById(entity.notes.restaurantId);
  }

  if (!restaurant) {
    console.warn(`[Subscription Webhook] No matching restaurant found for subscription: ${subId}`);
    return { success: false, message: 'No matching tenant found' };
  }

  const subStart = entity.start_at ? new Date(entity.start_at * 1000) : new Date();
  const subEnd = entity.current_end ? new Date(entity.current_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const nextBilling = entity.charge_at ? new Date(entity.charge_at * 1000) : null;

  switch (event) {
    case 'subscription.activated':
    case 'subscription.resumed':
      restaurant.subscription.status = 'active';
      restaurant.subscription.planName = 'Craviti Pro';
      restaurant.subscription.subscriptionStart = subStart;
      restaurant.subscription.subscriptionEnd = subEnd;
      restaurant.subscription.nextBillingDate = nextBilling;
      break;

    case 'subscription.charged':
      restaurant.subscription.status = 'active';
      restaurant.subscription.planName = 'Craviti Pro';
      restaurant.subscription.subscriptionEnd = subEnd;
      restaurant.subscription.nextBillingDate = nextBilling;
      if (payment.id) {
        restaurant.subscription.lastPaymentId = payment.id;
      }
      // Create PlatformInvoice for billing record
      try {
        await PlatformInvoice.create({
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          restaurantId: restaurant._id,
          planName: 'Craviti Pro',
          totalAmount: (payment.amount ? payment.amount / 100 : 699),
          status: 'paid',
          invoiceDate: new Date(),
          paidAt: new Date(),
          paymentMethod: 'razorpay',
          transactionId: payment.id || '',
        });
      } catch (invErr) {
        console.warn('[Subscription Webhook] Invoice creation note:', invErr.message);
      }
      break;

    case 'subscription.pending':
      restaurant.subscription.status = 'pending';
      break;

    case 'subscription.halted':
      restaurant.subscription.status = 'halted';
      break;

    case 'subscription.cancelled':
      restaurant.subscription.status = 'cancelled';
      break;

    default:
      console.log(`[Subscription Webhook] Unhandled event type: ${event}`);
  }

  await restaurant.save();

  // Sync Subscription Model
  await Subscription.findOneAndUpdate(
    { restaurantId: restaurant._id },
    {
      $set: {
        status: restaurant.subscription.status,
        plan: 'Craviti Pro',
        currentPeriodStart: restaurant.subscription.subscriptionStart,
        currentPeriodEnd: restaurant.subscription.subscriptionEnd,
        priceMonthly: 699,
      },
    }
  );

  // Broadcast real-time update to restaurant panel
  try {
    emitToRestaurant(restaurant._id, 'subscription-updated', {
      event,
      subscription: restaurant.subscription,
    });
  } catch (sErr) {
    console.warn('[Subscription Webhook] Socket broadcast note:', sErr.message);
  }

  return { success: true, status: restaurant.subscription.status };
};

/**
 * 5. Admin/System: Pause Subscription
 */
export const pauseSubscriptionService = async ({ restaurantId, reason = 'Paused by Admin', admin = null, ip = '127.0.0.1' }) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);
  const restaurant = await Restaurant.findById(restId);
  if (!restaurant || restaurant.isDeleted) {
    throw new Error('Restaurant not found');
  }

  restaurant.subscription = restaurant.subscription || {};
  restaurant.subscription.status = 'paused';
  await restaurant.save();

  await Subscription.findOneAndUpdate(
    { restaurantId: restId },
    { $set: { status: 'paused' } }
  );

  await SubscriptionHistory.create({
    restaurantId: restId,
    planId: restaurant.subscription.planId || '',
    planName: restaurant.subscription.planName || 'Standard',
    eventType: 'paused',
    notes: reason,
    performedBy: admin?.email || admin?.name || 'Admin',
  });

  await logFinanceAudit({
    action: 'subscription_paused',
    restaurantId: restId,
    admin,
    ip,
    reason,
    metadata: { restaurantName: restaurant.restaurantName },
  });

  try {
    emitToRestaurant(restId, 'subscription-updated', {
      status: 'paused',
      subscription: restaurant.subscription,
    });
  } catch {
    /* ignore */
  }

  return { success: true, subscription: restaurant.subscription };
};

/**
 * 6. Admin/System: Resume Subscription
 */
export const resumeSubscriptionService = async ({ restaurantId, reason = 'Resumed by Admin', admin = null, ip = '127.0.0.1' }) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);
  const restaurant = await Restaurant.findById(restId);
  if (!restaurant || restaurant.isDeleted) {
    throw new Error('Restaurant not found');
  }

  restaurant.subscription = restaurant.subscription || {};
  restaurant.subscription.status = 'active';
  await restaurant.save();

  await Subscription.findOneAndUpdate(
    { restaurantId: restId },
    { $set: { status: 'active' } }
  );

  await SubscriptionHistory.create({
    restaurantId: restId,
    planId: restaurant.subscription.planId || '',
    planName: restaurant.subscription.planName || 'Standard',
    eventType: 'resumed',
    notes: reason,
    performedBy: admin?.email || admin?.name || 'Admin',
  });

  await logFinanceAudit({
    action: 'subscription_resumed',
    restaurantId: restId,
    admin,
    ip,
    reason,
    metadata: { restaurantName: restaurant.restaurantName },
  });

  try {
    emitToRestaurant(restId, 'subscription-updated', {
      status: 'active',
      subscription: restaurant.subscription,
    });
  } catch {
    /* ignore */
  }

  return { success: true, subscription: restaurant.subscription };
};

/**
 * 7. Admin/Restaurant: Renew Subscription (extends end date by 30 days)
 */
export const renewSubscriptionService = async ({ restaurantId, months = 1, amount = 699, admin = null, ip = '127.0.0.1' }) => {
  const restId = new mongoose.Types.ObjectId(restaurantId);
  const restaurant = await Restaurant.findById(restId);
  if (!restaurant || restaurant.isDeleted) {
    throw new Error('Restaurant not found');
  }

  const currentEnd = restaurant.subscription?.subscriptionEnd
    ? new Date(restaurant.subscription.subscriptionEnd)
    : new Date();
  const baseDate = currentEnd > new Date() ? currentEnd : new Date();
  const newEndDate = new Date(baseDate.getTime() + months * 30 * 24 * 60 * 60 * 1000);

  restaurant.subscription = restaurant.subscription || {};
  restaurant.subscription.planName = 'Craviti Pro';
  restaurant.subscription.status = 'active';
  restaurant.subscription.subscriptionEnd = newEndDate;
  restaurant.subscription.nextBillingDate = newEndDate;
  await restaurant.save();

  await Subscription.findOneAndUpdate(
    { restaurantId: restId },
    {
      $set: {
        plan: 'Craviti Pro',
        status: 'active',
        currentPeriodEnd: newEndDate,
        priceMonthly: 699,
      },
    },
    { upsert: true }
  );

  await SubscriptionHistory.create({
    restaurantId: restId,
    planId: restaurant.subscription.planId || '',
    planName: 'Craviti Pro',
    eventType: 'renewed',
    amount: amount || 699,
    notes: `Manual renewal for ${months} month(s) until ${newEndDate.toISOString().split('T')[0]}`,
    performedBy: admin?.email || admin?.name || 'Admin',
  });

  await logFinanceAudit({
    action: 'subscription_renewed',
    restaurantId: restId,
    admin,
    ip,
    reason: `Subscription renewed for ${months} month(s)`,
    metadata: {
      newEndDate,
      amount,
      restaurantName: restaurant.restaurantName,
    },
  });

  try {
    emitToRestaurant(restId, 'subscription-updated', {
      status: 'active',
      subscription: restaurant.subscription,
    });
  } catch {
    /* ignore */
  }

  return { success: true, subscription: restaurant.subscription };
};

/**
 * 8. Get Subscription History for Restaurant or Platform
 */
export const getSubscriptionHistoryService = async ({ restaurantId = null, page = 1, limit = 20 } = {}) => {
  const query = {};
  if (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) {
    query.restaurantId = new mongoose.Types.ObjectId(restaurantId);
  }

  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));

  const [history, total] = await Promise.all([
    SubscriptionHistory.find(query)
      .populate('restaurantId', 'name restaurantName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    SubscriptionHistory.countDocuments(query),
  ]);

  return {
    history,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
};

/**
 * 9. Admin: Get full subscription list with MRR / ARR metrics
 */
export const getAdminSubscriptionsListService = async ({ search = '', status = 'all', page = 1, limit = 20 } = {}) => {
  const query = { isDeleted: { $ne: true } };

  if (status && status !== 'all') {
    query['subscription.status'] = status;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { restaurantName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));

  const [restaurants, total, counts] = await Promise.all([
    Restaurant.find(query)
      .select('name restaurantName email phone subscription createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Restaurant.countDocuments(query),
    Restaurant.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$subscription.status',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const statusCounts = {
    all: 0,
    active: 0,
    trial: 0,
    expired: 0,
    pending: 0,
    paused: 0,
    cancelled: 0,
  };

  counts.forEach((c) => {
    const s = c._id || 'trial';
    if (statusCounts[s] !== undefined) {
      statusCounts[s] = c.count;
    }
    statusCounts.all += c.count;
  });

  const mrr = statusCounts.active * 699;
  const arr = mrr * 12;

  return {
    restaurants: restaurants.map((r) => ({
      _id: r._id,
      name: r.restaurantName || r.name,
      email: r.email,
      phone: r.phone,
      plan: r.subscription?.planName || 'Craviti Pro',
      status: r.subscription?.status || 'trial',
      trialEndsAt: r.subscription?.trialEndsAt,
      subscriptionEnd: r.subscription?.subscriptionEnd,
      nextBillingDate: r.subscription?.nextBillingDate,
      razorpaySubscriptionId: r.subscription?.razorpaySubscriptionId,
      createdAt: r.createdAt,
    })),
    metrics: {
      mrr,
      arr,
      ...statusCounts,
    },
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};


