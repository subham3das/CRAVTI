import { Router } from 'express';
import { handleRazorpayWebhook } from '../controllers/subscriptionController.js';

const router = Router();

// Public Razorpay Webhook Endpoint (No JWT Auth)
router.post('/razorpay', handleRazorpayWebhook);

export default router;

