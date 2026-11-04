import { Router } from 'express';
import { body } from 'express-validator';
import { signup, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validatorMiddleware.js';

const router = Router();

router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('phone').trim().notEmpty().withMessage('Mobile number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
    validateRequest,
  ],
  signup
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest,
  ],
  login
);

router.get('/me', protect, getMe);

export default router;

