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
import { protect } from '../middleware/authMiddleware.js';
import { adminProtect } from '../middleware/adminAuthMiddleware.js';
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
  return getAdminPayments(req, res, next);
});

// Single Payment Inspection (Restaurant or Admin)
router.get('/:paymentId', protect, getPaymentById);

export default router;
