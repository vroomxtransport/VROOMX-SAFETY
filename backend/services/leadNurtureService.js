/**
 * Lead Nurture Service
 *
 * Processes the email nurture sequence for CSA checker leads.
 * Called daily by a cron job. Each lead progresses through:
 *   sent_welcome → (2 days) → sent_day2 → (3 days) → sent_day5
 *   → (4 days) → sent_day9 → (5 days) → sent_day14 → completed
 */

const Lead = require('../models/Lead');
const emailService = require('./emailService');
const logger = require('../utils/logger');

// Sequence steps: [currentStatus, daysToWait, sendMethod, nextStatus]
const SEQUENCE_STEPS = [
  { from: 'sent_welcome', daysWait: 2, sendMethod: 'sendLeadDay2', to: 'sent_day2' },
  { from: 'sent_day2',    daysWait: 3, sendMethod: 'sendLeadDay5', to: 'sent_day5' },
  { from: 'sent_day5',    daysWait: 4, sendMethod: 'sendLeadDay9', to: 'sent_day9' },
  { from: 'sent_day9',    daysWait: 5, sendMethod: 'sendLeadDay14', to: 'sent_day14' },
  { from: 'sent_day14',   daysWait: 0, sendMethod: null, to: 'completed' },
];

const leadNurtureService = {
  /**
   * Process all leads that are due for their next nurture email.
   * Called by the daily cron job.
   *
   * @returns {Promise<{ processed: number, sent: number, errors: number, completed: number }>}
   */
  async processSequence() {
    const results = { processed: 0, sent: 0, errors: 0, completed: 0 };

    try {
      // Find all leads that are in the nurture sequence (not completed, not unsubscribed, not pending)
      const activeStatuses = SEQUENCE_STEPS.map(s => s.from);
      const leads = await Lead.find({
        emailSequenceStatus: { $in: activeStatuses },
        lastEmailSentAt: { $exists: true },
      });

      for (const lead of leads) {
        results.processed++;

        const step = SEQUENCE_STEPS.find(s => s.from === lead.emailSequenceStatus);
        if (!step) continue;

        // Check if enough time has passed since last email
        const msSinceLastEmail = Date.now() - new Date(lead.lastEmailSentAt).getTime();
        const daysElapsed = msSinceLastEmail / (1000 * 60 * 60 * 24);

        if (daysElapsed < step.daysWait) continue;

        // If this is the final step (sent_day14 → completed), just mark it
        if (!step.sendMethod) {
          lead.emailSequenceStatus = step.to;
          await lead.save();
          results.completed++;
          continue;
        }

        // Send the next email
        try {
          const result = await emailService[step.sendMethod](lead);
          if (result !== null) {
            lead.emailSequenceStatus = step.to;
            lead.lastEmailSentAt = new Date();
            await lead.save();
            results.sent++;
          } else {
            results.errors++;
          }
        } catch (err) {
          logger.error(`[LeadNurture] Failed to send ${step.sendMethod} to ${lead.email}`, { error: err.message });
          results.errors++;
        }
      }
    } catch (err) {
      logger.error('[LeadNurture] processSequence failed', { error: err.message });
    }

    return results;
  },
};

module.exports = leadNurtureService;
