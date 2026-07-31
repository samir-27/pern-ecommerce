import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { createOrder, getMyOrders } from '../controllers/order.controller.js';


const router = express.Router();

router.post('/', protectRoute, createOrder);
router.get('/myorders', protectRoute, getMyOrders);

export default router;