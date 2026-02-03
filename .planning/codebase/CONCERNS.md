# Codebase Concerns

**Analysis Date:** 2026-02-03

## Tech Debt

**Legacy Multi-Company Migration**
- Issue: Codebase still supports old single-company structure (`companyId` field) alongside new multi-company structure (`companies[]` array and `activeCompanyId`). This creates parallel code paths and potential for desynchronization.
- Files: `backend/middleware/auth.js` (lines 128-173), `backend/models/User.js`, all route files
- Impact: Difficult to maintain. New developers must understand dual structure. Risk of permissions bypass if legacy and new paths diverge.
- Fix approach: Complete migration of all users from legacy to new structure, then remove legacy code paths from auth middleware and models.

**Oversized Route Files**
- Issue: Several route files exceed 2000 lines, creating single points of maintenance.
- Files:
  - `backend/routes/admin.js` (2041 lines) - super admin panel, user/company management, bulk operations
  - `backend/routes/auth.js` (842 lines) - login, register, password reset, profile
  - `backend/routes/dashboard.js` (797 lines) - CSA tracking, FMCSA sync, compliance scores
  - `backend/routes/maintenance.js` (698 lines) - maintenance record CRUD, smart upload
- Impact: Difficult to navigate, test, and modify. Cognitive overhead for new developers.
- Fix approach: Split into domain-specific sub-routers (e.g., `/api/admin/users`, `/api/admin/companies`, `/api/auth/*`) over multiple sprints.

**Fire-and-Forget Email Service**
- Issue: Email sending never throws and uses `.catch()` to swallow errors. Failed emails are only logged to console, not persisted.
- Files: `backend/services/emailService.js` (lines 88-125), `backend/routes/auth.js` (password reset), `backend/services/stripeService.js` (payment notifications)
- Impact: Users may never know registration or password reset emails failed. Stripe payment notifications may silently fail to send, leaving users confused about subscription status.
- Fix approach: Add EmailLog database tracking (already exists). Implement retry queue for critical emails (registration, password reset, payment confirmations). Add alerting for email delivery failures.

**Puppeteer Browser Instance Lifecycle**
- Issue: Global `browserInstance` variable in `backend/services/fmcsaService.js` persists across requests. No explicit connection cleanup or connection pool management.
- Files: `backend/services/fmcsaService.js` (lines 13-14, 286-310)
- Impact: Browser process may leak memory if connections fail or timeout. In cloud environments (Render), each deployment restart leaks the browser process.
- Fix approach: Implement explicit connection timeout, health checks every 5 minutes, and graceful restart on stale connections. Consider using chromium-in-cloud service instead.

**Uncontrolled File Upload Sizing**
- Issue: Upload file size limit is 10MB but no explicit quota per user/company/month. Storage is unlimited local filesystem.
- Files: `backend/middleware/upload.js`, `backend/routes/documents.js`, `backend/routes/maintenance.js`
- Impact: Malicious users can exhaust disk space. No billing/metering for storage usage even though it's a per-resource constraint.
- Fix approach: Add storage quota per company tier (e.g., 1GB for solo, 10GB for fleet, 100GB for pro). Implement automated purging of old uploads. Monitor disk usage on production.

---

## Known Bugs

**Subscription Status Not Synced on Token Refresh**
- Symptoms: User cancels subscription or payment fails, but remains logged in with cached old plan data until browser refresh.
- Files: `backend/middleware/auth.js` (lines 56-63), `frontend/src/context/AuthContext.jsx`
- Trigger: Cancel subscription → stay logged in → subscription page still shows old plan until page refresh
- Workaround: Refresh browser. Proper fix: Sync subscription status on every API request (add subscription check after protect middleware).

**Race Condition on Driver Limit Check (Mitigated but Not Eliminated)**
- Symptoms: Two concurrent requests to create drivers can both pass the middleware check before the database creates records, allowing one extra driver on solo/free plans.
- Files: `backend/middleware/subscriptionLimits.js` (lines 54-58, 154-155), `backend/routes/drivers.js` (lines 241-305), `backend/routes/vehicles.js` (lines 158-200)
- Trigger: Simultaneous driver creation requests on solo plan
- Current mitigation: Route handlers use MongoDB transactions to re-check before insert. However, middleware check can still mislead frontend.
- Better fix: Remove middleware check entirely for hard-limit plans; only check in route handler within transaction.

**AI Query Quota Not Counted on All Paths**
- Symptoms: AI quota checked in middleware but not incremented on all API calls that use Claude/OpenAI.
- Files: `backend/middleware/subscriptionLimits.js` (checkAIQueryQuota), `backend/services/aiService.js`, `backend/routes/ai.js`, `backend/routes/documents.js` (smart upload)
- Impact: Users might consume more queries than quota allows without being throttled.
- Fix approach: Instrument every AI API call with usage tracking via `aiUsageService.incrementQuery()` before calling AI APIs, not after.

**Maintenance Mode Doesn't Queue Requests**
- Symptoms: Maintenance mode returns 503 to all requests. If admin forgets to disable it, users get stuck and can't recover state.
- Files: `backend/middleware/maintenance.js`, `frontend/src/utils/api.js` (lines 48-52)
- Trigger: Admin enables maintenance mode and forgets to disable it
- Workaround: Direct database query to disable maintenance mode. Proper fix: Add auto-disable after 24 hours; queue user requests during maintenance; send email to admin.

---

## Security Considerations

**localStorage for Auth Token (XSS Risk)**
- Risk: Frontend stores JWT in localStorage as fallback (`frontend/src/utils/api.js`, lines 13-27). localStorage is vulnerable to XSS; httpOnly cookies mitigate, but token stored in memory can be extracted by injected scripts.
- Files: `frontend/src/utils/api.js`, `frontend/src/context/AuthContext.jsx`
- Current mitigation: httpOnly cookie is primary; localStorage is fallback for legacy browsers.
- Recommendations: Migrate fully to httpOnly cookies. Sanitize all user inputs (already done with DOMPurify for blog articles, but check all other forms). Add Content Security Policy (CSP) with `script-src 'self'` to block inline scripts.

**super_admin Role Bypass in Legacy Structure**
- Risk: `backend/middleware/auth.js` (line 124) checks `req.user.role === 'super_admin'` for old structure, bypassing company isolation. If legacy structure is used, super_admin can access all companies. New multi-company structure uses `isSuperAdmin` flag which is safer.
- Files: `backend/middleware/auth.js` (lines 122-126)
- Current mitigation: `isSuperAdmin` is now the standard. Legacy role field is deprecated but still checked.
- Recommendations: Audit all users to ensure super_admin role is NOT set; only `isSuperAdmin` flag should grant admin access. Add validation to prevent accidental super_admin role assignment.

**CSV Export Not Paginated**
- Risk: Dashboard and report exports retrieve ALL records in memory, then serialize to CSV. Large datasets (10k+ violations) can cause OOM or performance spike.
- Files: `frontend/src/pages/Compliance.jsx`, `frontend/src/pages/CSATrends.jsx`, `backend/routes/dashboard.js` (export endpoints if any)
- Impact: Potential DOS attack vector; large exports could crash backend.
- Recommendations: Paginate CSV export (stream results in chunks). Set max rows per export (e.g., 10k). Add timeout for exports (30s).

**No Input Validation on Search/Filter Strings**
- Risk: User-provided search strings in violations, drivers, vehicles, etc. are escaped via `escapeRegex()` but regex is still built and executed on large result sets.
- Files: Most route files use regex search. `backend/routes/violations.js`, `backend/routes/drivers.js` (search)
- Impact: Regex DOS (ReDoS) attack if malicious user crafts complex regex pattern.
- Recommendations: Use MongoDB text search indexes instead of regex. Set max string length (e.g., 100 chars). Use regex timeout (library like `safe-regex`).

**Stripe Webhook Signature Not Validated on Every Provider**
- Risk: Stripe webhook at `/api/billing/webhook` requires raw body (not JSON-parsed). Signature validation is critical but could be missed in deployment if middleware order changes.
- Files: `backend/server.js` (line 135-136), `backend/routes/billing.js` (webhook handler)
- Current mitigation: Middleware order carefully documented.
- Recommendations: Add unit test that confirms raw body is passed to webhook handler. Add assertion in webhook handler to prevent processing if signature is not validated.

---

## Performance Bottlenecks

**Unbounded FMCSA SAFER Scraping on Every User Login**
- Problem: Dashboard auto-refreshes FMCSA data on every visit if data >6 hours old. If fleet has 100 carriers, this triggers 100 Puppeteer browser page loads sequentially.
- Files: `backend/routes/dashboard.js` (refresh endpoint), `backend/services/fmcsaService.js`
- Cause: Sequential page navigation; no concurrency limits.
- Improvement path: Queue FMCSA lookups with rate limiting (1 per second). Use cache aggressively (extend TTL to 24 hours for inactive carriers). Deduplicate requests across users (one shared lookup for all users of same DOT).

**N+1 Query on Driver List with Vehicle References**
- Problem: Driver list endpoint loads drivers, then loads vehicles for each driver separately (`lean()` not used everywhere).
- Files: `backend/routes/drivers.js` (getAll endpoint line 15-50)
- Cause: Mongoose populate not used; manual vehicle fetch in loop.
- Improvement path: Use `.populate('vehicles')` or explicit `.lean()` with separate aggregation pipeline.

**Alert Generation Cron Runs on Every 6 Hours for All Companies**
- Problem: Every 6 hours at 6 AM, `backend/server.js` runs alert generation for all companies. If 1000 companies exist, this could take hours.
- Files: `backend/server.js` (cron jobs, lines ~200+), `backend/services/alertService.js`
- Cause: Synchronous processing; no parallelization or queuing.
- Improvement path: Use distributed job queue (Bull Redis queue). Process alerts in parallel (10 at a time). Make cron time configurable per company or stagger by company ID.

**CSA Estimator Recalculates Full History on Every Request**
- Problem: CSA estimator recalculates weighted severity from all violations every request, even if data hasn't changed.
- Files: `backend/services/fmcsaInspectionService.js` (calculateWeightedSeverity)
- Cause: No caching of calculation results.
- Improvement path: Cache CSA score on the Company model. Invalidate cache only when new violations added or violation is deleted. Use Redis for per-request caching.

---

## Fragile Areas

**Data Integrity Service Not Audited**
- Files: `backend/services/dataIntegrityService.js` (721 lines)
- Why fragile: Performs multi-collection updates (cascade updates to violations, CSA scores, etc.) without transaction wrapping. If one update fails mid-process, data becomes inconsistent.
- Safe modification: All bulk updates must use MongoDB transactions. Add comprehensive logging of before/after state.
- Test coverage: No test cases for data integrity service. Manual testing only.

**Email Template Rendering with String Replacement**
- Files: `backend/services/emailService.js` (renderTemplate function, lines 47-69)
- Why fragile: Template variables are replaced via regex. If a variable appears in template content twice by accident, both get replaced. No validation that all required variables are provided.
- Safe modification: Use a templating engine (Handlebars, EJS) instead of regex. Pre-validate template structure.
- Test coverage: No tests for template rendering.

**Admin Cascade Delete Without Audit**
- Files: `backend/routes/admin.js` (cascadeDeleteCompany function, lines 26-66)
- Why fragile: Deletes all related data in parallel without transaction. If cascade fails mid-way, orphaned data remains. No audit log of what was deleted.
- Safe modification: Wrap entire cascade in MongoDB session/transaction. Audit log the deletion. Soft-delete (archive) instead of hard delete for compliance.
- Test coverage: No test cases.

**Samsara Sync Upsert Logic**
- Files: `backend/services/samsaraService.js` (syncVehicleTelematics, syncDriverDvirs, syncAll functions)
- Why fragile: Creates or updates records from external API without deduplication logic. If Samsara record ID changes or timestamp drifts, could create duplicates.
- Safe modification: Query existing record by Samsara ID + company + vehicle ID before upsert. Log all upsert decisions.
- Test coverage: Integration tests with mock Samsara API required.

---

## Scaling Limits

**MongoDB Connection Pool Not Configured**
- Current capacity: Default Mongoose connection pool (5 connections) on single production server.
- Limit: ~50 concurrent requests before connection queue backs up. After ~30s wait, requests timeout.
- Files: `backend/config/database.js`
- Scaling path: Increase pool size to 20 for single-server. If adding read replicas, use connection pooling proxy (PgBouncer-like for MongoDB). Monitor connection count on Render dashboard.

**Stripe Metered Billing Updates Sequential**
- Current capacity: Driver usage reported to Stripe one-by-one as drivers are created.
- Limit: If user adds 50 drivers at once, 50 Stripe API calls in series. Each takes ~200ms = 10 seconds of API calls.
- Files: `backend/middleware/subscriptionLimits.js` (reportDriverUsage, line 141)
- Scaling path: Batch usage updates (report once per minute if N drivers added). Use Stripe batch API (if available) or queue usage reports in Redis.

**Search Indexes Not Defined on All Indexed Queries**
- Current capacity: Regex search on driver name, vehicle VIN, etc. without indexes. Scans entire collection on each search.
- Limit: Slow at 50k+ records.
- Files: `backend/routes/drivers.js`, `backend/routes/vehicles.js`
- Scaling path: Add `db.drivers.createIndex({ firstName: 'text', lastName: 'text' })` and use MongoDB text search instead of regex. Add compound indexes for common filters (companyId + status).

**Frontend Bundle Size**
- Current capacity: Main bundle ~450KB gzipped (includes Recharts, jsPDF, React PDF).
- Limit: Takes 3+ seconds to load on slow 4G connections. Code splitting not aggressive.
- Files: `frontend/vite.config.js`
- Scaling path: Add dynamic imports for admin pages, CSA estimator, report generation. Defer non-critical charts until page interaction.

---

## Dependencies at Risk

**Puppeteer-Core EOL Risk**
- Risk: `@sparticuz/chromium` (Puppeteer wrapper for serverless) is community-maintained. If maintainer abandons it, will be incompatible with new Chrome versions.
- Impact: FMCSA lookups will fail. Roadside inspection report uploads won't work.
- Current mitigation: Falls back to local Puppeteer binary if not in cloud.
- Migration plan: Switch to Playwright (better maintained, official serverless support via `@playwright/test`). OR pre-render carrier snapshots once daily and cache.

**OpenAI Vision API Breaking Changes**
- Risk: OpenAI Responses API (used for PDF document extraction) is new and may change pricing/endpoints in next 12 months.
- Impact: Smart maintenance upload and inspection report upload will fail.
- Current mitigation: Error handling in place.
- Migration plan: Add fallback to Claude 3.5 Sonnet's vision API for document extraction. OR build local OCR pipeline with Tesseract.

**Node-Cron Doesn't Persist Across Restarts**
- Risk: In-memory cron jobs are lost if server restarts. Alert generation and email digests won't run until server comes back up.
- Impact: Alerts delayed by hours if deployment downtime occurs.
- Current mitigation: None.
- Migration plan: Move cron jobs to external scheduler (GitHub Actions, AWS EventBridge, or Bull Redis Queue). Current approach is unsuitable for production multi-instance deployment.

---

## Missing Critical Features

**No Request Rate Limiting per User**
- Problem: Rate limits are IP-based and global (200/15min). Multi-user corporate networks (behind NAT) could collectively exceed limits. Malicious users from same IP are blocked together.
- Blocks: Can't enforce per-user quotas fairly. Can't prevent one user from consuming all server resources.
- Files: `backend/server.js` (lines 110-145)
- Priority: **Medium** - affects multi-seat customers more than SMBs.

**No Scheduled Report Delivery**
- Problem: Reports must be manually downloaded. No email delivery or scheduled PDF generation.
- Blocks: Enterprise customers expect weekly compliance reports via email.
- Files: `backend/models/ScheduledReport.js` exists but never used in routes.
- Priority: **Medium** - low-code to implement, high customer value.

**No Multi-Language Support**
- Problem: All UI and emails hardcoded in English.
- Blocks: International expansion beyond English-speaking markets.
- Files: All frontend components, all email templates.
- Priority: **Low** - nice-to-have for future.

---

## Test Coverage Gaps

**No API Integration Tests**
- What's not tested: End-to-end auth flow (register → login → create driver → upload document). Subscription upgrade flow. Stripe webhook handling. Email delivery.
- Files: No test directory in backend. 42 node_modules test files exist but no app tests.
- Risk: Regression on critical paths goes undetected until production.
- Priority: **High** - add Jest test suite for at least auth, drivers, subscriptions, billing.

**No Middleware Unit Tests**
- What's not tested: Auth middleware with multi-company structure. Subscription limit enforcement. Error handler. File upload validation.
- Files: `backend/middleware/*.js` - no corresponding `.test.js` files.
- Risk: Auth bypass or permission leaks if middleware logic changes.
- Priority: **High** - auth middleware is security-critical.

**No Frontend Component Tests**
- What's not tested: AuthContext with subscription changes. Driver list pagination. Form validation. Error boundary.
- Files: `frontend/src/**/*.jsx` - no test files exist.
- Risk: UI bugs (broken buttons, missing data, infinite loops) not caught until production.
- Priority: **Medium** - add React Testing Library tests for core pages and components.

**No Load Testing**
- What's not tested: Dashboard with 50k+ drivers. Alert generation at scale. Concurrent driver creation. File uploads during FMCSA sync.
- Impact: Unknown if system can handle 100 concurrent users or if DB queries timeout.
- Priority: **Medium** - run k6 load test against staging environment before scaling to 100+ paying customers.

---

*Concerns audit: 2026-02-03*
