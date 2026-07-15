/**
 * Global Error Handler Middleware
 * Handles all Express errors with proper HTTP status codes
 */

/**
 * Map of error names/codes to HTTP status codes
 */
const ERROR_STATUS_MAP = {
  // Mongoose errors
  ValidationError: 400,
  CastError: 400,
  MongoServerError: 409, // Duplicate key etc.
  MongoNetworkError: 503,

  // Custom app errors
  BadRequestError: 400,
  UnauthorizedError: 401,
  ForbiddenError: 403,
  NotFoundError: 404,
  ConflictError: 409,
  UnprocessableEntityError: 422,
  TooManyRequestsError: 429,
  InternalServerError: 500,
  ServiceUnavailableError: 503,

  // JWT
  JsonWebTokenError: 401,
  TokenExpiredError: 401,
  NotBeforeError: 401,

  // Multer
  MulterError: 400,
};

/**
 * Format Mongoose ValidationError details
 */
function formatValidationErrors(err) {
  if (err.name === 'ValidationError') {
    return Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));
  }
  return null;
}

/**
 * Get HTTP status from error
 */
function getStatusCode(err) {
  // Explicit status set on error
  if (err.statusCode) return err.statusCode;
  if (err.status) return err.status;

  // MongoDB duplicate key
  if (err.code === 11000) return 409;

  // Multer file size limit
  if (err.code === 'LIMIT_FILE_SIZE') return 413;

  // From error name map
  if (ERROR_STATUS_MAP[err.name]) return ERROR_STATUS_MAP[err.name];

  return 500;
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(err, statusCode) {
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return `Duplicate value for field: ${field}. This ${field} already exists.`;
  }

  // Mongoose CastError (invalid ObjectId etc.)
  if (err.name === 'CastError') {
    return `Invalid value for field '${err.path}': ${err.value}`;
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return 'File size exceeds the maximum allowed limit (50MB).';
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return 'Too many files uploaded at once.';
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return `Unexpected file field: ${err.field}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') return 'Invalid authentication token.';
  if (err.name === 'TokenExpiredError') return 'Authentication token has expired.';

  // Use the error's own message
  if (err.message) return err.message;

  // Generic fallback
  return statusCode >= 500 ? 'An internal server error occurred.' : 'An error occurred.';
}

/**
 * Global error handling middleware
 * Must have 4 parameters for Express to recognize it as an error handler
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = getStatusCode(err);
  const message = getErrorMessage(err, statusCode);
  const validationErrors = formatValidationErrors(err);
  const isDev = process.env.NODE_ENV === 'development';

  // Log all errors in development, only 5xx in production
  if (isDev || statusCode >= 500) {
    console.error(`[Error Handler] ${req.method} ${req.originalUrl}`);
    console.error(`  Status: ${statusCode}`);
    console.error(`  Message: ${message}`);
    if (isDev && err.stack) {
      console.error('  Stack:', err.stack);
    }
  }

  const responseBody = {
    success: false,
    message,
    statusCode,
    ...(validationErrors && { validationErrors }),
    ...(isDev && {
      error: {
        name: err.name,
        code: err.code,
        stack: err.stack,
      },
    }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  res.status(statusCode).json(responseBody);
}

/**
 * Create a custom error with a specific HTTP status code
 */
export function createError(message, statusCode = 500, code = null) {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (code) err.code = code;
  return err;
}

/**
 * Async route wrapper to catch promise rejections
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default errorHandler;
