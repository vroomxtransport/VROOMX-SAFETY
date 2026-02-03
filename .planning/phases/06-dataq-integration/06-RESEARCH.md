# Phase 6: DataQ Integration - Research

**Researched:** 2026-02-03
**Domain:** DataQ opportunity detection, post-sync hooks, background AI analysis
**Confidence:** HIGH

## Summary

This phase connects the FMCSA sync pipeline (Phase 3-5) to the existing DataQ challenge module. The research reveals that most DataQ infrastructure already exists: `dataQAnalysisService.js` scores violations, `violations.js` routes expose `/dataq-opportunities`, and `DataQDashboard.jsx` displays opportunities. What's missing are three specific integrations:

1. **DATQ-01**: Newly synced violations are already available via the existing `/dataq-opportunities` endpoint which queries all open violations. No new code needed - the endpoint already includes sync-imported violations (they have `status: 'open'`).

2. **DATQ-02**: The DataQ opportunities list needs to refresh after each sync. This requires calling the DataQ analysis service after the sync orchestrator completes, and optionally caching/pre-computing analysis results.

3. **DATQ-03**: AI analysis should run on new violations in the background (not blocking sync). This requires a post-sync hook that processes new violations with AI analysis, storing results in `dataQChallenge.aiAnalysis`.

**Key insight:** The existing `identifyChallengeableViolations()` uses local scoring rules (no AI call). Deep AI analysis via `aiService.analyzeDataQChallenge()` runs only when a user requests it. For DATQ-03, we need batch AI analysis on newly-imported violations in the background.

**Primary recommendation:** Add a step 5 to the sync orchestrator that runs DataQ analysis on new violations, with configurable AI analysis (can be enabled/disabled per company).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | ^0.71.2 | Claude AI for violation analysis | Already in codebase for aiService |
| node-cron | ^3.0.3 | Background job scheduling | Already used for sync orchestrator |
| mongoose | ^8.x | Violation model access | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node-cache | ^5.1.2 | Cache analysis results | Optional - for performance if needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline sync analysis | BullMQ job queue | Deferred to v2 per STATE.md |
| AI for all violations | AI only for high-score | Cost vs coverage tradeoff |

**Installation:**
No new packages required - all dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── services/
│   ├── fmcsaSyncOrchestrator.js   # MODIFY - add step 5 for DataQ analysis
│   ├── dataQAnalysisService.js    # MODIFY - add bulk AI analysis method
│   └── aiService.js               # EXISTING - analyzeDataQChallenge()
├── routes/
│   └── violations.js              # EXISTING - /dataq-opportunities already works
└── models/
    └── Company.js                  # MODIFY - add dataQAnalysis sync status field
```

### Pattern 1: Post-Sync Hook in Orchestrator
**What:** Add DataQ analysis as step 5 in the sync orchestrator after entity linking
**When to use:** When new violations need post-processing after sync
**Example:**
```javascript
// Source: Pattern from fmcsaSyncOrchestrator.js entity linking step
async syncCompany(companyId) {
  // ... existing steps 1-4 ...

  // 5. Run DataQ analysis on newly-synced violations (background, non-blocking)
  try {
    console.log(`[FMCSA Orchestrator] Running DataQ analysis for company ${companyId}`);
    const dataQResult = await this.runDataQAnalysis(companyId);
    timestamps.dataQAnalysisLastRun = new Date();
    console.log(`[FMCSA Orchestrator] DataQ analysis complete: ${dataQResult.analyzed} violations`);
  } catch (err) {
    // Log but don't fail the sync - DataQ analysis is optional
    console.error(`[FMCSA Orchestrator] DataQ analysis failed:`, err.message);
    errors.push({ source: 'dataq_analysis', error: err.message, timestamp: new Date() });
  }

  // Update Company sync status
  // ...
}
```

### Pattern 2: Bulk AI Analysis Service
**What:** Batch process new violations with AI analysis, respecting rate limits
**When to use:** Post-sync when many violations need analysis
**Example:**
```javascript
// Source: Derived from dataQAnalysisService.identifyChallengeableViolations pattern
async function runBulkAIAnalysis(companyId, options = {}) {
  const { aiEnabled = false, maxViolations = 10 } = options;

  // Only analyze violations imported in last sync (have syncMetadata.importedAt in last 24h)
  const recentCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const violations = await Violation.find({
    companyId,
    'syncMetadata.importedAt': { $gte: recentCutoff },
    'dataQChallenge.aiAnalysis': { $exists: false } // Not already analyzed
  })
  .sort({ severityWeight: -1 }) // Prioritize high-severity
  .limit(maxViolations);

  const results = { analyzed: 0, skipped: 0, errors: [] };

  for (const violation of violations) {
    try {
      // Local scoring (fast, no AI)
      const basicScore = calculateChallengeScore(violation);

      // Optional: Deep AI analysis for high-potential violations
      if (aiEnabled && basicScore.score >= 50 && process.env.ANTHROPIC_API_KEY) {
        const aiResult = await aiService.analyzeDataQChallenge({
          violation: violation.toObject(),
          companyInfo: null // Can enhance later
        });

        // Save AI analysis to violation
        await saveAnalysisToViolation(violation._id, {
          score: basicScore.score,
          factors: basicScore.factors,
          aiAnalysis: aiResult.analysis,
          confidence: basicScore.score >= 75 ? 'high' : basicScore.score >= 50 ? 'medium' : 'low',
          recommendation: basicScore.score >= 75 ? 'strongly_recommend' : basicScore.score >= 50 ? 'recommend' : 'neutral'
        });
      } else {
        // Just save local scoring
        await saveAnalysisToViolation(violation._id, {
          score: basicScore.score,
          factors: basicScore.factors,
          confidence: basicScore.score >= 75 ? 'high' : basicScore.score >= 50 ? 'medium' : 'low',
          recommendation: basicScore.score >= 75 ? 'strongly_recommend' : basicScore.score >= 50 ? 'recommend' : 'neutral'
        });
      }

      results.analyzed++;
    } catch (err) {
      results.errors.push({ violationId: violation._id, error: err.message });
    }
  }

  return results;
}
```

### Pattern 3: Sync Status Tracking for DataQ
**What:** Track when DataQ analysis last ran for a company
**When to use:** To show users when opportunities were last refreshed
**Example:**
```javascript
// Source: Pattern from Company.fmcsaData.syncStatus
// Add to Company schema:
'fmcsaData.syncStatus.dataQAnalysisLastRun': { type: Date },
'fmcsaData.syncStatus.dataQAnalysisViolationCount': { type: Number }
```

### Anti-Patterns to Avoid
- **Running AI on ALL violations:** Expensive and slow - prioritize high-severity or high-score violations
- **Blocking sync for AI analysis:** AI calls are slow (2-5 sec each) - don't block the main sync
- **Re-analyzing already-analyzed violations:** Check for existing aiAnalysis before re-running
- **Ignoring rate limits:** Anthropic API has rate limits - process sequentially with delays if needed

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Violation scoring | Custom scoring | `dataQAnalysisService.calculateChallengeScore()` | Already considers age, severity, BASIC, OOS, error-prone codes |
| AI violation analysis | Custom prompt | `aiService.analyzeDataQChallenge()` | Tuned system prompt with JSON output |
| Saving analysis results | Direct model update | `dataQAnalysisService.saveAnalysisToViolation()` | Handles nested object merge |
| Opportunity filtering | Custom query | `dataQAnalysisService.identifyChallengeableViolations()` | Already filters by score, status, age |

**Key insight:** All the analysis logic exists. Phase 6 is about triggering it automatically after sync.

## Common Pitfalls

### Pitfall 1: AI Rate Limiting
**What goes wrong:** Too many AI calls in quick succession hit Anthropic rate limits
**Why it happens:** Processing all violations in parallel
**How to avoid:** Sequential processing with optional delay, limit violations per sync
**Warning signs:** 429 errors from AI service, incomplete analysis

### Pitfall 2: Blocking Sync Completion
**What goes wrong:** Users see stale sync status because AI analysis takes too long
**Why it happens:** AI analysis runs synchronously in sync orchestrator
**How to avoid:** Fire-and-forget pattern or separate cron job for AI analysis
**Warning signs:** Sync status shows old timestamp despite successful import

### Pitfall 3: Duplicate AI Analysis
**What goes wrong:** Same violation analyzed repeatedly, wasting API calls
**Why it happens:** Not checking for existing `dataQChallenge.aiAnalysis`
**How to avoid:** Query filter: `{ 'dataQChallenge.aiAnalysis': { $exists: false } }`
**Warning signs:** High AI token usage, same violations appear in logs multiple times

### Pitfall 4: Missing syncMetadata.importedAt
**What goes wrong:** Can't identify which violations are new from sync
**Why it happens:** Violations created manually don't have this field
**How to avoid:** Use sparse query with $exists check, or default to violationDate
**Warning signs:** Analysis runs on all violations every sync, not just new ones

### Pitfall 5: No ANTHROPIC_API_KEY
**What goes wrong:** AI analysis silently fails
**Why it happens:** API key not configured in production
**How to avoid:** Check for key before attempting AI analysis, log clear warning
**Warning signs:** All violations have local score but no aiAnalysis

## Code Examples

Verified patterns from existing codebase:

### Existing Analysis Trigger (User-Initiated)
```javascript
// Source: backend/routes/ai.js:369
// Get the basic scoring analysis first
const basicAnalysis = dataQAnalysisService.analyzeViolationChallengeability(violation);

// If AI is configured, get deep AI analysis
let aiAnalysis = null;
if (process.env.ANTHROPIC_API_KEY) {
  try {
    const aiResult = await aiService.analyzeDataQChallenge({
      violation: violation.toObject(),
      companyInfo: company ? {
        dotNumber: company.dotNumber,
        name: company.name
      } : null
    });
    aiAnalysis = aiResult.analysis;
  } catch (aiError) {
    console.error('AI analysis failed:', aiError.message);
    // Continue with basic analysis only
  }
}
```

### Existing Violation Query for DataQ
```javascript
// Source: backend/services/dataQAnalysisService.js:266-293
const query = {
  companyId,
  status: { $in: ['open', 'upheld'] }
};

// Optionally filter out already challenged
if (!includeAlreadyChallenged) {
  query.$or = [
    { 'dataQChallenge.submitted': { $ne: true } },
    { 'dataQChallenge.status': 'denied' }
  ];
}

// Only look at violations from last 24 months (relevant for CSA)
const twoYearsAgo = new Date();
twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
query.violationDate = { $gte: twoYearsAgo };
```

### Existing Save Analysis Pattern
```javascript
// Source: backend/services/dataQAnalysisService.js:430-453
async function saveAnalysisToViolation(violationId, analysis) {
  const violation = await Violation.findById(violationId);
  if (!violation) {
    throw new Error('Violation not found');
  }

  // Update dataQChallenge with AI analysis
  if (!violation.dataQChallenge) {
    violation.dataQChallenge = {};
  }

  violation.dataQChallenge.aiAnalysis = {
    score: analysis.score,
    factors: analysis.factors,
    generatedAt: new Date()
  };

  if (analysis.evidenceChecklist) {
    violation.dataQChallenge.evidenceChecklist = analysis.evidenceChecklist;
  }

  await violation.save();
  return violation;
}
```

### Existing Entity Linking Post-Sync Hook
```javascript
// Source: backend/services/fmcsaSyncOrchestrator.js:119-128
// 4. Link violations to entities (drivers/vehicles)
try {
  console.log(`[FMCSA Orchestrator] Running entity linking for company ${companyId}`);
  const linkingResult = await entityLinkingService.linkViolationsForCompany(companyId);
  timestamps.linkingLastRun = new Date();
  console.log(`[FMCSA Orchestrator] Linking complete: ${linkingResult.linked} linked, ${linkingResult.reviewRequired} need review, ${linkingResult.skipped} skipped`);
} catch (err) {
  console.error(`[FMCSA Orchestrator] Entity linking failed:`, err.message);
  errors.push({ source: 'entity_linking', error: err.message, timestamp: new Date() });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| User triggers analysis | Auto-analyze after sync | This phase | Users see opportunities immediately |
| All local scoring | Local + optional AI | This phase | Higher quality recommendations for high-value violations |
| Manual refresh | Post-sync refresh | This phase | Always current after sync |

**Deprecated/outdated:**
- `inspectionsAPI.syncViolations()` one-time trigger in DataQDashboard: Will still work but auto-sync is primary

## Open Questions

1. **AI Analysis Cost Control**
   - What we know: Each AI call uses ~500-1000 tokens, costs ~$0.003 at current rates
   - What's unclear: Should we have a company-level setting to enable/disable AI analysis?
   - Recommendation: Default to local-only scoring, add company preference for AI analysis

2. **Analysis Priority**
   - What we know: High-severity, high-score violations are most valuable to analyze
   - What's unclear: How many violations per sync should get AI analysis?
   - Recommendation: Start with 10 per company per sync, prioritized by severity weight

## Sources

### Primary (HIGH confidence)
- backend/services/dataQAnalysisService.js - All scoring and analysis methods
- backend/services/aiService.js - analyzeDataQChallenge() AI integration
- backend/services/fmcsaSyncOrchestrator.js - Post-sync hook pattern (entity linking)
- backend/routes/violations.js - /dataq-opportunities endpoint
- backend/routes/ai.js - AI analysis route patterns
- frontend/src/pages/DataQDashboard.jsx - Current UI consumption

### Secondary (MEDIUM confidence)
- backend/models/Violation.js - dataQChallenge schema structure
- backend/models/Company.js - syncStatus schema pattern

### Tertiary (LOW confidence)
- None - all patterns are well-established in the existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, all AI/analysis code exists
- Architecture: HIGH - Pattern matches existing entity linking post-sync hook
- Pitfalls: HIGH - Based on existing AI rate limiting in routes/ai.js

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable patterns, established services)
