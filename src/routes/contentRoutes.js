/**
 * Content Routes
 *
 * GET /api/content - Get all content sections (admin)
 * GET /api/content/:section - Get content by section (public)
 * PUT /api/content/:section - Update content (admin)
 * POST /api/content/init - Initialize all sections (super_admin)
 */

import express from 'express';
import {
  getContentBySection,
  getAllContent,
  updateContent,
  initializeContent,
} from '../controllers/contentController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route
router.get('/:section', getContentBySection);

// Admin routes
router.get('/', authenticate, getAllContent);
router.put('/:section', authenticate, authorize('super_admin', 'editor'), updateContent);

// Super admin only
router.post('/init', authenticate, authorize('super_admin'), initializeContent);

export default router;
