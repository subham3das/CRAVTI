import FeatureFlags from '../models/FeatureFlags.js';
import { HTTP_STATUS } from '../constants/index.js';

/**
 * Middleware factory to guard routes by FeatureFlag
 */
export const requireFeature = (flagName) => async (req, res, next) => {
  try {
    const restaurantId = req.restaurantId || req.params?.restaurantId;
    if (!restaurantId) return next();

    const flags = await FeatureFlags.getFlagsForRestaurant(restaurantId);
    if (flags && flags[flagName] === false) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `Feature '${flagName}' is disabled for this restaurant.`,
        error: 'FEATURE_DISABLED',
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

