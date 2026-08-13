/**
 * Authentication Routes
 *
 * POST /api/auth/login - Login with email/password
 * POST /api/auth/register - Create new admin (super_admin only)
 * POST /api/auth/forgot-password - Request password reset
 * POST /api/auth/reset-password - Reset password with token
 * POST /api/auth/change-password - Change password (logged in)
 * GET /api/auth/me - Get current user info
 */

import express from 'express';
import {
  login,
  register,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser,
} from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Public routes (rate-limited: 5 attempts per 15 minutes per IP)
router.post('/login', authRateLimiter, login);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);

// Protected routes (require authentication)
router.post('/change-password', authenticate, changePassword);
router.get('/me', authenticate, getCurrentUser);

// Admin only routes
router.post('/register', authenticate, authorize('super_admin'), register);

export default router;
