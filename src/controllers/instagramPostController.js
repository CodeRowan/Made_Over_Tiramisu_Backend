/**
 * Instagram Post Controller
 *
 * Manages the Instagram feed grid shown on the landing page:
 * - Get all posts (public - active only; admins see all)
 * - Create/update/delete post (admin)
 *
 * All admin operations are logged in ActivityLog
 */

import InstagramPost from '../models/InstagramPost.js';
import ActivityLog from '../models/ActivityLog.js';
import {
  validate,
  createInstagramPostSchema,
  updateInstagramPostSchema,
} from '../utils/validators.js';
import { ErrorTypes } from '../utils/errorHandler.js';
import { deleteImage, extractPublicIdFromUrl } from '../services/cloudinaryService.js';
import { emitUpdate } from '../realtime.js';

/**
 * Get all Instagram posts
 *
 * GET /api/instagram
 * Public: returns only active posts, sorted by order
 * Admin (valid token): returns all posts
 */
export const getAllInstagramPosts = async (req, res, next) => {
  try {
    const filter = req.user ? {} : { isActive: true };

    const posts = await InstagramPost.find(filter).sort({
      order: 1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Instagram post
 *
 * POST /api/instagram
 * Requires: Admin authentication
 */
export const createInstagramPost = async (req, res, next) => {
  try {
    const { error, value } = validate(createInstagramPostSchema, req.body);
    if (error) {
      throw ErrorTypes.VALIDATION_ERROR('Validation failed', error.details);
    }

    const post = await InstagramPost.create({
      ...value,
      createdBy: req.user._id,
    });

    await ActivityLog.create({
      'admin.id': req.user._id,
      'admin.name': req.user.name,
      'admin.email': req.user.email,
      action: 'create_instagram_post',
      resourceType: 'instagram_post',
      resourceId: post._id,
      changesSummary: 'Added an Instagram post',
      newValue: post.toObject(),
    });

    emitUpdate('instagram');

    res.status(201).json({
      success: true,
      message: 'Instagram post created successfully',
      post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Instagram post
 *
 * PUT /api/instagram/:id
 * Requires: Admin authentication
 */
export const updateInstagramPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error, value } = validate(updateInstagramPostSchema, req.body);
    if (error) {
      throw ErrorTypes.VALIDATION_ERROR('Validation failed', error.details);
    }

    const post = await InstagramPost.findById(id);
    if (!post) {
      throw ErrorTypes.NOT_FOUND('Instagram post not found');
    }

    const oldValue = post.toObject();

    if (value.image && oldValue.image && oldValue.image !== value.image) {
      try {
        const publicId = extractPublicIdFromUrl(oldValue.image);
        if (publicId) await deleteImage(publicId);
      } catch (imageError) {
        console.warn('Failed to delete old image:', imageError);
      }
    }

    Object.assign(post, value);
    await post.save();

    await ActivityLog.create({
      'admin.id': req.user._id,
      'admin.name': req.user.name,
      'admin.email': req.user.email,
      action: 'edit_instagram_post',
      resourceType: 'instagram_post',
      resourceId: post._id,
      changesSummary: 'Updated an Instagram post',
      oldValue,
      newValue: post.toObject(),
    });

    emitUpdate('instagram');

    res.status(200).json({
      success: true,
      message: 'Instagram post updated successfully',
      post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Instagram post
 *
 * DELETE /api/instagram/:id
 * Requires: Admin authentication
 */
export const deleteInstagramPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await InstagramPost.findById(id);
    if (!post) {
      throw ErrorTypes.NOT_FOUND('Instagram post not found');
    }

    const oldValue = post.toObject();

    if (post.image) {
      try {
        const publicId = extractPublicIdFromUrl(post.image);
        if (publicId) await deleteImage(publicId);
      } catch (imageError) {
        console.warn('Failed to delete image from Cloudinary:', imageError);
      }
    }

    await InstagramPost.findByIdAndDelete(id);

    await ActivityLog.create({
      'admin.id': req.user._id,
      'admin.name': req.user.name,
      'admin.email': req.user.email,
      action: 'delete_instagram_post',
      resourceType: 'instagram_post',
      resourceId: id,
      changesSummary: 'Deleted an Instagram post',
      oldValue,
    });

    emitUpdate('instagram');

    res.status(200).json({
      success: true,
      message: 'Instagram post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
