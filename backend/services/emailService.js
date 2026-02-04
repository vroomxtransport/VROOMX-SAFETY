const { Resend } = require('resend');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const EmailLog = require('../models/EmailLog');

const RESEND_ENABLED = !!process.env.RESEND_API_KEY;
const resend = RESEND_ENABLED ? new Resend(process.env.RESEND_API_KEY) : null;

if (!RESEND_ENABLED) {
  console.warn('WARNING: Resend is not configured. Set RESEND_API_KEY to enable email.');
}

const FROM = process.env.EMAIL_FROM || 'VroomX Safety <noreply@vroomxsafety.com>';
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'support@vroomxsafety.com';
const FRONTEND_URL = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:3000';

// In-memory template cache
const templateCache = {};

/**
 * Load an HTML template from disk, caching in memory.
 * @param {string} name - Template filename without path (e.g. 'welcome')
 * @returns {string} Raw HTML string
 */
function loadTemplate(name) {
  if (templateCache[name]) {
    return templateCache[name];
  }

  const templatePath = path.join(__dirname, '..', 'templates', `${name}.html`);
  const html = fs.readFileSync(templatePath, 'utf8');
  templateCache[name] = html;
  return html;
}

/**
 * Render a template by loading it, wrapping in _layout.html, and replacing
 * all {{key}} placeholders with the provided variables.
 *
 * Always injects: frontendUrl, currentYear, unsubscribeUrl
 *
 * @param {string} name - Template name (without .html)
 * @param {object} variables - Key/value pairs for substitution
 * @returns {string} Rendered HTML
 */
function renderTemplate(name, variables = {}) {
  const layout = loadTemplate('_layout');
  const content = loadTemplate(name);

  // Merge content into layout
  let html = layout.replace('{{content}}', content);

  // Always-available variables
  const vars = {
    frontendUrl: FRONTEND_URL,
    currentYear: new Date().getFullYear().toString(),
    unsubscribeUrl: `${FRONTEND_URL}/app/settings`,
    ...variables,
  };

  // Replace all {{key}} placeholders
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    html = html.replace(regex, value != null ? String(value) : '');
  }

  return html;
}

const emailService = {
  /**
   * Core send method. Renders a template, sends via Resend, and logs the result.
   * NEVER throws -- returns null on error.
   *
   * @param {object} options
   * @param {string|string[]} options.to
   * @param {string} options.subject
   * @param {string} options.templateName
   * @param {object} [options.variables]
   * @param {string} [options.category]
   * @param {string} [options.userId]
   * @param {string} [options.companyId]
   * @param {object} [options.metadata]
   * @param {Array}  [options.attachments]
   * @returns {Promise<object|null>} Resend response or null
   */
  async send({ to, subject, templateName, variables = {}, category, userId, companyId, metadata, attachments }) {
    if (!RESEND_ENABLED) {
      return null;
    }

    try {
      const html = renderTemplate(templateName, variables);

      const payload = {
        from: FROM,
        to: Array.isArray(to) ? to : [to],
        reply_to: REPLY_TO,
        subject,
        html,
      };

      if (attachments && attachments.length > 0) {
        payload.attachments = attachments;
      }

      const result = await resend.emails.send(payload);

      // Resend SDK v2+ returns { data, error } without throwing
      if (result?.error) {
        const errMsg = result.error.message || JSON.stringify(result.error);
        console.error(`[EmailService] Resend rejected "${subject}" to ${to}:`, errMsg);
        try {
          await EmailLog.create({
            to: Array.isArray(to) ? to.join(', ') : to,
            from: FROM,
            subject,
            templateName,
            category,
            userId,
            companyId,
            metadata,
            status: 'failed',
            error: errMsg,
          });
        } catch (logErr) {
          console.error('[EmailService] Failed to write EmailLog:', logErr.message);
        }
        return null;
      }

      // Log success
      try {
        await EmailLog.create({
          to: Array.isArray(to) ? to.join(', ') : to,
          from: FROM,
          subject,
          templateName,
          category,
          userId,
          companyId,
          metadata,
          resendId: result?.data?.id || result?.id,
          status: 'sent',
        });
      } catch (logErr) {
        console.error('[EmailService] Failed to write EmailLog:', logErr.message);
      }

      return result;
    } catch (error) {
      console.error(`[EmailService] Failed to send email "${subject}" to ${to}:`, error.message);

      // Log failure
      try {
        await EmailLog.create({
          to: Array.isArray(to) ? to.join(', ') : to,
          from: FROM,
          subject,
          templateName,
          category,
          userId,
          companyId,
          metadata,
          status: 'failed',
          error: error.message,
        });
      } catch (logErr) {
        console.error('[EmailService] Failed to write EmailLog:', logErr.message);
      }

      return null;
    }
  },

  /**
   * Determine whether an email of a given category should be sent to a user,
   * based on user.emailPreferences.
   *
   * Transactional emails are always sent.
   *
   * @param {object} user - User document
   * @param {string} category - Email category
   * @returns {boolean}
   */
  shouldSend(user, category) {
    if (category === 'transactional') return true;
    if (!user.emailPreferences) return true;
    return user.emailPreferences[category] !== false;
  },

  // ---------------------------------------------------------------------------
  // Convenience methods
  // ---------------------------------------------------------------------------

  /**
   * Welcome email sent after registration.
   */
  async sendWelcome(user) {
    return this.send({
      to: user.email,
      subject: 'Welcome to VroomX Safety!',
      templateName: 'welcome',
      variables: {
        firstName: user.firstName,
        frontendUrl: FRONTEND_URL,
      },
      category: 'transactional',
      userId: user._id,
    });
  },

  /**
   * Email verification. Generates a token, stores a SHA-256 hash on the user
   * document, and emails the raw token in a verification link.
   */
  async sendEmailVerification(user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save({ validateBeforeSave: false });

    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${rawToken}`;

    return this.send({
      to: user.email,
      subject: 'Verify Your Email Address',
      templateName: 'email-verification',
      variables: {
        firstName: user.firstName,
        verificationUrl,
      },
      category: 'transactional',
      userId: user._id,
    });
  },

  /**
   * Password reset email.
   */
  async sendPasswordReset(user, resetToken) {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    return this.send({
      to: user.email,
      subject: 'Reset Your Password',
      templateName: 'password-reset',
      variables: {
        firstName: user.firstName,
        resetUrl,
      },
      category: 'transactional',
      userId: user._id,
    });
  },

  /**
   * Password reset confirmation (sent after password is successfully changed).
   */
  async sendPasswordResetConfirmation(user) {
    return this.send({
      to: user.email,
      subject: 'Your Password Has Been Changed',
      templateName: 'password-reset-confirmation',
      variables: {
        firstName: user.firstName,
      },
      category: 'transactional',
      userId: user._id,
    });
  },

  /**
   * Payment success / invoice receipt.
   */
  async sendPaymentSuccess(user, invoice) {
    if (!this.shouldSend(user, 'billing')) return null;

    const amount = (invoice.amount / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    return this.send({
      to: user.email,
      subject: 'Payment Received - Thank You!',
      templateName: 'payment-success',
      variables: {
        firstName: user.firstName,
        amount,
        planName: invoice.planName,
        invoiceDate: new Date(invoice.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      },
      category: 'billing',
      userId: user._id,
    });
  },

  /**
   * Payment failed notification.
   */
  async sendPaymentFailed(user) {
    if (!this.shouldSend(user, 'billing')) return null;

    return this.send({
      to: user.email,
      subject: 'Action Required: Payment Failed',
      templateName: 'payment-failed',
      variables: {
        firstName: user.firstName,
        updatePaymentUrl: `${FRONTEND_URL}/app/settings?tab=billing`,
      },
      category: 'billing',
      userId: user._id,
    });
  },

  /**
   * Trial ending reminder (uses user's trialDaysRemaining virtual).
   */
  async sendTrialEnding(user) {
    if (!this.shouldSend(user, 'billing')) return null;

    const daysRemaining = user.trialDaysRemaining || 3;

    return this.send({
      to: user.email,
      subject: `Your Trial Ends in ${daysRemaining} Day${daysRemaining === 1 ? '' : 's'}`,
      templateName: 'trial-ending',
      variables: {
        firstName: user.firstName,
        daysRemaining: String(daysRemaining),
        upgradeUrl: `${FRONTEND_URL}/app/settings?tab=billing`,
      },
      category: 'billing',
      userId: user._id,
    });
  },

  /**
   * Trial ending reminder with explicit options (for Stripe webhook).
   * @param {object} user - User document
   * @param {object} options - { trialEndDate, daysRemaining }
   */
  async sendTrialEndingReminder(user, options = {}) {
    if (!this.shouldSend(user, 'billing')) return null;

    const daysRemaining = options.daysRemaining || 3;
    const trialEndDate = options.trialEndDate
      ? new Date(options.trialEndDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null;

    return this.send({
      to: user.email,
      subject: `Your Trial Ends in ${daysRemaining} Day${daysRemaining === 1 ? '' : 's'}`,
      templateName: 'trial-ending',
      variables: {
        firstName: user.firstName,
        daysRemaining: String(daysRemaining),
        trialEndDate: trialEndDate || '',
        upgradeUrl: `${FRONTEND_URL}/app/settings?tab=billing`,
      },
      category: 'billing',
      userId: user._id,
    });
  },

  /**
   * Company invitation email.
   */
  async sendCompanyInvitation(invitation, company, inviter) {
    const acceptUrl = `${FRONTEND_URL}/accept-invitation?token=${invitation.token}`;

    return this.send({
      to: invitation.email,
      subject: `You've Been Invited to Join ${company.name} on VroomX Safety`,
      templateName: 'company-invitation',
      variables: {
        inviterName: `${inviter.firstName} ${inviter.lastName}`,
        companyName: company.name,
        acceptUrl,
      },
      category: 'transactional',
      companyId: company._id,
      metadata: { invitationId: invitation._id },
    });
  },

  /**
   * Compliance alert digest for a user / company.
   */
  async sendComplianceAlertDigest(user, company, alerts) {
    if (!this.shouldSend(user, 'compliance')) return null;

    const criticalAlerts = alerts.filter((a) => a.type === 'critical');
    const warningAlerts = alerts.filter((a) => a.type === 'warning');

    // Build HTML table rows
    const alertsTable = alerts
      .map(
        (a) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${a.type === 'critical' ? '🔴' : '🟡'} ${a.type.toUpperCase()}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${a.category}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${a.title}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${a.message}</td>
          </tr>`
      )
      .join('\n');

    return this.send({
      to: user.email,
      subject: `Compliance Alert Digest: ${criticalAlerts.length} Critical, ${warningAlerts.length} Warning`,
      templateName: 'compliance-alert-digest',
      variables: {
        firstName: user.firstName,
        companyName: company.name,
        criticalCount: String(criticalAlerts.length),
        warningCount: String(warningAlerts.length),
        alertsTable,
      },
      category: 'compliance',
      userId: user._id,
      companyId: company._id,
    });
  },

  /**
   * Send CSA Score Report email with PDF attachment.
   * Used by the free CSA checker lead magnet.
   *
   * @param {string} email - Recipient email
   * @param {object} carrier - Carrier info (legalName, dotNumber, mcNumber, etc.)
   * @param {object} basics - BASIC percentile scores
   * @param {string} aiAnalysis - AI-generated analysis text
   * @param {string} riskLevel - 'HIGH', 'MODERATE', or 'LOW'
   * @param {object} stats - { inspections: { last24Months }, crashes: { last24Months } }
   * @param {Buffer} [pdfBuffer] - Optional PDF attachment
   */
  async sendCSAReport(email, carrier, basics, aiAnalysis, riskLevel, stats, pdfBuffer) {
    // Risk level colors for email
    const riskColors = {
      HIGH: { bg: '#dc2626', text: '#ffffff' },
      MODERATE: { bg: '#f97316', text: '#ffffff' },
      LOW: { bg: '#16a34a', text: '#ffffff' }
    };

    // BASIC thresholds
    const thresholds = {
      unsafeDriving: 65,
      hosCompliance: 65,
      vehicleMaintenance: 80,
      controlledSubstances: 80,
      hazmatCompliance: 80,
      driverFitness: 80,
      crashIndicator: 65
    };

    // BASIC display names
    const basicNames = {
      unsafeDriving: 'Unsafe Driving',
      hosCompliance: 'HOS Compliance',
      vehicleMaintenance: 'Vehicle Maintenance',
      controlledSubstances: 'Controlled Substances',
      hazmatCompliance: 'Hazmat Compliance',
      driverFitness: 'Driver Fitness',
      crashIndicator: 'Crash Indicator'
    };

    // Helper to get status
    const getStatus = (score, threshold) => {
      if (score === null || score === undefined) return { bg: '#f3f4f6', text: '#6b7280', label: 'N/A' };
      if (score >= threshold) return { bg: '#fef2f2', text: '#dc2626', label: 'CRITICAL' };
      if (score >= threshold - 10) return { bg: '#fffbeb', text: '#f97316', label: 'WARNING' };
      return { bg: '#f0fdf4', text: '#16a34a', label: 'OK' };
    };

    // Generate BASIC rows HTML for email
    let basicsRows = '';
    for (const [key, name] of Object.entries(basicNames)) {
      const score = basics[key];
      const threshold = thresholds[key];
      const status = getStatus(score, threshold);
      const barWidth = score !== null && score !== undefined ? Math.min(score, 100) : 0;
      const barColor = score >= threshold ? '#dc2626' : score >= threshold - 10 ? '#f97316' : '#16a34a';

      basicsRows += `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">${name}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="120" style="padding-right: 8px;">
                  <div style="width: 120px; height: 16px; background: #f3f4f6; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${barWidth}%; height: 100%; background: ${barColor}; border-radius: 4px;"></div>
                  </div>
                </td>
                <td style="font-size: 14px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">${score !== null && score !== undefined ? score + '%' : 'N/A'}</td>
              </tr>
            </table>
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; background: ${status.bg}; color: ${status.text}; font-family: Arial, Helvetica, sans-serif;">${status.label}</span>
          </td>
        </tr>
      `;
    }

    const riskColor = riskColors[riskLevel] || riskColors.MODERATE;
    const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Format AI analysis as structured HTML
    const formatAiAnalysisHtml = (text) => {
      if (!text) return '<p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6;">No analysis available.</p>';

      // Split into sections based on emoji headers
      const sections = text.split(/(?=📊|⚠️|✅)/);
      let html = '';

      sections.forEach((section) => {
        section = section.trim();
        if (!section) return;

        // Detect section type and style accordingly
        if (section.startsWith('📊')) {
          // Quick Summary - blue section
          const content = section.replace(/^📊\s*QUICK SUMMARY\s*\n?/, '');
          html += `
            <div style="margin-bottom: 16px; padding: 12px; background: #eff6ff; border-radius: 6px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #1e40af; font-family: Arial, sans-serif;">📊 QUICK SUMMARY</p>
              <p style="margin: 0; font-size: 14px; color: #1e3a8a; line-height: 1.5; font-family: Arial, sans-serif;">${content.trim()}</p>
            </div>`;
        } else if (section.startsWith('⚠️')) {
          // Issues Found - amber section
          const content = section.replace(/^⚠️\s*ISSUES FOUND\s*\n?/, '');
          const bullets = content.trim().split('\n').filter(line => line.trim()).map(line => {
            const cleanLine = line.replace(/^[•\-]\s*/, '').trim();
            return `<li style="margin: 4px 0; font-size: 14px; color: #92400e;">${cleanLine}</li>`;
          }).join('');
          html += `
            <div style="margin-bottom: 16px; padding: 12px; background: #fffbeb; border-radius: 6px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #92400e; font-family: Arial, sans-serif;">⚠️ ISSUES FOUND</p>
              <ul style="margin: 0; padding-left: 20px; font-family: Arial, sans-serif;">${bullets}</ul>
            </div>`;
        } else if (section.startsWith('✅')) {
          // Action Plan - green section
          const content = section.replace(/^✅\s*YOUR 3-STEP ACTION PLAN\s*\n?/, '');
          const steps = content.trim().split('\n').filter(line => line.trim()).map(line => {
            const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
            return `<li style="margin: 6px 0; font-size: 14px; color: #166534;">${cleanLine}</li>`;
          }).join('');
          html += `
            <div style="margin-bottom: 0; padding: 12px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #22c55e;">
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #166534; font-family: Arial, sans-serif;">✅ YOUR 3-STEP ACTION PLAN</p>
              <ol style="margin: 0; padding-left: 20px; font-family: Arial, sans-serif;">${steps}</ol>
            </div>`;
        } else {
          // Fallback for unrecognized sections
          html += `<p style="margin: 0 0 12px 0; font-size: 14px; color: #78350f; line-height: 1.5; font-family: Arial, sans-serif;">${section.replace(/\n/g, '<br>')}</p>`;
        }
      });

      return html || '<p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6;">No analysis available.</p>';
    };

    const emailPayload = {
      to: email,
      subject: `CSA Score Report: ${carrier.legalName || 'Your Carrier'}`,
      templateName: 'csa-report',
      variables: {
        carrierName: carrier.legalName || 'Unknown Carrier',
        dotNumber: carrier.dotNumber || 'N/A',
        mcNumber: carrier.mcNumber || 'N/A',
        operatingStatus: carrier.operatingStatus || 'Unknown',
        fleetSize: carrier.fleetSize?.powerUnits || 'N/A',
        riskLevel,
        riskBg: riskColor.bg,
        riskText: riskColor.text,
        basicsRows,
        inspections24: stats?.inspections?.last24Months || 0,
        crashes24: stats?.crashes?.last24Months || 0,
        aiAnalysis: formatAiAnalysisHtml(aiAnalysis),
        reportDate,
      },
      category: 'report',
      metadata: { dotNumber: carrier.dotNumber, riskLevel },
    };

    if (pdfBuffer) {
      const safeName = (carrier.legalName || 'CSA_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
      emailPayload.attachments = [
        {
          filename: `CSA_Report_${safeName}_${carrier.dotNumber || 'unknown'}.pdf`,
          content: pdfBuffer,
        },
      ];
    }

    return this.send(emailPayload);
  },

  /**
   * Send a report with a PDF attachment.
   */
  async sendReport(user, reportName, pdfBuffer, toEmail) {
    if (!this.shouldSend(user, 'report')) return null;

    const recipient = toEmail || user.email;

    const emailPayload = {
      to: recipient,
      subject: `Your Report: ${reportName}`,
      templateName: 'report',
      variables: {
        firstName: user.firstName,
        reportName,
      },
      category: 'report',
      userId: user._id,
    };

    if (pdfBuffer) {
      emailPayload.attachments = [
        {
          filename: `${reportName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
          content: pdfBuffer,
        },
      ];
    }

    return this.send(emailPayload);
  },

  /**
   * Batch job: send daily compliance alert digests to all eligible users
   * across all companies.
   *
   * For each company:
   *  1. Find active critical/warning alerts
   *  2. Find users with owner/admin/safety_manager roles
   *     who have compliance email preference enabled
   *  3. Send digest to each qualifying user
   */
  async sendDailyAlertDigests() {
    const Company = require('../models/Company');
    const Alert = require('../models/Alert');
    const User = require('../models/User');

    try {
      const companies = await Company.find({ isActive: { $ne: false } }).lean();
      let totalSent = 0;

      for (const company of companies) {
        // Get active critical/warning alerts for this company
        const alerts = await Alert.find({
          companyId: company._id,
          status: 'active',
          type: { $in: ['critical', 'warning'] },
        }).lean();

        if (alerts.length === 0) continue;

        // Find users who are owner, admin, or safety_manager for this company
        const users = await User.find({
          'companies.companyId': company._id,
          'companies.role': { $in: ['owner', 'admin', 'safety_manager'] },
          'companies.isActive': true,
          isActive: { $ne: false },
        }).lean();

        for (const user of users) {
          if (!this.shouldSend(user, 'compliance')) continue;

          await this.sendComplianceAlertDigest(user, company, alerts);
          totalSent++;
        }
      }

      return totalSent;
    } catch (error) {
      console.error('[EmailService] Daily alert digest job failed:', error.message);
      return 0;
    }
  },
};

module.exports = emailService;
