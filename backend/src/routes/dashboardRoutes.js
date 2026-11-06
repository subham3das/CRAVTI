import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getRestaurantDashboard } from '../controllers/dashboardController.js';
import { getBusinessDashboard } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminProtect } from '../middleware/adminAuthMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';
import env from '../config/env.js';

const router = Router();

// GET /api/dashboard - Smart route supporting Admin or Restaurant Owner
router.get('/', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      if (decoded.type === 'admin') {
        return adminProtect(req, res, () => getBusinessDashboard(req, res, next));
      }
    } catch (_) {}
  }
  return protect(req, res, (err) => {
    if (err) return next(err);
    requireRestaurant(req, res, () => getRestaurantDashboard(req, res, next));
  });
});

export default router;
