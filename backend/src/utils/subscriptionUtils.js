/**
 * Canonical Subscription Utility for CRAVITI
 * Single source of truth for trial & subscription calculations across the entire application.
 */

export const calculateSubscriptionState = (rawSub, createdAt) => {
  const sub = rawSub || {};
  const now = Date.now();

  // 1. Determine canonical trial dates
  const trialStart = sub.trialStartDate || sub.subscriptionStart || createdAt || new Date(now);
  const trialStartDate = new Date(trialStart);

  // If trialEndDate is specified, prefer it; otherwise fallback to trialEndsAt, or calculate 14 days from start
  let trialEndDate;
  if (sub.trialEndDate) {
    trialEndDate = new Date(sub.trialEndDate);
  } else if (sub.trialEndsAt) {
    trialEndDate = new Date(sub.trialEndsAt);
  } else {
    trialEndDate = new Date(trialStartDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  }

  // 2. Calculate remaining trial days
  // Day 1 (0 to 24 hours into 14 days): 14 days remaining
  // Day 2 (24 to 48 hours into 14 days): 13 days remaining
  // Last valid day (0 < diffMs <= 24h): 1 day remaining
  // Expired (diffMs <= 0): 0 days remaining
  const diffMs = trialEndDate.getTime() - now;
  let trialDaysRemaining = 0;
  if (diffMs > 0) {
    trialDaysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  } else {
    trialDaysRemaining = 0;
  }

  // 3. Determine status & automatic expiration
  const baseStatus = sub.status || 'trial';
  let effectiveStatus = baseStatus;

  if (baseStatus === 'trial') {
    if (trialDaysRemaining <= 0 || diffMs <= 0) {
      effectiveStatus = 'expired';
    } else {
      effectiveStatus = 'trial';
    }
  } else if (baseStatus === 'active') {
    if (sub.subscriptionEnd && new Date(sub.subscriptionEnd).getTime() <= now) {
      effectiveStatus = 'expired';
    } else {
      effectiveStatus = 'active';
    }
  }

  const isTrialActive = effectiveStatus === 'trial' && trialDaysRemaining > 0;
  const isSubscriptionActive = effectiveStatus === 'active';
  const canAccessFeatures = isTrialActive || isSubscriptionActive;

  // Active subscription renewal window
  let daysUntilRenewal = 0;
  if (sub.subscriptionEnd) {
    const endDiff = new Date(sub.subscriptionEnd).getTime() - now;
    daysUntilRenewal = Math.max(0, Math.ceil(endDiff / (1000 * 60 * 60 * 24)));
  }
  const renewalRequired = effectiveStatus === 'expired' || (effectiveStatus === 'active' && daysUntilRenewal <= 7);

  return {
    planName: 'Craviti Pro',
    planId: sub.planId || '',
    status: effectiveStatus,
    subscriptionStatus: effectiveStatus,
    trialStartDate: trialStartDate.toISOString(),
    trialEndDate: trialEndDate.toISOString(),
    trialEndsAt: trialEndDate.toISOString(),
    trialDaysRemaining: effectiveStatus === 'trial' ? trialDaysRemaining : 0,
    subscriptionStart: sub.subscriptionStart ? new Date(sub.subscriptionStart).toISOString() : null,
    subscriptionEnd: sub.subscriptionEnd ? new Date(sub.subscriptionEnd).toISOString() : null,
    nextBillingDate: sub.nextBillingDate ? new Date(sub.nextBillingDate).toISOString() : null,
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
