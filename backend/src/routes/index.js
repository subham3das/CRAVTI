import { Router } from 'express';
import authRoutes from './authRoutes.js';
import restaurantRoutes from './restaurantRoutes.js';
import profileRoutes from './profileRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import menuRoutes from './menuRoutes.js';
import tableRoutes from './tableRoutes.js';
import orderRoutes from './orderRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import adminRoutes from './adminRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import paymentRoutes from './paymentRoutes.js';

import healthRoutes from './healthRoutes.js';

const router = Router();

// Health, Readiness & Liveness Routes
router.use('/', healthRoutes);

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/payment', paymentRoutes);
router.use('/payments', paymentRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/profile', profileRoutes);
router.use('/categories', categoryRoutes);
router.use('/menu', menuRoutes);
router.use('/tables', tableRoutes);
router.use('/orders', orderRoutes);
router.use('/order', orderRoutes); // Alias for customer ordering path
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
