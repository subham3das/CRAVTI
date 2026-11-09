import { Router } from 'express';
import {
  getCustomerMenu,
  getCustomerCategories,
  getCustomerMenuItems,
} from '../controllers/customerController.js';

const router = Router();

// Menu routes
router.get('/menu/:restaurantSlug/:tableId/:qrToken', getCustomerMenu);
router.get('/menu/:restaurantSlug/:tableId', getCustomerMenu);
router.get('/menu/:restaurantSlug', getCustomerMenu);
router.get('/menu', getCustomerMenu);
router.get('/', getCustomerMenu);

// Category routes
router.get('/categories/:restaurantSlug', getCustomerCategories);
router.get('/categories', getCustomerCategories);

// Menu items routes
router.get('/menu-items/:restaurantSlug', getCustomerMenuItems);
router.get('/menu-items', getCustomerMenuItems);

export default router;

