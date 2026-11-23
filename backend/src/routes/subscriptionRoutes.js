import { Router } from 'express';
import {
  createSubscription,
  cancelSubscription,
  getSubscriptionStatus,
  confirmSubscription,
  renewSubscription,
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';

const router = Router();

// Authenticated Restaurant Subscription APIs
router.post('/create', protect, requireRestaurant, createSubscription);
router.post('/confirm', protect, requireRestaurant, confirmSubscription);
router.post('/renew', protect, requireRestaurant, renewSubscription);
router.post('/cancel', protect, requireRestaurant, cancelSubscription);
router.get('/status', protect, requireRestaurant, getSubscriptionStatus);

export default router;
