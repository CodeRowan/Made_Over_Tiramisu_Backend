/**
 * Product Routes
 *
 * GET /api/products - Get all products (public)
 * GET /api/products/:id - Get single product (public)
 * GET /api/products/search?q=... - Search products (public)
 * POST /api/products - Create product (admin)
 * PUT /api/products/:id - Update product (admin)
 * DELETE /api/products/:id - Delete product (admin)
 */

import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
} from '../controllers/productController.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (returns all products, including unavailable ones, when
// called with a valid admin token so the admin panel can manage them)
router.get('/', optionalAuthenticate, getAllProducts);
router.get('/search', searchProducts);
router.get('/:id', getProductById);

// Admin only routes
router.post('/', authenticate, authorize('super_admin', 'editor'), createProduct);
router.put('/:id', authenticate, authorize('super_admin', 'editor'), updateProduct);
router.delete('/:id', authenticate, authorize('super_admin', 'editor'), deleteProduct);

export default router;
