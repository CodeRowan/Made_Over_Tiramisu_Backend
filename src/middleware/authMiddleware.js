/**
 * Authentication Middleware
 *
 * This middleware runs BEFORE protected routes to verify the user is logged in.
 *
 * Process:
 * 1. Extract JWT token from Authorization header
 * 2. Verify the token is valid
 * 3. Get the user from the database
 * 4. Attach user info to request object
 * 5. Allow route handler to proceed
 *
 * If token is missing or invalid, return 401 Unauthorized
 */

import User from '../models/User.js';
import { verifyToken, extractTokenFromHeader } from '../utils/tokenUtils.js';
import ApiError, { ErrorTypes } from '../utils/errorHandler.js';

/**
 * Verify user is authenticated
 *
 * Usage in routes:
 * router.get('/protected-route', authenticate, routeHandler)
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    // Verify token is valid
    const decoded = verifyToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw ErrorTypes.UNAUTHORIZED('User not found');
    }

    if (!user.isActive) {
      throw ErrorTypes.UNAUTHORIZED('User account is disabled');
    }

    // Attach user info to request for use in route handlers
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Attach user to request if a valid token is present, but never block the
 * request if it's missing or invalid.
 *
 * Usage: lets public listing routes return admin-only data (e.g. inactive
 * products) when called with a valid admin token, while staying public.
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (user && user.isActive) {
      req.user = user;
      req.token = token;
    }
  } catch (error) {
    // Invalid/missing token — proceed as a public request
  }

  next();
};

/**
 * Check if user has required role
 *
 * Usage in routes:
 * router.delete('/admin-only', authenticate, authorize('super_admin'), handler)
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // User is attached by authenticate middleware
      if (!req.user) {
        throw ErrorTypes.UNAUTHORIZED('User not authenticated');
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        throw ErrorTypes.FORBIDDEN(
          `This action requires one of these roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
