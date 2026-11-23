import { Router } from 'express';
import {
  getRestaurantPaymentsSummary,
  getRestaurantPaymentsList,
  getRestaurantRevenueChart,
  getRestaurantPaymentMethods,
  getRestaurantSettlementsHistory,
  getRestaurantRefunds,
  getRestaurantFailedPayments,
  getRestaurantBankDetails,
  exportRestaurantPaymentsCSV,
} from '../controllers/restaurantPaymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';
import { verifySubscription } from '../middleware/subscriptionMiddleware.js';

const router = Router();

// Require authenticated restaurant tenant for all routes
router.use(protect, requireRestaurant, verifySubscription);

router.get('/summary', getRestaurantPaymentsSummary);
router.get('/chart', getRestaurantRevenueChart);
router.get('/methods', getRestaurantPaymentMethods);
router.get('/settlements', getRestaurantSettlementsHistory);
router.get('/settlements/history', getRestaurantSettlementsHistory);
router.get('/refunds', getRestaurantRefunds);
router.get('/failed', getRestaurantFailedPayments);
router.get('/bank-details', getRestaurantBankDetails);
router.get('/export', exportRestaurantPaymentsCSV);
router.get('/', getRestaurantPaymentsList);

export default router;

