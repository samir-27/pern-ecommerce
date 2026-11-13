import { asyncHandler } from '../utils/asyncHandler.js';
import * as adminService from '../services/admin.service.js';

export const getAdminOverview = asyncHandler(async (req, res) => {
    const overview = await adminService.getAdminOverviewService();
    res.json(overview);
});

export const getAdminProducts = asyncHandler(async (req, res) => {
    const products = await adminService.getAdminProductsService();
    res.json(products);
});

export const moderateProduct = asyncHandler(async (req, res) => {
    const product = await adminService.moderateProductService(req.user, req.params.id, req.body);
    res.json({
        message: 'Product moderation status updated',
        product
    });
});

export const getAdminOrders = asyncHandler(async (req, res) => {
    const orders = await adminService.getAdminOrdersService();
    res.json(orders);
});

export const getSellerApplications = asyncHandler(async (req, res) => {
    const apps = await adminService.getSellerApplicationsService();
    res.json(apps);
});

export const reviewSellerApplication = asyncHandler(async (req, res) => {
    const updatedApp = await adminService.reviewSellerApplicationService(req.user, req.params.id, req.body);
    res.json({
        message: `Application ${req.body.status} successfully`,
        application: updatedApp
    });
});

export const getAdminSellers = asyncHandler(async (req, res) => {
    const sellers = await adminService.getAdminSellersService();
    res.json(sellers);
});

export const updateSellerStatus = asyncHandler(async (req, res) => {
    const updated = await adminService.updateSellerStatusService(req.user, req.params.id, req.body);
    res.json({
        message: 'Seller status updated',
        seller: updated
    });
});

export const getCommissionRules = asyncHandler(async (req, res) => {
    const rules = await adminService.getCommissionRulesService();
    res.json(rules);
});

export const createOrUpdateCommissionRule = asyncHandler(async (req, res) => {
    res.json({
        message: 'Platform operates on a standard 5% commission rate across all brands.',
        commission_rate: 5.00
    });
});

export const getAdminPayouts = asyncHandler(async (req, res) => {
    const payouts = await adminService.getAdminPayoutsService();
    res.json(payouts);
});

export const updatePayoutStatus = asyncHandler(async (req, res) => {
    const payout = await adminService.updatePayoutStatusService(req.user, req.params.id, req.body);
    res.json({
        message: 'Payout status updated',
        payout
    });
});

export const getAdminReturns = asyncHandler(async (req, res) => {
    const returns = await adminService.getAdminReturnsService();
    res.json(returns);
});

export const updateReturnStatus = asyncHandler(async (req, res) => {
    const updated = await adminService.updateReturnStatusService(req.user, req.params.id, req.body);
    res.json({
        message: 'Return request updated',
        returnRequest: updated
    });
});

export const getAuditLogs = asyncHandler(async (req, res) => {
    const logs = await adminService.getAuditLogsService();
    res.json(logs);
});

export const getBuyers = asyncHandler(async (req, res) => {
    const buyers = await adminService.getBuyersService();
    res.json(buyers);
});

export const getBrandSellers = asyncHandler(async (req, res) => {
    const brands = await adminService.getBrandSellersService();
    res.json(brands);
});

export const updateBrandStatus = asyncHandler(async (req, res) => {
    const brand = await adminService.updateBrandStatusService(req.user, req.params.id, req.body);
    res.json({
        message: req.body.status === 'active' ? 'Brand verified and activated successfully' : 'Brand status updated successfully',
        brand
    });
});

export const deleteBrand = asyncHandler(async (req, res) => {
    await adminService.deleteBrandService(req.user, req.params.id);
    res.json({ message: 'Brand and its product listings have been permanently deleted' });
});

export const toggleBlockUser = asyncHandler(async (req, res) => {
    const user = await adminService.toggleBlockUserService(req.user, req.params.id);
    res.json({
        message: user.is_blocked ? 'User has been blocked successfully' : 'User has been unblocked successfully',
        user
    });
});
