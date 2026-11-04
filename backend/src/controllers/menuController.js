import {
  getMenuItemsService,
  getMenuStatsService,
  createMenuItemService,
  updateMenuItemService,
  deleteMenuItemService,
  duplicateMenuItemService,
  toggleItemAvailabilityService,
} from '../services/menuService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import { emitSyncEvent } from '../config/socket.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const getMenuItems = asyncHandler(async (req, res) => {
  const result = await getMenuItemsService(req.restaurantId, req.query);
  return sendSuccess(res, 'Menu items fetched successfully', result, HTTP_STATUS.OK, { data: result });
});

export const getMenuStats = asyncHandler(async (req, res) => {
  const stats = await getMenuStatsService(req.restaurantId);
  return sendSuccess(res, 'Menu stats fetched successfully', stats, HTTP_STATUS.OK, { data: stats });
});

export const createMenuItem = asyncHandler(async (req, res) => {
  const item = await createMenuItemService(req.restaurantId, req.body, req.file);
  emitSyncEvent({
    event: SOCKET_EVENTS.MENU_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'create', item },
  });
  return sendSuccess(res, 'Menu item added successfully.', item, HTTP_STATUS.CREATED, { data: item });
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await updateMenuItemService(req.restaurantId, req.params.id, req.body, req.file);
  emitSyncEvent({
    event: SOCKET_EVENTS.MENU_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'update', item },
  });
  return sendSuccess(res, 'Menu item updated successfully.', item, HTTP_STATUS.OK, { data: item });
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
  const result = await deleteMenuItemService(req.restaurantId, req.params.id);
  emitSyncEvent({
    event: SOCKET_EVENTS.MENU_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'delete', itemId: req.params.id },
  });
  return sendSuccess(res, result.message, result, HTTP_STATUS.OK);
});

export const duplicateMenuItem = asyncHandler(async (req, res) => {
  const item = await duplicateMenuItemService(req.restaurantId, req.params.id);
  emitSyncEvent({
    event: SOCKET_EVENTS.MENU_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'duplicate', item },
  });
  return sendSuccess(res, `"${item.itemName}" created as duplicate.`, item, HTTP_STATUS.CREATED, { data: item });
});

export const toggleItemAvailability = asyncHandler(async (req, res) => {
  const item = await toggleItemAvailabilityService(req.restaurantId, req.params.id);
  emitSyncEvent({
    event: SOCKET_EVENTS.MENU_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'toggle_availability', item },
  });
  return sendSuccess(
    res,
    `Status updated to ${item.availability === 'available' ? 'Available' : 'Out of Stock'}.`,
    item,
    HTTP_STATUS.OK,
    { data: item }
  );
});
