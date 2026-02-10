/**
 * State Profile Service
 *
 * Manages state-level DataQ challenge intelligence.
 * Provides score modifiers based on historical approval rates
 * and learns from challenge outcomes over time.
 */

const StateProfile = require('../models/StateProfile');

const NATIONAL_AVERAGE_RATE = 0.40;

const stateProfileService = {
  /**
   * Get profile for a state, lazy-seeding from defaults if missing.
   */
  async getProfile(stateCode) {
    if (!stateCode) return null;
    return StateProfile.getOrSeed(stateCode);
  },

  /**
   * Get score modifier for a state (-15 to +15).
   * Based on how the state's approval rate compares to national average.
   *
   * @param {string} stateCode - Two-letter state code
   * @param {string} [challengeType] - Optional challenge type for type-specific rate
   * @returns {number} Score modifier clamped to [-15, 15]
   */
  async getScoreModifier(stateCode, challengeType) {
    if (!stateCode) return 0;

    const profile = await this.getProfile(stateCode);
    if (!profile) return 0;

    // Use type-specific rate if available, otherwise overall
    let rate = profile.approvalRates?.overall ?? NATIONAL_AVERAGE_RATE;
    if (challengeType && profile.approvalRates?.byType?.[challengeType] != null) {
      rate = profile.approvalRates.byType[challengeType];
    }

    const modifier = Math.round((rate - NATIONAL_AVERAGE_RATE) * 75);
    return Math.max(-15, Math.min(15, modifier));
  },

  /**
   * Learn from a challenge outcome. Incrementally updates the state's approval rate.
   * Fire-and-forget — never throws.
   *
   * Formula: newRate = (oldRate * N + (accepted ? 1 : 0)) / (N + 1)
   *
   * @param {string} stateCode - Two-letter state code
   * @param {string} challengeType - Challenge type
   * @param {boolean} accepted - Whether the challenge was accepted
   */
  async learnFromOutcome(stateCode, challengeType, accepted) {
    try {
      if (!stateCode) return;

      const profile = await this.getProfile(stateCode);
      if (!profile) return;

      // Update counters
      profile.challengeCount += 1;
      if (accepted) {
        profile.acceptedCount += 1;
      } else {
        profile.deniedCount += 1;
      }

      // Incremental overall rate update
      const totalCompleted = profile.acceptedCount + profile.deniedCount;
      const oldRate = profile.approvalRates.overall ?? NATIONAL_AVERAGE_RATE;
      const N = Math.max(totalCompleted - 1, 0);
      profile.approvalRates.overall = (oldRate * N + (accepted ? 1 : 0)) / (N + 1);

      // Update type-specific rate if challenge type provided
      if (challengeType) {
        if (!profile.approvalRates.byType) {
          profile.approvalRates.byType = {};
        }
        const typeRate = profile.approvalRates.byType[challengeType] ?? NATIONAL_AVERAGE_RATE;
        // Use overall count as approximation — type-specific tracking would need per-type counters
        profile.approvalRates.byType[challengeType] = (typeRate * N + (accepted ? 1 : 0)) / (N + 1);
      }

      profile.lastUpdated = new Date();
      await profile.save();
    } catch (err) {
      console.error(`[StateProfile] learnFromOutcome error for ${stateCode}:`, err.message);
    }
  },

  /**
   * Get all state profiles (for admin/debug).
   */
  async getAllProfiles() {
    return StateProfile.find().sort({ stateCode: 1 }).lean();
  }
};

module.exports = stateProfileService;
