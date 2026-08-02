/**
 * Testimonial Controller
 *
 * Manages customer reviews shown on the landing page:
 * - Get all testimonials (public - active only; admins see all)
 * - Create/update/delete testimonial (admin)
 *
 * All admin operations are logged in ActivityLog
 */

import Testimonial from '../models/Testimonial.js';
import ActivityLog from '../models/ActivityLog.js';
import {
  validate,
  createTestimonialSchema,
  updateTestimonialSchema,
} from '../utils/validators.js';
import { ErrorTypes } from '../utils/errorHandler.js';
import { emitUpdate } from '../realtime.js';

/**
 * Get all testimonials
 *
 * GET /api/testimonials
 * Public: returns only active testimonials, sorted by order
 * Admin (valid token): returns all testimonials
 */
export const getAllTestimonials = async (req, res, next) => {
  try {
    const filter = req.user ? {} : { isActive: true };

    const testimonials = await Testimonial.find(filter).sort({
      order: 1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      testimonials,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create testimonial
 *
 * POST /api/testimonials
 * Requires: Admin authentication
 */
export const createTestimonial = async (req, res, next) => {
  try {
    const { error, value } = validate(createTestimonialSchema, req.body);
    if (error) {
      throw ErrorTypes.VALIDATION_ERROR('Validation failed', error.details);
    }

    const testimonial = await Testimonial.create({
      ...value,
      createdBy: req.user._id,
    });

    await ActivityLog.create({
      'admin.id': req.user._id,
      'admin.name': req.user.name,
      'admin.email': req.user.email,
      action: 'create_testimonial',
      resourceType: 'testimonial',
      resourceId: testimonial._id,
      changesSummary: `Added testimonial from ${testimonial.name}`,
      newValue: testimonial.toObject(),
    });

    emitUpdate('testimonials');

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      testimonial,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update testimonial
 *
 * PUT /api/testimonials/:id
 * Requires: Admin authentication
 */
export const updateTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error, value } = validate(updateTestimonialSchema, req.body);
    if (error) {
      throw ErrorTypes.VALIDATION_ERROR('Validation failed', error.details);
    }

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      throw ErrorTypes.NOT_FOUND('Testimonial not found');
    }

    const oldValue = testimonial.toObject();
    Object.assign(testimonial, value);
    await testimonial.save();

    await ActivityLog.create({
      'admin.id': req.user._id,
      'admin.name': req.user.name,
      'admin.email': req.user.email,
      action: 'edit_testimonial',
      resourceType: 'testimonial',
      resourceId: testimonial._id,
      changesSummary: `Updated testimonial from ${testimonial.name}`,
      oldValue,
      newValue: testimonial.toObject(),
    });

    emitUpdate('testimonials');

    res.status(200).json({
      success: true,
      message: 'Testimonial updated successfully',
      testimonial,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete testimonial
 *
 * DELETE /api/testimonials/:id
 * Requires: Admin authentication
 */
export const deleteTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      throw ErrorTypes.NOT_FOUND('Testimonial not found');
    }

    const oldValue = testimonial.toObject();
    await Testimonial.findByIdAndDelete(id);

    await ActivityLog.create({
      'admin.id': req.user._id,
      'admin.name': req.user.name,
      'admin.email': req.user.email,
      action: 'delete_testimonial',
      resourceType: 'testimonial',
      resourceId: id,
      changesSummary: `Deleted testimonial from ${oldValue.name}`,
      oldValue,
    });

    emitUpdate('testimonials');

    res.status(200).json({
      success: true,
      message: 'Testimonial deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
