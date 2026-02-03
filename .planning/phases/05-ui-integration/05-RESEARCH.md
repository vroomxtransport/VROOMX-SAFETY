# Phase 5: UI Integration - Research

**Researched:** 2026-02-03
**Domain:** React UI patterns, data fetching, CSA calculations, entity-violation display
**Confidence:** HIGH

## Summary

Phase 5 integrates violations from Phase 4's entity linking into driver and vehicle profile pages. The research reveals that **most of the foundation already exists**: the driver profile (`DriverDetail.jsx`) already has a functional "Safety & CSA" tab with full CSA impact display, violation lists, and unlink functionality. The backend service (`driverCSAService.js`) already calculates CSA impact scores, BASIC breakdowns, and provides paginated violation data. The frontend API client already has `driversAPI.getCSAImpact()` and `driversAPI.getViolations()` methods.

For vehicles, no equivalent "Safety" tab or OOS rate calculation exists. The `VehicleDetail.jsx` has overview, maintenance, inspections, and claims tabs but no violation display. A new `vehicleCSAService.js` must be created following the `driverCSAService.js` pattern, along with new backend endpoints and frontend API methods.

**Primary recommendation:** For drivers, enhance the existing Safety & CSA tab if any improvements are needed (it appears complete). For vehicles, create a parallel implementation mirroring the driver pattern: new backend service, new routes, new frontend API methods, and a new Safety tab in VehicleDetail.jsx.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | UI components | Already used throughout codebase |
| react-icons/fi | ^4.x | Icons | Already imported in DriverDetail.jsx and VehicleDetail.jsx |
| react-router-dom | ^6.x | Navigation | Already used for page routing |
| react-hot-toast | ^2.x | Notifications | Already used for toast messages |
| date-fns | ^2.x | Date formatting | Already used via helpers.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| axios | ^1.x | API calls | Via utils/api.js (already configured) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom tabs | TabNav component | TabNav exists but DriverDetail uses inline TabButton; keep consistent with existing pattern |
| react-query | Direct useState/useEffect | Codebase uses useState/useEffect pattern consistently; don't introduce new paradigm |

**Installation:**
```bash
# No new packages needed - all dependencies exist
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── pages/
│   ├── DriverDetail.jsx    # EXISTING - Safety & CSA tab already complete
│   └── VehicleDetail.jsx   # MODIFY - Add Safety tab with violations/OOS rate
├── utils/
│   ├── api.js              # MODIFY - Add vehiclesAPI.getViolations(), getOOSStats()
│   └── helpers.js          # EXISTING - basicCategories, formatDate already available
└── components/
    └── [existing]          # No new components needed

backend/
├── routes/
│   ├── drivers.js          # EXISTING - GET /:id/csa, GET /:id/violations exist
│   └── vehicles.js         # MODIFY - Add GET /:id/violations, GET /:id/oos-stats
└── services/
    ├── driverCSAService.js # EXISTING - Complete CSA calculation service
    └── vehicleOOSService.js # NEW - OOS rate calculation (follows driverCSAService pattern)
```

### Pattern 1: Entity Detail Page with Safety Tab
**What:** Add a Safety/Violations tab to detail pages showing linked violations with calculated metrics
**When to use:** Driver and Vehicle profile pages
**Example:**
```jsx
// Source: DriverDetail.jsx lines 735-840 (existing pattern)
// The Safety & CSA tab structure:

{activeTab === 'safety' && (
  <div className="space-y-6">
    {/* Summary Stats Card */}
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FiShield className="w-4 h-4 text-primary-500" />
          CSA Impact
        </h3>
        {csaData && (
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(csaData.riskLevel)}`}>
            {csaData.riskLevel} Risk
          </span>
        )}
      </div>
      <div className="card-body">
        {csaLoading ? (
          <LoadingSpinner />
        ) : csaData && csaData.totalViolations > 0 ? (
          <div className="space-y-6">
            {/* Summary Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-zinc-50 rounded-xl">
                <p className="text-3xl font-bold">{csaData.totalViolations}</p>
                <p className="text-sm text-zinc-600">Violations</p>
              </div>
              {/* ...more stats */}
            </div>

            {/* BASIC Breakdown */}
            {/* Recent Violations List */}
          </div>
        ) : (
          <EmptyState message="No violations linked" />
        )}
      </div>
    </div>
  </div>
)}
```

### Pattern 2: Backend Service for Entity Violations
**What:** Service module that queries violations by entityId and calculates aggregate metrics
**When to use:** Driver CSA calculation, Vehicle OOS rate calculation
**Example:**
```javascript
// Source: driverCSAService.js lines 176-236 (existing pattern)

const vehicleOOSService = {
  async getVehicleOOSStats(vehicleId, companyId) {
    // Verify vehicle exists
    const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId })
      .select('unitNumber vin licensePlate status')
      .lean();

    if (!vehicle) throw new Error('Vehicle not found');

    // Get violations (last 24 months)
    const twoYearsAgo = new Date();
    twoYearsAgo.setMonth(twoYearsAgo.getMonth() - 24);

    const violations = await Violation.find({
      vehicleId,
      companyId,
      violationDate: { $gte: twoYearsAgo }
    }).lean();

    // Calculate OOS rate
    const oosCount = violations.filter(v => v.outOfService).length;
    const oosRate = violations.length > 0
      ? (oosCount / violations.length * 100).toFixed(1)
      : 0;

    // Calculate BASIC breakdown (follows driver pattern)
    const basicBreakdown = this._calculateBasicBreakdown(violations);

    return {
      vehicle: {
        _id: vehicle._id,
        unitNumber: vehicle.unitNumber,
        vin: vehicle.vin,
        licensePlate: vehicle.licensePlate,
        status: vehicle.status
      },
      totalViolations: violations.length,
      oosViolations: oosCount,
      oosRate: parseFloat(oosRate),
      basicBreakdown,
      recentViolations: violations
        .sort((a, b) => new Date(b.violationDate) - new Date(a.violationDate))
        .slice(0, 5)
    };
  },

  async getVehicleViolations(vehicleId, companyId, filters = {}) {
    // Same pagination pattern as driverCSAService.getDriverViolations()
    const { page = 1, limit = 20, basic, sortBy = 'violationDate', sortOrder = 'desc' } = filters;

    const query = { vehicleId, companyId };
    if (basic) query.basic = basic;

    const skip = (page - 1) * limit;
    const [violations, total] = await Promise.all([
      Violation.find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('driverId', 'firstName lastName employeeId')
        .lean(),
      Violation.countDocuments(query)
    ]);

    return {
      violations,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    };
  }
};
```

### Pattern 3: Frontend API Client Methods
**What:** Add API methods for new backend endpoints following existing patterns
**When to use:** Adding vehicle violation/OOS endpoints to api.js
**Example:**
```javascript
// Source: utils/api.js lines 98-111 (existing vehiclesAPI pattern)

export const vehiclesAPI = {
  // ... existing methods ...

  // NEW: Safety/violations methods (mirroring driversAPI pattern)
  getOOSStats: (id) => api.get(`/vehicles/${id}/oos-stats`),
  getViolations: (id, params) => api.get(`/vehicles/${id}/violations`, { params }),
  unlinkViolation: (violationId) => api.delete(`/violations/${violationId}/link-vehicle`)
};
```

### Anti-Patterns to Avoid
- **Calculating metrics client-side:** All OOS rates and CSA scores calculated in backend services, not React components
- **Fetching violations without pagination:** Use the existing pagination pattern (page, limit, total, pages)
- **Creating new UI components:** Use existing card, badge, and loading patterns from DriverDetail.jsx
- **Breaking existing functionality:** The driver Safety & CSA tab is working - don't regress it

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting | Custom formatters | helpers.js formatDate() | Already handles edge cases, consistent formatting |
| Risk level colors | Inline color logic | Existing getRiskColor() pattern from DriverDetail.jsx | Keep UI consistency |
| BASIC category names | Hardcoded strings | helpers.js basicCategories or service _getBasicName() | Single source of truth |
| Loading states | Custom spinners | LoadingSpinner component | Consistent loading UX |
| Empty states | Custom empty messages | Follow existing empty state pattern from DriverDetail.jsx | Consistent look |
| Pagination structure | Custom format | { page, limit, total, pages } object | Backend already returns this format |

**Key insight:** The driver implementation in DriverDetail.jsx is a complete reference. Vehicle implementation should mirror it exactly, changing only the data source (vehicleId instead of driverId) and metrics label (OOS Rate instead of CSA Impact Score).

## Common Pitfalls

### Pitfall 1: Forgetting Named Route Ordering
**What goes wrong:** Express matches `/:id` route before named routes like `/review-queue`
**Why it happens:** Route registration order matters in Express
**How to avoid:** Put named routes BEFORE parameterized `/:id` routes in vehicles.js (same pattern used in violations.js and drivers.js)
**Warning signs:** 404 errors or wrong handler executing for named routes

### Pitfall 2: Missing Loading States During Data Fetch
**What goes wrong:** UI shows stale data or blank during API calls
**Why it happens:** useEffect fetches without loading indicator
**How to avoid:** Use the exact pattern from DriverDetail.jsx: `const [csaLoading, setCsaLoading] = useState(true)` with try/finally
**Warning signs:** Flash of old content before new data loads

### Pitfall 3: Inconsistent Company Scoping
**What goes wrong:** Vehicles/violations from other companies leak into results
**Why it happens:** Missing `req.companyFilter` in queries
**How to avoid:** Always include `...req.companyFilter` in MongoDB queries (same as drivers.js pattern)
**Warning signs:** Users see data they shouldn't have access to

### Pitfall 4: Violation Unlink Breaking Vehicle Links
**What goes wrong:** Unlinking a violation from driver also removes vehicle link (or vice versa)
**Why it happens:** Using wrong unlinking method
**How to avoid:** Create separate `unlinkVehicle` method that only clears `vehicleId`, preserving `driverId`
**Warning signs:** Driver unlink affects vehicle display, or vice versa

### Pitfall 5: Not Handling Zero-Violation State
**What goes wrong:** Division by zero in OOS rate calculation, or ugly 0/0 display
**Why it happens:** No violations exist for the vehicle
**How to avoid:** Check `violations.length > 0` before calculation; show "Clean Record" empty state
**Warning signs:** NaN in UI, or confusing "0%" OOS rate when there are no inspections

## Code Examples

### Vehicle Safety Tab UI (mirrors DriverDetail.jsx pattern)
```jsx
// Source: Follows DriverDetail.jsx lines 735-840 pattern

{activeTab === 'safety' && (
  <div className="space-y-6">
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FiShield className="w-4 h-4 text-primary-500" />
          Violation History
        </h3>
        {oosData && oosData.totalViolations > 0 && (
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            oosData.oosRate > 20 ? 'text-red-600 bg-red-100' :
            oosData.oosRate > 10 ? 'text-yellow-600 bg-yellow-100' :
            'text-green-600 bg-green-100'
          }`}>
            {oosData.oosRate}% OOS Rate
          </span>
        )}
      </div>
      <div className="card-body">
        {oosLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        ) : oosData && oosData.totalViolations > 0 ? (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">{oosData.totalViolations}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Violations</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-500/10 rounded-xl">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{oosData.oosViolations}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Out of Service</p>
              </div>
              <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">{oosData.oosRate}%</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">OOS Rate</p>
              </div>
            </div>

            {/* BASIC Breakdown */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">By Category</p>
              <div className="space-y-2">
                {Object.entries(oosData.basicBreakdown || {})
                  .filter(([, data]) => data.count > 0)
                  .map(([basic, data]) => (
                    <div key={basic} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{data.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-zinc-500">{data.count} violations</span>
                        <span className="text-xs text-red-600">{data.oosCount} OOS</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent Violations List */}
            {oosData.recentViolations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">Recent Violations</p>
                <div className="space-y-2">
                  {oosData.recentViolations.map((violation) => (
                    <div key={violation._id} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{violation.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-zinc-500">{formatDate(violation.date)}</span>
                          <span className="text-xs text-zinc-500">|</span>
                          <span className="text-xs text-zinc-500 capitalize">{basicCategories?.[violation.basic]?.label || violation.basic}</span>
                          {violation.outOfService && (
                            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">OOS</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
              <FiShield className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">Clean Record</h3>
            <p className="text-zinc-500 dark:text-zinc-400">No violations linked to this vehicle</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

### Backend Route Registration (named routes before :id)
```javascript
// Source: Follows drivers.js lines 149-165 pattern

// @route   GET /api/vehicles/stats
// @desc    Get vehicle statistics
router.get('/stats', checkPermission('vehicles', 'view'), asyncHandler(async (req, res) => {
  // ... existing stats logic
}));

// NEW: Named routes BEFORE /:id
// @route   GET /api/vehicles/risk-ranking
// @desc    Get top risk vehicles by OOS rate
router.get('/risk-ranking', checkPermission('vehicles', 'view'), asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;
  const vehicles = await vehicleOOSService.getTopRiskVehicles(req.companyFilter.companyId, parseInt(limit));
  res.json({ success: true, vehicles });
}));

// @route   GET /api/vehicles/:id
// @desc    Get single vehicle
router.get('/:id', checkPermission('vehicles', 'view'), asyncHandler(async (req, res) => {
  // ... existing get by id logic
}));

// @route   GET /api/vehicles/:id/oos-stats
// @desc    Get vehicle's OOS rate and violation stats
router.get('/:id/oos-stats', checkPermission('vehicles', 'view'), asyncHandler(async (req, res) => {
  const stats = await vehicleOOSService.getVehicleOOSStats(req.params.id, req.companyFilter.companyId);
  res.json({ success: true, ...stats });
}));

// @route   GET /api/vehicles/:id/violations
// @desc    Get vehicle's linked violations
router.get('/:id/violations', checkPermission('violations', 'view'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, basic, sortBy = 'violationDate', sortOrder = 'desc' } = req.query;
  const result = await vehicleOOSService.getVehicleViolations(req.params.id, req.companyFilter.companyId, { page, limit, basic, sortBy, sortOrder });
  res.json({ success: true, ...result });
}));
```

### Data Fetching Pattern in React Component
```javascript
// Source: DriverDetail.jsx lines 126-136 pattern

// State
const [oosData, setOosData] = useState(null);
const [oosLoading, setOosLoading] = useState(true);

// Effect
useEffect(() => {
  fetchOOSData();
}, [id]);

const fetchOOSData = async () => {
  setOosLoading(true);
  try {
    const response = await vehiclesAPI.getOOSStats(id);
    setOosData(response.data);
  } catch (error) {
    setOosData(null);
  } finally {
    setOosLoading(false);
  }
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Driver violations unlinked | Driver Safety tab with full CSA impact display | Pre-existing (before Phase 5) | Driver implementation complete |
| Vehicle violations not shown | Vehicle Safety tab with OOS rate | Phase 5 | Vehicle gets same treatment as driver |
| Manual review only | Automatic linking with review queue | Phase 4 | Most violations auto-linked |

**Deprecated/outdated:**
- None identified - the existing driver implementation uses current React patterns (hooks, functional components)

## Open Questions

1. **Should OOS Rate calculation include all violations or only vehicle_maintenance BASIC?**
   - What we know: FMCSA calculates Vehicle OOS rate from vehicle inspection violations
   - What's unclear: Whether to include hours_of_service, driver_fitness etc. linked to vehicle
   - Recommendation: Include ALL violations linked to vehicle (mirrors driver CSA which includes all BASICs)

2. **Should vehicles have a "risk ranking" endpoint like drivers?**
   - What we know: Drivers have `GET /drivers/risk-ranking` returning top 5 risk drivers
   - What's unclear: Whether this is needed for vehicles dashboard
   - Recommendation: Yes, add `GET /vehicles/risk-ranking` for consistency; useful for fleet overview

## Sources

### Primary (HIGH confidence)
- `frontend/src/pages/DriverDetail.jsx` - Complete reference implementation for Safety & CSA tab (lines 735-840)
- `backend/services/driverCSAService.js` - Backend service pattern for CSA calculations
- `backend/routes/drivers.js` - Route patterns for `/csa` and `/violations` endpoints
- `frontend/src/utils/api.js` - API client patterns (driversAPI.getCSAImpact, getViolations)
- `frontend/src/utils/helpers.js` - Utility functions (formatDate, basicCategories)
- `backend/models/Violation.js` - Violation schema with driverId, vehicleId, linkingMetadata

### Secondary (MEDIUM confidence)
- `frontend/src/pages/VehicleDetail.jsx` - Target file for modifications (existing tab structure)
- `backend/routes/vehicles.js` - Target file for new routes

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use in codebase
- Architecture: HIGH - Direct copy of existing driver implementation patterns
- Pitfalls: HIGH - Based on codebase analysis and existing patterns

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable patterns, no external dependencies changing)
