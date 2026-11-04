import { Category } from '../models/Category.js';
import { MenuItem } from '../models/MenuItem.js';

export const getAllCategoriesService = async (restaurantId) => {
  const categories = await Category.find({ restaurantId, isDeleted: { $ne: true } }).sort({ displayOrder: 1, createdAt: 1 });

  // Get item counts per category (excluding deleted items)
  const itemCounts = await MenuItem.aggregate([
    { $match: { restaurantId, isDeleted: { $ne: true } } },
    { $group: { _id: '$categoryId', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  itemCounts.forEach((item) => {
    countMap[item._id.toString()] = item.count;
  });

  return categories.map((cat) => ({
    ...cat.toObject(),
    itemCount: countMap[cat._id.toString()] || 0,
  }));
};

export const createCategoryService = async (restaurantId, { categoryName, displayOrder, isActive }) => {
  const existing = await Category.findOne({
    restaurantId,
    categoryName: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') },
  });

  if (existing) {
    const error = new Error(`Category "${categoryName}" already exists in your restaurant menu.`);
    error.statusCode = 400;
    throw error;
  }

  const category = await Category.create({
    restaurantId,
    categoryName: categoryName.trim(),
    displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
    isActive: isActive !== undefined ? Boolean(isActive) : true,
  });

  return category;
};

export const updateCategoryService = async (restaurantId, categoryId, { categoryName, displayOrder, isActive }) => {
  const category = await Category.findOne({ _id: categoryId, restaurantId });
  if (!category) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }

  if (categoryName && categoryName.trim() !== category.categoryName) {
    const duplicate = await Category.findOne({
      restaurantId,
      _id: { $ne: categoryId },
      categoryName: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') },
    });
    if (duplicate) {
      const error = new Error(`Category "${categoryName}" already exists.`);
      error.statusCode = 400;
      throw error;
    }
    category.categoryName = categoryName.trim();
  }

  if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);
  if (isActive !== undefined) category.isActive = Boolean(isActive);

  await category.save();
  return category;
};

export const deleteCategoryService = async (restaurantId, categoryId) => {
  const category = await Category.findOne({ _id: categoryId, restaurantId, isDeleted: { $ne: true } });
  if (!category) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }

  // Check if active items are assigned to this category
  const itemCount = await MenuItem.countDocuments({ restaurantId, categoryId, isDeleted: { $ne: true } });
  if (itemCount > 0) {
    const error = new Error(`Cannot delete category. It contains ${itemCount} menu item(s). Move or delete them first.`);
    error.statusCode = 400;
    throw error;
  }

  // Soft delete standard (Standard 22)
  category.isDeleted = true;
  category.deletedAt = new Date();
  await category.save();

  return { id: categoryId, message: 'Category deleted successfully.' };
};

export const toggleCategoryStatusService = async (restaurantId, categoryId) => {
  const category = await Category.findOne({ _id: categoryId, restaurantId });
  if (!category) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }

  category.isActive = !category.isActive;
  await category.save();

  return category;
};

