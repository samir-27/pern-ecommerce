import express from 'express';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import { getAdminOverview, getAdminProducts, getAdminOrders } from '../controllers/admin.controller.js';

const router = express.Router();

router.get('/overview', protectRoute, adminRoute, getAdminOverview);
router.get('/products', protectRoute, adminRoute, getAdminProducts);
router.get('/orders', protectRoute, adminRoute, getAdminOrders);

export default router;
