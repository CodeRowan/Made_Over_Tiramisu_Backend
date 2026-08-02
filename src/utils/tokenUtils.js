/**
 * JWT Token Utilities
 *
 * These functions handle JWT (JSON Web Token) creation and verification.
 *
 * What is JWT?
 * - A token that proves a user is logged in
 * - Contains user information encoded in it
 * - Expires after a certain time
 * - Cannot be forged (cryptographically signed)
 *
 * Flow:
 * 1. User logs in with email/password
 * 2. Server creates a JWT token
 * 3. Token is sent to frontend
 * 4. Frontend stores token and includes it in every API request
 * 5. Backend verifies token to ensure request is from logged-in user
 */

import jwt from 'jsonwebtoken';
import ApiError, { ErrorTypes } from './errorHandler.js';

/**
 * Generate a JWT token for a user
 *
 * @param {string} userId - The user's MongoDB ID
 * @returns {string} - The JWT token
 */
export const generateToken = (userId) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '24h',
    });

    return token;
  } catch (error) {
    throw ErrorTypes.INTERNAL_SERVER_ERROR('Failed to generate token');
  }
};

/**
 * Verify a JWT token
 *
 * @param {string} token - The JWT token to verify
 * @returns {object} - The decoded token data { userId, iat, exp }
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ErrorTypes.UNAUTHORIZED('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw ErrorTypes.UNAUTHORIZED('Invalid token');
    }
    throw ErrorTypes.UNAUTHORIZED('Token verification failed');
  }
};

/**
 * Extract token from Authorization header
 *
 * Authorization header format: "Bearer <token>"
 *
 * @param {string} authHeader - The Authorization header value
 * @returns {string} - The extracted token
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ErrorTypes.UNAUTHORIZED('Missing or invalid authorization header');
  }

  return authHeader.substring(7); // Remove "Bearer " prefix
};
