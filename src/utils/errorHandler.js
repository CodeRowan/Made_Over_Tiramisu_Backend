/**
 * Custom Error Handler Class
 *
 * This class is used to standardize error responses across the API.
 * Instead of throwing random errors, we always use this class.
 *
 * Benefits:
 * - Consistent error format in API responses
 * - Easy to identify and debug errors
 * - Proper HTTP status codes
 */

class ApiError extends Error {
  /**
   * Create a new API Error
   *
   * @param {number} statusCode - HTTP status code (e.g., 400, 401, 500)
   * @param {string} message - Error message to display
   * @param {array} errors - Additional error details (optional)
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;

    // Capture the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;

/**
 * Common error types (for convenience)
 */
export const ErrorTypes = {
  // 400 - Client made a bad request
  BAD_REQUEST: (message = 'Bad Request') =>
    new ApiError(400, message),

  // 401 - User is not authenticated
  UNAUTHORIZED: (message = 'Unauthorized') =>
    new ApiError(401, message),

  // 403 - User is authenticated but not authorized
  FORBIDDEN: (message = 'Forbidden') =>
    new ApiError(403, message),

  // 404 - Resource not found
  NOT_FOUND: (message = 'Not Found') =>
    new ApiError(404, message),

  // 409 - Conflict (e.g., email already exists)
  CONFLICT: (message = 'Conflict') =>
    new ApiError(409, message),

  // 500 - Server error
  INTERNAL_SERVER_ERROR: (message = 'Internal Server Error') =>
    new ApiError(500, message),

  // Validation error
  VALIDATION_ERROR: (message = 'Validation Error', errors = []) =>
    new ApiError(400, message, errors),
};
