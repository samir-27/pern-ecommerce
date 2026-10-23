import express from 'express';
import { protectRoute, sellerRoute, superAdminRoute } from '../middleware/auth.middleware.js';
import {
    productListingAssistant,
    shoppingAssistant,
    getRecommendations,
    getInventoryForecast,
    adminAnalyticsAssistant,
    customerSupportAssistant
} from '../controllers/ai.controller.js';

const router = express.Router();

// Public / Buyer AI endpoints
router.post('/shop-assistant', shoppingAssistant);
router.get('/recommendations', getRecommendations);
router.post('/support', customerSupportAssistant);

// Seller AI endpoints
router.post('/product-assistant', protectRoute, sellerRoute, productListingAssistant);
router.get('/inventory-forecast', protectRoute, sellerRoute, getInventoryForecast);

// Admin AI analytics
router.post('/admin-analytics', protectRoute, superAdminRoute, adminAnalyticsAssistant);

export default router;
