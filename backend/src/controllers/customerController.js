import mongoose from 'mongoose';
import { Restaurant } from '../models/Restaurant.js';
import { Category } from '../models/Category.js';
import { MenuItem } from '../models/MenuItem.js';
import { getCustomerMenuService } from '../services/orderService.js';
import { calculateSellingPrice } from '../utils/discountCalculator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';

/**
 * GET /api/customer/menu/:restaurantSlug/:tableId?
 * GET /api/customer/menu
 * Dynamic customer menu single source of truth
 */
export const getCustomerMenu = asyncHandler(async (req, res) => {
  const { restaurantSlug: paramSlug, tableId, tableNumber } = req.params;
  const {
    restaurantSlug: querySlug,
    slug,
    restaurantId,
    tableIdentifier,
    tableId: queryTableId,
    table: queryTable,
    guestId,
    deviceId,
    token,
    qrToken: queryQrToken,
  } = req.query;

  const resolvedSlug = paramSlug || querySlug || slug || restaurantId || '';
  const resolvedTable = tableId || tableNumber || tableIdentifier || queryTableId || queryTable || '';
  const resolvedToken = token || queryQrToken || '';

  const data = await getCustomerMenuService(resolvedSlug, resolvedTable, guestId, deviceId, resolvedToken);
  const message =
    !data.menuItems || data.menuItems.length === 0
      ? 'Menu is currently unavailable.'
      : 'Customer menu fetched successfully';

  return sendSuccess(res, message, data, HTTP_STATUS.OK, {
    restaurant: data.restaurant,
    table: data.table,
    categories: data.categories || [],
    items: data.menuItems || [],
    menuItems: data.menuItems || [],
  });
});

/**
 * GET /api/customer/categories/:restaurantSlug
 * GET /api/customer/categories
 * Returns live active categories for customer menu
 */
export const getCustomerCategories = asyncHandler(async (req, res) => {
  const { restaurantSlug: paramSlug } = req.params;
  const { restaurantSlug: querySlug, slug, restaurantId } = req.query;
  const resolvedSlug = paramSlug || querySlug || slug || restaurantId;

  if (!resolvedSlug) {
    const error = new Error('Restaurant slug or ID is required');
    error.statusCode = 400;
    throw error;
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(resolvedSlug);
  const restaurant = await Restaurant.findOne({
    $or: [
      { slug: resolvedSlug.toLowerCase() },
      ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(resolvedSlug) }] : []),
    ],
    isDeleted: { $ne: true },
  }).select('_id restaurantName slug isActive');

  if (!restaurant || restaurant.isActive === false) {
    const error = new Error('Restaurant not found or unavailable');
    error.statusCode = 404;
    throw error;
  }

  const categories = await Category.find({
    restaurantId: restaurant._id,
    isActive: true,
    isDeleted: { $ne: true },
  })
    .sort({ displayOrder: 1, createdAt: 1 })
    .select('_id categoryName displayOrder isActive')
    .lean();

  return sendSuccess(res, 'Categories fetched successfully', categories, HTTP_STATUS.OK, { data: categories });
});

/**
 * GET /api/customer/menu-items/:restaurantSlug
 * GET /api/customer/menu-items
 * Returns live non-deleted menu items for customer menu
 */
export const getCustomerMenuItems = asyncHandler(async (req, res) => {
  const { restaurantSlug: paramSlug } = req.params;
  const { restaurantSlug: querySlug, slug, restaurantId, categoryId, search, foodType } = req.query;
  const resolvedSlug = paramSlug || querySlug || slug || restaurantId;

  if (!resolvedSlug) {
    const error = new Error('Restaurant slug or ID is required');
    error.statusCode = 400;
    throw error;
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(resolvedSlug);
  const restaurant = await Restaurant.findOne({
    $or: [
      { slug: resolvedSlug.toLowerCase() },
      ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(resolvedSlug) }] : []),
    ],
    isDeleted: { $ne: true },
  }).select('_id restaurantName slug isActive');

  if (!restaurant || restaurant.isActive === false) {
    const error = new Error('Restaurant not found or unavailable');
    error.statusCode = 404;
    throw error;
  }

  // Active categories for reference
  const categories = await Category.find({
    restaurantId: restaurant._id,
    isActive: true,
    isDeleted: { $ne: true },
  }).select('_id');
  const activeCatIds = new Set(categories.map((c) => c._id.toString()));

  const query = {
    restaurantId: restaurant._id,
    isDeleted: { $ne: true },
  };

  if (categoryId) {
    query.categoryId = categoryId;
  }
  if (foodType) {
    query.foodType = foodType;
  }
  if (search && search.trim()) {
    query.itemName = { $regex: search.trim(), $options: 'i' };
  }

  const rawItems = await MenuItem.find(query)
    .populate('categoryId', 'categoryName isActive isDeleted displayOrder')
    .sort({ displayOrder: 1, createdAt: -1 })
    .lean();

  const items = rawItems
    .filter((item) => {
      if (item.isDeleted === true) return false;
      if (!item.categoryId) return false;
      const cId = item.categoryId?._id ? item.categoryId._id.toString() : item.categoryId.toString();
      if (!activeCatIds.has(cId)) return false;
      if (typeof item.categoryId === 'object') {
        if (item.categoryId.isActive === false || item.categoryId.isDeleted === true) return false;
      }
      return true;
    })
    .map((item) => {
      const price = Number(item.price) || 0;
      const discountType = item.discountType || 'none';
      const discountValue = Number(item.discountValue) || 0;
      const calculatedSellingPrice = calculateSellingPrice(price, discountType, discountValue);

      return {
        ...item,
        price,
        discountType,
        discountValue,
        sellingPrice:
          item.sellingPrice !== undefined && Number(item.sellingPrice) > 0
            ? Number(item.sellingPrice)
            : calculatedSellingPrice,
        availability: item.availability || 'available',
      };
    });

  return sendSuccess(res, 'Menu items fetched successfully', items, HTTP_STATUS.OK, { data: items });
});

