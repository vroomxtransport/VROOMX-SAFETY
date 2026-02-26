# Testing Patterns

**Analysis Date:** 2026-02-25

## Test Framework

**Runner:**
- Backend: Jest `^30.2.0` (configured in `backend/package.json`)
- Config: No `jest.config.js` found at project level; Jest uses defaults
- Frontend: No test framework configured (no vitest, jest, or testing-library in `frontend/package.json`)

**Assertion Library:**
- Backend: Jest built-in (`expect`)

**Run Commands:**
```bash
# Backend only
cd backend && npm test          # Run all Jest tests

# Frontend - no test runner configured
# (no test script in frontend/package.json)
```

## Test File Organization

**Location:**
- No test files (`*.test.*` or `*.spec.*`) found in `backend/` or `frontend/src/`
- One informal script exists at `backend/test-fmcsa.js` — not a Jest test, just a manual runner

**Naming:**
- No established naming convention (no test files exist)

**Structure:**
- No test directory structure established

## Current State Assessment

The codebase has **minimal automated testing**:

- Jest is installed as a devDependency in the backend (`backend/package.json` line 48)
- `npm test` script is defined (`"test": "jest"`)
- **Zero actual test files exist** in either `backend/` or `frontend/`
- The only test artifact is `backend/test-fmcsa.js`, an informal manual test script:
  ```javascript
  // backend/test-fmcsa.js (NOT a Jest test — run with node directly)
  const fmcsaService = require('./services/fmcsaService');
  async function test() {
    const result = await fmcsaService.fetchCarrierData('80806');
    console.log('Success:', JSON.stringify(result, null, 2));
  }
  test();
  ```

## Mocking

**Framework:** Jest (available but unused)

**What Would Need Mocking (if tests were written):**
- MongoDB: Mongoose models would need mocking or an in-memory MongoDB (e.g., `mongodb-memory-server`)
- External HTTP: FMCSA API calls, Stripe, Resend, OpenAI, Anthropic would need `jest.mock()` or `nock`
- `req`/`res` objects for middleware and route handler unit tests
- `process.env` for testing environment-conditional logic

## Fixtures and Factories

**Test Data:**
- No test fixtures or factories exist
- The `backend/scripts/seed.js` script exists for database seeding in development, but is not a test fixture

**Location:**
- `backend/scripts/seed.js` — dev data seeder only

## Coverage

**Requirements:** None enforced (no coverage thresholds configured)

**View Coverage:**
```bash
cd backend && npx jest --coverage   # Would generate coverage report if tests existed
```

## Test Types

**Unit Tests:**
- Not implemented

**Integration Tests:**
- Not implemented

**E2E Tests:**
- Not implemented

## Manual Testing Patterns

While no automated tests exist, the codebase demonstrates manual validation patterns:

**Input Validation (backend):**
- `express-validator` used on all write endpoints (`body()`, `query()`, `param()` chains)
- Checked with `validationResult(req)` at route handler start
- Files: `backend/routes/auth.js`, `backend/routes/drivers.js`, `backend/routes/documents.js`

**Error Handling Verification:**
- `AppError` class with `isOperational` flag used to distinguish operational vs programming errors
- Global error handler in `backend/middleware/errorHandler.js` tested manually via API calls

**Ad-hoc Scripts:**
- `backend/test-fmcsa.js` — manual FMCSA service test (run with `node test-fmcsa.js`)
- `backend/scripts/seed.js` — database seeder for dev environment verification

## If Adding Tests (Recommended Approach)

Given the existing tech stack, new tests should follow this pattern:

**Backend Unit Test (Jest):**
```javascript
// backend/services/__tests__/complianceScoreService.test.js
const { calculateScore } = require('../complianceScoreService');

describe('complianceScoreService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null overall score when no applicable components', async () => {
    // Mock Mongoose models
    jest.mock('../../models/Driver', () => ({ find: jest.fn().mockResolvedValue([]) }));
    // ...
  });
});
```

**Backend Route Test (supertest + jest):**
```javascript
// backend/routes/__tests__/drivers.test.js
const request = require('supertest');
const app = require('../../server');

describe('GET /api/drivers', () => {
  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/drivers');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
```

**What to Mock:**
- `mongoose` model methods (`find`, `findOne`, `findById`, `save`, `create`, `countDocuments`)
- External services: `emailService`, `stripeService`, `openaiVisionService`
- `req.user`, `req.companyFilter` for middleware tests

**What NOT to Mock:**
- `asyncHandler` wrapper (test with it in place)
- `AppError` class (test real error propagation)
- Business logic inside services (test those directly)

## Key Files for Test Setup

| File | Purpose |
|------|---------|
| `backend/middleware/errorHandler.js` | `AppError`, `asyncHandler` — critical to test |
| `backend/middleware/auth.js` | JWT verify logic — needs mocked `User.findById` |
| `backend/middleware/subscriptionLimits.js` | Plan limit enforcement — needs mocked `req.user.limits` |
| `backend/services/complianceScoreService.js` | Core business logic — highest priority for unit tests |
| `backend/services/auditService.js` | Fire-and-forget — verify it never throws |
| `backend/utils/helpers.js` | Pure functions — easiest to test (`escapeRegex`) |
| `frontend/src/utils/helpers.js` | Pure functions — easiest to test (`formatDate`, `daysUntilExpiry`, `getExpiryStatus`) |

---

*Testing analysis: 2026-02-25*
