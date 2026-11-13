import multer from 'multer';
import { ApiError } from '../middleware/error.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as productService from '../services/product.service.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (/^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new ApiError(400, 'Invalid file type. Only JPEG, PNG, WEBP, and AVIF images are permitted.'));
        }
    }
});

export const uploadProductImages = upload.array('images', 50);

export const getCategories = asyncHandler(async (req, res) => {
    const categories = await productService.getCategoriesService();
    res.json(categories);
});

export const getColors = asyncHandler(async (req, res) => {
    const colors = await productService.getColorsService();
    res.json(colors);
});

export const getProducts = asyncHandler(async (req, res) => {
    const result = await productService.getProductsService(req.query);
    res.json(result);
});

export const getProductById = asyncHandler(async (req, res) => {
    const product = await productService.getProductByIdService(req.params.id);
    res.json(product);
});

export const createProduct = asyncHandler(async (req, res) => {
    const product = await productService.createProductService({
        user: req.user,
        body: req.body,
        files: req.files
    });
    res.status(201).json({
        message: 'Product created successfully',
        product
    });
});

export const updateProduct = asyncHandler(async (req, res) => {
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

export const deleteProduct = asyncHandler(async (req, res) => {
    await productService.deleteProductService({
        user: req.user,
        productId: req.params.id
    });
    res.status(200).json({ message: 'Product cleaned up successfully' });
});

export const getProductReviews = asyncHandler(async (req, res) => {
    const reviews = await productService.getProductReviewsService(req.params.id);
    res.json(reviews);
});

export const createProductReview = asyncHandler(async (req, res) => {
    const review = await productService.createProductReviewService({
        user: req.user,
        productId: req.params.id,
        body: req.body
    });
    res.status(201).json(review);
});
