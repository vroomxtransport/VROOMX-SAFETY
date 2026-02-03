# Technology Stack: FMCSA Data Integration

**Project:** VroomX Safety - FMCSA Auto-Sync Enhancement
**Researched:** 2026-02-03
**Overall Confidence:** HIGH (verified against current codebase + official sources)

## Executive Summary

The existing stack is well-chosen. This research focuses on **what to add** for bulletproof auto-sync, not what to replace. Key additions: BullMQ for job queuing, better caching strategy, and formalized data source hierarchy.

---

## Current Stack Assessment

| Component | Current | Status | Recommendation |
|-----------|---------|--------|----------------|
| Web Scraping | Puppeteer + @sparticuz/chromium | KEEP | Works well, cloud-compatible |
| HTML Parsing | Cheerio 1.1.2 | KEEP | Efficient, no changes needed |
| In-Memory Cache | node-cache 5.1.2 | PARTIAL | Keep for single-instance, add Redis for multi-instance |
| Cron Jobs | node-cron 3.0.3 | REPLACE | Upgrade to BullMQ for reliability |
| HTTP Client | Native fetch | KEEP | Built-in, no dependencies |

---

## Recommended Stack Additions

### 1. Job Queue: BullMQ

**Confidence:** HIGH (verified via official docs and community adoption)

| Attribute | Value |
|-----------|-------|
| Package | `bullmq` |
| Version | `^5.x` (latest stable) |
| Requires | Redis 6.2+ |
| Purpose | Reliable background job processing with retry, scheduling |

**Why BullMQ over node-cron:**
- **Persistence**: Jobs survive server restarts
- **Retry logic**: Automatic retry with exponential backoff
- **Concurrency control**: Prevents task stacking
- **Visibility**: bull-board for monitoring
- **Rate limiting**: Built-in rate limiting per queue

**Why NOT Agenda:**
- Agenda requires MongoDB connection per worker (you already have MongoDB, but BullMQ's Redis is more efficient for job queuing)
- BullMQ has better TypeScript support and more active maintenance

```bash
npm install bullmq
# For dashboard:
npm install @bull-board/express @bull-board/api
```

**Configuration:**
```javascript
// config/queue.js
const { Queue, Worker } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

const fmcsaSyncQueue = new Queue('fmcsa-sync', { connection });

// Add repeatable job for every 6 hours
await fmcsaSyncQueue.add('sync-all-companies', {}, {
  repeat: { cron: '0 */6 * * *' }
});
```

**Source:** [BullMQ Official Documentation](https://bullmq.io/)

---

### 2. Caching Strategy: Tiered Approach

**Confidence:** HIGH

**Tier 1: In-Memory (node-cache)** - Already implemented
- TTL: 6 hours
- Use for: Single-request deduplication, hot data

**Tier 2: Redis (optional, for scale)**
- Only needed when: Running multiple backend instances
- Use for: Shared cache across instances, job queue backend

**Recommendation for MVP:** Keep node-cache. Add Redis only when scaling to multiple instances.

**Current Implementation is Sound:**
```javascript
// Already in fmcsaService.js - this is correct
const cache = new NodeCache({ stdTTL: 21600, checkperiod: 600 });
```

---

### 3. FMCSA Data Sources (Priority Order)

**Confidence:** HIGH (verified against official FMCSA documentation)

| Priority | Source | Data Type | Rate Limits | Auth Required |
|----------|--------|-----------|-------------|---------------|
| 1 | FMCSA QCMobile API | Carrier snapshot, licensing, insurance | Unknown (free tier) | WebKey via Login.gov |
| 2 | DOT DataHub (Socrata) | Violation records (8mt8-2mdr) | 1000/hour with app token | App token (free) |
| 3 | SaferWebAPI | Inspections, OOS rates | Paid tiers | API key (paid) |
| 4 | SAFER Scraping | CSA BASIC scores | N/A (scraping) | None |

**Source Hierarchy Rationale:**

1. **FMCSA QCMobile API (Primary for carrier data)**
   - Official government API
   - Free with WebKey registration
   - JSON responses, no scraping needed
   - URL: `https://mobile.fmcsa.dot.gov/qc/services/`
   - [FMCSA Developer Portal](https://mobile.fmcsa.dot.gov/QCDevsite/docs/apiAccess)

2. **DOT DataHub / Socrata (Primary for violations)**
   - Dataset: `8mt8-2mdr` (SMS Input - Violation)
   - Free with app token (1000 requests/hour)
   - Public API, no approval needed
   - URL: `https://datahub.transportation.gov/resource/8mt8-2mdr.json`
   - [Socrata Throttling Docs](https://dev.socrata.com/docs/app-tokens.html)

3. **SaferWebAPI (Secondary for inspections)**
   - Third-party paid service
   - More reliable than scraping
   - Endpoint: `https://saferwebapi.com/v2/usdot/snapshot/{dot}`
   - **Note:** Requires `SAFERWEB_API_KEY` env variable

4. **SAFER Web Scraping (Fallback for CSA scores)**
   - Use Puppeteer for SMS pages (JS-rendered)
   - Use Cheerio for static SAFER pages
   - **Warning:** Brittle, may break with site changes

---

### 4. HTTP Client: Keep Native Fetch

**Confidence:** HIGH

Native `fetch` (available in Node 18+) is already used correctly. No need for axios.

**Current Pattern (keep this):**
```javascript
const response = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 ...',
    'x-api-key': apiKey  // for SaferWebAPI
  }
});
```

---

### 5. Retry & Circuit Breaker: p-retry + cockatiel

**Confidence:** MEDIUM (recommended addition, not critical)

| Package | Version | Purpose |
|---------|---------|---------|
| `p-retry` | `^6.x` | Retry failed API calls with backoff |
| `cockatiel` | `^3.x` | Circuit breaker for external services |

**Why:**
- FMCSA services can be unreliable
- Circuit breaker prevents cascade failures
- Already seeing error handling in codebase, this formalizes it

```bash
npm install p-retry cockatiel
```

**Usage:**
```javascript
const pRetry = require('p-retry');
const { circuitBreaker, handleAll, ConsecutiveBreaker } = require('cockatiel');

const fmcsaBreaker = circuitBreaker(handleAll, {
  halfOpenAfter: 30000,  // Try again after 30s
  breaker: new ConsecutiveBreaker(5)  // Open after 5 failures
});

async function fetchWithRetry(url) {
  return fmcsaBreaker.execute(() =>
    pRetry(() => fetch(url), { retries: 3 })
  );
}
```

---

## Environment Variables to Add

```bash
# .env additions for FMCSA integration

# Required for BullMQ
REDIS_HOST=localhost
REDIS_PORT=6379

# FMCSA Official API (get from Login.gov)
FMCSA_WEBKEY=your_webkey_here

# DOT DataHub (Socrata) - Optional but recommended for higher limits
SOCRATA_APP_TOKEN=your_app_token_here

# Already exists:
# SAFERWEB_API_KEY=your_key_here
```

---

## Installation Commands

```bash
cd backend

# Required for bulletproof sync
npm install bullmq

# Dashboard for monitoring jobs (optional but recommended)
npm install @bull-board/express @bull-board/api

# Retry and circuit breaker (recommended)
npm install p-retry cockatiel
```

---

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| Agenda | BullMQ is lighter, doesn't need MongoDB for job storage |
| Axios | Native fetch is sufficient, fewer dependencies |
| Playwright | Puppeteer is already working; switching adds risk |
| Redis for cache | Overkill for single-instance; node-cache is fine |
| Cron (system-level) | Doesn't survive deploys, no retry logic |

---

## Rate Limit Summary

| API | Limit | Strategy |
|-----|-------|----------|
| Socrata (DataHub) | 1000/hour with token | Batch requests, respect 429s |
| SaferWebAPI | Unknown (paid tiers) | Cache aggressively (6hr TTL) |
| FMCSA QCMobile | Unknown | Register WebKey, monitor usage |
| SAFER Scraping | N/A | Rate-limit to 1 req/5s to avoid blocks |

**Recommended sync interval:** Every 6 hours (already implemented in codebase)

---

## Data Freshness Reality

| Data Type | FMCSA Update Frequency | Recommended Sync |
|-----------|------------------------|------------------|
| CSA BASIC Scores | Weekly (Saturdays) | Every 6 hours |
| Inspection Records | Daily (by noon EST) | Every 6 hours |
| Violation Details | Daily | Every 6 hours |
| Carrier Snapshot | Real-time | On-demand + 6hr cache |

**Key Insight:** FMCSA data updates weekly at most. Syncing more than every 6 hours provides no benefit and risks rate limiting.

---

## Architecture Decision: Sync Flow

```
                    +------------------+
                    |   BullMQ Queue   |
                    |  (Redis-backed)  |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
              v              v              v
        +---------+    +---------+    +---------+
        | Worker 1|    | Worker 2|    | Worker 3|
        +---------+    +---------+    +---------+
              |              |              |
              v              v              v
        +---------+    +---------+    +---------+
        |DataHub  |    |SaferWeb |    | SAFER   |
        |Socrata  |    |  API    |    |Scraping |
        +---------+    +---------+    +---------+
              |              |              |
              +--------------+--------------+
                             |
                             v
                    +------------------+
                    |    MongoDB       |
                    | (Company.fmcsaData)|
                    +------------------+
```

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Job Queue (BullMQ) | HIGH | Well-documented, industry standard, Jan 2026 guides available |
| Socrata Rate Limits | HIGH | Official documentation verified |
| FMCSA QCMobile API | HIGH | Official FMCSA developer docs |
| SaferWebAPI Details | MEDIUM | Third-party, limited public docs |
| Scraping Approach | MEDIUM | Works now, may need maintenance |

---

## Sources

- [FMCSA Developer Portal - API Access](https://mobile.fmcsa.dot.gov/QCDevsite/docs/apiAccess)
- [FMCSA QCMobile API Docs](https://mobile.fmcsa.dot.gov/QCDevsite/docs/qcApi)
- [DOT Transportation Data Portal](https://data.transportation.gov/)
- [Socrata App Tokens & Rate Limits](https://dev.socrata.com/docs/app-tokens.html)
- [Socrata Throttling Clarification](https://dev.socrata.com/changelog/2016/06/04/clarification-of-throttling-limits.html)
- [BullMQ Official Site](https://bullmq.io/)
- [OneUptime BullMQ Guide (Jan 2026)](https://oneuptime.com/blog/post/2026-01-06-nodejs-job-queue-bullmq-redis/view)
- [Better Stack Node-cron Guide](https://betterstack.com/community/guides/scaling-nodejs/node-cron-scheduled-tasks/)
- [SaferWebAPI Homepage](https://saferwebapi.com/)
