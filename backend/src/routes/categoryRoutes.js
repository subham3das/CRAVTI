import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';
import { validateRequest } from '../middleware/validatorMiddleware.js';

const router = Router();

// Protect all category routes and resolve tenant restaurantId
router.use(protect, requireRestaurant);

router.get('/', getCategories);

router.post(
  '/',
  [
    body('categoryName')
      .trim()
      .notEmpty()
      .withMessage('Category name is required')
      .isLength({ max: 60 })
      .withMessage('Category name cannot exceed 60 characters'),
    validateRequest,
  ],
  createCategory
);

router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.patch('/:id/toggle-status', toggleCategoryStatus);

export default router;

