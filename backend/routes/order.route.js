import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { createPaymentOrder, getMyOrders, verifyPayment } from '../controllers/order.controller.js';


const router = express.Router();

router.post('/payment/order', protectRoute, createPaymentOrder);
router.post('/payment/verify', protectRoute, verifyPayment);
router.get('/myorders', protectRoute, getMyOrders);

export default router;