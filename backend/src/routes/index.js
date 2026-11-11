import { Router } from 'express';
import authRoutes from './authRoutes.js';
import restaurantRoutes from './restaurantRoutes.js';
import profileRoutes from './profileRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import menuRoutes from './menuRoutes.js';
import tableRoutes from './tableRoutes.js';
import orderRoutes from './orderRoutes.js';
import manualOrderRoutes from './manualOrderRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import adminRoutes from './adminRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import healthRoutes from './healthRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import restaurantPaymentRoutes from './restaurantPaymentRoutes.js';
import customerRoutes from './customerRoutes.js';
import {
  getPlatformRevenueStats,
  getPlatformSubscriptions,
  getPlatformInvoices,
} from '../controllers/adminController.js';
import { submitContactInquiry } from '../controllers/contactController.js';
import { adminProtect } from '../middleware/adminAuthMiddleware.js';

const router = Router();

// Health, Readiness & Liveness Routes
router.use('/', healthRoutes);

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/restaurant/payments', restaurantPaymentRoutes);
router.use('/restaurant/settlements', restaurantPaymentRoutes);
router.use('/payment', paymentRoutes);
router.use('/payments', paymentRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/profile', profileRoutes);
router.use('/categories', categoryRoutes);
router.use('/menu', menuRoutes);
router.use('/tables', tableRoutes);
router.use('/orders', orderRoutes);
router.use('/order', orderRoutes); // Alias for customer ordering path
router.use('/manual-orders', manualOrderRoutes);
router.use('/customer', customerRoutes); // Customer public menu & categories APIs
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);

// Public Contact Form Endpoint (SMTP Dispatched to contactcraviti@gmail.com)
router.post('/contact', submitContactInquiry);

// Direct Route Aliases for Platform Revenue & Subscriptions (Tasks 5 & 9)
router.get('/revenue', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer')) {
    return adminProtect(req, res, () => getPlatformRevenueStats(req, res, next));
  }
  return getPlatformRevenueStats(req, res, next);
});

router.get('/subscriptions', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer')) {
    return adminProtect(req, res, () => getPlatformSubscriptions(req, res, next));
  }
  return getPlatformSubscriptions(req, res, next);
});

router.get('/billing/invoices', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer')) {
    return adminProtect(req, res, () => getPlatformInvoices(req, res, next));
  }
  return getPlatformInvoices(req, res, next);
});

// Admin Panel Dedicated Namespace
router.use('/admin', adminRoutes);

export default router;
