import express from 'express';
import { protectRoute, sellerRoute } from '../middleware/auth.middleware.js';
import {
    applySeller,
    getApplicationStatus,
    getMyStore,
    updateMyStore,
    getSellerOverview,
    getSellerProducts,
    getSellerOrders,
    updateOrderFulfillment,
    getSellerPayouts,
    requestPayout,
    getPublicStoreBySlug,
    getAllStores
} from '../controllers/seller.controller.js';

const router = express.Router();

// Public store endpoints
router.get('/public/all', getAllStores);
router.get('/public/:slug', getPublicStoreBySlug);
router.get('/stores', getAllStores);
router.get('/stores/:slug', getPublicStoreBySlug);

// Seller onboarding & status
router.post('/apply', protectRoute, applySeller);
router.get('/status', protectRoute, getApplicationStatus);

// Authenticated seller routes (Strict tenant isolation)
router.get('/store', protectRoute, sellerRoute, getMyStore);
router.put('/store', protectRoute, sellerRoute, updateMyStore);
router.get('/overview', protectRoute, sellerRoute, getSellerOverview);
router.get('/products', protectRoute, sellerRoute, getSellerProducts);
router.get('/orders', protectRoute, sellerRoute, getSellerOrders);
router.put('/orders/:id/fulfill', protectRoute, sellerRoute, updateOrderFulfillment);
router.get('/payouts', protectRoute, sellerRoute, getSellerPayouts);
router.post('/payouts/request', protectRoute, sellerRoute, requestPayout);

export default router;
