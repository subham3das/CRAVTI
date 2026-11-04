import { Router } from 'express';
import {
  getRoot,
  getHealth,
  getReadiness,
  getLiveness,
} from '../controllers/healthController.js';

const router = Router();

router.get('/', getRoot);
router.get('/health', getHealth);
router.get('/ready', getReadiness);
router.get('/live', getLiveness);

export default router;

