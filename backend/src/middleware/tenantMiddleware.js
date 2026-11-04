import { Restaurant } from '../models/Restaurant.js';

export const requireRestaurant = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    let restaurantId = req.user.restaurantId;

    if (!restaurantId) {
      const restaurant = await Restaurant.findOne({ createdBy: req.user._id });
      if (restaurant) {
        restaurantId = restaurant._id;
        req.user.restaurantId = restaurant._id;
      }
    }

    if (!restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Please complete restaurant onboarding before managing your menu.',
      });
    }

    req.restaurantId = restaurantId;
    next();
  } catch (error) {
    next(error);
  }
};

