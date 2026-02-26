# Coding Conventions

**Analysis Date:** 2026-02-25

## Naming Patterns

**Files:**
- Backend routes/services/models: `camelCase.js` (e.g., `alertService.js`, `fmcsaSyncService.js`)
- Frontend pages: `PascalCase.jsx` (e.g., `Drivers.jsx`, `Dashboard.jsx`)
- Frontend components: `PascalCase.jsx` (e.g., `Modal.jsx`, `DataTable.jsx`, `LoadingSpinner.jsx`)
- Frontend hooks: `camelCase.js` prefixed with `use` (e.g., `useInView.js`, `useForceLightMode.js`)
- Frontend utilities: `camelCase.js` (e.g., `api.js`, `helpers.js`, `lazyWithRetry.js`)
- Backend models: `PascalCase.js` (e.g., `Driver.js`, `ComplianceScore.js`, `FMCSAInspection.js`)

**Functions:**
- Backend: camelCase for both service methods and route handlers (`fetchCarrierData`, `generateToken`, `setTokenCookie`)
- Frontend: camelCase for event handlers with `handle` prefix (`handleRestore`, `handleNestedChange`, `handleSubmit`)
- Frontend fetchers: camelCase with `fetch` prefix (`fetchDrivers`, `fetchArchivedDrivers`, `fetchDashboard`)
- Custom hooks: camelCase with `use` prefix (`useInView`, `useAuth`, `useTheme`)

**Variables:**
- camelCase throughout both frontend and backend
- Boolean flags use `is`/`has` prefix: `isAnimating`, `isRefreshing`, `hasTriggered`, `hasError`
- Status constants use `SCREAMING_SNAKE_CASE`: `RESEND_ENABLED`, `PLAN_CONFIG`, `AI_QUERY_QUOTAS`
- Config objects use `SCREAMING_SNAKE_CASE`: `COMPONENT_WEIGHTS`, `TIME_WEIGHTS`, `BASIC_INFO`

**Types/Classes:**
- Custom error class: `AppError` (PascalCase) in `backend/middleware/errorHandler.js`
- Mongoose schemas: `camelCase` variable name ending in `Schema` (e.g., `userSchema`, `permissionSchema`, `companyMembershipSchema`)

## Code Style

**Formatting:**
- No project-level Prettier config detected; code uses consistent 2-space indentation
- Template literals used for string interpolation
- Arrow functions for callbacks and event handlers; standard `function` keyword for named utility functions

**Linting:**
- Frontend: ESLint with `eslint-plugin-react` and `eslint-plugin-react-hooks` (configured in `frontend/package.json`)
- Lint command: `eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0`
- Backend: No ESLint configured; relies on code review discipline
- Frontend uses ES modules (`"type": "module"` in `frontend/package.json`)
- Backend uses CommonJS (`require` / `module.exports`)

## Import Organization

**Backend (CommonJS):**
```javascript
// 1. Node built-ins / npm packages
const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

// 2. Internal models
const { Driver } = require('../models');

// 3. Internal middleware
const { protect, checkPermission, restrictToCompany } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// 4. Internal services
const auditService = require('../services/auditService');

// 5. Internal utilities
const { escapeRegex } = require('../utils/helpers');
```

**Frontend (ESM):**
```javascript
// 1. React and hooks
import { useState, useEffect, useCallback, useMemo } from 'react';

// 2. Router
import { useNavigate } from 'react-router-dom';

// 3. API utilities
import api, { driversAPI } from '../utils/api';

// 4. Internal utilities/helpers
import { formatDate, daysUntilExpiry } from '../utils/helpers';

// 5. Third-party UI/notification libs
import toast from 'react-hot-toast';
import debounce from 'lodash.debounce';

// 6. Icons
import { FiPlus, FiSearch } from 'react-icons/fi';

// 7. Internal components
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
```

**Path Aliases:**
- None configured; relative paths used throughout (`'../utils/api'`, `'../middleware/auth'`)

## Error Handling

**Backend — Route Layer:**
- All route handlers wrapped with `asyncHandler()` from `backend/middleware/errorHandler.js`
- `asyncHandler` eliminates try/catch in routes; errors bubble to global error handler
- Throw `AppError(message, statusCode)` for known errors: `throw new AppError('Document not found', 404)`
- Manual `res.status().json({ success: false, message })` for inline validation errors
- `express-validator` used for input validation: `body('email').isEmail()`, checked with `validationResult(req)`
- Global error handler in `backend/middleware/errorHandler.js` handles Mongoose cast errors, duplicates, validation, and JWT errors

```javascript
// Standard route handler pattern
router.get('/:id', checkPermission('drivers', 'view'), asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ _id: req.params.id, ...req.companyFilter });
  if (!driver) throw new AppError('Driver not found', 404);
  res.json({ success: true, driver });
}));
```

**Backend — Service Layer:**
- Services throw plain `Error` objects; routes catch via `asyncHandler`
- Fire-and-forget services (audit, email) never throw — catch internally and `console.error`
- Background/cron operations logged with prefixed tags: `[AuditService]`, `[FMCSA]`, `[EmailService]`

**Frontend — Page/Component Layer:**
- Async operations use `try/catch/finally` pattern
- `toast.error('message')` for user-facing errors; generic fallback: `error.response?.data?.message || 'Failed to ...'`
- `toast.success('message')` for successful mutations
- `setLoading(true)` before fetch, `setLoading(false)` in `finally` block

```javascript
// Standard frontend async pattern
const fetchDrivers = async () => {
  setLoading(true);
  try {
    const response = await driversAPI.getAll(params);
    setDrivers(response.data.drivers);
  } catch (error) {
    toast.error('Failed to fetch drivers');
  } finally {
    setLoading(false);
  }
};
```

## API Response Shape

**All backend responses follow this envelope:**
```javascript
// Success
res.json({ success: true, data: ..., count: ..., total: ..., page: ..., pages: ... });
res.status(201).json({ success: true, driver: newDriver });

// Error
res.status(400).json({ success: false, message: 'Reason', code: 'OPTIONAL_CODE', errors: [] });
```

- `success: true` always present on 2xx responses
- `success: false` always present on error responses
- Machine-readable `code` field added for actionable errors: `'COMPANY_LIMIT_REACHED'`, `'SUBSCRIPTION_UNPAID'`, `'ACCOUNT_SUSPENDED'`

## Logging

**Framework:** `console.error` / `console.warn` (no structured logger)

**Patterns:**
- Services prefix logs with service name in brackets: `console.error('[AuditService] Failed...')`, `console.error('[FMCSA] ...')`
- Missing optional config emits `console.warn` on startup (Resend, PostHog, Perplexity)
- `morgan` used for HTTP request logging in development (`backend/server.js`)
- Stack traces suppressed in production (global error handler checks `NODE_ENV`)

## Comments

**When to Comment:**
- JSDoc blocks on all service methods and exported utility functions: `@param`, `@returns`
- Route comments follow Express convention: `// @route`, `// @desc`, `// @access`
- Inline comments explain non-obvious logic (security decisions, regex patterns)

**Backend Route Comment Pattern:**
```javascript
// @route   GET /api/drivers
// @desc    Get all drivers with filtering and pagination
// @access  Private
```

**JSDoc Pattern (services and utils):**
```javascript
/**
 * Load an HTML template from disk, caching in memory.
 * @param {string} name - Template filename without path (e.g. 'welcome')
 * @returns {string} Raw HTML string
 */
function loadTemplate(name) { ... }
```

**Security comments:** Inline notes explain security decisions (e.g., token storage in memory, `select: false` on SSN field)

## Function Design

**Size:** Services contain many methods; individual methods are focused on a single concern. Large files are common (700–1200 lines) since all methods for a service domain live in one object literal.

**Parameters:** Destructuring used for options objects with defaults:
```javascript
async getAlerts(companyId, options = {}) {
  const { type, category, status = 'active', page = 1, limit = 20 } = options;
}
```

**Return Values:** Services return plain objects or Mongoose documents. Routes always send via `res.json()`.

## Module Design

**Backend Exports:** Object literals with async methods (not classes):
```javascript
const myService = {
  async doThing(arg) { ... },
  async doOther(arg) { ... },
};
module.exports = myService;
```

**Frontend Exports:**
- Pages and components: `export default ComponentName`
- Contexts: named export for hook + provider, default export for context object
  ```javascript
  export const useAuth = () => { ... };
  export const AuthProvider = ({ children }) => { ... };
  export default AuthContext;
  ```
- Utilities: named exports only (`export const formatDate = ...`)

**Barrel Files:**
- `backend/models/index.js` — aggregates all Mongoose model exports
- `backend/routes/index.js` — registers all route modules under `/api`
- No barrel files on the frontend; components are imported directly by path

## React Component Patterns

**Component Style:**
- All components and pages are functional components (arrow function assigned to `const`)
- Class components used only for `ErrorBoundary` in `frontend/src/components/ErrorBoundary.jsx`
- No PropTypes; no TypeScript — no runtime type checking on props

**State Management:**
- Local `useState` for all component state; no global state library
- `useContext` via `AuthContext` and `ThemeContext` for cross-cutting state
- `useCallback` for stable handler references passed to child components
- `useMemo` for derived values that are expensive or cause re-renders (e.g., debounced search)

**Lazy Loading:**
- Heavy pages lazy-loaded via `lazyWithRetry()` wrapper (`frontend/src/utils/lazyWithRetry.js`)
- Provides 3-retry exponential backoff (1s, 2s, 4s) for chunk load failures

**Tailwind CSS:**
- All styling via Tailwind utility classes directly in JSX
- Custom design tokens defined in `frontend/tailwind.config.js` (primary, cta, accent, success, warning, danger, info)
- Dark mode via `class` strategy (`darkMode: 'class'`)
- Custom `safelist` in tailwind config for dynamically constructed class strings

---

*Convention analysis: 2026-02-25*
