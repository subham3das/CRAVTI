import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import {
  getRestaurantPaymentsSummaryService,
  getRestaurantPaymentsListService,
  getRestaurantRevenueChartService,
  getRestaurantPaymentMethodsDistributionService,
  getRestaurantSettlementsHistoryService,
  getRestaurantRefundsService,
  getRestaurantFailedPaymentsService,
  getRestaurantBankDetailsService,
  exportRestaurantPaymentsCSVService,
} from '../services/restaurantPaymentService.js';

export const getRestaurantPaymentsSummary = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId;
  const data = await getRestaurantPaymentsSummaryService(restaurantId);
  return sendSuccess(res, 'Payments summary loaded successfully', data, HTTP_STATUS.OK);
});

export const getRestaurantPaymentsList = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId;
  const data = await getRestaurantPaymentsListService(restaurantId, req.query);
  return sendSuccess(res, 'Payments list loaded successfully', data, HTTP_STATUS.OK);
});

export const getRestaurantRevenueChart = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId;
  const timeframe = req.query.timeframe || '7days';
  const data = await getRestaurantRevenueChartService(restaurantId, timeframe);
  return sendSuccess(res, 'Revenue chart loaded successfully', data, HTTP_STATUS.OK);
});

export const getRestaurantPaymentMethods = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId;
  const data = await getRestaurantPaymentMethodsDistributionService(restaurantId);
  return sendSuccess(res, 'Payment methods loaded successfully', data, HTTP_STATUS.OK);
});

export const getRestaurantSettlementsHistory = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId;
  const data = await getRestaurantSettlementsHistoryService(restaurantId);
  return sendSuccess(res, 'Settlement history loaded successfully', data, HTTP_STATUS.OK);
});

export const getRestaurantRefunds = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId;
  const data = await getRestaurantRefundsService(restaurantId);
  return sendSuccess(res, 'Refunds loaded successfully', data, HTTP_STATUS.OK);
});

export const getRestaurantFailedPayments = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId;
  const data = await getRestaurantFailedPaymentsService(restaurantId);
  return sendSuccess(res, 'Failed payments loaded successfully', data, HTTP_STATUS.OK);
});

export const getRestaurantBankDetails = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId;
  const data = await getRestaurantBankDetailsService(restaurantId);
  return sendSuccess(res, 'Bank details loaded successfully', data, HTTP_STATUS.OK);
});

export const exportRestaurantPaymentsCSV = asyncHandler(async (req, res) => {
  const restaurantId = req.restaurantId;
  const csv = await exportRestaurantPaymentsCSVService(restaurantId, req.query);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="craviti_payments_${restaurantId}_${Date.now()}.csv"`
  );
  return res.status(200).send(csv);
});

