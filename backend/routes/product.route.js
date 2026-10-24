import express from 'express';
import { getProducts, getCategories, getProductById, createProduct, getColors, deleteProduct, updateProduct, uploadProductImages, getProductReviews, createProductReview } from '../controllers/product.controller.js';
import { protectRoute, sellerRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/colors', getColors);
router.get('/categories', getCategories);
router.get('/', getProducts);
router.post('/', protectRoute, sellerRoute, uploadProductImages, createProduct);
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', protectRoute, createProductReview);
router.get('/:id', getProductById);
router.put('/:id', protectRoute, sellerRoute, uploadProductImages, updateProduct);
router.delete('/:id', protectRoute, sellerRoute, deleteProduct);

export default router;
