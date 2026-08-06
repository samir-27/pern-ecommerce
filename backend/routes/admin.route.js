import express from 'express';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import { getAdminOverview } from '../controllers/admin.controller.js';

const router = express.Router();

router.get('/overview', protectRoute, adminRoute, getAdminOverview);

export default router;
