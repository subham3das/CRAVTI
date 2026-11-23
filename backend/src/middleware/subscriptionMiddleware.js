import { Restaurant } from '../models/Restaurant.js';
import { calculateSubscriptionState } from '../utils/subscriptionUtils.js';
import { HTTP_STATUS } from '../constants/index.js';

/**
 * Subscription Verification Middleware
 * Single source of truth for protecting restaurant operational modules:
 * Dashboard, Orders, Menu, Tables, Billing, Analytics, Settings.
 * Never locks customer QR ordering or public storefronts.
 */
export const verifySubscription = async (req, res, next) => {
  try {
    const restaurantId = req.restaurant?._id || req.user?.restaurantId;

    if (!restaurantId) {
      return next();
    }

    const restaurant = await Restaurant.findById(restaurantId).select('subscription restaurantName isDeleted createdAt');
    if (!restaurant || restaurant.isDeleted) {
      return next();
    }

    const subState = calculateSubscriptionState(restaurant.subscription, restaurant.createdAt);

    if (subState.canAccessFeatures) {
      return next();
    }

    // Subscription or trial has lapsed
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: 'SUBSCRIPTION_EXPIRED',
      message: 'Your Craviti subscription or trial has expired. Please renew to continue managing your restaurant.',
      redirectUrl: '/subscription',
      subscription: subState,
    });
  } catch (err) {
    console.error('[Subscription Middleware] Check error:', err.message);
    // On unexpected middleware error, do not break operations
    return next();
  }
};

export default verifySubscription;

