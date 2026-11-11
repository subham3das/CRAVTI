import { MenuItem } from '../models/MenuItem.js';
import { Category } from '../models/Category.js';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from './cloudinaryService.js';
import { calculateSellingPrice } from '../utils/discountCalculator.js';
import { normalizeImage } from '../utils/imageUtils.js';

export const getMenuItemsService = async (restaurantId, query = {}) => {
  const {
    search = '',
    categoryId = '',
    foodType = '',
    availability = '',
    sort = 'newest',
    page = 1,
    limit = 10,
  } = query;

  const filter = { restaurantId, isDeleted: { $ne: true } };

  if (search.trim()) {
    filter.itemName = { $regex: search.trim(), $options: 'i' };
  }

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  if (foodType) {
    filter.foodType = foodType;
  }

  if (availability) {
    filter.availability = availability;
  }

  // Sorting
  let sortOption = { createdAt: -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };
  if (sort === 'price_asc') sortOption = { sellingPrice: 1 };
  if (sort === 'price_desc') sortOption = { sellingPrice: -1 };
  if (sort === 'alphabetical') sortOption = { itemName: 1 };
  if (sort === 'display_order') sortOption = { displayOrder: 1, createdAt: -1 };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * pageLimit;

  const [items, total] = await Promise.all([
    MenuItem.find(filter)
      .populate('categoryId', 'categoryName isActive')
      .sort(sortOption)
      .skip(skip)
      .limit(pageLimit),
    MenuItem.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / pageLimit) || 1,
    limit: pageLimit,
  };
};

export const getMenuStatsService = async (restaurantId) => {
  const [totalItems, categoriesCount, popularCount, outOfStockCount] = await Promise.all([
    MenuItem.countDocuments({ restaurantId }),
    Category.countDocuments({ restaurantId }),
    MenuItem.countDocuments({ restaurantId, popular: true }),
    MenuItem.countDocuments({ restaurantId, availability: 'out_of_stock' }),
  ]);

  return {
    totalItems,
    categoriesCount,
    popularCount,
    outOfStockCount,
  };
};

export const createMenuItemService = async (restaurantId, data, imageFile) => {
  // Validate category belongs to this restaurant
  const category = await Category.findOne({ _id: data.categoryId, restaurantId });
  if (!category) {
    const error = new Error('Selected category is invalid or does not belong to your restaurant.');
    error.statusCode = 400;
    throw error;
  }

  // Calculate dynamic selling price
  const price = Number(data.price);
  const discountType = data.discountType || 'none';
  const discountValue = Number(data.discountValue) || 0;
  const sellingPrice = calculateSellingPrice(price, discountType, discountValue);

  let imageData = { url: '', public_id: '' };
  if (imageFile) {
    const uploaded = await uploadImageToCloudinary(imageFile, 'craviti/menu');
    if (uploaded) imageData = normalizeImage(uploaded);
  } else if (data.image) {
    imageData = normalizeImage(data.image);
  }

  const item = await MenuItem.create({
    restaurantId,
    categoryId: data.categoryId,
    itemName: data.itemName.trim(),
    description: data.description ? data.description.trim() : '',
    image: imageData,
    price,
    discountType,
    discountValue,
    sellingPrice,
    foodType: data.foodType || 'veg',
    availability: data.availability || 'available',
    preparationTime: Number(data.preparationTime) || 15,
    popular: data.popular === 'true' || data.popular === true,
    recommended: data.recommended === 'true' || data.recommended === true,
    displayOrder: Number(data.displayOrder) || 0,
  });

  return await MenuItem.findById(item._id).populate('categoryId', 'categoryName isActive');
};

export const updateMenuItemService = async (restaurantId, itemId, data, imageFile) => {
  const item = await MenuItem.findOne({ _id: itemId, restaurantId });
  if (!item) {
    const error = new Error('Menu item not found.');
    error.statusCode = 404;
    throw error;
  }

  if (data.categoryId && data.categoryId !== item.categoryId.toString()) {
    const category = await Category.findOne({ _id: data.categoryId, restaurantId });
    if (!category) {
      const error = new Error('Selected category is invalid.');
      error.statusCode = 400;
      throw error;
    }
    item.categoryId = data.categoryId;
  }

  if (data.itemName) item.itemName = data.itemName.trim();
  if (data.description !== undefined) item.description = data.description.trim();

  // Pricing & Discounts
  const price = data.price !== undefined ? Number(data.price) : item.price;
  const discountType = data.discountType !== undefined ? data.discountType : item.discountType;
  const discountValue = data.discountValue !== undefined ? Number(data.discountValue) : item.discountValue;

  item.price = price;
  item.discountType = discountType;
  item.discountValue = discountValue;
  item.sellingPrice = calculateSellingPrice(price, discountType, discountValue);

  if (data.foodType) item.foodType = data.foodType;
  if (data.availability) item.availability = data.availability;
  if (data.preparationTime !== undefined) item.preparationTime = Number(data.preparationTime);
  if (data.popular !== undefined) item.popular = data.popular === 'true' || data.popular === true;
  if (data.recommended !== undefined) item.recommended = data.recommended === 'true' || data.recommended === true;
  if (data.displayOrder !== undefined) item.displayOrder = Number(data.displayOrder);

  // Handle image replacement with Cloudinary asset cleanup (Standard 21)
  if (imageFile) {
    if (item.image?.public_id) {
      await deleteImageFromCloudinary(item.image.public_id);
    }
    const uploaded = await uploadImageToCloudinary(imageFile, 'craviti/menu');
    if (uploaded) item.image = normalizeImage(uploaded);
  } else if (data.image !== undefined) {
    item.image = normalizeImage(data.image);
  } else if (item.image) {
    item.image = normalizeImage(item.image);
  }

  await item.save();
  return await MenuItem.findById(item._id).populate('categoryId', 'categoryName isActive');
};

export const deleteMenuItemService = async (restaurantId, itemId) => {
  const item = await MenuItem.findOne({ _id: itemId, restaurantId, isDeleted: { $ne: true } });
  if (!item) {
    const error = new Error('Menu item not found.');
    error.statusCode = 404;
    throw error;
  }

  // Soft delete standard (Standard 22)
  item.isDeleted = true;
  item.deletedAt = new Date();
  await item.save();

  return { id: itemId, message: 'Menu item deleted successfully.' };
};

export const duplicateMenuItemService = async (restaurantId, itemId) => {
  const item = await MenuItem.findOne({ _id: itemId, restaurantId });
  if (!item) {
    const error = new Error('Menu item not found.');
    error.statusCode = 404;
    throw error;
  }

  const duplicated = await MenuItem.create({
    restaurantId,
    categoryId: item.categoryId,
    itemName: `${item.itemName} (Copy)`,
    description: item.description,
    image: item.image,
    price: item.price,
    discountType: item.discountType,
    discountValue: item.discountValue,
    sellingPrice: item.sellingPrice,
    foodType: item.foodType,
    availability: item.availability,
    preparationTime: item.preparationTime,
    popular: false,
    recommended: false,
    displayOrder: (item.displayOrder || 0) + 1,
  });

  return await MenuItem.findById(duplicated._id).populate('categoryId', 'categoryName isActive');
};

export const toggleItemAvailabilityService = async (restaurantId, itemId) => {
  const item = await MenuItem.findOne({ _id: itemId, restaurantId });
  if (!item) {
    const error = new Error('Menu item not found.');
    error.statusCode = 404;
    throw error;
  }

  item.availability = item.availability === 'available' ? 'out_of_stock' : 'available';
  await item.save();

  return await MenuItem.findById(item._id).populate('categoryId', 'categoryName isActive');
};

