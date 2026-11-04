import { Router } from 'express';
import { getRestaurantDashboard } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';

const router = Router();

// GET /api/dashboard - Authenticated Restaurant Owner
router.get('/', protect, requireRestaurant, getRestaurantDashboard);

export default router;

