/**
 * Testimonial Routes
 *
 * GET /api/testimonials - Get all testimonials (public: active only, admin: all)
 * POST /api/testimonials - Create testimonial (admin)
 * PUT /api/testimonials/:id - Update testimonial (admin)
 * DELETE /api/testimonials/:id - Delete testimonial (admin)
 */

import express from 'express';
import {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../controllers/testimonialController.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuthenticate, getAllTestimonials);

router.post('/', authenticate, authorize('super_admin', 'editor'), createTestimonial);
router.put('/:id', authenticate, authorize('super_admin', 'editor'), updateTestimonial);
router.delete('/:id', authenticate, authorize('super_admin', 'editor'), deleteTestimonial);

export default router;
