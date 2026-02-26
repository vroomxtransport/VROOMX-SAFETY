# External Integrations

**Analysis Date:** 2026-02-25

## APIs & External Services

**Payments & Billing:**
- Stripe - Subscription management, checkout, customer portal, metered billing
  - SDK/Client: `stripe` ^20.2.0
  - Auth: `STRIPE_SECRET_KEY` (backend env var)
  - Webhook secret: `STRIPE_WEBHOOK_SECRET`
  - Plans: owner_operator, small_fleet, fleet_pro (monthly + annual price IDs each)
  - Extra driver metered billing: `STRIPE_SMALL_FLEET_EXTRA_DRIVER_PRICE_ID`, `STRIPE_FLEET_PRO_EXTRA_DRIVER_PRICE_ID`
  - Implementation: `backend/services/stripeService.js`
  - Webhook handler: `POST /api/billing/webhook` (raw body required — JSON parsing skipped in `backend/server.js`)
  - Events handled: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `customer.subscription.trial_will_end`, `invoice.payment_succeeded/failed`, `invoice.finalization_failed`
  - Idempotency: `WebhookEvent` model (`backend/models/WebhookEvent.js`) prevents duplicate processing

**AI - Document Extraction:**
- OpenAI GPT-4 Vision - Extracts data from DOT documents (medical cards, CDLs, inspection reports, drug tests, maintenance invoices)
  - SDK/Client: `openai` ^6.16.0
  - Auth: `OPENAI_API_KEY`
  - PDFs: Uses Responses API (`openai.responses.create()` with `input_file`)
  - Images: Uses Chat Completions (`image_url`)
  - Implementation: `backend/services/openaiVisionService.js`

**AI - Compliance Q&A:**
- Anthropic Claude - Primary model for compliance Q&A, DQF analysis, driver coaching
  - SDK/Client: `@anthropic-ai/sdk` ^0.71.2
  - Auth: `ANTHROPIC_API_KEY`
  - Fallback: OpenAI used if Anthropic key not set
  - Implementation: `backend/services/aiService.js`

**AI - Regulation Assistant:**
- Perplexity Sonar (via OpenRouter) - Live web search for FMCSA regulations
  - Client: OpenAI SDK with `baseURL: 'https://openrouter.ai/api/v1'`
  - Auth: `PERPLEXITY_API_KEY`
  - Headers: `HTTP-Referer: https://vroomxsafety.com`, `X-Title: VroomX Compliance Hub`
  - Falls back to Anthropic/OpenAI if not configured
  - Implementation: `backend/services/aiService.js`

**Fleet Management:**
- Samsara - Vehicle telematics and driver data sync
  - Client: Native `fetch()` to `https://api.samsara.com`
  - Auth: Per-company API key stored in `Integration` model (`backend/models/Integration.js`)
  - Cron sync: Every hour at :30 for companies with `autoSync: true`
  - Implementation: `backend/services/samsaraService.js`

**Email:**
- Resend - All transactional email (welcome, alerts, billing notifications, digest emails, trial reminders)
  - SDK/Client: `resend` ^6.9.1
  - Auth: `RESEND_API_KEY`
  - From: `EMAIL_FROM` env var (default: `VroomX Safety <noreply@vroomxsafety.com>`)
  - Reply-To: `EMAIL_REPLY_TO` env var (default: `support@vroomxsafety.com`)
  - Fire-and-forget pattern; logs to `EmailLog` model (`backend/models/EmailLog.js`)
  - HTML templates in `backend/templates/` with `_layout.html` wrapper
  - Implementation: `backend/services/emailService.js`

**Analytics:**
- PostHog - Product analytics (both frontend and backend)
  - Backend SDK: `posthog-node` ^5.24.10; auth: `POSTHOG_API_KEY`, host: `POSTHOG_HOST`
  - Frontend SDK: `posthog-js` ^1.342.0; auth: `VITE_POSTHOG_KEY`, host: `VITE_POSTHOG_HOST`
  - Backend implementation: `backend/services/posthogService.js` (fire-and-forget, never throws)
  - Frontend implementation: `frontend/src/utils/analytics.js` (named event helpers)
  - Frontend init: `frontend/src/main.jsx`
  - Events tracked: subscriptions, payments, CRUD operations, AI usage, compliance report generation

## Data Storage

**Databases:**
- MongoDB - Primary database for all application data
  - Connection: `MONGODB_URI` env var
  - Client: Mongoose 8.0.3 ODM
  - 38 models in `backend/models/`
  - All models scoped by `companyId` for multi-tenant isolation
  - Config: `backend/config/database.js`
  - Audit log TTL: 2 years on `AuditLog` model

**File Storage:**
- Local filesystem - Uploaded documents stored on the server
  - Path: `backend/uploads/{category}/`
  - Filenames: UUID-based to prevent enumeration
  - Max size: 10MB (`MAX_FILE_SIZE` env var)
  - Served only via authenticated `GET /api/documents/:id/download` (no direct static access)
  - Note: Local storage on Render free tier means files lost on redeploy; no cloud storage (S3/GCS) configured

**Caching:**
- Redis (optional) - Distributed rate limiting across multiple server instances
  - Client: `ioredis` ^5.9.2
  - Connection: `REDIS_URL` env var (optional; falls back to in-memory if not set)
  - Used for: rate limit counters only (`rl:global:` and `rl:auth:` key prefixes)
- In-process Node cache - FMCSA data (6h TTL) via `node-cache` ^5.1.2 in `backend/services/fmcsaService.js`

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based auth (no third-party identity provider)
  - Implementation: `backend/middleware/auth.js`, `backend/routes/auth.js`
  - Tokens stored in httpOnly cookies (auto-sent via `withCredentials: true` on all frontend requests)
  - JWT secret: `JWT_SECRET` (min 32 chars); expiry: `JWT_EXPIRES_IN` (default `2h`)
  - Refresh: `JWT_REFRESH_EXPIRES_IN` (default `7d`)
  - Passwords hashed with `bcryptjs`

## FMCSA Government Data Sources

**FMCSA SAFER Web Scraping:**
- Carrier snapshot: `https://safer.fmcsa.dot.gov/query.asp` — DOT/MC# lookup, carrier profile
- SMS profile: `https://ai.fmcsa.dot.gov/SMS/Carrier/{dot}/Overview.aspx` — CSA BASIC percentile scores
- Method: Puppeteer + Chromium headless browser for JS-rendered pages; Cheerio for static HTML parsing
- Auth: None (public pages); `SAFERWEB_API_KEY` used for some supplemental endpoints
- Caching: 6h in-process cache; `smsBasics.lastUpdated` on `Company` model prevents redundant fetches
- Implementation: `backend/services/fmcsaService.js`

**FMCSA DataHub (Socrata):**
- Source: `https://opendata.transportation.gov` — violation records from FMCSA public datasets
- Auth: `SOCRATA_APP_TOKEN` (optional; improves rate limits from ~10 to 1000 req/hour)
- Implementation: `backend/services/fmcsaInspectionService.js` (step 2 in sync orchestrator)
- Populates: `Violation` model (`backend/models/Violation.js`)

**FMCSA SAFER API (official REST API):**
- Base URL: `FMCSA_API_BASE_URL` env var (default: `https://mobile.fmcsa.dot.gov/qc/services`)
- Auth: `FMCSA_API_KEY` (optional; improves rate limits)
- Implementation: `backend/services/fmcsaSyncService.js`

**FMCSA Drug & Alcohol Clearinghouse:**
- Used for pre-employment and annual query tracking
- Tracked internally in `ClearinghouseQuery` model (`backend/models/ClearinghouseQuery.js`)
- No direct API integration; data entered manually by users

## Monitoring & Observability

**Error Tracking:**
- Not configured (no Sentry, Datadog, or similar)

**Logs:**
- Custom logger at `backend/utils/logger.js` — info/debug suppressed in production, warn/error always on
- Morgan HTTP request logging in development only
- Sensitive fields redacted before logging: password, token, secret, apiKey, authorization, cookie, ssn, creditCard

**Health Check:**
- `GET /health` endpoint — returns DB connectivity status, uptime, environment
- Render uses `healthCheckPath: /health` for health monitoring (`render.yaml`)

## CI/CD & Deployment

**Hosting:**
- Backend: Render.com (`render.yaml`; web service, Oregon region, Node env)
  - Build: `cd backend && npm install`
  - Start: `cd backend && npm start`
  - Health check: `/health`
- Frontend: Netlify (`frontend/netlify.toml`)
  - Build: `npm run build` → publishes `dist/`
  - SPA redirect: all paths → `index.html`
  - API proxy: `/api/*` → `https://vroomx-safety.onrender.com/api/:splat`
  - Static asset caching: `Cache-Control: max-age=31536000, immutable` for `/assets/*`
  - `index.html` explicitly not cached

**CI Pipeline:**
- None detected (no `.github/workflows/`, CircleCI, etc.)

## Webhooks & Callbacks

**Incoming:**
- `POST /api/billing/webhook` - Stripe webhook events (subscription lifecycle, payment events)
  - Signature verified via `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`
  - Raw body preserved (JSON parsing skipped in middleware for this route)
  - Idempotency via `WebhookEvent` model

**Outgoing:**
- None configured

## Environment Configuration

**Required env vars (all environments):**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Minimum 32 characters

**Required in production (server will not start without):**
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_OWNER_OPERATOR_MONTHLY_PRICE_ID`, `STRIPE_SMALL_FLEET_MONTHLY_PRICE_ID`, `STRIPE_FLEET_PRO_MONTHLY_PRICE_ID`
- `RESEND_API_KEY`
- `FRONTEND_URL`

**Optional (features degrade gracefully):**
- `ANTHROPIC_API_KEY` - Claude AI; falls back to OpenAI
- `OPENAI_API_KEY` - GPT-4 Vision document extraction
- `PERPLEXITY_API_KEY` - Live regulation search via OpenRouter
- `POSTHOG_API_KEY` - Analytics tracking
- `REDIS_URL` - Distributed rate limiting; falls back to in-memory
- `SAFERWEB_API_KEY` - FMCSA SAFER API; FMCSA sync disabled without it
- `SOCRATA_APP_TOKEN` - DataHub violation data; reduced rate limits without it
- `FMCSA_API_KEY` - Official FMCSA REST API rate limit improvement

**Secrets location:**
- `.env` file in `backend/` (gitignored); `.env.example` documents all variables
- Render dashboard for production secrets (auto-generated JWT_SECRET via `generateValue: true`)
- Frontend secrets: Netlify environment variables (prefixed `VITE_`)

---

*Integration audit: 2026-02-25*
