/**
 * Instagram Post Routes
 *
 * GET /api/instagram - Get all posts (public: active only, admin: all)
 * POST /api/instagram - Create post (admin)
 * PUT /api/instagram/:id - Update post (admin)
 * DELETE /api/instagram/:id - Delete post (admin)
 */

import express from 'express';
import {
  getAllInstagramPosts,
  createInstagramPost,
  updateInstagramPost,
  deleteInstagramPost,
} from '../controllers/instagramPostController.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuthenticate, getAllInstagramPosts);

router.post('/', authenticate, authorize('super_admin', 'editor'), createInstagramPost);
router.put('/:id', authenticate, authorize('super_admin', 'editor'), updateInstagramPost);
router.delete('/:id', authenticate, authorize('super_admin', 'editor'), deleteInstagramPost);

export default router;
