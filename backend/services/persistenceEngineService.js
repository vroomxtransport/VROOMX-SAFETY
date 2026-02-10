/**
 * Persistence & Follow-Up Engine Service
 *
 * Manages active DataQ challenges lifecycle:
 * - Tracks active challenges with deadlines and countdown status
 * - Provides denial response options after challenge rejection
 * - Initiates new challenge rounds (reconsideration, FMCSA escalation)
 * - Aggregates batch dashboard stats for challenge portfolio overview
 */

const { Violation } = require('../models');

const persistenceEngineService = {
  /**
   * Get all violations with active DataQ challenges (submitted, pending or under_review).
   * Populates driver and vehicle refs. Sorted by submission date descending.
   */
  async getActiveChallenges(companyId) {
    const violations = await Violation.find({
      companyId,
      'dataQChallenge.submitted': true,
      'dataQChallenge.status': { $in: ['pending', 'under_review'] }
    })
      .populate('driverId', 'firstName lastName cdlNumber')
      .populate('vehicleId', 'unitNumber vin make model year')
      .sort({ 'dataQChallenge.submissionDate': -1 })
      .lean();

    return violations;
  },

  /**
   * Calculate countdown status for a violation's pending response deadline.
   * Returns deadline info with urgency flags.
   */
  getCountdownStatus(violation) {
    const challenge = violation.dataQChallenge;

    if (!challenge || !challenge.pendingResponseDeadline) {
      return {
        hasPendingDeadline: false,
        deadline: null,
        daysRemaining: null,
        isUrgent: false,
        isExpired: false
      };
    }

    const now = new Date();
    const deadline = new Date(challenge.pendingResponseDeadline);
    const diffMs = deadline.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      hasPendingDeadline: true,
      deadline,
      daysRemaining,
      isUrgent: daysRemaining <= 3 && daysRemaining > 0,
      isExpired: daysRemaining <= 0
    };
  },

  /**
   * Find all violations with approaching pending response deadlines.
   * Returns array of { violation, daysRemaining, isUrgent }.
   */
  async checkPendingDeadlines(companyId) {
    const violations = await Violation.find({
      companyId,
      'dataQChallenge.submitted': true,
      'dataQChallenge.status': { $in: ['pending', 'under_review'] },
      'dataQChallenge.pendingResponseDeadline': { $exists: true, $ne: null }
    })
      .populate('driverId', 'firstName lastName')
      .populate('vehicleId', 'unitNumber')
      .lean();

    const results = [];

    for (const violation of violations) {
      const status = this.getCountdownStatus(violation);
      if (status.hasPendingDeadline) {
        results.push({
          violation,
          daysRemaining: status.daysRemaining,
          isUrgent: status.isUrgent,
          isExpired: status.isExpired
        });
      }
    }

    // Sort by urgency - most urgent first
    results.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return results;
  },

  /**
   * Get the 5 denial response options based on violation state.
   * Each option has availability based on the violation's challenge context.
   */
  getDenialOptions(violation) {
    const challenge = violation.dataQChallenge || {};
    const stateReview = challenge.stateReview || {};
    const hasCitation = violation.fineAmount > 0 || (violation.documents || []).some(
      d => d.type === 'citation'
    );
    const isRdrType = !!challenge.rdrType;
    const hasStateReview = stateReview.submitted === true;

    const options = [
      {
        id: 'A',
        label: 'Request FMCSA review',
        description: 'Escalate to FMCSA for federal-level review of the state decision. Best for RDR-type challenges that were reviewed at state level.',
        available: isRdrType && hasStateReview,
        reason: !isRdrType
          ? 'Only available for RDR-type challenges'
          : !hasStateReview
            ? 'Requires state-level review to have been completed first'
            : null
      },
      {
        id: 'B',
        label: 'Reopen with additional evidence',
        description: 'Submit new supporting documents or information that was not part of the original challenge. Useful when new evidence becomes available.',
        available: true,
        reason: null
      },
      {
        id: 'C',
        label: 'Refile under different RDR type',
        description: 'Start a new challenge using a different Request for Data Review type. Consider if the original RDR type did not match the situation well.',
        available: true,
        reason: null
      },
      {
        id: 'D',
        label: 'Go to court',
        description: 'Contest the underlying citation in court. If the citation is dismissed or reduced, use the court outcome to support a new DataQ challenge.',
        available: hasCitation,
        reason: !hasCitation
          ? 'No citation on record for this violation. Court option requires a citation to contest.'
          : null
      },
      {
        id: 'E',
        label: 'Accept and focus on clean inspections',
        description: 'Accept the denial and focus compliance efforts elsewhere. The violation will age off your record over time with reduced weight.',
        available: true,
        reason: null
      }
    ];

    return options;
  },

  /**
   * Record the selected denial action for a violation.
   * Updates dataQChallenge.denialWorkflow and pushes to history.
   */
  async recordDenialAction(violationId, option, userId) {
    const violation = await Violation.findById(violationId);
    if (!violation) {
      throw new Error('Violation not found');
    }

    if (!violation.dataQChallenge) {
      throw new Error('No DataQ challenge exists for this violation');
    }

    // Initialize denialWorkflow if it doesn't exist
    if (!violation.dataQChallenge.denialWorkflow) {
      violation.dataQChallenge.denialWorkflow = {};
    }

    violation.dataQChallenge.denialWorkflow = {
      selectedOption: option.id,
      selectedLabel: option.label,
      selectedAt: new Date(),
      selectedBy: userId,
      actionTaken: false
    };

    // Push to history
    violation.history.push({
      action: `denial_response_selected`,
      date: new Date(),
      userId,
      notes: `Selected denial response: Option ${option.id} - ${option.label}`
    });

    await violation.save();
    return violation;
  },

  /**
   * Initiate a new challenge round for a violation.
   * roundType: 'reconsideration' or 'fmcsa_escalation'
   */
  async initiateNewRound(violationId, roundType, userId) {
    const violation = await Violation.findById(violationId);
    if (!violation) {
      throw new Error('Violation not found');
    }

    if (!violation.dataQChallenge) {
      throw new Error('No DataQ challenge exists for this violation');
    }

    // Determine round number
    const currentRounds = violation.dataQChallenge.rounds || [];
    const roundNumber = currentRounds.length + 1;

    // Archive current challenge status into rounds history
    const roundEntry = {
      roundNumber,
      roundType,
      initiatedAt: new Date(),
      initiatedBy: userId,
      previousStatus: violation.dataQChallenge.status,
      previousResponseNotes: violation.dataQChallenge.responseNotes
    };

    if (!violation.dataQChallenge.rounds) {
      violation.dataQChallenge.rounds = [];
    }
    violation.dataQChallenge.rounds.push(roundEntry);

    // Reset status for new round
    violation.dataQChallenge.status = 'pending';
    violation.dataQChallenge.responseDate = null;
    violation.dataQChallenge.responseNotes = null;

    // Update the challenge type metadata for the new round
    if (roundType === 'fmcsa_escalation') {
      violation.dataQChallenge.escalatedToFMCSA = true;
      violation.dataQChallenge.escalationDate = new Date();
    }

    // Push to history
    violation.history.push({
      action: `new_round_initiated`,
      date: new Date(),
      userId,
      notes: `Round ${roundNumber} initiated: ${roundType === 'fmcsa_escalation' ? 'FMCSA Escalation' : 'Reconsideration'}`
    });

    // Update parent violation status
    violation.status = 'dispute_in_progress';

    await violation.save();
    return violation;
  },

  /**
   * Aggregate batch dashboard stats for company's DataQ challenges.
   */
  async getBatchDashboard(companyId) {
    const [activeChallenges, allChallenges] = await Promise.all([
      Violation.countDocuments({
        companyId,
        'dataQChallenge.submitted': true,
        'dataQChallenge.status': { $in: ['pending', 'under_review'] }
      }),
      Violation.find({
        companyId,
        'dataQChallenge.submitted': true
      }).lean()
    ]);

    let pendingResponse = 0;
    let won = 0;
    let lost = 0;
    const totalFiled = allChallenges.length;

    for (const v of allChallenges) {
      const challenge = v.dataQChallenge || {};

      if (challenge.pendingResponseDeadline) {
        const status = this.getCountdownStatus(v);
        if (status.hasPendingDeadline && status.daysRemaining > 0) {
          pendingResponse++;
        }
      }

      if (challenge.status === 'accepted') {
        won++;
      }
      if (challenge.status === 'denied') {
        lost++;
      }
    }

    const successRate = totalFiled > 0
      ? Math.round((won / totalFiled) * 100)
      : 0;

    return {
      active: activeChallenges,
      pendingResponse,
      won,
      lost,
      totalFiled,
      successRate
    };
  }
};

module.exports = persistenceEngineService;
