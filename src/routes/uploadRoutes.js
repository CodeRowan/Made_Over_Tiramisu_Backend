/**
 * Upload Routes
 *
 * POST /api/upload - Upload single image (admin)
 * POST /api/upload/multiple - Upload multiple images (admin)
 * POST /api/upload/metadata - Get image metadata (admin)
 * GET /api/upload/video-config - Cloudinary config for direct video uploads (admin)
 * POST /api/upload/log - Log a direct video upload to the audit trail (admin)
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import {
  uploadImageFile,
  uploadMultipleImages,
  getImageMetadata,
  getVideoUploadConfig,
  logVideoUpload,
} from '../controllers/uploadController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use system temp directory
    cb(null, process.env.UPLOAD_DIR || '/tmp');
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueName = `${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter - accept images and video files
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/ogg',
    'video/3gpp',
    'video/x-matroska',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Only image files (jpeg, png, webp, gif) and video files (mp4, webm, mov, ogg, etc.) are allowed'),
      false
    );
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
});

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('super_admin', 'editor'));

// Upload routes
router.post('/', upload.single('file'), uploadImageFile);
router.post('/multiple', upload.array('files', 10), uploadMultipleImages);
router.post('/metadata', getImageMetadata);

// Config for direct browser video uploads to Cloudinary (bypasses Vercel's
// serverless request-body limit, so large videos don't fail with "payload too large")
router.get('/video-config', getVideoUploadConfig);

// Audit log entry for direct (browser-to-Cloudinary) video uploads
router.post('/log', logVideoUpload);

export default router;
