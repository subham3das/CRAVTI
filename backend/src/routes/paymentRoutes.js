import { Router } from 'express';
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

// Single Payment Inspection (Restaurant or Admin)
router.get('/:paymentId', protect, getPaymentById);

export default router;

