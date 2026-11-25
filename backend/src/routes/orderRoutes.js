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
  callWaiter,
  requestWater,
  getWaterOptions,
  handleServiceRequest,
} from '../controllers/orderController.js';
import {
  getCustomerCategories,
  getCustomerMenuItems,
} from '../controllers/customerController.js';
import { getAdminOrders } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminProtect } from '../middleware/adminAuthMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';
import { verifySubscription } from '../middleware/subscriptionMiddleware.js';
import env from '../config/env.js';

const router = Router();

// ==========================================
// Customer / Public Order Tracking & Digital Menu (NO AUTH REQUIRED)
// ==========================================
router.get('/menu/:restaurantSlug/:tableId/:qrToken', getCustomerMenu);
router.get('/menu/:restaurantSlug/:tableId', getCustomerMenu);
router.get('/menu/:restaurantSlug', getCustomerMenu);
router.get('/menu', getCustomerMenu);

router.get('/categories/:restaurantSlug', getCustomerCategories);
router.get('/categories', getCustomerCategories);

router.get('/menu-items/:restaurantSlug', getCustomerMenuItems);
router.get('/menu-items', getCustomerMenuItems);

router.get('/cart', (req, res) => res.status(200).json({ success: true, cart: [] }));
router.get('/status/:id', getOrderById);
router.get('/status', (req, res) => res.status(200).json({ success: true, message: 'Ordering system active' }));

router.get('/active-session/:restaurantSlug/:tableId', getActiveCustomerOrder);
router.post('/place', placeOrder);
router.post('/', placeOrder);
router.get('/track/:id', getOrderById);
router.get('/detail/:id', getOrderById);
router.get('/receipt/:id', getOrderReceipt);
router.get('/:id/receipt', getOrderReceipt);

// Customer Table Service: Water & Waiter calls
router.get('/service/water-options/:restaurantSlug', getWaterOptions);
router.get('/service/water-options', getWaterOptions);
router.post('/service/waiter', callWaiter);
router.post('/service/water', requestWater);
router.post('/request-water', requestWater);
router.post('/:orderId/waiter', callWaiter);
router.post('/:orderId/water', requestWater);
router.post('/:orderId/request-water', requestWater);

// ==========================================
// Authenticated Restaurant Order Management
// ==========================================
router.get('/live', protect, requireRestaurant, verifySubscription, getLiveOrders);
router.get('/history', protect, requireRestaurant, verifySubscription, getHistoricalOrders);
router.get('/metrics', protect, requireRestaurant, verifySubscription, getOrderMetrics);
router.patch('/:id/status', protect, requireRestaurant, verifySubscription, updateOrderStatus);
router.patch('/:id/payment', protect, requireRestaurant, verifySubscription, updatePaymentStatus);
router.patch('/:orderId/service/:requestId', protect, requireRestaurant, verifySubscription, handleServiceRequest);
router.patch('/:orderId/service', protect, requireRestaurant, verifySubscription, handleServiceRequest);
router.delete('/:id', protect, requireRestaurant, verifySubscription, softDeleteOrder);

// GET /api/orders (Plural) - Smart route supporting Admin or Restaurant Owner
router.get('/', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  // If accessed via /order or /api/order (singular), this is the public customer ordering root
  if (req.baseUrl?.endsWith('/order')) {
    return res.status(200).json({ success: true, message: 'Craviti Customer Ordering API Active' });
  }

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
    requireRestaurant(req, res, () => verifySubscription(req, res, () => getHistoricalOrders(req, res, next)));
  });
});

export default router;
