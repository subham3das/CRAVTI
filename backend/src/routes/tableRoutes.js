import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';
import {
  getTables,
  getTableStats,
  createTable,
  bulkCreateTables,
  updateTable,
  deleteTable,
  toggleTableActive,
  regenerateQR,
  exportQRZip,
} from '../controllers/tableController.js';

const router = Router();
router.use(protect, requireRestaurant);

router.get('/stats', getTableStats);
router.get('/export', exportQRZip);
router.get('/', getTables);
router.post('/', createTable);
router.post('/bulk', bulkCreateTables);
router.put('/:id', updateTable);
router.delete('/:id', deleteTable);
router.patch('/:id/toggle', toggleTableActive);
router.post('/:id/regenerate', regenerateQR);

export default router;

