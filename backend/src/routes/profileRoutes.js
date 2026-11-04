import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/', protect, getProfile);
router.put('/', protect, upload.single('coverImage'), updateProfile);

export default router;

