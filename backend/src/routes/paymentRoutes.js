import { Router } from 'express';
import jwt from 'jsonwebtoken';
import {
  createPaymentOrder,
  verifyPayment,
  handlePaymentWebhook,
  getPaymentById,
  refundPayment,
  getGatewayStatus,
  testGatewayConnection,
  getAdminPayments,
} from '../controllers/paymentController.js';
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
import { adminProtect } from '../middleware/adminAuthMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';
import env from '../config/env.js';

const router = Router();

// ==========================================
// Customer / Public Payment Checkout Routes
// ==========================================
router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', handlePaymentWebhook);

// ==========================================
// Restaurant Owner Settings & Diagnostics
// ==========================================
router.get('/gateway-status', protect, getGatewayStatus);
router.post('/test-connection', protect, testGatewayConnection);
router.get('/summary', protect, requireRestaurant, getRestaurantPaymentsSummary);
router.get('/chart', protect, requireRestaurant, getRestaurantRevenueChart);
router.get('/methods', protect, requireRestaurant, getRestaurantPaymentMethods);
router.get('/settlements', protect, requireRestaurant, getRestaurantSettlementsHistory);
router.get('/settlements/history', protect, requireRestaurant, getRestaurantSettlementsHistory);
router.get('/refunds', protect, requireRestaurant, getRestaurantRefunds);
router.get('/failed', protect, requireRestaurant, getRestaurantFailedPayments);
router.get('/bank-details', protect, requireRestaurant, getRestaurantBankDetails);
router.get('/export', protect, requireRestaurant, exportRestaurantPaymentsCSV);

// ==========================================
// Admin Control Center Routes
// ==========================================
router.get('/admin/all', adminProtect, getAdminPayments);
router.post('/refund', adminProtect, refundPayment);

// Direct list payments route: GET /api/payments
router.get('/', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      if (decoded.type === 'admin') {
        return adminProtect(req, res, () => getAdminPayments(req, res, next));
      }
    } catch (_) {}
  }
  // Otherwise, route as restaurant authenticated request
  return protect(req, res, (err) => {
    if (err) return next(err);
    requireRestaurant(req, res, () => getRestaurantPaymentsList(req, res, next));
  });
});

// Single Payment Inspection (Restaurant or Admin)
router.get('/:paymentId', protect, getPaymentById);

export default router;
