/**
 * Demo Guard Middleware
 * Prevents demo users from modifying data (write operations)
 * Demo users can only perform read operations
 */

const demoGuard = (req, res, next) => {
  // Skip if not a demo user
  if (!req.user || !req.user.isDemo) {
    return next();
  }

  // Allow GET requests (read operations)
  if (req.method === 'GET') {
    return next();
  }

  // Allow specific safe POST endpoints for demo users
  const safeEndpoints = [
    '/api/auth/logout',
    '/api/auth/me',
    '/api/companies/switch',
    '/api/ai/', // Allow AI assistant queries
    '/api/fmcsa/csa-check', // Allow CSA lookups
  ];

  const isAllowed = safeEndpoints.some(endpoint => req.originalUrl.startsWith(endpoint));
  if (isAllowed) {
    return next();
  }

  // Block all other write operations for demo users
  return res.status(403).json({
    success: false,
    error: 'DEMO_READ_ONLY',
    message: 'Demo accounts are read-only. Create a free account to make changes.',
    isDemo: true
  });
};

module.exports = { demoGuard };
