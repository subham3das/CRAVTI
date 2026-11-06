import { Router } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import { onboardRestaurant, getMyRestaurant } from '../controllers/restaurantController.js';
import { getRestaurants } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminProtect } from '../middleware/adminAuthMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { validateRequest } from '../middleware/validatorMiddleware.js';
import env from '../config/env.js';

const router = Router();

// GET /api/restaurants - List restaurants (Admin or Directory)
router.get('/', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      if (decoded.type === 'admin') {
        return adminProtect(req, res, () => getRestaurants(req, res, next));
      }
    } catch (_) {}
  }
  return getRestaurants(req, res, next);
});

router.post(
  '/onboard',
  protect,
  upload.single('logo'),
  [
    body('restaurantName').trim().notEmpty().withMessage('Restaurant name is required'),
    body('ownerName').trim().notEmpty().withMessage('Owner name is required'),
    body('ownerPhone').trim().notEmpty().withMessage('Owner phone is required'),
    validateRequest,
  ],
  onboardRestaurant
);

router.get('/my-restaurant', protect, getMyRestaurant);

export default router;
