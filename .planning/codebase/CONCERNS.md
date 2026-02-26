# Codebase Concerns

**Analysis Date:** 2026-02-25

---

## Tech Debt

**Legacy Plan Names (dual-vocabulary throughout codebase):**
- Issue: Two parallel plan name sets exist — old (`solo`, `fleet`, `pro`) and new (`owner_operator`, `small_fleet`, `fleet_pro`). Both are handled everywhere with explicit `||` fallbacks.
- Files: `backend/middleware/subscriptionLimits.js` (L11-28), `backend/services/stripeService.js` (L22-41), `backend/models/User.js` (L106), `backend/routes/admin.js` (L77-79)
- Impact: Every plan-conditional path must be duplicated. Adding a new plan requires updating 6+ files. Admin `VALID_PLANS` list (`backend/routes/admin.js:77`) still uses old names and is missing `owner_operator`, `small_fleet`, `fleet_pro`.
- Fix approach: Run a one-time migration to rename all legacy plan values in the DB, then remove the fallback branches.

**Legacy User Fields (`companyId`, `role`, `permissions` at root level):**
- Issue: `backend/models/User.js` retains three root-level legacy fields (`companyId`, `role`, `permissions`) alongside the new `companies[]` array, with comments saying they "will be removed after migration." They are actively used in `backend/middleware/auth.js:176-187` as the fallback path.
- Files: `backend/models/User.js` (L134-145), `backend/middleware/auth.js` (L175-191), `backend/routes/auth.js` (L114-116)
- Impact: All auth middleware must test both code paths. Any new user gets both structures written (`backend/routes/auth.js:139`). Ambiguity about which fields are authoritative.
- Fix approach: Migrate DB users who have `companyId` set but no `companies[]` array, then delete the fallback branches and model fields.

**`admin.js` Not Using `asyncHandler`:**
- Issue: `backend/routes/admin.js` (2178 lines) has 48 route handlers all written as raw `async (req, res) =>` with manual `try/catch`. Every other route file uses `asyncHandler`.
- Files: `backend/routes/admin.js` — all 48 route handlers
- Impact: Errors in admin routes that escape the `try/catch` become unhandled rejections that crash the process in production. Inconsistent error format (some return `res.status(500).json(...)`, bypassing global error handler's sanitization).
- Fix approach: Wrap all admin route handlers with `asyncHandler` and throw `AppError` instead of manually calling `res.status(500)`.

**One-Time Migration Code in `server.js` Startup:**
- Issue: `backend/server.js:99-114` runs a `passwordChangedAt` cleanup migration inside `connectDB().then()` on every cold start. The flag check uses a raw MongoDB `migrations` collection rather than a proper migration framework.
- Files: `backend/server.js` (L99-115)
- Impact: Cold start latency on first deploy after flag is absent. Raw `db.collection('migrations')` is used nowhere else — no pattern for future migrations.
- Fix approach: Move to a dedicated migration script run once via npm task, or use a migration library (migrate-mongo). Remove from server.js startup.

---

## Known Bugs

**Expired Trial Accounts Still Have Full Access:**
- Symptoms: Users with `subscription.status = 'trialing'` but `trialEndsAt` in the past retain full API access. The `protect` middleware in `backend/middleware/auth.js:67-74` only blocks `unpaid` and `past_due` statuses — expired trials (`trialing` with past date) are not blocked.
- Files: `backend/middleware/auth.js` (L67-74), `backend/models/User.js` (L224-226)
- Trigger: Register, wait 7+ days without subscribing, continue using the app.
- Workaround: None — Stripe must fire a webhook to update status to `canceled` after trial ends. If Stripe webhook is delayed or misconfigured, access continues indefinitely.

**`canceled` Subscription Not Enforced at Auth Level:**
- Symptoms: Users whose `subscription.status` is `canceled` can still log in and access all data. Only `unpaid` and `past_due` are blocked in `protect` middleware.
- Files: `backend/middleware/auth.js` (L67-74)
- Trigger: Cancel Stripe subscription → access remains until next login attempt after status is updated by webhook.
- Workaround: No server-side workaround; relies entirely on Stripe webhook updating status promptly.

**`getUsageStats` Counts Vehicles with `out_of_service` Status Instead of `sold`/`totaled`:**
- Symptoms: `getUsageStats` in `backend/middleware/subscriptionLimits.js:241` excludes vehicles with `status !== 'out_of_service'` for the usage display, but `checkVehicleLimit` at L179 excludes `['sold', 'totaled']` for limit enforcement. The two functions use different exclusion criteria.
- Files: `backend/middleware/subscriptionLimits.js` (L179-181 vs L241-243)
- Impact: Usage display shows a different vehicle count than what the limit enforcement uses, confusing users about how many vehicles count against their plan.
- Fix approach: Use a shared constant for the "active" vehicle status filter.

**`fmcsaService.js` `browserInstance` Not Cleared on Normal Errors:**
- Symptoms: The Puppeteer `browserInstance` module-level singleton in `backend/services/fmcsaService.js` is only closed (set to `null`) when `process.env.RENDER === 'true'` (L550-552). If the browser crashes in non-Render environments, the stale `browserInstance` reference is returned by `getBrowser()` and all subsequent calls fail silently.
- Files: `backend/services/fmcsaService.js` (L287-354, L550-552)
- Trigger: Browser process crash in development or other cloud hosts.
- Workaround: Restart the Node.js process.

---

## Security Considerations

**Refresh Tokens Not Stored or Revocable:**
- Risk: Refresh tokens (7-day JWT) are issued but never stored in the database. There is no denylist. If a refresh token is stolen, it cannot be revoked until it expires naturally.
- Files: `backend/routes/auth.js` (L27-33, L452-463), `frontend/src/utils/api.js` (L22-36)
- Current mitigation: Token rotation on each refresh; `passwordChangedAt` check invalidates tokens issued before a password change. Refresh token is stored in `sessionStorage` (not `localStorage`), reducing XSS surface.
- Recommendations: Store a hash of the refresh token in MongoDB with a TTL index. On logout or password change, delete the DB record. Check DB on each refresh before issuing a new token.

**Hardcoded Admin Email in Committed Scripts:**
- Risk: `backend/scripts/force-admin.js:5` and `backend/scripts/fix-admin-access.js:5` hardcode `levanisbx@gmail.com` as the target admin email. These scripts are committed to the repo.
- Files: `backend/scripts/force-admin.js`, `backend/scripts/fix-admin-access.js`
- Current mitigation: Scripts require local execution with database credentials; they are not exposed via API. Seed route is blocked in production.
- Recommendations: Accept target email as a CLI argument (`process.argv[2]`) instead of hardcoding. Consider excluding these scripts from the repo or adding a `.gitignore` entry.

**SAFER Web Scraping with Bot-Spoofed User-Agent:**
- Risk: `backend/services/fmcsaService.js:133` sends requests with a spoofed Chrome browser User-Agent string to FMCSA government servers. This simulates a browser to bypass scraping protections on a government website, which may violate FMCSA terms of service and could result in IP bans or legal exposure.
- Files: `backend/services/fmcsaService.js` (L131-136, L380)
- Current mitigation: 6-hour caching reduces request frequency. `SAFERWEB_API_KEY` credential is used for SaferWebAPI.com as an alternative.
- Recommendations: Migrate fully to the official FMCSA API (`FMCSA_API_KEY` + `FMCSA_API_BASE_URL` already in `.env.example`) for carrier snapshots. Remove Puppeteer-based CSA score scraping once an API-based alternative is available.

**Token Included in Response Body by Default:**
- Risk: `backend/routes/auth.js:176` includes the JWT access token in the JSON response body unless `INCLUDE_TOKEN_IN_BODY=false` is set. In production, this means the token is readable by JavaScript if the response is intercepted, undermining the httpOnly cookie protection.
- Files: `backend/routes/auth.js` (L172-177)
- Current mitigation: Comment notes this is for mobile clients that can't use httpOnly cookies.
- Recommendations: Default `INCLUDE_TOKEN_IN_BODY` to `false` in production. Require explicit opt-in for mobile use cases.

**Global Rate Limit is 100 Requests per 30 Seconds In-Memory by Default:**
- Risk: Without Redis configured, rate limiting uses in-memory storage per Node.js process. If the app is deployed across multiple instances (horizontal scaling), each instance has its own counter, effectively multiplying the allowed request rate by the instance count.
- Files: `backend/server.js` (L167-183)
- Current mitigation: Redis support is implemented and auto-enabled when `REDIS_URL` is set.
- Recommendations: Document that `REDIS_URL` is required for production deployments with more than one instance. Consider making it a startup warning.

---

## Performance Bottlenecks

**Dashboard Fires 13 Parallel MongoDB Queries on Every Page Load:**
- Problem: `backend/routes/dashboard.js:25-165` runs 13 concurrent queries via `Promise.all()` including multiple aggregations on `Driver`, `Vehicle`, `Document`, `Violation`, `Accident`, and `Alert` collections. There is no caching.
- Files: `backend/routes/dashboard.js` (L19-175)
- Cause: Every dashboard visit recalculates all stats from scratch, including compliance score calculation if none exists for today.
- Improvement path: Add a short-lived (5-minute) server-side cache for dashboard stats per company, keyed on `companyId`. Alternatively, compute stats async and push via WebSocket.

**`alertService.generateAlertsForAllCompanies()` Iterates All Companies Sequentially:**
- Problem: `backend/services/alertService.js` cron at 6 AM fetches all companies and generates alerts for each one-by-one. As company count grows, this will increasingly delay or overlap with the 6h escalation cron.
- Files: `backend/server.js` (L292-312), `backend/services/alertService.js`
- Cause: Sequential processing to avoid thundering herd; no batch size or timeout limit per company.
- Improvement path: Process in batches of 10 with `Promise.all`, add a per-company timeout.

**FMCSA Orchestrator `syncAllCompanies` Sequential Processing:**
- Problem: `backend/services/fmcsaSyncOrchestrator.js:46` iterates all companies one-by-one for the 6-hour FMCSA sync. Each company sync involves multiple external API calls and Puppeteer browser sessions.
- Files: `backend/services/fmcsaSyncOrchestrator.js` (L29-64)
- Cause: Sequential design intentional to avoid rate limiting, but no maximum duration or partial-batch recovery.
- Improvement path: Add a total timeout (e.g., 5 hours max), track `lastSyncedAt` per company, and prioritize companies that haven't synced recently.

**`pdfService` and `fmcsaService` Both Maintain Separate Puppeteer Singleton Instances:**
- Problem: Two Chromium browser instances may exist simultaneously (`backend/services/pdfService.js:16` and `backend/services/fmcsaService.js:14`). On memory-constrained hosting (Render free tier), this can cause OOM kills.
- Files: `backend/services/pdfService.js` (L14-57), `backend/services/fmcsaService.js` (L14, L287-354)
- Cause: Services were built independently without shared browser pool.
- Improvement path: Create a shared `browserPool` service that both PDF generation and FMCSA scraping use. Only launch one browser instance at a time.

**Compliance Score Recalculation Fires 5 Parallel MongoDB Queries Per Company:**
- Problem: `backend/services/complianceScoreService.js:42-54` runs 5 parallel aggregation/count queries then creates a new `ComplianceScore` record. `getScore()` (L134) calls `calculateScore()` if no score exists for today, meaning any company without a daily score triggers full recalculation on first dashboard visit.
- Files: `backend/services/complianceScoreService.js` (L41-128, L134-159)
- Cause: No background pre-computation; compliance score is lazily computed on first access.
- Improvement path: Add compliance score calculation to the nightly cron job (6 AM) so it's ready when users arrive.

---

## Fragile Areas

**FMCSA CSA Score Scraping via Puppeteer:**
- Files: `backend/services/fmcsaService.js` (L356-555), `backend/services/fmcsaSyncService.js`
- Why fragile: Dependent on FMCSA SMS HTML structure (`data-percentile` attributes, CSS class names like `querylabelbkg`, `queryfield`). Any FMCSA website redesign breaks score syncing silently — scores just return `null`. The `fetchCarrierSnapshot` method uses Cheerio to parse SAFER's circa-2000s HTML tables (`th.querylabelbkg`), which is especially brittle.
- Safe modification: Test against the actual FMCSA URLs before deploying any change. Cache test HTML snapshots for unit testing.
- Test coverage: No tests exist for scraping logic.

**`admin.js` Route File (2178 Lines, 48 Routes):**
- Files: `backend/routes/admin.js`
- Why fragile: Largest route file with no `asyncHandler` wrapper. Contains cascade delete logic, subscription management, impersonation, data integrity checks, user management, feature flags, announcements, and bug reports — all in one file with shared helpers at the top. A syntax error in any part affects all admin routes.
- Safe modification: Extract into sub-routers: `admin/users.js`, `admin/companies.js`, `admin/billing.js`, `admin/system.js`. Add `asyncHandler` to all handlers.
- Test coverage: No tests.

**`reports.js` Route File (2809 Lines, 9+ Report Types):**
- Files: `backend/routes/reports.js`
- Why fragile: Largest file in the codebase. Contains 9 report types (DQF, vehicle, violations, audit, document-expiration, drug-alcohol, dataq, accident, maintenance-costs) each with PDF, CSV, and Excel export paths, plus preview endpoints. Any shared helper change affects all report types. Report logic is not unit-testable without HTTP setup.
- Safe modification: Extract each report type into `backend/services/reports/{type}ReportService.js`. The route file should only handle HTTP concern and delegate to service.
- Test coverage: No tests.

**Email Template Rendering via `fs.readFileSync` at Startup:**
- Files: `backend/services/emailService.js` (L26-35)
- Why fragile: `loadTemplate()` reads HTML files from disk synchronously (`fs.readFileSync`) and caches in memory. Templates are cached once — if a template file is missing, the first email send after server start will throw and crash email sending for that template type permanently until restart. The `_layout.html` template is required by every email.
- Safe modification: Add an `init()` method that pre-loads and validates all templates at startup, failing fast with a clear error. Or use `fs.promises.readFile` in `renderTemplate`.
- Test coverage: No tests.

**Stripe Webhook Handler Idempotency (Partial):**
- Files: `backend/services/stripeService.js` (L288-296), `backend/models/WebhookEvent.js`
- Why fragile: Webhook events are stored in `WebhookEvent` collection with duplicate detection. However, `user.save({ validateBeforeSave: false })` is called 6+ times in the webhook handler without transactions. If the Node.js process crashes mid-webhook (e.g., after updating `subscription.plan` but before saving `subscription.status`), the subscription state becomes inconsistent.
- Safe modification: Use MongoDB sessions/transactions for multi-field subscription updates in the webhook handler.
- Test coverage: No tests.

**FMCSA `syncAllCompanies` No Per-Company Timeout:**
- Files: `backend/services/fmcsaSyncOrchestrator.js` (L29-64)
- Why fragile: If any single company's sync hangs (e.g., Puppeteer launch deadlock), the entire cron job stops processing remaining companies. The overlap guard prevents the next scheduled run from starting while still blocked.
- Safe modification: Wrap `this.syncCompany(company._id)` in a per-company timeout (e.g., 120 seconds) so one stuck company doesn't block the rest.
- Test coverage: No tests.

---

## Scaling Limits

**Uploaded Files Stored on Local Disk:**
- Current capacity: Files stored in `backend/uploads/{category}/` on the server's local filesystem. `ReportHistory` saves generated reports to `backend/uploads/reports/`.
- Limit: Not portable across instances. On Render free tier with ephemeral storage, uploaded files are lost on deploy/restart.
- Files: `backend/middleware/upload.js`, `backend/services/reportHistoryService.js`
- Scaling path: Migrate uploads to object storage (S3, Cloudflare R2, or Render Disk). The upload middleware already isolates the storage concern — only `destination` in `multer.diskStorage` and `deleteFile` need updating.

**In-Memory Rate Limiter (No Redis):**
- Current capacity: Per-instance. Rate limits reset on every restart.
- Limit: Multiple server instances share no state.
- Files: `backend/server.js` (L167-209)
- Scaling path: Set `REDIS_URL` in production environment. Redis support is already implemented.

**Node-Cache In-Memory Caching Across Services:**
- Current capacity: Three independent `node-cache` instances (`fmcsaService`, `fmcsaInspectionService`, `fmcsaViolationService`), all in-memory.
- Limit: Cache is lost on restart. Multiple instances have separate caches, causing redundant API calls.
- Files: `backend/services/fmcsaService.js` (L17-18), `backend/services/fmcsaInspectionService.js` (L21-24), `backend/services/fmcsaViolationService.js` (L13-14)
- Scaling path: Replace with Redis-backed cache when Redis is added for rate limiting.

---

## Dependencies at Risk

**`puppeteer-core` + `@sparticuz/chromium` (Web Scraping):**
- Risk: Chromium binary download on deploy increases cold start time. `@sparticuz/chromium` is specific to serverless/Lambda environments; behavior on long-running Render servers differs. The `pdfService` and `fmcsaService` each launch their own browser, doubling memory use.
- Impact: Memory pressure on free-tier Render instances. FMCSA scraping breaks on any SAFER HTML update.
- Migration plan: Replace FMCSA CSA score scraping with the official FMCSA API (credentials already in `.env.example`). Migrate PDF generation to a managed service (WeasyPrint, Puppeteer Cloud, or React-PDF for client-side).

**`SaferWebAPI.com` (Third-Party Paid API):**
- Risk: `SaferWebAPI.com` is a commercial third-party service, not an official FMCSA resource. If the service changes pricing, goes offline, or is discontinued, inspection stats and carrier snapshots stop working.
- Impact: `fmcsaViolationService.syncViolationHistory()` (step 3 of orchestrator) silently fails; inspection history stats go stale.
- Files: `backend/services/fmcsaViolationService.js`
- Migration plan: The official FMCSA SAFER API provides similar data for free with an API key. Evaluate replacing SaferWebAPI with direct FMCSA API calls.

**`Perplexity` via OpenRouter (Regulation Assistant):**
- Risk: Regulation assistant AI (`backend/services/aiService.js:14-24`) uses Perplexity via OpenRouter, which is two hops from the underlying model. OpenRouter adds latency, cost markup, and a dependency on a third-party routing service.
- Impact: If OpenRouter or Perplexity changes their API, the regulation assistant breaks. There is no fallback for the Perplexity path (Anthropic/OpenAI are only used for other AI features).
- Files: `backend/services/aiService.js` (L14-30)
- Migration plan: Use Perplexity's API directly, or use Anthropic Claude with web search tool when it becomes production-stable.

---

## Missing Critical Features

**No Automated Trial Expiration Enforcement:**
- Problem: When a 7-day trial expires, the `subscription.status` remains `'trialing'` in the database until Stripe fires a webhook. The `protect` middleware does not check `trialEndsAt`. A user whose trial expired but whose Stripe webhook is delayed or missing has indefinite access.
- Blocks: Revenue protection, plan enforcement
- Files: `backend/middleware/auth.js` (L67-74), `backend/server.js` (cron job section)
- Recommended fix: Add a check in `protect` middleware: if `status === 'trialing' && trialEndsAt < now`, treat as expired and return 403 with `code: 'TRIAL_EXPIRED'`. Also add a daily cron job to transition stale `trialing` users whose `trialEndsAt` is past.

**No Refresh Token Revocation:**
- Problem: Refresh tokens cannot be invalidated server-side (no storage mechanism). Logout only clears the client-side cookie/sessionStorage; the token remains valid for up to 7 days if stolen.
- Blocks: Security compliance, session management
- Files: `backend/routes/auth.js` (L213-234), `backend/routes/auth.js` (L405-479)

**No File Storage Migration (Local Disk):**
- Problem: All uploads are stored on the server's ephemeral local filesystem. On Render, files are lost on every deploy.
- Blocks: Production reliability for document storage, report history
- Files: `backend/middleware/upload.js`, `backend/services/reportHistoryService.js`

---

## Test Coverage Gaps

**Zero Application Tests:**
- What's not tested: The entire backend codebase has no application-level test files (`backend/` contains no `*.test.js` or `*.spec.js` outside `node_modules`). No unit tests for services, no integration tests for routes, no middleware tests.
- Files: All of `backend/services/`, `backend/routes/`, `backend/middleware/`
- Risk: Any refactoring, dependency upgrade, or new feature introduction can silently break existing behavior. The FMCSA scraping logic, compliance score calculation, Stripe webhook handler, and subscription enforcement are all untested.
- Priority: High

**Critical Untested Business Logic:**
- Subscription limit enforcement: `backend/middleware/subscriptionLimits.js` — driver/vehicle limit race condition noted in code comments but not covered by tests.
- Stripe webhook processing: `backend/services/stripeService.js` (L200-460) — all subscription lifecycle handlers (checkout completed, invoice paid, subscription deleted) are untested.
- Compliance score calculation: `backend/services/complianceScoreService.js` — weighted score formula and component calculations are untested.
- FMCSA sync orchestrator: `backend/services/fmcsaSyncOrchestrator.js` — multi-step orchestration with partial failure handling is untested.
- Auth middleware: `backend/middleware/auth.js` — token validation, multi-company resolution, role checking all untested.
- Priority: High for Stripe webhook, Medium for others.

**No Frontend Tests:**
- What's not tested: `frontend/src/` has no test files. React components, context providers (`AuthContext.jsx`, `FeatureFlagContext.jsx`), and API utility (`utils/api.js`) are all untested.
- Files: All of `frontend/src/`
- Risk: UI regressions go undetected. The token refresh/retry logic in `frontend/src/utils/api.js` is complex and untested.
- Priority: Medium

---

*Concerns audit: 2026-02-25*
