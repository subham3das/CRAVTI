import { Router } from 'express';
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
import { protect } from '../middleware/authMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';

const router = Router();

// ==========================================
// Public Customer Ordering Routes (No Auth)
// ==========================================
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
router.get('/', protect, requireRestaurant, getHistoricalOrders);

export default router;
