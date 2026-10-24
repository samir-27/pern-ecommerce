import express from 'express';
import { protectRoute, superAdminRoute } from '../middleware/auth.middleware.js';
import {
    getAdminOverview,
    getAdminProducts,
    getAdminOrders,
    moderateProduct,
    getSellerApplications,
    reviewSellerApplication,
    getAdminSellers,
    updateSellerStatus,
    getCommissionRules,
    createOrUpdateCommissionRule,
    getAdminPayouts,
    updatePayoutStatus,
    getAdminReturns,
    updateReturnStatus,
    getAuditLogs,
    getBuyers,
    getBrandSellers,
    updateBrandStatus,
    deleteBrand,
    toggleBlockUser
} from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes strictly protected by superAdminRoute
router.get('/overview', protectRoute, superAdminRoute, getAdminOverview);
router.get('/products', protectRoute, superAdminRoute, getAdminProducts);
router.put('/products/:id/moderation', protectRoute, superAdminRoute, moderateProduct);
router.get('/orders', protectRoute, superAdminRoute, getAdminOrders);

// Seller & Brand Management
router.get('/seller-applications', protectRoute, superAdminRoute, getSellerApplications);
router.put('/seller-applications/:id', protectRoute, superAdminRoute, reviewSellerApplication);
router.get('/sellers', protectRoute, superAdminRoute, getAdminSellers);
router.put('/sellers/:id', protectRoute, superAdminRoute, updateSellerStatus);
router.get('/brands', protectRoute, superAdminRoute, getBrandSellers);
router.put('/brands/:id', protectRoute, superAdminRoute, updateBrandStatus);
router.delete('/brands/:id', protectRoute, superAdminRoute, deleteBrand);
router.get('/buyers', protectRoute, superAdminRoute, getBuyers);
router.put('/buyers/:id/block', protectRoute, superAdminRoute, toggleBlockUser);
router.put('/users/:id/block', protectRoute, superAdminRoute, toggleBlockUser);

// Commission Rules & Payouts
router.get('/commissions', protectRoute, superAdminRoute, getCommissionRules);
router.post('/commissions', protectRoute, superAdminRoute, createOrUpdateCommissionRule);
router.get('/payouts', protectRoute, superAdminRoute, getAdminPayouts);
router.put('/payouts/:id', protectRoute, superAdminRoute, updatePayoutStatus);

// Returns & Disputes
router.get('/returns', protectRoute, superAdminRoute, getAdminReturns);
router.put('/returns/:id', protectRoute, superAdminRoute, updateReturnStatus);

// Audit Logs
router.get('/audit-logs', protectRoute, superAdminRoute, getAuditLogs);

export default router;
