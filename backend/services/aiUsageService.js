const AIQueryUsage = require('../models/AIQueryUsage');

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const aiUsageService = {
  /**
   * Get monthly query count for a user (current month)
   */
  async getMonthlyCount(userId) {
    const month = getCurrentMonth();
    const record = await AIQueryUsage.findOne({ userId, month });
    return record?.count || 0;
  },

  /**
   * Increment query count (fire-and-forget, never throws)
   */
  async trackQuery(userId, inputTokens = 0, outputTokens = 0) {
    try {
      const month = getCurrentMonth();
      await AIQueryUsage.findOneAndUpdate(
        { userId, month },
        {
          $inc: {
            count: 1,
            totalInputTokens: inputTokens,
            totalOutputTokens: outputTokens
          },
          $set: { lastQueryAt: new Date() }
        },
        { upsert: true }
      );
    } catch (err) {
      console.error('[aiUsageService] Track failed:', err.message);
      // Fire-and-forget - never throw
    }
  },

  /**
   * Get usage stats for billing display
   */
  async getUsageStats(userId) {
    const month = getCurrentMonth();
    const record = await AIQueryUsage.findOne({ userId, month });
    return {
      month,
      count: record?.count || 0,
      inputTokens: record?.totalInputTokens || 0,
      outputTokens: record?.totalOutputTokens || 0,
      lastQueryAt: record?.lastQueryAt || null
    };
  }
};

module.exports = aiUsageService;
