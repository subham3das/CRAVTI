import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import {
  getAdminSettlementsService,
  processSettlementService,
  updateRestaurantCommissionService,
  getRestaurantWalletsService,
} from '../services/settlementService.js';

/**
 * GET /api/admin/settlements
 * List all settlements with stats and pagination
 */
export const getAdminSettlements = asyncHandler(async (req, res) => {
  const result = await getAdminSettlementsService(req.query);
  return sendSuccess(res, 'Settlements retrieved successfully', result, HTTP_STATUS.OK);
});

/**
 * GET /api/admin/settlements/wallets
 * List all restaurant wallets, balances, and commission rates
 */
export const getAdminRestaurantWallets = asyncHandler(async (req, res) => {
  const result = await getRestaurantWalletsService(req.query);
  return sendSuccess(res, 'Restaurant wallets retrieved successfully', result, HTTP_STATUS.OK);
});

/**
 * POST /api/admin/settlements/process
 * Manually or automatically mark settlement as completed/failed
 */
export const processAdminSettlement = asyncHandler(async (req, res) => {
  const { settlementId, utr, status, failureReason, notes } = req.body;

  if (!settlementId) {
    return sendError(res, 'Settlement ID is required', 'MISSING_FIELD', HTTP_STATUS.BAD_REQUEST);
  }

  const result = await processSettlementService({
    settlementId,
    utr,
    status: status || 'completed',
    failureReason,
    notes,
    actor: req.admin?.name || req.user?.name || 'Admin',
  });

  return sendSuccess(res, 'Settlement status updated successfully', { settlement: result }, HTTP_STATUS.OK);
});

/**
 * PATCH /api/admin/settlements/commission
 * Update commission rate, linked Razorpay account, or cycle for restaurant
 */
export const updateAdminRestaurantCommission = asyncHandler(async (req, res) => {
  const { restaurantId, commissionRate, linkedAccountId, settlementCycle, minimumSettlement, notes } = req.body;

  if (!restaurantId) {
    return sendError(res, 'Restaurant ID is required', 'MISSING_FIELD', HTTP_STATUS.BAD_REQUEST);
  }

  const result = await updateRestaurantCommissionService({
    restaurantId,
    commissionRate,
    linkedAccountId,
    settlementCycle,
    minimumSettlement,
    notes,
  });

  return sendSuccess(res, 'Restaurant commission settings updated', { restaurant: result }, HTTP_STATUS.OK);
});

