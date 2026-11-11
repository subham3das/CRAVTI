import { Router } from 'express';
import {
  createManualOrder,
  getManualOrders,
  getManualOrderById,
  updateManualOrder,
  markManualOrderPaid,
  cancelManualOrder,
  printManualOrderReceipt,
} from '../controllers/manualOrderController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';

const router = Router();

// Base middleware: All manual order routes require authentication, tenant isolation, and staff role authorization (owner, manager, cashier only; kitchen is blocked)
router.use(protect);
router.use(requireRestaurant);
router.use(authorizeRoles('owner', 'manager', 'cashier'));

// Routes
router.post('/', createManualOrder);
router.get('/', getManualOrders);
router.get('/:id', getManualOrderById);
router.patch('/:id', updateManualOrder);
router.patch('/:id/pay', markManualOrderPaid);
router.delete('/:id', cancelManualOrder);
router.post('/:id/print', printManualOrderReceipt);

export default router;

