import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
    createPaymentOrder,
    getMyOrders,
    verifyPayment,
    createOrder,
    requestReturn,
    getMyReturns
} from '../controllers/order.controller.js';

const router = express.Router();

router.post('/payment/order', protectRoute, createPaymentOrder);
router.post('/payment/verify', protectRoute, verifyPayment);
router.post('/create', protectRoute, createOrder);
router.get('/myorders', protectRoute, getMyOrders);
router.post('/returns', protectRoute, requestReturn);
router.get('/returns/my', protectRoute, getMyReturns);

export default router;
