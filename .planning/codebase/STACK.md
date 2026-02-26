# Technology Stack

**Analysis Date:** 2026-02-25

## Languages

**Primary:**
- JavaScript (ES2022+) - All backend and frontend code
- CommonJS modules (backend) - `require()` / `module.exports` throughout `backend/`
- ES Modules (frontend) - `import`/`export` throughout `frontend/src/`

**Secondary:**
- HTML - Email templates in `backend/templates/`, index at `frontend/index.html`
- CSS - Tailwind utility classes generated at build time; no separate `.css` files in `src/`

## Runtime

**Environment:**
- Node.js >= 18.0.0 (required; specified in `backend/package.json` `engines` field)

**Package Manager:**
- npm (both `backend/` and `frontend/`)
- Lockfiles: `backend/package-lock.json` and `frontend/package-lock.json` both present

## Frameworks

**Backend Core:**
- Express 4.18.2 - HTTP server, REST API (`backend/server.js`)
- Mongoose 8.0.3 - MongoDB ODM, all models in `backend/models/`

**Frontend Core:**
- React 18.2.0 - UI component framework (`frontend/src/`)
- React Router DOM 6.21.0 - Client-side routing (`frontend/src/App.jsx`)
- Vite 5.0.8 - Dev server + build tool (`frontend/vite.config.js`)

**Styling:**
- Tailwind CSS 3.3.6 - Utility-first CSS (`frontend/tailwind.config.js`)
- PostCSS 8.4.32 - CSS processing (`frontend/postcss.config.js`)
- Custom design tokens: Navy blue primary (`#1E3A5F`), CTA orange (`#EA580C`), semantic success/warning/danger/info scales

**Testing:**
- Jest 30.2.0 - Backend unit test runner (`backend/`)
- No frontend test framework detected

**Build/Dev:**
- Vite `@vitejs/plugin-react` 4.2.1 - React fast refresh + JSX transform
- Nodemon 3.0.2 - Backend auto-reload in development
- ESLint 9.39.2 - Frontend linting (`eslint-plugin-react`, `eslint-plugin-react-hooks`)

## Key Dependencies

**Critical Backend:**
- `stripe` ^20.2.0 - Subscription billing, webhook handling (`backend/services/stripeService.js`)
- `@anthropic-ai/sdk` ^0.71.2 - Claude AI for compliance Q&A (`backend/services/aiService.js`)
- `openai` ^6.16.0 - Document extraction via GPT-4 Vision + Perplexity via OpenRouter (`backend/services/openaiVisionService.js`, `backend/services/aiService.js`)
- `mongoose` ^8.0.3 - Database access; 38 models in `backend/models/`
- `jsonwebtoken` ^9.0.2 - Auth tokens; httpOnly cookies with `cookie-parser`
- `bcryptjs` ^2.4.3 - Password hashing
- `multer` ^1.4.5-lts.1 - File uploads (10MB limit, MIME validation) to `backend/uploads/{category}/`
- `resend` ^6.9.1 - Transactional email (`backend/services/emailService.js`)
- `posthog-node` ^5.24.10 - Backend analytics tracking (`backend/services/posthogService.js`)

**FMCSA Data Pipeline:**
- `puppeteer-core` ^24.35.0 - Headless Chromium for FMCSA SAFER scraping (`backend/services/fmcsaService.js`)
- `@sparticuz/chromium` ^143.0.4 - Serverless-compatible Chromium binary
- `cheerio` ^1.1.2 - HTML parsing of scraped FMCSA pages
- `fuzzball` ^2.2.3 - Fuzzy name matching for entity linking (`backend/services/entityLinkingService.js`)

**Rate Limiting & Caching:**
- `express-rate-limit` ^8.2.1 - 100 req/30s global, 15 req/30s auth endpoints
- `ioredis` ^5.9.2 - Redis client for distributed rate limiting when `REDIS_URL` set
- `rate-limit-redis` ^4.3.1 - Redis store for rate limiter
- `node-cache` ^5.1.2 - In-process cache for FMCSA data (6h TTL)

**Report Generation:**
- `pdfkit` ^0.17.2 - Programmatic PDF generation
- `puppeteer-core` - Also used for HTML-to-PDF rendering (`backend/services/pdfService.js`)
- `exceljs` ^4.4.0 - Excel export
- `@fast-csv/format` ^5.0.5 - CSV export

**Frontend Critical:**
- `axios` ^1.6.2 - HTTP client with `withCredentials: true` (`frontend/src/utils/api.js`)
- `recharts` ^2.10.3 - Charts and data visualization
- `react-helmet-async` ^2.0.5 - SEO meta tags + JSON-LD schemas
- `dompurify` ^3.3.1 - XSS sanitization for blog content rendering
- `jspdf` ^2.5.1 + `jspdf-autotable` ^3.8.1 - Client-side PDF generation
- `posthog-js` ^1.342.0 - Frontend analytics (`frontend/src/utils/analytics.js`)
- `motion` ^12.34.2 - Framer Motion animations
- `react-hot-toast` ^2.4.1 - Toast notifications

**Scheduling:**
- `node-cron` ^3.0.3 - 7 cron jobs registered in `backend/server.js` at startup

**Security:**
- `helmet` ^7.1.0 - HTTP security headers; full CSP in production
- `cors` ^2.8.5 - Origin whitelist; credentials mode on
- `express-validator` ^7.0.1 - Request input validation
- `uuid` ^9.0.1 - UUID filenames for uploaded files

**Utilities:**
- `date-fns` ^4.1.0 (backend) / ^3.0.6 (frontend) - Date manipulation
- `nodemailer` ^6.9.7 - Present in dependencies but Resend is the active email provider

## Configuration

**Environment:**
- Backend: `.env` file loaded via `dotenv`; `.env.example` at `backend/.env.example`
- Frontend: Vite env vars prefixed `VITE_`; `.env.example` at `frontend/.env.example`
- Required at all times: `MONGODB_URI`, `JWT_SECRET` (min 32 chars)
- Required in production: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, all 3 Stripe price IDs, `RESEND_API_KEY`, `FRONTEND_URL`
- Optional (features degrade gracefully without): `REDIS_URL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `POSTHOG_API_KEY`, `SAFERWEB_API_KEY`, `SOCRATA_APP_TOKEN`, `FMCSA_API_KEY`

**Build:**
- Backend: No build step; runs directly with `node server.js`
- Frontend: `vite build` → outputs to `frontend/dist/`; manual chunk splitting for react, charts, pdf, utils
- Vite dev proxy: `/api/*` → `http://localhost:5001`

## Platform Requirements

**Development:**
- Node >= 18, npm, local MongoDB instance
- Optional: Redis for distributed rate limiting

**Production:**
- Backend: Render.com (configured in `render.yaml`; Oregon region; `cd backend && npm start`)
- Frontend: Netlify (configured in `frontend/netlify.toml`; proxies `/api/*` to `https://vroomx-safety.onrender.com/api/:splat`)
- Database: MongoDB Atlas (external; connection via `MONGODB_URI`)

---

*Stack analysis: 2026-02-25*
