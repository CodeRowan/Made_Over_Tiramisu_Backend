/**
 * Cloudinary Configuration
 *
 * Cloudinary is used to store product and content images.
 *
 * Why Cloudinary?
 * - Easy image upload and storage
 * - Automatic image optimization
 * - CDN for fast delivery
 * - No need to manage server storage
 * - Free tier is generous for small projects
 *
 * Setup:
 * 1. Create account at https://cloudinary.com/
 * 2. Copy your Cloud Name, API Key, and API Secret
 * 3. Add them to .env file
 */

import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

/**
 * Configure Cloudinary with API credentials
 * These are read from environment variables for security
 */
export const initCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

/**
 * Verify Cloudinary is configured correctly
 * This checks if all required credentials are present
 */
export const verifyCloudinaryConfig = () => {
  // Initialize first
  initCloudinary();

  const { cloud_name, api_key, api_secret } = cloudinary.config();

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      'Cloudinary configuration is incomplete. Check your .env file.'
    );
  }

  logger.info('Cloudinary Configured');
};

export default cloudinary;
