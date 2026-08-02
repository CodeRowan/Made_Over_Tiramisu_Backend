/**
 * Authentication Controller
 *
 * Handles all authentication-related operations:
 * - Login
 * - Register (create new admin)
 * - Password reset request
 * - Password reset confirmation
 * - Change password
 * - Get current user
 *
 * This controller receives requests from routes,
 * validates input, calls services, and returns responses.
 */

import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import Owner from '../models/Owner.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import ActivityLog from '../models/ActivityLog.js';
import { generateToken } from '../utils/tokenUtils.js';
import { validate, loginSchema, changePasswordSchema, resetPasswordSchema, forgotPasswordSchema } from '../utils/validators.js';
import ApiError, { ErrorTypes } from '../utils/errorHandler.js';
import { sendPasswordResetEmail, sendAdminWelcomeEmail } from '../services/emailService.js';

/**
 * Login with email and password
 *
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { token, user }
 */
export const login = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = validate(loginSchema, req.body);
    if (error) {
      throw ErrorTypes.VALIDATION_ERROR(
        'Validation failed',
        error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        }))
      );
    }

    const { email, password } = value;

    // Find user by email and include password field (normally excluded)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw ErrorTypes.UNAUTHORIZED('Invalid email or password');
    }

    if (!user.isActive) {
      throw ErrorTypes.UNAUTHORIZED('Your account has been disabled');
    }

    // Compare passwords using bcryptjs
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      throw ErrorTypes.UNAUTHORIZED('Invalid email or password');
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Log the login action
    await ActivityLog.create({
      'admin.id': user._id,
      'admin.name': user.name,
      'admin.email': user.email,
      action: 'login',
      resourceType: 'user',
      resourceId: user._id,
      changesSummary: `Logged in successfully`,
    });

    // Return response without password
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new admin user
 *
 * POST /api/auth/register
 * Body: { email, password, name, role }
 * Requires: Super admin role
 * Returns: { user }
 */
export const register = async (req, res, next) => {
  try {
    // This endpoint should only be called by super admin
    // Check is done in route middleware

    const { email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ErrorTypes.CONFLICT(`User with email ${email} already exists`);
    }

    // Hash password with bcryptjs (10 salt rounds)
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      role: role || 'editor',
    });

    // Log the creation
    await ActivityLog.create({
      'admin.id': req.user._id,
      'admin.name': req.user.name,
      'admin.email': req.user.email,
      action: 'create_admin',
      resourceType: 'user',
      resourceId: newUser._id,
      changesSummary: `Created new admin: ${name} (${role || 'editor'})`,
    });

    // Send welcome email with temporary password
    try {
      await sendAdminWelcomeEmail(newUser.email, newUser.name, password);
    } catch (emailError) {
      console.warn('Welcome email failed to send:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 *
 * POST /api/auth/forgot-password
 * Body: { email }
 * Returns: { message }
 */
export const forgotPassword = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = validate(forgotPasswordSchema, req.body);
    if (error) {
      throw ErrorTypes.VALIDATION_ERROR('Validation failed');
    }

    const { email } = value;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists, a reset email will be sent',
      });
    }

    // Generate unique reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Save reset token with expiration (1 hour)
    const tokenDoc = await PasswordResetToken.create({
      userId: user._id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    // Generate reset link
    const resetLink = `${process.env.FRONTEND_URL}/admin/reset-password?token=${resetToken}`;

    // Send email
    try {
      await sendPasswordResetEmail(user.email, resetLink, user.name);
    } catch (emailError) {
      // Delete token if email fails
      await PasswordResetToken.deleteOne({ _id: tokenDoc._id });
      throw emailError;
    }

    // Log the password reset request
    await ActivityLog.create({
      'admin.id': user._id,
      'admin.name': user.name,
      'admin.email': user.email,
      action: 'password_reset_requested',
      resourceType: 'user',
      resourceId: user._id,
      changesSummary: `Password reset requested`,
    });

    res.status(200).json({
      success: true,
      message: 'If an account exists, a reset email will be sent',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 *
 * POST /api/auth/reset-password
 * Body: { token, newPassword, confirmPassword }
 * Returns: { message }
 */
export const resetPassword = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = validate(resetPasswordSchema, req.body);
    if (error) {
      throw ErrorTypes.VALIDATION_ERROR('Validation failed');
    }

    const { token, newPassword } = value;

    // Find reset token
    const tokenDoc = await PasswordResetToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }, // Not expired
    });

    if (!tokenDoc) {
      throw ErrorTypes.BAD_REQUEST('Invalid or expired reset token');
    }

    // Find user
    const user = await User.findById(tokenDoc.userId);

    if (!user) {
      throw ErrorTypes.NOT_FOUND('User not found');
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Mark token as used
    tokenDoc.used = true;
    tokenDoc.usedAt = new Date();
    await tokenDoc.save();

    // Log password change
    await ActivityLog.create({
      'admin.id': user._id,
      'admin.name': user.name,
      'admin.email': user.email,
      action: 'password_changed',
      resourceType: 'user',
      resourceId: user._id,
      changesSummary: `Password changed via reset token`,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password (while logged in)
 *
 * POST /api/auth/change-password
 * Body: { currentPassword, newPassword, confirmPassword }
 * Requires: Authentication
 * Returns: { message }
 */
export const changePassword = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = validate(changePasswordSchema, req.body);
    if (error) {
      throw ErrorTypes.VALIDATION_ERROR('Validation failed');
    }

    const { currentPassword, newPassword } = value;
    const userId = req.user._id;

    // Get user with password field
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw ErrorTypes.NOT_FOUND('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcryptjs.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw ErrorTypes.UNAUTHORIZED('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Log password change
    await ActivityLog.create({
      'admin.id': user._id,
      'admin.name': user.name,
      'admin.email': user.email,
      action: 'password_changed',
      resourceType: 'user',
      resourceId: user._id,
      changesSummary: `Password changed by user`,
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current logged-in user info
 *
 * GET /api/auth/me
 * Requires: Authentication
 * Returns: { user }
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw ErrorTypes.NOT_FOUND('User not found');
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
