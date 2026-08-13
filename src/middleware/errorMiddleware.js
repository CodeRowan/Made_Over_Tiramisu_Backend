/**
 * Error Handling Middleware
 *
 * This middleware catches ALL errors from routes and middleware
 * and sends them back to the client in a consistent format.
 *
 * This must be the LAST middleware registered in the app
 * (after all other routes and middleware)
 *
 * Error Flow:
 * 1. Error occurs in route handler
 * 2. Route handler calls next(error)
 * 3. This middleware catches it
 * 4. Sends formatted error response to client
 */

import ApiError from '../utils/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * Global error handler
 *
 * Express calls this automatically when an error is passed to next()
 * Four parameters are required (even if not all used) for Express to recognize it as error handler
 */
export const errorHandler = (err, req, res, next) => {
  // Default to 500 server error if no status code
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Handle Joi validation errors
  if (err.isJoi) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
  }

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `A user with this ${field} already exists`;
  }

  // Handle MongoDB validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));
  }

  // Handle MongoDB cast error (invalid ID format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Log error for debugging, using the final (corrected) status code. 5xx
  // (unexpected/bug) logs at error level and is picked up by Sentry via
  // setupExpressErrorHandler in server.js; 4xx (expected — bad input, auth,
  // not found) logs at warn level so it doesn't drown out real errors or
  // trigger Sentry alerts.
  const logPayload = {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message,
    errors,
    stack: err.stack,
  };
  if (statusCode >= 500) {
    logger.error(logPayload, 'Request failed');
  } else {
    logger.warn(logPayload, 'Request rejected');
  }

  // Send error response to client
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(errors.length > 0 && { errors }),
    // Only include error details in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 *
 * This catches requests to routes that don't exist
 * Should be registered AFTER all other routes
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};
