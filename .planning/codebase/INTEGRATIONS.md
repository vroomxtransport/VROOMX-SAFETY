# External Integrations

**Analysis Date:** 2026-02-03

## Payment & Billing

**Stripe:**
- **Purpose:** Subscription management and payment processing
- **SDK/Client:** `stripe` v20.2.0
- **Auth:** `STRIPE_SECRET_KEY` env var
- **Key Features:**
  - Checkout sessions for subscription signup
  - Customer portal for subscription management
  - Webhook handling at `POST /api/billing/webhook` (requires raw body for signature verification)
  - Three-tier subscription plans:
    - Solo: $19/month, 1 driver max
    - Fleet: $39/month, 3 included drivers, $6/extra
    - Pro: $89/month, 10 included drivers, $5/extra
  - Metered billing for extra drivers (usage records)
  - Proration support for plan upgrades
- **Location:** `backend/services/stripeService.js` (237 lines)
- **Webhook Events Handled:**
  - `checkout.session.completed` - Create subscription record
  - `customer.subscription.created` / `customer.subscription.updated` - Sync subscription state
  - `customer.subscription.deleted` - Reset to free trial
  - `invoice.payment_succeeded` - Resolve past_due status
  - `invoice.payment_failed` - Mark subscription as past_due
- **Database:** User model stores `stripeCustomerId`, `subscription` object with plan/status/dates

## AI & Document Intelligence

**OpenAI (Vision & Document Extraction):**
- **Purpose:** Document classification and data extraction from images and PDFs
- **SDK/Client:** `openai` v6.16.0
- **Auth:** `OPENAI_API_KEY` env var
- **Model:** GPT-4o
- **Key Features:**
  - Image classification (PNG, JPG, GIF, WebP via Chat Completions API)
  - PDF extraction via Responses API (input_file content type)
  - Document type detection (medical_card, cdl, inspection_report, drug_test, etc.)
  - Structured data extraction with JSON responses
  - Multi-page document analysis
- **Location:** `backend/services/openaiVisionService.js` (586 lines)
- **Extraction Types:**
  - Medical_card (DOT medical examiner certificates)
  - CDL (Commercial driver licenses)
  - Inspection_report (DOT roadside inspections)
  - Drug_test (Drug and alcohol test results)
  - Maintenance_invoice (Work orders and repair receipts)
  - Generic (fallback for unknown documents)
- **Usage Tracking:** Token counts stored with extraction results
- **Enabled Check:** Returns null/error if `OPENAI_API_KEY` not set

**Anthropic (Compliance Q&A & Analysis):**
- **Purpose:** FMCSA compliance guidance, DQF analysis, CSA risk analysis, DataQ challenge generation
- **SDK/Client:** `@anthropic-ai/sdk` v0.71.2
- **Auth:** `ANTHROPIC_API_KEY` env var
- **Model:** claude-sonnet-4-20250514 (configurable)
- **Key System Prompts:**
  - `regulationAssistant` - FMCSA CFR guidance (391, 382, 395, 396, 393, 390)
  - `dqfAnalyzer` - Driver Qualification File compliance per 49 CFR §391.51
  - `csaAnalyzer` - CSA/SMS risk profiling with BASIC thresholds
  - `dataQChallengeAnalyzer` - Violation challengeability analysis (returns JSON)
  - `dataQLetterGenerator` - Professional DataQ challenge letter drafting
- **Location:** `backend/services/aiService.js` (446 lines)
- **API Methods:**
  - `query(promptType, userMessage, options)` - Generic query execution
  - `analyzeDQF(driverData)` - Driver file compliance check
  - `analyzeCSARisk(violationData)` - CSA score risk assessment
  - `generateDataQChallenge(challengeData)` - Challenge letter generation
  - `analyzeDataQChallenge(violationData)` - Challengeability analysis (JSON)
  - `generateDataQLetter(letterData)` - Professional letter with CFR citations
- **Usage Tracking:** Input/output token counts returned with responses

## Email & Communications

**Resend:**
- **Purpose:** Transactional and marketing email delivery
- **SDK/Client:** `resend` v6.9.1
- **Auth:** `RESEND_API_KEY` env var
- **From Address:** `EMAIL_FROM` env var (default: `VroomX Safety <noreply@vroomxsafety.com>`)
- **Reply-To:** `EMAIL_REPLY_TO` env var (default: `support@vroomxsafety.com`)
- **Location:** `backend/services/emailService.js` (666 lines)
- **Fire-and-Forget Pattern:** Never throws; logs failures silently to `EmailLog` model
- **Template Engine:** Custom render function with {{variable}} substitution and layout wrapping
- **Email Templates:**
  - `welcome` - Post-registration
  - `email-verification` - Email verification with token link
  - `password-reset` - Password reset link
  - `password-reset-confirmation` - Confirmation after reset
  - `payment-success` - Invoice receipt
  - `payment-failed` - Payment failure notification
  - `trial-ending` - Trial ending reminder (days remaining)
  - `company-invitation` - Company invite with accept token
  - `compliance-alert-digest` - Daily alert summary
  - `csa-report` - CSA score report with PDF attachment
  - `report` - Generic report delivery with attachment
- **Email Categories:** `transactional`, `billing`, `compliance`, `report` (user preferences honored except transactional)
- **Logging:** All sends logged to `EmailLog` model with status, template name, userId, companyId
- **Attachment Support:** PDF buffers with custom filenames

**Nodemailer (Optional Alternative):**
- **Purpose:** SMTP email fallback
- **SDK/Client:** `nodemailer` v6.9.7
- **Status:** Available but Resend is primary

## Database

**MongoDB:**
- **Purpose:** Primary data store for all application data
- **Connection:** Mongoose 8.0.3 ODM
- **URI:** `MONGODB_URI` env var (required)
- **Location:** `backend/config/database.js`
- **Collections:**
  - Users (multi-company support via `companies[]` array)
  - Companies
  - Drivers
  - Vehicles
  - Violations
  - Documents
  - MaintenanceRecords
  - SamsaraRecords
  - Alerts
  - AuditLogs (2-year TTL)
  - CSAScoreHistory
  - FMCSAInspections
  - EmailLogs
  - ChecklistTemplates, ChecklistAssignments
  - Tasks, Announcements
  - FeatureFlags, SystemConfig
- **Tenant Isolation:** Every collection includes `companyId` field indexed for multi-tenancy
- **Connection Events:** Auto-reconnect, graceful shutdown on SIGINT
- **Validation:** Mongoose schemas enforce data integrity

## FMCSA & Regulatory Data

**SAFER Web Scraping (FMCSA Carrier Data):**
- **Purpose:** Real-time CSA scores and carrier compliance snapshot
- **Scraping Technology:**
  - Puppeteer Core 24.35.0 (headless browser)
  - @sparticuz/chromium 143.0.4 (serverless chromium)
  - Cheerio 1.1.2 (HTML parsing)
- **URLs Scraped:**
  - `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${DOT_NUMBER}` (carrier data)
  - `https://ai.fmcsa.dot.gov/SMS/Carrier/${DOT_NUMBER}/Overview.aspx` (SMS/CSA profile page)
- **Location:** `backend/services/fmcsaService.js` (100+ lines)
- **Data Extracted:**
  - BASIC percentile scores (Unsafe Driving, HOS Compliance, Vehicle Maintenance, Controlled Substances, Driver Fitness, Hazmat, Crash Indicator)
  - Inspection counts (24-month history)
  - Crash counts
  - BASIC intervention thresholds
  - Risk level calculation
- **Caching:** 6-hour TTL via node-cache (FMCSA data updates weekly)
- **Optional API:** `FMCSA_API_KEY` and `FMCSA_API_BASE_URL` env vars for direct API access (not primary)

**SaferWeb API (Inspection Data Sync):**
- **Purpose:** Sync roadside inspection violation data
- **Auth:** `SAFERWEB_API_KEY` env var
- **Status:** Optional integration

## Fleet Management Integration

**Samsara API:**
- **Purpose:** Sync driver and vehicle data from Samsara fleet management platform
- **API Base:** `https://api.samsara.com`
- **Auth:** Bearer token (API key in Samsara account)
- **SDK/Client:** Native `fetch` API (no SDK)
- **Location:** `backend/services/samsaraService.js` (80+ lines)
- **Endpoints Used:**
  - `GET /fleet/drivers` - Fetch all drivers
  - `GET /fleet/vehicles` - Fetch all vehicles
  - Additional endpoints available in Samsara SDK
- **Database Model:** `SamsaraRecord` model stores sync metadata
- **Validation:** Validates API key before sync operations

## Web Scraping & HTML Processing

**Puppeteer Core:**
- **Purpose:** Headless browser automation for JavaScript-heavy pages (FMCSA SMS)
- **Package:** `puppeteer-core` 24.35.0 + `@sparticuz/chromium` 143.0.4
- **Use Case:** Extract CSA scores from SAFER portal
- **Browser Pool:** Reused browser instance for efficiency

**Cheerio:**
- **Purpose:** Fast jQuery-like HTML parsing
- **Package:** `cheerio` 1.1.2
- **Use Case:** Extract data from scraped HTML pages (FMCSA SAFER snapshots)

## Caching & Performance

**Node-Cache:**
- **Purpose:** In-memory caching of frequently-accessed data
- **Package:** `node-cache` v5.1.2
- **TTL:** 6 hours (3600 seconds) for FMCSA carrier data
- **Use:** Avoid repeated scrapes of SAFER portal

## Webhooks & Callbacks

**Incoming Webhooks:**

**Stripe Webhook:**
- **Endpoint:** `POST /api/billing/webhook`
- **Authentication:** HMAC-SHA256 signature verification using `STRIPE_WEBHOOK_SECRET`
- **Events:** checkout.session.completed, customer.subscription.*, invoice.payment_*
- **Body Handling:** Raw body required (not JSON-parsed by Express middleware)
- **Location:** `backend/routes/billingRoutes.js` or similar

**Outgoing Webhooks:**
- Not detected in current codebase

## Security & Authentication

**JWT (JSON Web Tokens):**
- **Library:** `jsonwebtoken` v9.0.2
- **Secret:** `JWT_SECRET` env var (minimum 32 characters)
- **Token Lifetime:** `JWT_EXPIRES_IN` (default: 2h)
- **Refresh Tokens:** `JWT_REFRESH_EXPIRES_IN` (default: 7d)
- **Storage:** httpOnly cookies (auto-sent by Axios with `withCredentials: true`)
- **Validation:** Backend `protect` middleware validates on every request
- **Location:** `backend/middleware/auth.js`

**Password Security:**
- **Hashing:** bcryptjs v2.4.3 with salt rounds
- **Storage:** Hashed in User model
- **Verification:** Used in login and password reset flows

**Input Validation:**
- **Library:** `express-validator` v7.0.1
- **Pattern:** All route handlers validate user input before processing
- **Sanitization:** HTML escaping, regex escaping to prevent NoSQL injection

## Rate Limiting

**Express-Rate-Limit:**
- **Library:** `express-rate-limit` v8.2.1
- **Global Limit:** 200 requests per 15 minutes (per IP)
- **Auth Limit:** 15 requests per 15 minutes (per IP + email combination)
- **Configuration:** Applied at Express middleware level before routes
- **Location:** `backend/server.js`

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, LogRocket, etc.)
- Errors logged to console in development
- Error responses sanitized in production

**Logging:**
- **HTTP Requests:** Morgan v1.10.0 in development only
- **Audit Trail:** `auditService` logs all CRUD operations to `AuditLog` model
- **Email Logging:** `EmailLog` model stores all email send attempts (success/failure)
- **Location:** `backend/services/auditService.js`, `backend/services/emailService.js`

## File Storage & Uploads

**Local Filesystem:**
- **Purpose:** Store uploaded files (documents, maintenance receipts)
- **Path:** `./uploads/` (configurable via `UPLOAD_PATH` env var)
- **Structure:** Organized by category (e.g., `uploads/documents/`, `uploads/maintenance/`)
- **File Naming:** UUID-based to prevent collisions and path traversal
- **Size Limit:** 10MB per file (configurable via `MAX_FILE_SIZE` env var)
- **Validation:** MIME type + file extension checks
- **Library:** Multer v1.4.5-lts.1
- **Note:** For production, recommend S3 or similar cloud storage with env var override

---

*Integration audit: 2026-02-03*
