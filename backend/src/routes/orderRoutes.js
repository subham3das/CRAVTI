import { Router } from 'express';
import jwt from 'jsonwebtoken';
import {
  getCustomerMenu,
  getActiveCustomerOrder,
  placeOrder,
  getOrderById,
  getOrderReceipt,
  updateOrderStatus,
  updatePaymentStatus,
  getLiveOrders,
  getHistoricalOrders,
  getOrderMetrics,
  softDeleteOrder,
} from '../controllers/orderController.js';
import { getAdminOrders } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminProtect } from '../middleware/adminAuthMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';
import env from '../config/env.js';

const router = Router();

// ==========================================
// Customer / Public Order Tracking & Digital Menu
// ==========================================
router.get('/menu/:restaurantSlug/:tableId/:qrToken', getCustomerMenu);
router.get('/menu/:restaurantSlug/:tableId', getCustomerMenu);
router.get('/active-session/:restaurantSlug/:tableId', getActiveCustomerOrder);
router.post('/place', placeOrder);
router.get('/track/:id', getOrderById);
router.get('/detail/:id', getOrderById);
router.get('/receipt/:id', getOrderReceipt);
router.get('/:id/receipt', getOrderReceipt);

// ==========================================
// Authenticated Restaurant Order Management
// ==========================================
router.get('/live', protect, requireRestaurant, getLiveOrders);
router.get('/history', protect, requireRestaurant, getHistoricalOrders);
router.get('/metrics', protect, requireRestaurant, getOrderMetrics);
router.patch('/:id/status', protect, requireRestaurant, updateOrderStatus);
router.patch('/:id/payment', protect, requireRestaurant, updatePaymentStatus);
router.delete('/:id', protect, requireRestaurant, softDeleteOrder);

// GET /api/orders - Smart route supporting Admin or Restaurant Owner
router.get('/', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      if (decoded.type === 'admin') {
        return adminProtect(req, res, () => getAdminOrders(req, res, next));
      }
    } catch (_) {}
  }
  return protect(req, res, (err) => {
    if (err) return next(err);
    requireRestaurant(req, res, () => getHistoricalOrders(req, res, next));
  });
});

export default router;
