import { Router } from 'express';
import { body } from 'express-validator';
import { onboardRestaurant, getMyRestaurant } from '../controllers/restaurantController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { validateRequest } from '../middleware/validatorMiddleware.js';

const router = Router();

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

