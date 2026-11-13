import { asyncHandler } from '../utils/asyncHandler.js';
import * as sellerService from '../services/seller.service.js';

export const applySeller = asyncHandler(async (req, res) => {
    const application = await sellerService.applySellerService(req.user.id, req.body);
    res.status(201).json({
        message: 'Application submitted successfully. A Super Admin will review your credentials.',
        application
    });
});

export const getApplicationStatus = asyncHandler(async (req, res) => {
    const status = await sellerService.getApplicationStatusService(req.user);
    res.json(status);
});

export const getMyStore = asyncHandler(async (req, res) => {
    const store = await sellerService.getMyStoreService(req.user);
    res.json(store);
});

export const updateMyStore = asyncHandler(async (req, res) => {
    const store = await sellerService.updateMyStoreService(req.user, req.body);
    res.json({ message: 'Store profile updated', store });
});

export const getSellerOverview = asyncHandler(async (req, res) => {
    const overview = await sellerService.getSellerOverviewService(req.sellerStore?.id, req.user.id);
    res.json(overview);
});

export const getSellerProducts = asyncHandler(async (req, res) => {
    const products = await sellerService.getSellerProductsService(req.sellerStore?.id, req.user.id);
    res.json(products);
});

export const getSellerOrders = asyncHandler(async (req, res) => {
    const orders = await sellerService.getSellerOrdersService(req.sellerStore?.id, req.user.id);
    res.json(orders);
});

export const updateOrderFulfillment = asyncHandler(async (req, res) => {
    const updated = await sellerService.updateSellerOrderFulfillmentService(req.user, req.sellerStore?.id, req.params.id, req.body);
    res.json({
        message: 'Fulfillment updated successfully',
        sellerOrder: updated
    });
});

export const getSellerPayouts = asyncHandler(async (req, res) => {
    const payouts = await sellerService.getSellerPayoutsService(req.sellerStore?.id, req.user.id);
    res.json(payouts);
});

export const requestPayout = asyncHandler(async (req, res) => {
    const payout = await sellerService.requestPayoutService(req.user, req.sellerStore?.id, req.body);
    res.status(201).json({
        message: 'Payout request logged successfully.',
        payout
    });
});

export const getAllStores = asyncHandler(async (req, res) => {
    const stores = await sellerService.getAllStoresService();
    res.json(stores);
});

export const getPublicStoreBySlug = asyncHandler(async (req, res) => {
    const data = await sellerService.getPublicStoreBySlugService(req.params.slug);
    res.json(data);
});
