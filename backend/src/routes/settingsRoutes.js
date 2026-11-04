import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  getBusinessHours,
  updateBusinessHours,
  getPaymentSettings,
  updatePaymentSettings,
  getReceiptByOrder,
} from '../controllers/settingsController.js';
import {
  getBankDetails,
  saveBankDetailsDraft,
  submitBankDetails,
  getBankStatus,
  uploadBankDocument,
} from '../controllers/bankDetailsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRestaurant } from '../middleware/tenantMiddleware.js';
import { uploadBankDoc } from '../middleware/uploadMiddleware.js';

const router = Router();

// All settings routes are tenant-isolated and require authentication
router.use(protect, requireRestaurant);

router.get('/', getSettings);
router.put('/', updateSettings);

router.get('/business-hours', getBusinessHours);
router.put('/business-hours', updateBusinessHours);

router.get('/payments', getPaymentSettings);
router.put('/payments', updatePaymentSettings);

router.get('/receipt/:orderId', getReceiptByOrder);

// Restaurant Bank Verification & Settlement Routes (Phase 4.1)
router.get('/bank-details', getBankDetails);
router.put('/bank-details', saveBankDetailsDraft);
router.post('/bank-details/submit', submitBankDetails);
router.get('/bank-details/status', getBankStatus);
router.post('/bank-details/upload-doc', uploadBankDoc.single('file'), uploadBankDocument);

export default router;

