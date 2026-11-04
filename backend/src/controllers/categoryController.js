import {
  getAllCategoriesService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
  toggleCategoryStatusService,
} from '../services/categoryService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import { emitSyncEvent } from '../config/socket.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await getAllCategoriesService(req.restaurantId);
  return sendSuccess(res, 'Categories fetched successfully', categories, HTTP_STATUS.OK, { data: categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await createCategoryService(req.restaurantId, req.body);
  emitSyncEvent({
    event: SOCKET_EVENTS.CATEGORY_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'create', category },
  });
  return sendSuccess(res, 'Category created successfully.', category, HTTP_STATUS.CREATED, { data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await updateCategoryService(req.restaurantId, req.params.id, req.body);
  emitSyncEvent({
    event: SOCKET_EVENTS.CATEGORY_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'update', category },
  });
  return sendSuccess(res, 'Category updated successfully.', category, HTTP_STATUS.OK, { data: category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const result = await deleteCategoryService(req.restaurantId, req.params.id);
  emitSyncEvent({
    event: SOCKET_EVENTS.CATEGORY_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'delete', categoryId: req.params.id },
  });
  return sendSuccess(res, result.message, result, HTTP_STATUS.OK);
});

export const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const category = await toggleCategoryStatusService(req.restaurantId, req.params.id);
  emitSyncEvent({
    event: SOCKET_EVENTS.CATEGORY_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'toggle_status', category },
  });
  return sendSuccess(
    res,
    `Category ${category.isActive ? 'activated' : 'deactivated'} successfully.`,
    category,
    HTTP_STATUS.OK,
    { data: category }
  );
});
