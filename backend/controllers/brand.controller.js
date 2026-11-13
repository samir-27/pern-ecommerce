import multer from 'multer';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as brandService from '../services/brand.service.js';
import * as productService from '../services/product.service.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

export const uploadBrandAssets = upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
]);

export const getPublicBrands = asyncHandler(async (req, res) => {
    const brands = await brandService.getPublicBrandsService();
    res.json(brands);
});

export const getPublicBrandBySlug = asyncHandler(async (req, res) => {
    const data = await brandService.getPublicBrandBySlugService(req.params.slug);
    res.json(data);
});

export const getBrandProfile = asyncHandler(async (req, res) => {
    const profile = await brandService.getBrandProfileService(req.user, req.brand);
    res.json(profile);
});

export const updateBrandProfile = asyncHandler(async (req, res) => {
    const brand = await brandService.updateBrandProfileService(req.user, req.brand, req.body, req.files);
    res.json({ message: 'Brand profile updated successfully', brand });
});

export const respondToCommissionProposal = asyncHandler(async (req, res) => {
    res.json({
        message: 'Platform commission is set to a static 5% marketplace take-rate for all brands.',
        commission_rate: 5.00
    });
});

export const getBrandOverview = asyncHandler(async (req, res) => {
    const overview = await brandService.getBrandOverviewService(req.brand.id, req.user.id);
    res.json(overview);
});

export const getBrandProducts = asyncHandler(async (req, res) => {
    const products = await brandService.getBrandProductsService(req.brand.id, req.user.id);
    res.json(products);
});

export const createBrandProduct = asyncHandler(async (req, res) => {
    const product = await productService.createProductService({
        user: req.user,
        body: req.body,
        files: req.files
    });
    res.status(201).json({
        message: 'Brand product listed successfully',
        product
    });
});

export const updateBrandProduct = asyncHandler(async (req, res) => {
    const product = await productService.updateProductService({
        user: req.user,
        productId: req.params.id,
        body: req.body,
        files: req.files
    });
    res.json({
        message: 'Product updated successfully',
        product
    });
});

export const deleteBrandProduct = asyncHandler(async (req, res) => {
    await productService.deleteProductService({
        user: req.user,
        productId: req.params.id
    });
    res.json({ message: 'Product deleted from brand catalog' });
});

export const getBrandOrders = asyncHandler(async (req, res) => {
    const orders = await brandService.getBrandOrdersService(req.brand.id, req.user.id);
    res.json(orders);
});

export const updateOrderFulfillment = asyncHandler(async (req, res) => {
    const updated = await brandService.updateBrandOrderFulfillmentService(req.user, req.brand.id, req.params.id, req.body);
    res.json({
        message: 'Fulfillment updated successfully',
        sellerOrder: updated
    });
});

export const getBrandAnalytics = asyncHandler(async (req, res) => {
    const analytics = await brandService.getBrandAnalyticsService(req.brand.id, req.user.id);
    res.json(analytics);
});
