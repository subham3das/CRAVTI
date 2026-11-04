import { RestaurantUser } from '../models/RestaurantUser.js';
import { Restaurant } from '../models/Restaurant.js';
import { generateToken } from '../utils/generateToken.js';

export const registerUserService = async ({ email, phone, password }) => {
  const existingUser = await RestaurantUser.findOne({ email });
  if (existingUser) {
    const error = new Error('A restaurant owner account already exists with this email');
    error.statusCode = 400;
    throw error;
  }

  const user = await RestaurantUser.create({
    email,
    phone,
    password,
    role: 'owner',
  });

  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      restaurantId: null,
    },
    token,
  };
};

export const loginUserService = async ({ email, password }) => {
  const user = await RestaurantUser.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id);

  let restaurant = null;
  if (user.restaurantId) {
    restaurant = await Restaurant.findById(user.restaurantId);
  }

  return {
    user: {
      id: user._id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      restaurantId: user.restaurantId,
    },
    restaurant,
    token,
  };
};

export const getCurrentUserService = async (userId) => {
  const user = await RestaurantUser.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  let restaurant = null;
  if (user.restaurantId) {
    restaurant = await Restaurant.findById(user.restaurantId);
  }

  return { user, restaurant };
};

