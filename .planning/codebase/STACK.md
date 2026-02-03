# Technology Stack

**Analysis Date:** 2026-02-03

## Languages

**Primary:**
- JavaScript (Node.js) - Backend API, services, scripts
- JavaScript (React 18) - Frontend UI
- JSON - Configuration and data

**Secondary:**
- HTML/CSS - Email templates and styling
- Bash - DevOps scripts

## Runtime

**Environment:**
- Node.js >= 18.0.0 (required)

**Package Managers:**
- npm (Node Package Manager)
- Lock files: `backend/package-lock.json`, `frontend/package-lock.json` (Git-tracked)

## Frameworks & Core Libraries

**Backend:**
- Express.js 4.18.2 - HTTP server and routing
- Mongoose 8.0.3 - MongoDB ODM and schema validation
- Node-cron 3.0.3 - Scheduled jobs (alerts, escalations, trial notifications)

**Frontend:**
- React 18.2.0 - UI component framework
- React Router DOM 6.21.0 - Client-side routing
- Vite 5.0.8 - Build tool and dev server (proxies `/api` to localhost:5001)

## Build & Development Tools

**Frontend:**
- Vite 5.0.8 - Fast dev server with HMR, production bundling
- Tailwind CSS 3.3.6 - Utility-first CSS framework
- PostCSS 8.4.32 - CSS transformations
- Autoprefixer 10.4.16 - Cross-browser CSS prefixes
- ESLint - Code quality (configured in `frontend/package.json`)

**Backend:**
- Nodemon 3.0.2 - Auto-reload on file changes (dev only)

## Key Dependencies

**Security & Auth:**
- bcryptjs 2.4.3 - Password hashing and verification
- jsonwebtoken 9.0.2 - JWT token generation and validation (2-hour expiry, 7-day refresh)
- helmet 7.1.0 - HTTP security headers
- cookie-parser 1.4.7 - Cookie parsing for httpOnly JWT cookies

**API & Data:**
- axios 1.6.2 - HTTP client with credentials support (frontend)
- express-validator 7.0.1 - Input validation and sanitization
- express-rate-limit 8.2.1 - Rate limiting (200/15min global, 15/15min auth per IP+email)
- dotenv 16.3.1 - Environment variable management

**File Handling:**
- multer 1.4.5-lts.1 - Multipart form data / file uploads (10MB limit)
- uuid 9.0.1 - Unique filename generation
- fs (built-in) - File system operations

**PDF Generation:**
- pdfkit 0.17.2 - PDF document creation
- jspdf 2.5.1 - Frontend PDF generation and export
- jspdf-autotable 3.8.1 - Table rendering in PDFs

**AI & Document Processing:**
- @anthropic-ai/sdk 0.71.2 - Claude API for compliance Q&A and DataQ analysis
- openai 6.16.0 - OpenAI GPT-4o for document extraction (images and PDFs via Responses API)
- puppeteer-core 24.35.0 - Headless browser for web scraping
- @sparticuz/chromium 143.0.4 - Chromium binary for serverless environments

**Email & Notifications:**
- resend 6.9.1 - Email delivery API (sends to SMTP)
- nodemailer 6.9.7 - SMTP client (optional alternative)

**Payment:**
- stripe 20.2.0 - Payment processing and subscription management (webhook integration at `/api/billing/webhook`)

**Data Processing:**
- cheerio 1.1.2 - HTML parsing for web scraping
- node-cache 5.1.2 - In-memory caching (6-hour TTL for FMCSA data)
- lodash 4.17.23 - Utility functions
- date-fns 3.0.6 - Date manipulation and formatting

**Logging & Debugging:**
- morgan 1.10.0 - HTTP request logging (dev only)

**UI Components & Visualization:**
- react-hot-toast 2.4.1 - Toast notifications
- react-icons 4.12.0 - Icon library
- react-datepicker 4.25.0 - Date picker component
- recharts 2.10.3 - Chart and graph visualizations
- dompurify 3.3.1 - XSS sanitization for HTML rendering

**Database:**
- MongoDB (external service) - NoSQL document database with company-scoped indices

## Configuration

**Environment Variables (Critical):**

**Server:**
- `PORT` - Backend port (default: 5001)
- `NODE_ENV` - "development" or "production"
- `MONGODB_URI` - MongoDB connection string (required)
- `JWT_SECRET` - Signing key for tokens (minimum 32 characters, **must be generated securely**)
- `JWT_EXPIRES_IN` - Token lifetime (default: 2h)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token lifetime (default: 7d)

**Frontend:**
- `VITE_API_URL` - Backend API URL (used in production; dev uses Vite proxy)

**File Uploads:**
- `MAX_FILE_SIZE` - Maximum upload size in bytes (default: 10485760 = 10MB)
- `UPLOAD_PATH` - Directory for file storage (default: `./uploads`)

**Payment (Stripe):**
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification key
- `STRIPE_SOLO_PRICE_ID` - Price ID for solo plan
- `STRIPE_FLEET_PRICE_ID` - Price ID for fleet plan (3 included drivers, $6/extra)
- `STRIPE_PRO_PRICE_ID` - Price ID for pro plan (10 included drivers, $5/extra)
- `STRIPE_FLEET_EXTRA_DRIVER_PRICE_ID` - Metered billing price ID for fleet overage
- `STRIPE_PRO_EXTRA_DRIVER_PRICE_ID` - Metered billing price ID for pro overage

**AI & Document Processing:**
- `ANTHROPIC_API_KEY` - Claude API key (optional, enables AI compliance Q&A)
- `OPENAI_API_KEY` - OpenAI API key (optional, enables document extraction)

**Email:**
- `RESEND_API_KEY` - Resend email service API key (optional, enables transactional emails)
- `EMAIL_FROM` - Sender email address (default: `VroomX Safety <noreply@vroomxsafety.com>`)
- `EMAIL_REPLY_TO` - Reply-to email address (default: `support@vroomxsafety.com`)

**CORS & Frontend:**
- `FRONTEND_URL` - Comma-separated list of allowed origins (required in production)

**External APIs (Optional):**
- `FMCSA_API_KEY` - FMCSA SAFER API key (optional, for carrier data)
- `FMCSA_API_BASE_URL` - FMCSA API endpoint (default: `https://mobile.fmcsa.dot.gov/qc/services`)
- `SAFERWEB_API_KEY` - SaferWeb API key for inspection data sync

**Configuration Files:**

- `.env` - Local development overrides
- `.env.example` - Template with all required variables at `backend/.env.example`
- Tailwind config: `frontend/tailwind.config.js`
- Vite config: `frontend/vite.config.js`
- ESLint: `frontend/.eslintrc.cjs`

## Platform Requirements

**Development:**
- Node.js >= 18.0.0
- MongoDB instance (local or remote)
- npm or yarn
- Modern browser (Chrome/Edge/Firefox/Safari)

**Production:**
- Node.js runtime (Heroku, Render, AWS Lambda, etc.)
- MongoDB Atlas or self-hosted instance
- Stripe account with webhook configured
- Resend account for email delivery
- OpenAI account (optional, for document extraction)
- Anthropic account (optional, for compliance Q&A)

**Deployment:**
- Backend: Node.js on HTTP port 5001
- Frontend: Static hosting or Node.js serving (Vite build produces `dist/` folder)
- File uploads: Local filesystem (`./uploads/`) or cloud storage (S3, etc.) with env var override
- Database: MongoDB with SSL/TLS connection
- Webhook: Public HTTPS endpoint for Stripe webhook at `/api/billing/webhook` (no JSON parsing)

## Database Schema & Indices

**MongoDB:**
- Database: `trucking_compliance_hub` (from `MONGODB_URI`)
- Collections: Users, Companies, Drivers, Vehicles, Violations, Documents, MaintenanceRecords, Alerts, AuditLogs, CSAScoreHistory, FMCSAInspections, SamsaraRecords, EmailLogs, etc.
- Indices: All models include `companyId` indexed for tenant isolation
- User sessions: Stored in httpOnly cookies (auto-validated on mount)

---

*Stack analysis: 2026-02-03*
