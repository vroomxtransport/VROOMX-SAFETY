/**
 * Production-safe logger utility
 *
 * SECURITY: Prevents sensitive data from leaking via console.log in production.
 * - In development: All log levels are enabled
 * - In production: Only warn and error are enabled (info/debug are no-ops)
 *
 * Usage:
 *   const logger = require('./utils/logger');
 *   logger.info('User logged in', { userId: user._id });
 *   logger.error('Database connection failed', error);
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

// Sanitize objects to remove sensitive fields before logging
const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization', 'cookie', 'ssn', 'creditCard'];

const sanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (obj instanceof Error) {
    return {
      message: obj.message,
      stack: isDevelopment ? obj.stack : undefined,
      name: obj.name
    };
  }

  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }

  return sanitized;
};

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const sanitizedMeta = meta ? sanitize(meta) : '';
  return `[${timestamp}] [${level}] ${message}${sanitizedMeta ? ' ' + JSON.stringify(sanitizedMeta) : ''}`;
};

const logger = {
  /**
   * Debug level - only in development
   */
  debug: (message, meta) => {
    if (isDevelopment) {
      console.log(formatMessage('DEBUG', message, meta));
    }
  },

  /**
   * Info level - only in development
   */
  info: (message, meta) => {
    if (isDevelopment) {
      console.log(formatMessage('INFO', message, meta));
    }
  },

  /**
   * Warn level - always enabled
   */
  warn: (message, meta) => {
    console.warn(formatMessage('WARN', message, meta));
  },

  /**
   * Error level - always enabled, sanitizes stack traces in production
   */
  error: (message, meta) => {
    console.error(formatMessage('ERROR', message, meta));
  },

  /**
   * Cron job logging - prefixed for easy filtering
   */
  cron: (message, meta) => {
    const formattedMessage = `[Cron] ${message}`;
    if (isDevelopment) {
      console.log(formatMessage('CRON', formattedMessage, meta));
    } else if (meta instanceof Error || (meta && meta.error)) {
      // Always log cron errors in production
      console.error(formatMessage('CRON', formattedMessage, meta));
    }
  }
};

module.exports = logger;
