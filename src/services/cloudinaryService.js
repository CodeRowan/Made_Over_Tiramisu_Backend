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
      // Auto-optimize for web
      quality: 'auto',
      fetch_format: 'auto',
      transformation: [
        {
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
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

    return {
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      cloudinaryId: result.id,
      size: result.bytes,
      width: result.width,
      height: result.height,
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

    throw ErrorTypes.INTERNAL_SERVER_ERROR('Failed to upload image');
  }
};

/**
 * Delete an image from Cloudinary
 *
 * @param {string} publicId - Cloudinary public ID of image
 */
export const deleteImage = async (publicId) => {
  try {
    if (!publicId) {
      throw ErrorTypes.BAD_REQUEST('Public ID is required');
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      throw ErrorTypes.INTERNAL_SERVER_ERROR('Failed to delete image');
    }

    return {
      success: true,
      message: 'Image deleted successfully',
    };
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    throw ErrorTypes.INTERNAL_SERVER_ERROR('Failed to delete image');
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
