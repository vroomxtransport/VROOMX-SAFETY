const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');

// Cache maintenance status for 30 seconds to avoid DB hits on every request
let cachedStatus = null;
let cacheExpiry = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds

async function getMaintenanceStatus() {
  const now = Date.now();
  if (cachedStatus !== null && now < cacheExpiry) {
    return cachedStatus;
  }

  try {
    const value = await SystemConfig.getValue('maintenance_mode', { enabled: false });
    cachedStatus = value;
    cacheExpiry = now + CACHE_TTL;
    return cachedStatus;
  } catch (err) {
    console.error('[Maintenance] Error checking maintenance status:', err.message);
    // On error, assume not in maintenance to avoid blocking all traffic
    return { enabled: false };
  }
}

// Paths that are always allowed through maintenance mode
const ALLOWED_PATHS = ['/api/admin', '/api/auth/login', '/health'];

function isAllowedPath(path) {
  return ALLOWED_PATHS.some(allowed => path.startsWith(allowed));
}

async function isSuperAdmin(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) return false;

    const token = authHeader.split(' ')[1];
    if (!token) return false;

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const user = await User.findById(decoded.id).select('isSuperAdmin').lean();
    return user?.isSuperAdmin === true;
  } catch {
    return false;
  }
}

const maintenanceMiddleware = async (req, res, next) => {
  // Always allow certain paths
  if (isAllowedPath(req.path)) {
    return next();
  }

  const status = await getMaintenanceStatus();

  if (!status || !status.enabled) {
    return next();
  }

  // Allow superadmins through
  if (await isSuperAdmin(req)) {
    return next();
  }

  return res.status(503).json({
    success: false,
    message: status.message || 'System is under maintenance. Please try again later.',
    code: 'MAINTENANCE_MODE'
  });
};

// Export the middleware and a cache-busting method
maintenanceMiddleware.bustCache = function() {
  cachedStatus = null;
  cacheExpiry = 0;
};

module.exports = maintenanceMiddleware;
