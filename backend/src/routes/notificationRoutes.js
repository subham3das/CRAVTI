import { Router } from 'express';
import {
  getRestaurantNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';

const router = Router();

router.use(protect, requireRestaurant);

router.get('/', getRestaurantNotifications);
router.patch('/mark-all-read', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

export default router;

