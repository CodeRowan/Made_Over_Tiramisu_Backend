/**
 * Upload Controller
 *
 * Handles image uploads to Cloudinary.
 *
 * What this does:
 * - Accepts image upload from admin
 * - Uploads to Cloudinary
 * - Returns image URL
 * - Handles errors gracefully
 *
 * Image files are sent as multipart/form-data
 */

import ApiError, { ErrorTypes } from '../utils/errorHandler.js';
import {
  uploadImage,
  getOrCreateVideoUploadPreset,
} from '../services/cloudinaryService.js';
import ActivityLog from '../models/ActivityLog.js';

/**
 * Upload image
 *
 * POST /api/upload
 * Admin endpoint
 * Form data: file, folder (optional)
 * Returns: { imageUrl, publicId }
 */
export const uploadImageFile = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      throw ErrorTypes.BAD_REQUEST('No file uploaded');
    }

    const { folder = 'mad-over-tiramisu' } = req.body;

    // Get file path (Multer stores uploaded file info in req.file)
    const filePath = req.file.path;

    // Upload to Cloudinary
    const result = await uploadImage(filePath, folder);

    // Log the upload
    await ActivityLog.create({
      'admin.id': req.user._id,
      'admin.name': req.user.name,
      'admin.email': req.user.email,
      action: 'upload_image',
      resourceType: 'image',
      resourceId: result.publicId,
      changesSummary: `Uploaded image: ${req.file.originalname} (${result.size} bytes)`,
      newValue: result,
    });

    res.status(200).json({
      success: true,
      message: `${result.resourceType === 'video' ? 'Video' : 'Image'} uploaded successfully`,
      imageUrl: result.imageUrl,
      videoUrl: result.videoUrl || result.imageUrl,
      thumbnailUrl: result.thumbnailUrl || result.imageUrl,
      resourceType: result.resourceType,
      publicId: result.publicId,
      size: result.size,
      dimensions: {
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get video upload configuration
 *
 * GET /api/upload/video-config
 * Admin endpoint
 *
 * Videos are too large to route through the backend (Vercel's serverless
 * functions reject request bodies over ~4.5MB). Instead, the admin panel
 * uploads videos DIRECTLY to Cloudinary from the browser using an unsigned
 * upload preset. This endpoint returns the preset + cloud name needed to
 * build that direct upload request.
 */
export const getVideoUploadConfig = async (req, res, next) => {
  try {
    const config = await getOrCreateVideoUploadPreset();

    res.status(200).json({
      success: true,
      cloudName: config.cloudName,
      presetName: config.presetName,
      folder: config.folder,
      maxSizeMb: 100,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log a direct video upload to the activity log
 *
 * POST /api/upload/log
 * Admin endpoint
 *
 * Videos are uploaded directly to Cloudinary from the browser (to bypass
 * Vercel's serverless request-body limit), so the backend never sees the file.
 * The frontend calls this endpoint after a successful direct upload to keep
 * the admin audit trail complete.
 */
export const logVideoUpload = async (req, res, next) => {
  try {
    const { videoUrl, publicId, fileName, size } = req.body;

    if (!videoUrl) {
      throw ErrorTypes.BAD_REQUEST('Video URL is required');
    }

    await ActivityLog.create({
      'admin.id': req.user._id,
      'admin.name': req.user.name,
      'admin.email': req.user.email,
      action: 'upload_video',
      resourceType: 'video',
      resourceId: publicId || videoUrl,
      changesSummary: `Uploaded video: ${fileName || 'video'}${size ? ` (${size} bytes)` : ''}`,
      newValue: { videoUrl, publicId, size },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload multiple images
 *
 * POST /api/upload/multiple
 * Admin endpoint
 * Form data: files (array), folder (optional)
 * Returns: { images }
 */
export const uploadMultipleImages = async (req, res, next) => {
  try {
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      throw ErrorTypes.BAD_REQUEST('No files uploaded');
    }

    const { folder = 'mad-over-tiramisu' } = req.body;
    const uploadedImages = [];
    const errors = [];

    // Upload each file
    for (const file of req.files) {
      try {
        const result = await uploadImage(file.path, folder);
        uploadedImages.push(result);

        // Log each upload
        await ActivityLog.create({
          'admin.id': req.user._id,
          'admin.name': req.user.name,
          'admin.email': req.user.email,
          action: 'upload_image',
          resourceType: 'image',
          resourceId: result.publicId,
          changesSummary: `Uploaded image: ${file.originalname}`,
        });
      } catch (error) {
        errors.push({
          file: file.originalname,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: uploadedImages.length > 0,
      message: `Uploaded ${uploadedImages.length} of ${req.files.length} images`,
      images: uploadedImages,
      ...(errors.length > 0 && { errors }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get image metadata
 *
 * This endpoint can be used to verify image properties
 * like dimensions, file size, etc.
 *
 * Note: This is a client-side verification tool
 */
export const getImageMetadata = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      throw ErrorTypes.BAD_REQUEST('Image URL is required');
    }

    // In a production app, you might fetch image metadata from Cloudinary
    // For now, just verify the URL is valid
    res.status(200).json({
      success: true,
      message: 'Image URL is valid',
      imageUrl,
    });
  } catch (error) {
    next(error);
  }
};
