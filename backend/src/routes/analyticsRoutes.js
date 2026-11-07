import { Router } from 'express';
import jwt from 'jsonwebtoken';
import {
  getRestaurantAnalytics,
  exportRestaurantAnalytics,
} from '../controllers/analyticsController.js';
import { getPlatformAnalytics } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminProtect } from '../middleware/adminAuthMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';
import env from '../config/env.js';

const router = Router();

// GET /api/analytics - Smart route supporting Admin or Restaurant Owner
router.get('/', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      if (decoded.type === 'admin') {
        return adminProtect(req, res, () => getPlatformAnalytics(req, res, next));
      }
    } catch (_) {}
  }
  return protect(req, res, (err) => {
    if (err) return next(err);
    requireRestaurant(req, res, () => getRestaurantAnalytics(req, res, next));
  });
});

// GET /api/analytics/export
router.get('/export', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  return protect(req, res, (err) => {
    if (err) return next(err);
    requireRestaurant(req, res, () => exportRestaurantAnalytics(req, res, next));
  });
});

export default router;
