/**
 * CANONICAL SUBSCRIPTION & TRIAL ENGINE FOR CRAVITI
 *
 * Single, authoritative source of truth for all trial, subscription,
 * expiration, and feature access calculations across the entire application.
 *
 * IMMUTABLE RULES:
 * 1. The ONLY source of truth is the restaurant's registration date.
 *    - registrationDate = account creation timestamp (UTC)
 *    - trialStartDate = registrationDate
 *    - trialEndDate = registrationDate + exactly 14 * 24 hours (1,209,600,000 ms)
 * 2. Calculations ALWAYS use UTC millisecond timestamps (getTime()).
 *    - Never compare formatted strings or local time representations.
 * 3. Trial expires ONLY when now >= trialEndDate timestamp (accurate to the millisecond).
 * 4. A pending checkout or page refresh can NEVER prematurely terminate an active trial.
 */

export const getSubscriptionState = (restaurantOrSub, createdAtDate = null) => {
  const now = Date.now();

  // Handle both full restaurant document and raw subscription subdocument
  let sub = {};
  let regDateRaw = null;

  if (restaurantOrSub) {
    if (restaurantOrSub.subscription) {
      // It's a Restaurant document or object
      sub = restaurantOrSub.subscription || {};
      regDateRaw = restaurantOrSub.registrationDate || restaurantOrSub.createdAt;
    } else {
      // It's already the subscription subdocument
      sub = restaurantOrSub;
      regDateRaw = sub.registrationDate || createdAtDate;
    }
  }

  // 1. Resolve canonical registrationDate (UTC timestamp)
  const resolvedRegDate =
    regDateRaw ||
    sub.trialStartDate ||
    sub.subscriptionStart ||
    createdAtDate ||
    new Date(now);

  const registrationDate = new Date(resolvedRegDate);
  const registrationTimestamp = registrationDate.getTime();

  // 2. Resolve canonical trialStartDate
  // Must be anchored permanently to the registration date unless explicitly set
  const trialStartDate = sub.trialStartDate
    ? new Date(sub.trialStartDate)
    : new Date(registrationTimestamp);

  // 3. Resolve canonical trialEndDate
  // Exactly 14 * 24 * 60 * 60 * 1000 ms after trial start, unless explicitly stored
  let trialEndDate;
  if (sub.trialEndDate) {
    trialEndDate = new Date(sub.trialEndDate);
  } else if (sub.trialEndsAt) {
    trialEndDate = new Date(sub.trialEndsAt);
  } else {
    trialEndDate = new Date(trialStartDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  }

  const trialEndTimestamp = trialEndDate.getTime();

  // 4. Exact millisecond calculations
  const remainingMilliseconds = Math.max(0, trialEndTimestamp - now);
  const isTrialWindowOpen = trialEndTimestamp > now;

  // Breakdown of remaining time
  const remainingDays = Math.floor(remainingMilliseconds / (1000 * 60 * 60 * 24));
  const remainingHours = Math.floor((remainingMilliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((remainingMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const remainingSeconds = Math.floor((remainingMilliseconds % (1000 * 60)) / 1000);

  // Display days remaining for badges/labels:
  // When trial is active, Day 1 (13.9 days left) shows 14, last 5 hours shows 1, 0 only when expired
  const displayDaysRemaining = isTrialWindowOpen
    ? Math.max(1, Math.ceil(remainingMilliseconds / (1000 * 60 * 60 * 24)))
    : 0;

  // 5. Active Paid Subscription Calculations
  const rawStatus = (sub.status || 'trial').toLowerCase();
  let isSubscriptionActive = false;
  let daysUntilRenewal = 0;

  if (rawStatus === 'active') {
    if (sub.subscriptionEnd) {
      const subEndTimestamp = new Date(sub.subscriptionEnd).getTime();
      if (subEndTimestamp > now) {
        isSubscriptionActive = true;
        const renewDiff = subEndTimestamp - now;
        daysUntilRenewal = Math.max(0, Math.ceil(renewDiff / (1000 * 60 * 60 * 24)));
      }
    } else {
      // Active without end date defaults to active
      isSubscriptionActive = true;
      daysUntilRenewal = 30;
    }
  }

  // 6. Determine canonical effective status & feature access
  let effectiveStatus = rawStatus;
  let isTrialActive = false;
  let canAccessFeatures = false;

  if (isSubscriptionActive) {
    effectiveStatus = 'active';
    canAccessFeatures = true;
  } else if (rawStatus === 'active' && !isSubscriptionActive) {
    // Paid subscription period ended
    // If original trial period is still active, fall back to trial
    if (isTrialWindowOpen) {
      effectiveStatus = 'trial';
      isTrialActive = true;
      canAccessFeatures = true;
    } else {
      effectiveStatus = 'expired';
      canAccessFeatures = false;
    }
  } else if (rawStatus === 'cancelled' || rawStatus === 'suspended' || rawStatus === 'halted') {
    // If paid subscription was cancelled, allow access until subscriptionEnd
    if (sub.subscriptionEnd && new Date(sub.subscriptionEnd).getTime() > now) {
      effectiveStatus = rawStatus;
      canAccessFeatures = true;
    } else if (isTrialWindowOpen) {
      // If cancelled/halted but trial still has remaining time
      effectiveStatus = 'trial';
      isTrialActive = true;
      canAccessFeatures = true;
    } else {
      effectiveStatus = rawStatus === 'cancelled' ? 'cancelled' : 'expired';
      canAccessFeatures = false;
    }
  } else {
    // Default or trial or pending checkout
    if (isTrialWindowOpen) {
      effectiveStatus = 'trial';
      isTrialActive = true;
      canAccessFeatures = true;
    } else {
      effectiveStatus = 'expired';
      isTrialActive = false;
      canAccessFeatures = false;
    }
  }

  const renewalRequired =
    effectiveStatus === 'expired' ||
    (effectiveStatus === 'active' && daysUntilRenewal <= 7);

  return {
    planName: 'Craviti Pro',
    planId: sub.planId || '',
    status: effectiveStatus,
    subscriptionStatus: effectiveStatus,
    rawStatus,
    registrationDate: registrationDate.toISOString(),
    trialStartDate: trialStartDate.toISOString(),
    trialEndDate: trialEndDate.toISOString(),
    trialEndsAt: trialEndDate.toISOString(), // alias for compatibility
    subscriptionStart: sub.subscriptionStart ? new Date(sub.subscriptionStart).toISOString() : null,
    subscriptionEnd: sub.subscriptionEnd ? new Date(sub.subscriptionEnd).toISOString() : null,
    nextBillingDate: sub.nextBillingDate ? new Date(sub.nextBillingDate).toISOString() : null,
    remainingMilliseconds,
    remainingDays,
    remainingHours,
    remainingMinutes,
    remainingSeconds,
    trialDaysRemaining: effectiveStatus === 'trial' ? displayDaysRemaining : 0,
    trialRemainingDays: effectiveStatus === 'trial' ? displayDaysRemaining : 0,
    isTrialActive,
    isSubscriptionActive,
    canAccessFeatures,
    renewalRequired,
    daysUntilRenewal,
    razorpayCustomerId: sub.razorpayCustomerId || '',
    razorpaySubscriptionId: sub.razorpaySubscriptionId || '',
    lastPaymentId: sub.lastPaymentId || '',
    priceMonthly: 699,
  };
};

// Alias export for backward compatibility
export const calculateSubscriptionState = (rawSub, createdAt) => getSubscriptionState(rawSub, createdAt);

export default getSubscriptionState;
