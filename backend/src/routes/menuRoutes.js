import { Router } from 'express';
import { body } from 'express-validator';
import {
  getMenuItems,
  getMenuStats,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  duplicateMenuItem,
  toggleItemAvailability,
} from '../controllers/menuController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { validateRequest } from '../middleware/validatorMiddleware.js';

const router = Router();

router.use(protect, requireRestaurant);

router.get('/stats', getMenuStats);
router.get('/', getMenuItems);

router.post(
  '/',
  upload.single('image'),
  [
    body('itemName').trim().notEmpty().withMessage('Item name is required'),
    body('categoryId').trim().notEmpty().withMessage('Category is required'),
    body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
    body('discountType')
      .optional()
      .isIn(['none', 'percentage', 'flat'])
      .withMessage('Discount type must be none, percentage, or flat'),
    body('discountValue')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount value must be 0 or greater'),
    validateRequest,
  ],
  createMenuItem
);

router.put(
  '/:id',
  upload.single('image'),
  [
    body('price').optional().isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
    validateRequest,
  ],
  updateMenuItem
);

router.delete('/:id', deleteMenuItem);
router.post('/:id/duplicate', duplicateMenuItem);
router.patch('/:id/toggle-availability', toggleItemAvailability);

export default router;

