import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';
import { verifySubscription } from '../middleware/subscriptionMiddleware.js';
import {
  getRestaurantFinanceOverview,
  getRestaurantSettlements,
  getRestaurantInvoices,
  getRestaurantTransactions,
  exportRestaurantSettlementReport,
} from '../controllers/restaurantFinanceController.js';

const router = Router();

router.use(protect);
router.use(requireRestaurant);
router.use(verifySubscription);

router.get('/overview', getRestaurantFinanceOverview);
router.get('/settlements', getRestaurantSettlements);
router.get('/invoices', getRestaurantInvoices);
router.get('/transactions', getRestaurantTransactions);
router.get('/reports/export', exportRestaurantSettlementReport);

export default router;

