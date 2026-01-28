const AuditLog = require('../models/AuditLog');

const auditService = {
  /**
   * Log an action. Fire-and-forget — never throws.
   *
   * @param {object} req - Express request (extracts user, company, IP)
   * @param {string} action - create|update|delete|login|logout|password_change|role_change|impersonate|invite|export|upload
   * @param {string} resource - driver|vehicle|violation|document|...
   * @param {string|ObjectId} resourceId - ID of affected record (optional for auth events)
   * @param {object} details - Additional context (changes, summary, etc.)
   */
  log(req, action, resource, resourceId, details) {
    try {
      const activeCompany = req.user?.companies?.find(c => c.isActive) || req.user?.companies?.[0];

      AuditLog.create({
        action,
        resource,
        resourceId: resourceId || undefined,
        userId: req.user?._id || req.user?.id,
        userEmail: req.user?.email,
        companyId: req.companyFilter?.companyId || req.activeCompanyId || activeCompany?.companyId || activeCompany?.id,
        details,
        ipAddress: req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress,
        userAgent: req.headers?.['user-agent'],
      }).catch(err => {
        console.error('[AuditService] Failed to write log:', err.message);
      });
    } catch (err) {
      console.error('[AuditService] Error creating audit log:', err.message);
    }
  },

  /**
   * Log an auth event (login, logout, password_change).
   * Works before req.user is set (e.g., login attempts).
   */
  logAuth(req, action, details) {
    try {
      AuditLog.create({
        action,
        resource: 'user',
        userId: details?.userId || req.user?._id || req.user?.id,
        userEmail: details?.email || req.user?.email,
        companyId: details?.companyId,
        details,
        ipAddress: req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress,
        userAgent: req.headers?.['user-agent'],
      }).catch(err => {
        console.error('[AuditService] Failed to write auth log:', err.message);
      });
    } catch (err) {
      console.error('[AuditService] Error creating auth log:', err.message);
    }
  },

  /**
   * Compute field-level diff between two plain objects.
   * Returns array of { field, from, to } for changed fields.
   * Skips internal fields (_id, __v, updatedAt, createdAt, password).
   */
  diff(before, after) {
    if (!before || !after) return null;

    const skipFields = new Set(['_id', '__v', 'updatedAt', 'createdAt', 'password', 'passwordResetToken', 'passwordResetExpires', 'emailVerificationToken', 'emailVerificationExpires']);
    const changes = [];

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      if (skipFields.has(key)) continue;

      const oldVal = JSON.stringify(before[key]);
      const newVal = JSON.stringify(after[key]);

      if (oldVal !== newVal) {
        changes.push({
          field: key,
          from: before[key],
          to: after[key],
        });
      }
    }

    return changes.length > 0 ? changes : null;
  },
};

module.exports = auditService;
