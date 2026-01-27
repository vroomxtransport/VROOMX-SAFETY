const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, requireSuperAdmin } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// All routes require authentication
router.use(protect);

// Middleware: allow superadmin (all logs) or company admin/owner (own company only)
const requireAuditAccess = (req, res, next) => {
  if (req.user.isSuperAdmin) {
    return next();
  }

  // Determine role from active company membership
  const activeCompanyId = req.user.activeCompanyId?._id || req.user.activeCompanyId;
  const membership = req.user.companies?.find(
    c => String(c.companyId?._id || c.companyId) === String(activeCompanyId)
  );
  const role = membership?.role;

  if (role === 'admin' || role === 'owner') {
    req.auditCompanyId = activeCompanyId;
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'You do not have permission to view audit logs'
  });
};

router.use(requireAuditAccess);

// Build filter query from request params (shared by list and export)
function buildAuditQuery(req) {
  const { action, resource, userId, startDate, endDate, search } = req.query;
  const query = {};

  // Scope to company for non-superadmin users
  if (req.auditCompanyId) {
    query.companyId = req.auditCompanyId;
  }

  if (action) query.action = action;
  if (resource) query.resource = resource;
  if (userId) query.userId = userId;

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  if (search) {
    query.userEmail = { $regex: search, $options: 'i' };
  }

  return query;
}

// @route   GET /api/audit
// @desc    List audit logs with filtering and pagination
// @access  Private (superadmin or company admin/owner)
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sort = '-timestamp' } = req.query;
  const query = buildAuditQuery(req);

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('userId', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum),
    AuditLog.countDocuments(query)
  ]);

  res.json({
    success: true,
    count: logs.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    logs
  });
}));

// @route   GET /api/audit/export
// @desc    Export filtered audit logs as CSV
// @access  Private (superadmin or company admin/owner)
router.get('/export', asyncHandler(async (req, res) => {
  const query = buildAuditQuery(req);

  const logs = await AuditLog.find(query)
    .populate('userId', 'firstName lastName email')
    .sort('-timestamp')
    .lean();

  // Build CSV
  const headers = 'Timestamp,Action,Resource,Resource ID,User,Email,Details,IP Address';
  const rows = logs.map(log => {
    const userName = log.userId
      ? `${log.userId.firstName || ''} ${log.userId.lastName || ''}`.trim()
      : '';
    const email = log.userId?.email || log.userEmail || '';
    const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
    return [
      log.timestamp ? log.timestamp.toISOString() : '',
      log.action || '',
      log.resource || '',
      log.resourceId || '',
      userName,
      email,
      `"${details}"`,
      log.ipAddress || ''
    ].join(',');
  });

  const csv = [headers, ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
  res.send(csv);
}));

module.exports = router;
