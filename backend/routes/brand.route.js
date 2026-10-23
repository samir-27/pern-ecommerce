import express from 'express';
import { protectRoute, brandRoute } from '../middleware/auth.middleware.js';
import {
    getBrandProfile,
    updateBrandProfile,
    getBrandOverview,
    getBrandProducts,
    createBrandProduct,
    updateBrandProduct,
    deleteBrandProduct,
    getBrandOrders,
    updateOrderFulfillment,
    getBrandAnalytics,
    getPublicBrands,
    getPublicBrandBySlug
} from '../controllers/brand.controller.js';

const router = express.Router();

// Public brand catalog & pages
router.get('/public/all', getPublicBrands);
router.get('/public/:slug', getPublicBrandBySlug);
router.get('/directory', getPublicBrands);

// Authenticated Brand Seller portal routes (strict brand isolation)
router.get('/profile', protectRoute, brandRoute, getBrandProfile);
router.put('/profile', protectRoute, brandRoute, updateBrandProfile);
router.get('/overview', protectRoute, brandRoute, getBrandOverview);
router.get('/products', protectRoute, brandRoute, getBrandProducts);
router.post('/products', protectRoute, brandRoute, createBrandProduct);
router.put('/products/:id', protectRoute, brandRoute, updateBrandProduct);
router.delete('/products/:id', protectRoute, brandRoute, deleteBrandProduct);
router.get('/orders', protectRoute, brandRoute, getBrandOrders);
router.put('/orders/:id/fulfill', protectRoute, brandRoute, updateOrderFulfillment);
router.get('/analytics', protectRoute, brandRoute, getBrandAnalytics);

export default router;
