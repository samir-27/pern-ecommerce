import express from 'express';
import { protectRoute, sellerRoute, superAdminRoute } from '../middleware/auth.middleware.js';
import {
    productListingAssistant,
    shoppingAssistant,
    getRecommendations,
    getInventoryForecast,
    adminAnalyticsAssistant,
    customerSupportAssistant,
    sellerSalesAnalysis,
    adminSalesAnalysis,
    sellerChatAssistant,
    adminChatAssistant
} from '../controllers/ai.controller.js';

const router = express.Router();

// Public / Buyer AI endpoints
router.post('/shop-assistant', shoppingAssistant);
router.get('/recommendations', getRecommendations);
router.post('/support', customerSupportAssistant);

// Seller AI endpoints
router.post('/product-assistant', protectRoute, sellerRoute, productListingAssistant);
router.get('/inventory-forecast', protectRoute, sellerRoute, getInventoryForecast);
router.get('/seller-sales-analysis', protectRoute, sellerRoute, sellerSalesAnalysis);
router.post('/seller-chat', protectRoute, sellerRoute, sellerChatAssistant);

// Admin AI analytics
router.post('/admin-analytics', protectRoute, superAdminRoute, adminAnalyticsAssistant);
router.get('/admin-sales-analysis', protectRoute, superAdminRoute, adminSalesAnalysis);
router.post('/admin-chat', protectRoute, superAdminRoute, adminChatAssistant);

export default router;
