# Testing Patterns

**Analysis Date:** 2026-02-03

## Test Framework

**Runner:**
- Backend: Jest (configured via `"test": "jest"` in package.json, but no jest.config.js file)
- Frontend: No test framework configured
- Coverage: Not enforced

**Assertion Library:**
- None detected; Jest's built-in `expect()` would be used if tests existed

**Run Commands:**
```bash
npm test              # Backend only; runs jest (from backend directory)
```

**Status:**
- Jest dependency missing from `backend/package.json` (`devDependencies` only lists `nodemon`)
- Frontend has no test setup (no vitest, jest, or testing-library)
- No test files found in source code (only in node_modules from dependencies)

## Test File Organization

**Current Status: No Tests Exist**

Proposed structure if tests are added:

**Backend Test Location:**
- Should be co-located with source files: `backend/services/__tests__/auditService.test.js`
- Or separate: `backend/__tests__/services/auditService.test.js`

**Frontend Test Location:**
- Should be co-located: `frontend/src/components/__tests__/Modal.test.jsx`
- Or separate: `frontend/src/__tests__/components/Modal.test.jsx`

**Naming Convention:**
- Pattern: `*.test.js` or `*.spec.js` (Jest auto-discovers both)
- Recommended: Use `.test.js` for consistency

## Test Structure

**Backend Service Pattern (Proposed):**

```javascript
describe('AuditService', () => {
  describe('log()', () => {
    it('should create an audit log with company isolation', async () => {
      const req = {
        user: { _id: userId, email: 'user@test.com' },
        companyFilter: { companyId: companyId1 },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test' }
      };

      await auditService.log(req, 'create', 'driver', driverId, {});

      const log = await AuditLog.findOne({ resourceId: driverId });
      expect(log.companyId.toString()).toBe(companyId1.toString());
      expect(log.action).toBe('create');
    });

    it('should never throw even if database fails', async () => {
      // Mock AuditLog.create to reject
      const spy = jest.spyOn(AuditLog, 'create').mockRejectedValueOnce(new Error('DB error'));

      expect(() => auditService.log(req, 'test', 'driver', id, {})).not.toThrow();

      spy.mockRestore();
    });
  });

  describe('diff()', () => {
    it('should skip internal fields', () => {
      const before = { name: 'John', password: 'secret', _id: 123 };
      const after = { name: 'Jane', password: 'newsecret', _id: 123 };

      const changes = auditService.diff(before, after);

      expect(changes).toEqual([{ field: 'name', from: 'John', to: 'Jane' }]);
      expect(changes.some(c => c.field === 'password')).toBe(false);
    });
  });
});
```

**Route Handler Pattern (Proposed):**

```javascript
describe('GET /api/drivers', () => {
  beforeEach(async () => {
    // Setup test database with company-scoped data
    await Company.create({ _id: companyId, name: 'Test Co', dotNumber: '1234567' });
    await User.create({
      _id: userId,
      email: 'user@test.com',
      companies: [{ companyId, role: 'owner' }],
      activeCompanyId: companyId
    });
    await Driver.create({
      _id: driverId1,
      companyId,
      firstName: 'John',
      lastName: 'Doe'
    });
    await Driver.create({
      _id: driverId2,
      companyId: otherCompanyId,
      firstName: 'Jane',
      lastName: 'Smith'
    });
  });

  it('should return only drivers from user\'s company', async () => {
    const req = {
      user: { _id: userId, companies: [{ companyId, role: 'owner' }] },
      companyFilter: { companyId },
      query: {},
      headers: {}
    };

    const drivers = await Driver.find(req.companyFilter);

    expect(drivers).toHaveLength(1);
    expect(drivers[0]._id.toString()).toBe(driverId1.toString());
  });

  it('should apply search filter with regex escaping', async () => {
    const safeSearch = escapeRegex('John');
    const queryObj = {
      ...req.companyFilter,
      $or: [{ firstName: { $regex: safeSearch, $options: 'i' } }]
    };

    const drivers = await Driver.find(queryObj);

    expect(drivers).toHaveLength(1);
  });

  it('should not leak SSN field', async () => {
    const drivers = await Driver.find(req.companyFilter).select('-ssn');

    expect(drivers[0].ssn).toBeUndefined();
  });
});
```

**Frontend Component Pattern (Proposed):**

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal', () => {
  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test">
        <p>Hidden</p>
      </Modal>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should close on escape key', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('should prevent body scroll when open', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test">
        <p>Content</p>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Test">
        <p>Content</p>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('unset');
  });
});
```

## Mocking

**Framework:** Jest (not currently used; would use `jest.fn()`, `jest.spyOn()`, `jest.mock()`)

**Patterns (Recommended):**

**Mocking Database Models:**
```javascript
jest.mock('../models/Driver');

const mockFind = jest.fn().mockResolvedValue([{ _id: '1', firstName: 'John' }]);
Driver.find = mockFind;
```

**Mocking Express Request/Response:**
```javascript
const mockReq = {
  user: { _id: userId, email: 'user@test.com' },
  companyFilter: { companyId },
  query: { page: 1, limit: 20 },
  headers: { 'user-agent': 'test' },
  ip: '127.0.0.1'
};

const mockRes = {
  json: jest.fn().mockReturnThis(),
  status: jest.fn().mockReturnThis(),
  cookie: jest.fn().mockReturnThis()
};
```

**Mocking API Calls (Frontend):**
```javascript
jest.mock('../utils/api');
import { driversAPI } from '../utils/api';

driversAPI.getAll.mockResolvedValue({
  data: {
    drivers: [{ _id: '1', firstName: 'John' }],
    total: 1,
    pages: 1
  }
});
```

**Mocking Async Handlers:**
```javascript
// For routes wrapped in asyncHandler, test the handler directly
const mockNext = jest.fn();
await asyncHandler(async (req, res) => {
  const drivers = await Driver.find(req.companyFilter);
  res.json({ success: true, drivers });
})(mockReq, mockRes, mockNext);

expect(mockRes.json).toHaveBeenCalledWith(
  expect.objectContaining({ success: true })
);
```

## What to Mock

**Backend:**
- Database models (Driver, Vehicle, User, Company, etc.)
- External services (emailService, Stripe API, FMCSA API)
- `req` and `res` objects (create mock objects with relevant properties)
- Date functions if time-sensitive (use `jest.useFakeTimers()`)

**Frontend:**
- API calls via `axios` mock (entire `api` module)
- React Router (`useNavigate`, `useParams`)
- Context providers (AuthContext, FeatureFlagContext)
- External libraries for animations (react-hot-toast can be mocked)

## What NOT to Mock

**Backend:**
- Core Express functions (`res.json()`, `res.status()`) unless testing error flows
- Mongoose schema validation (test with real validation rules)
- Error handler middleware (test error transformation logic)

**Frontend:**
- React hooks like `useState`, `useEffect` (test component behavior instead)
- DOM APIs if possible (test component renders, not DOM manipulation)
- User events if component is simple (test outcome, not interaction details)

## Fixtures and Factories

**Test Data (Recommended Pattern):**

```javascript
// backend/__tests__/fixtures/user.fixture.js
export const createMockUser = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  email: 'user@test.com',
  firstName: 'John',
  lastName: 'Doe',
  companies: [{
    companyId: new mongoose.Types.ObjectId(),
    role: 'owner'
  }],
  subscription: {
    plan: 'fleet',
    status: 'active'
  },
  ...overrides
});

export const createMockDriver = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  companyId: new mongoose.Types.ObjectId(),
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: new Date('1990-01-01'),
  cdl: {
    number: 'A123456',
    state: 'CA',
    expiryDate: new Date('2026-12-31')
  },
  ...overrides
});
```

**Location:**
- Backend: `backend/__tests__/fixtures/` directory
- Frontend: `frontend/src/__tests__/fixtures/` directory

**Usage in Tests:**
```javascript
import { createMockDriver } from '../fixtures/driver.fixture';

const driver = createMockDriver({ firstName: 'Jane' });
```

## Coverage

**Requirements:** None enforced (not configured)

**Recommended:**
- Minimum 70% for business logic (services, models)
- Minimum 50% for routes (harder to test without full integration setup)
- Minimum 60% for components

**View Coverage (Would Be):**
```bash
npm test -- --coverage
```

**Config (If Added to jest.config.js):**
```javascript
module.exports = {
  collectCoverageFrom: [
    'services/**/*.js',
    'routes/**/*.js',
    'models/**/*.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70
    }
  }
};
```

## Test Types

**Backend Unit Tests:**
- **Scope:** Service methods, utility functions, model methods
- **Approach:** Mock database calls, test business logic in isolation
- **Example:** `auditService.log()` fire-and-forget behavior, `auditService.diff()` field-skipping
- **Setup:** Jest with MongoDB in-memory database (optional: use `mongodb-memory-server`)

**Backend Integration Tests:**
- **Scope:** Route handlers with real or in-memory database
- **Approach:** Create test database, run asyncHandler through middleware chain, verify database state
- **Example:** `GET /api/drivers` returns only company-scoped drivers; search filter works
- **Setup:** Test database connection; seed data per test; cleanup after

**Frontend Component Tests:**
- **Scope:** React components, hooks, integration
- **Approach:** Render component, simulate user interactions, assert rendered output
- **Example:** Modal closes on escape; form validation shows errors; data displays on load
- **Setup:** React Testing Library or Vitest; mock API calls; wrap in context providers if needed

**E2E Tests:**
- **Framework:** None (not configured)
- **Status:** Not used in this codebase

## Common Patterns

**Async Testing (Backend):**

```javascript
it('should create an alert and return it', async () => {
  const alertData = { companyId, type: 'critical', ... };

  const { alert, created } = await alertService.createAlert(alertData);

  expect(created).toBe(true);
  expect(alert._id).toBeDefined();
});
```

**Error Testing (Backend):**

```javascript
it('should throw if alert not found', async () => {
  await expect(
    alertService.dismissAlert(new mongoose.Types.ObjectId(), userId, 'test')
  ).rejects.toThrow('Alert not found');
});
```

**Async Testing (Frontend):**

```javascript
it('should load drivers on mount', async () => {
  driversAPI.getAll.mockResolvedValueOnce({
    data: { drivers: [{ _id: '1', firstName: 'John' }], pages: 1 }
  });

  render(<Drivers />);

  await waitFor(() => {
    expect(screen.getByText('John')).toBeInTheDocument();
  });
});
```

**Company Isolation Testing (Backend):**

```javascript
it('should not return drivers from other companies', async () => {
  const req = { companyFilter: { companyId: company1Id } };

  const drivers = await Driver.find(req.companyFilter);

  drivers.forEach(d => {
    expect(d.companyId.toString()).toBe(company1Id.toString());
  });
});
```

**Form Validation Testing (Frontend):**

```javascript
it('should show validation error for invalid email', async () => {
  const { container } = render(<AddDriver />);

  const emailInput = container.querySelector('input[name="email"]');
  fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
  fireEvent.submit(container.querySelector('form'));

  expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
});
```

## Implementation Gaps

**Missing:**
1. No Jest configuration file (`jest.config.js`)
2. No test runner configured for frontend
3. No test utilities library installed (`@testing-library/react`)
4. No fixture/factory pattern established
5. No test database setup (e.g., mongodb-memory-server)
6. No test environment variables (e.g., `.env.test`)
7. No code coverage tracking

**To Implement Tests:**
1. Add Jest to backend devDependencies: `npm install --save-dev jest`
2. Create `backend/jest.config.js` with MongoDB in-memory setup
3. Choose frontend test runner (Vitest recommended for Vite) and install dependencies
4. Create fixture directory structure
5. Start with service tests (easier to unit test)
6. Add integration tests for critical routes (auth, CRUD operations)
7. Add component tests for Modal, StatusBadge, DataTable (high reuse)

---

*Testing analysis: 2026-02-03*
