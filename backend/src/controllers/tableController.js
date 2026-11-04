import {
  getTablesService,
  getTableStatsService,
  createTableService,
  bulkCreateTablesService,
  updateTableService,
  deleteTableService,
  toggleTableActiveService,
  generateTableQRService,
  regenerateQRService,
  bulkGenerateQRCodesService,
  exportAllQRZipService,
} from '../services/tableService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import { emitSyncEvent } from '../config/socket.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

export const getTables = asyncHandler(async (req, res) => {
  const data = await getTablesService(req.restaurantId, req.query);
  return sendSuccess(res, 'Tables fetched successfully', data, HTTP_STATUS.OK, data);
});

export const getTableStats = asyncHandler(async (req, res) => {
  const stats = await getTableStatsService(req.restaurantId);
  return sendSuccess(res, 'Table stats fetched successfully', { stats }, HTTP_STATUS.OK, { stats });
});

export const createTable = asyncHandler(async (req, res) => {
  const table = await createTableService(req.restaurantId, req.body);
  emitSyncEvent({
    event: SOCKET_EVENTS.TABLE_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'create', table },
  });
  return sendSuccess(res, 'Table created successfully', { table }, HTTP_STATUS.CREATED, { table });
});

export const bulkCreateTables = asyncHandler(async (req, res) => {
  const result = await bulkCreateTablesService(req.restaurantId, req.body);
  emitSyncEvent({
    event: SOCKET_EVENTS.TABLE_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'bulk_create', result },
  });
  return sendSuccess(res, 'Bulk tables created successfully', result, HTTP_STATUS.CREATED, result);
});

/**
 * Bulk Generate QR Codes for Tables missing them
 */
export const bulkGenerateQRs = asyncHandler(async (req, res) => {
  const result = await bulkGenerateQRCodesService(req.restaurantId);
  emitSyncEvent({
    event: SOCKET_EVENTS.QR_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'bulk_qr_generate', result },
  });
  return sendSuccess(res, 'Bulk QR code generation completed', result, HTTP_STATUS.OK, result);
});

/**
 * Idempotent Single Table QR Generation
 */
export const generateTableQR = asyncHandler(async (req, res) => {
  const { force } = req.body || {};
  const result = await generateTableQRService(req.restaurantId, req.params.id, { force: Boolean(force) });
  emitSyncEvent({
    event: SOCKET_EVENTS.QR_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'qr_generate', table: result.table },
  });
  return sendSuccess(res, 'QR code generated successfully', result, HTTP_STATUS.OK, result);
});

export const updateTable = asyncHandler(async (req, res) => {
  const table = await updateTableService(req.restaurantId, req.params.id, req.body);
  emitSyncEvent({
    event: SOCKET_EVENTS.TABLE_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'update', table },
  });
  return sendSuccess(res, 'Table updated successfully', { table }, HTTP_STATUS.OK, { table });
});

export const deleteTable = asyncHandler(async (req, res) => {
  const result = await deleteTableService(req.restaurantId, req.params.id);
  emitSyncEvent({
    event: SOCKET_EVENTS.TABLE_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'delete', tableId: req.params.id },
  });
  return sendSuccess(res, 'Table deleted successfully', result, HTTP_STATUS.OK);
});

export const toggleTableActive = asyncHandler(async (req, res) => {
  const table = await toggleTableActiveService(req.restaurantId, req.params.id);
  emitSyncEvent({
    event: SOCKET_EVENTS.TABLE_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'toggle_active', table },
  });
  return sendSuccess(res, 'Table status updated', { table }, HTTP_STATUS.OK, { table });
});

export const regenerateQR = asyncHandler(async (req, res) => {
  const table = await regenerateQRService(req.restaurantId, req.params.id);
  emitSyncEvent({
    event: SOCKET_EVENTS.QR_UPDATED,
    restaurantId: req.restaurantId,
    data: { action: 'regenerate', table },
  });
  return sendSuccess(res, 'QR regenerated successfully', { table }, HTTP_STATUS.OK, { table });
});

export const exportQRZip = asyncHandler(async (req, res) => {
  await exportAllQRZipService(req.restaurantId, res);
});
