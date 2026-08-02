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

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (require authentication)
router.post('/change-password', authenticate, changePassword);
router.get('/me', authenticate, getCurrentUser);

// Admin only routes
router.post('/register', authenticate, authorize('super_admin'), register);

export default router;
