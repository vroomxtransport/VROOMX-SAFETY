// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key - sanitize field names
  if (err.code === 11000) {
    const message = 'A record with this value already exists. Please use a different value.';
    error = new AppError(message, 400);
  }

  // Mongoose validation error - show password messages, sanitize others in production
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    const hasPasswordError = Object.keys(err.errors).includes('password');
    const message = (process.env.NODE_ENV === 'production' && !hasPasswordError)
      ? 'Validation error. Please check your input.'
      : messages.join('. ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired. Please log in again';
    error = new AppError(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async handler wrapper to eliminate try-catch blocks
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not found handler
const notFound = (req, res, next) => {
  const message = process.env.NODE_ENV === 'production'
    ? 'Not found'
    : `Not found - ${req.originalUrl}`;
  const error = new AppError(message, 404);
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFound
};
