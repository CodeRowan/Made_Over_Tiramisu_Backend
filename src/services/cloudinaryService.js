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
      console.warn('Could not delete local file:', error);
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
    console.error('Cloudinary Upload Error:', error);

    // Clean up local file if upload failed
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError);
    }

    throw ErrorTypes.INTERNAL_SERVER_ERROR('Failed to upload media file');
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
    console.error('Cloudinary Delete Error:', error);
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
    console.error('URL Generation Error:', error);
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
    console.error('Public ID Extract Error:', error);
    return null;
  }
};
