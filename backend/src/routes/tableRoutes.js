import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';
import {
  getTables,
  getTableStats,
  createTable,
  bulkCreateTables,
  bulkGenerateQRs,
  generateTableQR,
  updateTable,
  deleteTable,
  toggleTableActive,
  regenerateQR,
  exportQRZip,
} from '../controllers/tableController.js';

const router = Router();
router.use(protect, requireRestaurant);

// Statistical & Bulk operations
router.get('/stats', getTableStats);
router.get('/export', exportQRZip);
router.post('/bulk', bulkCreateTables);
router.post('/bulk-generate-qr', bulkGenerateQRs);
router.post('/qr/bulk', bulkGenerateQRs);

// Base CRUD & QR operations
router.get('/', getTables);
router.post('/', createTable);
router.post('/:id/qr', generateTableQR);
router.post('/:id/regenerate', regenerateQR);
router.put('/:id', updateTable);
router.delete('/:id', deleteTable);
router.patch('/:id/toggle', toggleTableActive);

export default router;
