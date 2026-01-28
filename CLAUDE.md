# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (Express.js + MongoDB)
```bash
cd backend
npm install
npm run dev          # nodemon on port 5001
npm start            # production
npm test             # jest
```

### Frontend (React 18 + Vite)
```bash
cd frontend
npm install
npm run dev          # vite dev server on port 5173, proxies /api to localhost:5001
npm run build        # production build
npm run lint         # eslint
```

### Required Environment
- Node >= 18, MongoDB instance
- Backend: `MONGODB_URI`, `JWT_SECRET` (min 32 chars) required; see `backend/.env.example` for full list
- Frontend: `VITE_API_URL` for production (dev uses Vite proxy)

## Architecture

### Backend Middleware Chain (server.js)
Request flow: Helmet → CORS → Rate Limiting (200/15min global, 15/15min auth per IP+email) → Body Parsing (skips JSON for `/api/billing/webhook` to preserve raw body for Stripe signature) → Morgan (dev only) → Maintenance Mode → API Routes → 404 → Error Handler

### Multi-Tenancy / Company Isolation
Users belong to multiple companies via `user.companies[]` array (each with role + granular permissions). `user.activeCompanyId` sets the current context. The `restrictToCompany` middleware sets `req.companyFilter = { companyId }` on every request — all database queries use this filter for tenant isolation. Super admins bypass company checks.

### Auth Middleware Stack
Routes use: `protect` (JWT verify) → `restrictToCompany` (sets companyId filter + role) → optional `checkPermission(resource, action)` or `authorize(...roles)`. Roles: owner, admin, safety_manager, dispatcher, driver, viewer. Permissions are per-company per-resource (drivers.view, vehicles.edit, etc.).

### Route Registration
All routes mount under `/api` via `backend/routes/index.js` (~32 modules). Named routes must come before parameterized `/:id` routes in each file (Express evaluates top-to-bottom).

### Error Handling Pattern
All route handlers wrap with `asyncHandler()` from `backend/middleware/errorHandler.js`. Errors bubble to the global error handler which sanitizes messages in production.

### Audit Logging (Fire-and-Forget)
`auditService.log(req, action, resource, resourceId, details)` — never throws, logs silently on failure. Company-scoped with 2-year TTL. Used in all CRUD routes. Supports field-level diffs via `auditService.diff(before, after)`.

### Subscription & Plan Limits
Billing is per-user (not per-company). Plans: solo (1 driver), fleet (3 included + $6/extra), pro (10 included + $5/extra). `subscriptionLimits.js` middleware enforces limits before resource creation. Stripe webhook at `/api/billing/webhook` requires raw body (not JSON-parsed).

### Frontend Structure
- `App.jsx`: Route definitions with `<ProtectedRoute>` (requires auth), `<PublicRoute>` (redirects if auth'd), `<SuperAdminRoute>` (requires isSuperAdmin)
- `AuthContext.jsx`: Manages user/companies/activeCompany/subscription state; validates session via httpOnly cookie on mount
- `utils/api.js`: Axios instance with `withCredentials: true` (sends httpOnly cookie automatically), 401 interceptor (redirects to login), 503 interceptor (maintenance mode). Contains ~45 API service objects (driversAPI, vehiclesAPI, adminAPI, etc.)
- `FeatureFlagContext.jsx`: Provides `useFeatureFlag(key)` hook for feature toggling

### AI Services
- `openaiVisionService.js`: Document extraction via OpenAI. **PDFs use Responses API** (`openai.responses.create()` with `input_file`), **images use Chat Completions** (`image_url`). Specialized prompts per document type (maintenance_invoice, medical_card, cdl, inspection_report, drug_test).
- `aiService.js`: Claude integration for compliance Q&A
- Smart upload endpoints exist on maintenance and documents routes

### Cron Jobs (server.js startup)
- 6 AM: Alert generation + email digest
- Every 6h: Alert escalation
- 9 AM: Trial ending notifications

## Key Patterns

- **All models are company-scoped**: Every data model has `companyId` field indexed for tenant isolation
- **Services export object literals** with async methods (not classes)
- **Email is fire-and-forget**: `emailService` never blocks app flow; logs to `EmailLog` model
- **File uploads**: Multer with UUID filenames, 10MB limit, MIME+extension validation, path traversal protection. Files stored in `uploads/{category}/`
- **Search uses `escapeRegex()`**: All user-provided regex search strings are escaped to prevent NoSQL injection

## Key Files

| Purpose | File |
|---------|------|
| Server entry + middleware | `backend/server.js` |
| Route registration | `backend/routes/index.js` |
| Auth + company isolation | `backend/middleware/auth.js` |
| Subscription enforcement | `backend/middleware/subscriptionLimits.js` |
| Error handling | `backend/middleware/errorHandler.js` |
| User model (multi-company) | `backend/models/User.js` |
| Audit service | `backend/services/auditService.js` |
| AI document extraction | `backend/services/openaiVisionService.js` |
| Frontend routing | `frontend/src/App.jsx` |
| Auth state | `frontend/src/context/AuthContext.jsx` |
| API client (all endpoints) | `frontend/src/utils/api.js` |
| Project docs + changelog | `PROJECT.md` |
