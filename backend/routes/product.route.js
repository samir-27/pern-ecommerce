import express from 'express';
import { getProducts, getCategories, getProductById, createProduct } from '../controllers/product.controller.js';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/categories', getCategories);
router.get('/', getProducts);
router.post('/', protectRoute, adminRoute, createProduct);
router.get('/:id', getProductById);

export default router;