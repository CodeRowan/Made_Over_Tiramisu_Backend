/**
 * Cloudinary Service
 *
 * Handles image uploads and transformations using Cloudinary.
 *
 * What this does:
 * - Upload product images
 * - Upload content images
 * - Auto-optimize images (compression, format)
 * - Generate image URLs
 * - Delete images
 *
 * Why Cloudinary?
 * - Handles image optimization automatically
 * - Provides CDN for fast delivery
 * - Free tier is generous (10GB)
 * - Easy API integration
 */

import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import ApiError, { ErrorTypes } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * Upload an image to Cloudinary
 *
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder (e.g., 'products', 'content')
 * @param {string} publicId - Optional custom public ID
 * @returns {object} - Image data from Cloudinary
 */
export const uploadImage = async (filePath, folder = 'mad-over-tiramisu', publicId = null) => {
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw ErrorTypes.BAD_REQUEST('File not found');
    }

    // Upload options
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',
    };

    // Add custom public ID if provided
    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    // Delete local file after successful upload
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      logger.warn({ err: error }, 'Could not delete local file');
    }

    let thumbnailUrl = result.secure_url;
    if (result.resource_type === 'video') {
      try {
        thumbnailUrl = cloudinary.url(result.public_id, {
          resource_type: 'video',
          format: 'jpg',
          secure: true,
        });
      } catch (e) {
        thumbnailUrl = result.secure_url.replace(/\.[^/.]+$/, '.jpg');
      }
    }

    return {
      success: true,
      imageUrl: result.secure_url,
      videoUrl: result.resource_type === 'video' ? result.secure_url : null,
      thumbnailUrl: thumbnailUrl,
      resourceType: result.resource_type,
      publicId: result.public_id,
      cloudinaryId: result.id,
      size: result.bytes,
      width: result.width || null,
      height: result.height || null,
    };
  } catch (error) {
    logger.error({ err: error }, 'Cloudinary Upload Error');

    // Clean up local file if upload failed
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanupError) {
      logger.warn({ err: cleanupError }, 'Cleanup error');
    }

    throw ErrorTypes.INTERNAL_SERVER_ERROR('Failed to upload media file');
  }
};

/**
 * Unsigned upload preset for direct browser video uploads.
 *
 * Videos are often 50-100MB — far larger than Vercel's ~4.5MB serverless
 * request-body limit. To avoid "payload too large" errors, the admin panel
 * uploads videos DIRECTLY from the browser to Cloudinary using an unsigned
 * upload preset (no signature needed). This function creates that preset
 * once via Cloudinary's Admin API and is safe to call on every request.
 */
const VIDEO_UPLOAD_PRESET_NAME = 'mad-over-tiramisu-video';
const VIDEO_UPLOAD_FOLDER = 'mad-over-tiramisu/videos';

/**
 * Ensure the unsigned video upload preset exists and return its config.
 *
 * Idempotent: creates the preset on the first call, reuses it afterwards.
 *
 * @returns {Promise<{cloudName: string, presetName: string, folder: string}>}
 */
export const getOrCreateVideoUploadPreset = async () => {
  try {
    const { cloud_name: cloudName } = cloudinary.config();

    // Check existing presets to avoid duplicate creation
    const { presets = [] } = await cloudinary.api.upload_presets({
      max_results: 100,
    });
    const existing = presets.find((p) => p.name === VIDEO_UPLOAD_PRESET_NAME);

    if (!existing) {
      await cloudinary.api.create_upload_preset({
        name: VIDEO_UPLOAD_PRESET_NAME,
        unsigned: true,
        folder: VIDEO_UPLOAD_FOLDER,
        resource_type: 'auto',
        allowed_formats: ['mp4', 'webm', 'mov', 'avi', '3gp', 'mkv', 'ogg', 'ogv'],
      });
      console.log(`✅ Created unsigned upload preset: ${VIDEO_UPLOAD_PRESET_NAME}`);
    }

    return {
      cloudName,
      presetName: VIDEO_UPLOAD_PRESET_NAME,
      folder: VIDEO_UPLOAD_FOLDER,
    };
  } catch (error) {
    console.error('Video Upload Preset Error:', error);
    throw ErrorTypes.INTERNAL_SERVER_ERROR('Failed to configure video uploads');
  }
};

/**
 * Delete media (image or video) from Cloudinary
 *
 * @param {string} publicId - Cloudinary public ID of image or video
 * @param {string} resourceType - 'image' | 'video' | 'raw'
 */
export const deleteImage = async (publicId, resourceType = 'image') => {
  try {
    if (!publicId) {
      throw ErrorTypes.BAD_REQUEST('Public ID is required');
    }

    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

    if (result.result !== 'ok') {
      throw ErrorTypes.INTERNAL_SERVER_ERROR('Failed to delete media');
    }

    return {
      success: true,
      message: 'Media deleted successfully',
    };
  } catch (error) {
    logger.error({ err: error }, 'Cloudinary Delete Error');
    throw ErrorTypes.INTERNAL_SERVER_ERROR('Failed to delete media');
  }
};

/**
 * Generate optimized image URL with transformations
 *
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Transformation options
 * @returns {string} - Transformed image URL
 */
export const getOptimizedImageUrl = (publicId, options = {}) => {
  try {
    const defaultOptions = {
      quality: 'auto',
      fetch_format: 'auto',
    };

    const merged = { ...defaultOptions, ...options };

    return cloudinary.url(publicId, merged);
  } catch (error) {
    logger.error({ err: error }, 'URL Generation Error');
    throw ErrorTypes.INTERNAL_SERVER_ERROR('Failed to generate image URL');
  }
};

/**
 * Extract public ID from Cloudinary URL
 *
 * @param {string} url - Full Cloudinary URL
 * @returns {string} - Public ID
 */
export const extractPublicIdFromUrl = (url) => {
  try {
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234/folder/public_id.ext
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[1] : null;
  } catch (error) {
    logger.error({ err: error }, 'Public ID Extract Error');
    return null;
  }
};
