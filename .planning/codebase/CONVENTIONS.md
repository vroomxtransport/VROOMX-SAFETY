# Coding Conventions

**Analysis Date:** 2026-02-03

## Naming Patterns

**Files:**
- Backend routes: `kebab-case.js` (e.g., `drivers.js`, `audit.js`)
- Backend models: `PascalCase.js` (e.g., `Driver.js`, `Vehicle.js`, `Company.js`)
- Backend services: `camelCase.js` (e.g., `auditService.js`, `emailService.js`)
- Backend middleware: `kebab-case.js` (e.g., `errorHandler.js`, `auth.js`)
- Frontend pages: `PascalCase.jsx` (e.g., `Drivers.jsx`, `DriverDetail.jsx`)
- Frontend components: `PascalCase.jsx` (e.g., `Modal.jsx`, `StatusBadge.jsx`)
- Frontend utilities: `camelCase.js` (e.g., `api.js`, `helpers.js`)
- Frontend contexts: `PascalCase.jsx` (e.g., `AuthContext.jsx`, `FeatureFlagContext.jsx`)

**Functions:**
- Backend: camelCase (e.g., `findOrCreateAlert()`, `dismissAlert()`, `renderTemplate()`)
- Frontend React hooks: camelCase (e.g., `useAuth()`, `useState()`)
- Express route handlers: Named descriptors with `async` (e.g., `async (req, res) => {}`)
- Service methods: camelCase on exported object literals (e.g., `auditService.log()`)

**Variables:**
- Local: camelCase (e.g., `userId`, `templateCache`, `activeCompany`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `RESEND_ENABLED`, `JWT_EXPIRES_IN`, `FROM_EMAIL`)
- React state: camelCase (e.g., `const [drivers, setDrivers] = useState([])`)
- Destructured objects: camelCase with preservation of API response names

**Types/Enums:**
- Database enums: lowercase strings (e.g., `status: 'active'`, `role: 'owner'`)
- Status values: lowercase with underscores (e.g., `'non_compliant'`, `'due_soon'`, `'out_of_service'`)
- Role values: lowercase with underscores (e.g., `'safety_manager'`, `'dispatcher'`)

## Code Style

**Formatting:**
- No dedicated Prettier config file; code follows implicit conventions
- Indentation: 2 spaces (ES6 modules use default)
- Line length: No strict limit enforced
- Trailing commas: Used in multiline objects/arrays

**Linting:**
- Frontend has ESLint configured: `"lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0"`
- Eslint file: Not tracked in repo (uses defaults)
- Backend: No linter configured (no eslint dependency)
- Max warnings on frontend: **Zero** - strict enforcement

## Import Organization

**Order (both Backend & Frontend):**
1. Node.js core modules (`path`, `fs`, `crypto`)
2. Third-party packages (`express`, `mongoose`, `axios`, `react`)
3. Custom modules (models, services, middleware, utils)
4. Type definitions / JSDoc comments

**Path Aliases:**
- Frontend uses standard relative imports (no @ alias configured)
- Backend uses relative imports with traversal (e.g., `require('../models')`, `require('./services/auditService')`)
- Index file imports: `const { Driver } = require('../models')` (barrel export from `backend/models/index.js`)

**Example (Backend):**
```javascript
const express = require('express');
const mongoose = require('mongoose');
const { Driver } = require('../models');
const { protect, checkPermission } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const auditService = require('../services/auditService');
```

**Example (Frontend):**
```javascript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { driversAPI } from '../utils/api';
import { formatDate, daysUntilExpiry } from '../utils/helpers';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
```

## Error Handling

**Backend Pattern:**
- Custom `AppError` class in `middleware/errorHandler.js` with `statusCode` and `status` properties
- All route handlers wrapped with `asyncHandler()` to catch Promise rejections automatically
- Global error handler (`errorHandler` middleware) sanitizes messages in production
- Database errors transformed: CastError → 404, validation errors → 400, JWT errors → 401
- Sensitive fields excluded from error messages in production

**Frontend Pattern:**
- Axios response interceptor catches 401 (redirects to login) and 503 (maintenance mode)
- `react-hot-toast` for error notifications (called as `toast.error()`)
- No global error boundary catch-all; `ErrorBoundary.jsx` component exists for React error catching
- API calls wrapped in try-catch in page components

**Example (Backend):**
```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

**Example (Frontend):**
```javascript
try {
  const response = await driversAPI.getAll(params);
  setDrivers(response.data.drivers);
} catch (error) {
  toast.error(error.response?.data?.message || 'Failed to load drivers');
}
```

## Logging

**Backend:**
- `console.error()` for errors and warnings (prefixed with service name in brackets, e.g., `[AuditService]`)
- `console.warn()` for non-critical issues (e.g., missing environment variables)
- Morgan middleware for HTTP request logging in development only
- No centralized logging service; errors logged to stdout

**Frontend:**
- No console logging enforced; dev server logs from Vite
- Network errors logged via toast notifications instead of console
- No client-side error reporting service configured

**Audit Logging (Special):**
- Fire-and-forget pattern via `auditService.log(req, action, resource, resourceId, details)`
- Never throws; catches and logs failures silently with `console.error()`
- Company-scoped with 2-year TTL
- Supports field-level diffs via `auditService.diff(before, after)`

## Comments

**When to Comment:**
- JSDoc comments on service methods and utility functions (required)
- Inline comments for regex patterns, security considerations, or non-obvious logic
- Comments on import groups to separate concerns
- Comments on configuration objects explaining enum values

**JSDoc/TSDoc:**
- Service methods use JSDoc format:
  ```javascript
  /**
   * Log an action. Fire-and-forget — never throws.
   * @param {object} req - Express request
   * @param {string} action - create|update|delete|...
   */
  log(req, action, resource, resourceId, details) { ... }
  ```
- No TypeScript, so JSDoc provides documentation for consumers
- JSDoc used extensively in `auditService.js`, `emailService.js`, `alertService.js`

## Function Design

**Size:**
- Route handlers: 20-50 lines typical (wrapped in try-catch via asyncHandler)
- Service methods: 10-30 lines (business logic stays in services, not models)
- Middleware: 5-15 lines (protect, checkPermission, restrictToCompany patterns)

**Parameters:**
- Express routes: `(req, res, next)` always; error handler gets `(err, req, res, next)`
- Service methods: Accept single object for options (e.g., `getAlerts(companyId, options = {})`)
- React components: Props object destructured in function signature

**Return Values:**
- Backend route handlers: Return `res.json({ success, ...data })` or `res.status(code).json(error)`
- Service methods: Return objects or arrays directly; throw errors for failure
- Frontend API calls: Return response data (Axios unwraps `.data` automatically)

**Example (Backend Service):**
```javascript
async dismissAlert(alertId, userId, reason) {
  const alert = await Alert.findById(alertId);
  if (!alert) {
    throw new Error('Alert not found');
  }
  return alert.dismiss(userId, reason);
}
```

## Module Design

**Exports:**
- Services export object literals with async methods (not classes):
  ```javascript
  const auditService = {
    log(req, action, resource, ...) { ... },
    logAuth(req, action, details) { ... },
    diff(before, after) { ... }
  };
  module.exports = auditService;
  ```
- Routes export Express Router: `module.exports = router;`
- Models export Mongoose schemas: `module.exports = mongoose.model('Driver', driverSchema);`

**Barrel Files:**
- Backend `models/index.js` exports all models for convenient importing:
  ```javascript
  const { Driver, Vehicle, Company } = require('../models');
  ```
- Frontend components rarely use barrel exports; imports are direct per-component

**Middleware Pattern:**
- Middleware functions chained in `server.js` middleware stack
- Auth stack order: `protect` → `restrictToCompany` → optional `checkPermission()`
- Subscription limits checked via `checkDriverLimit` middleware before creation routes

## Company Isolation & Multi-Tenancy

**Pattern:**
- All models include `companyId` field indexed for fast filtering
- `restrictToCompany` middleware sets `req.companyFilter = { companyId }` on every authenticated request
- **All** database queries use `req.companyFilter` spread into query: `Driver.find({ ...req.companyFilter, ... })`
- Super admins bypass company checks via `req.user?.isSuperAdmin` flag

**Example:**
```javascript
const queryObj = { ...req.companyFilter }; // Always start with this
if (status) queryObj.status = status;
const drivers = await Driver.find(queryObj).sort(sort).skip(skip).limit(limit);
```

## Security Patterns

**Input Validation:**
- `express-validator` for route validation (body, query, param validators)
- Regex escaping for NoSQL injection prevention: `escapeRegex(userSearchString)`
- Mongoose schema validation with error messages
- File upload validation: MIME types + extensions + path traversal prevention

**Sensitive Data:**
- SSN fields: `select: false` on schema (explicitly fetch only when needed)
- Password: Never selected by default; excluded from audit diffs
- JWT: Stored in httpOnly cookie (production) + localStorage fallback (frontend)
- API Key validation: Check RESEND_API_KEY, STRIPE_SECRET_KEY at startup

**Example (Regex Escape):**
```javascript
const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
const safeSearch = escapeRegex(search);
queryObj.$or = [{ firstName: { $regex: safeSearch, $options: 'i' } }];
```

## Async/Await Convention

- All async functions use `async/await` (not `.then().catch()`)
- Promise chaining rare; `Promise.all()` used for parallel operations
- Error propagation: Errors bubble to `asyncHandler()` which forwards to global error handler
- No explicit error handling in routes; let middleware catch

## Status/Enum Values

**Driver Status:** `'active'`, `'inactive'`, `'terminated'`
**Compliance Status:** `'compliant'`, `'non_compliant'`
**Alert Status:** `'active'`, `'resolved'`, `'dismissed'`
**Subscription Status:** `'trialing'`, `'active'`, `'pending_payment'`, `'unpaid'`, `'past_due'`, `'canceled'`
**User Role:** `'owner'`, `'admin'`, `'safety_manager'`, `'dispatcher'`, `'driver'`, `'viewer'`

All status values use lowercase with underscores throughout the codebase (both backend and frontend).

---

*Convention analysis: 2026-02-03*
