# Phase 9: Unified Filtering - Research

**Researched:** 2026-02-04
**Domain:** Report filtering with date ranges, multi-select dropdowns, and presets in React
**Confidence:** HIGH

## Summary

This phase adds unified filtering capabilities to all report endpoints created in Phase 8. The existing codebase already has filtering patterns in place (e.g., Violations page with status, BASIC, and driver filters), and the backend routes use query parameters for filtering. This phase extends those patterns to the Reports page with richer filtering options including date range presets, multi-select driver/vehicle dropdowns, and status filters.

The recommended approach is to create a **reusable ReportFilters component** that can be configured per report type. Given that `react-datepicker` is already in the frontend dependencies (version 4.25.0), we should use that for date range selection rather than adding new libraries. For multi-select, we will build a lightweight custom component using native HTML checkboxes since adding react-select would add unnecessary bundle size for this use case, and the existing codebase uses native `<select>` elements consistently.

**Primary recommendation:** Create a ReportFilters component using existing `react-datepicker` for date selection and a custom MultiSelectDropdown component for driver/vehicle selection. Implement date presets (Last 30 days, This Quarter, YTD) as clickable buttons that populate the date fields. Backend filtering logic follows the existing pattern in violations route.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-datepicker | ^4.25.0 | Date range selection | Already installed, proven in codebase |
| date-fns | ^3.0.6 | Date calculations for presets | Already installed, used throughout codebase |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | ^3.3.6 | Styling filter components | Already installed, matches existing UI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom MultiSelect | react-select | Bundle size increase (~25KB gzipped); overkill for 10-50 item lists |
| react-datepicker | shadcn/ui date-range-picker | Would require adding Radix UI dependencies; react-datepicker already works |
| Date presets in picker | Separate preset buttons | Buttons are more discoverable and match the existing Reports.jsx UI pattern |

**No new installations required** - all necessary libraries are already in the project.

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── components/
│   ├── filters/
│   │   ├── ReportFilters.jsx        # NEW: Main filter component
│   │   ├── DateRangeFilter.jsx      # NEW: Date inputs + presets
│   │   ├── MultiSelectDropdown.jsx  # NEW: Checkbox-based multi-select
│   │   └── StatusFilter.jsx         # NEW: Single-select status dropdown
│   └── ...
├── pages/
│   └── Reports.jsx                  # MODIFY: Integrate ReportFilters
└── utils/
    └── datePresets.js               # NEW: Preset calculation functions

backend/routes/
└── reports.js                       # MODIFY: Add filter query params
```

### Pattern 1: Composable Filter Component
**What:** ReportFilters component accepts configuration to enable/disable filter types per report
**When to use:** All report types, with different filter combinations enabled
**Example:**
```jsx
// frontend/src/components/filters/ReportFilters.jsx
import { useState, useEffect, useCallback } from 'react';
import DateRangeFilter from './DateRangeFilter';
import MultiSelectDropdown from './MultiSelectDropdown';
import StatusFilter from './StatusFilter';

const ReportFilters = ({
  onFilterChange,
  enableDateRange = false,
  enableDriverFilter = false,
  enableVehicleFilter = false,
  enableStatusFilter = false,
  drivers = [],
  vehicles = [],
  statusOptions = [],
  initialFilters = {}
}) => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    driverIds: [],
    vehicleIds: [],
    status: '',
    ...initialFilters
  });

  // Debounce filter changes to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  const handleDateChange = useCallback((startDate, endDate) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  }, []);

  const handleDriversChange = useCallback((driverIds) => {
    setFilters(prev => ({ ...prev, driverIds }));
  }, []);

  const handleVehiclesChange = useCallback((vehicleIds) => {
    setFilters(prev => ({ ...prev, vehicleIds }));
  }, []);

  const handleStatusChange = useCallback((status) => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4">
      <div className="flex flex-col gap-4">
        {enableDateRange && (
          <DateRangeFilter
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={handleDateChange}
          />
        )}
        <div className="flex flex-wrap gap-4">
          {enableDriverFilter && (
            <MultiSelectDropdown
              label="Drivers"
              options={drivers.map(d => ({
                value: d._id,
                label: `${d.firstName} ${d.lastName}`
              }))}
              selected={filters.driverIds}
              onChange={handleDriversChange}
              placeholder="All Drivers"
            />
          )}
          {enableVehicleFilter && (
            <MultiSelectDropdown
              label="Vehicles"
              options={vehicles.map(v => ({
                value: v._id,
                label: v.unitNumber
              }))}
              selected={filters.vehicleIds}
              onChange={handleVehiclesChange}
              placeholder="All Vehicles"
            />
          )}
          {enableStatusFilter && (
            <StatusFilter
              options={statusOptions}
              value={filters.status}
              onChange={handleStatusChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
```

### Pattern 2: Date Range with Presets
**What:** Date inputs with clickable preset buttons that auto-populate dates
**When to use:** Any date-filtered report
**Example:**
```jsx
// frontend/src/components/filters/DateRangeFilter.jsx
import { getDatePresets } from '../../utils/datePresets';

const DateRangeFilter = ({ startDate, endDate, onChange }) => {
  const presets = getDatePresets();

  const handlePresetClick = (preset) => {
    onChange(preset.startDate, preset.endDate);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              startDate === preset.startDate && endDate === preset.endDate
                ? 'bg-primary-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="form-label">Start Date</label>
          <input
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => onChange(e.target.value, endDate)}
          />
        </div>
        <div className="flex-1">
          <label className="form-label">End Date</label>
          <input
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => onChange(startDate, e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;
```

### Pattern 3: Checkbox-based Multi-Select Dropdown
**What:** Custom dropdown with checkboxes for selecting multiple items
**When to use:** Driver and vehicle selection
**Example:**
```jsx
// frontend/src/components/filters/MultiSelectDropdown.jsx
import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCheck, FiX } from 'react-icons/fi';

const MultiSelectDropdown = ({ label, options, selected, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  const displayText = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? options.find(o => o.value === selected[0])?.label
      : `${selected.length} selected`;

  return (
    <div className="relative min-w-[180px]" ref={dropdownRef}>
      <label className="form-label">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="form-select w-full flex items-center justify-between"
      >
        <span className={selected.length === 0 ? 'text-zinc-400' : ''}>
          {displayText}
        </span>
        <div className="flex items-center gap-1">
          {selected.length > 0 && (
            <FiX
              className="w-4 h-4 text-zinc-400 hover:text-zinc-600"
              onClick={handleClear}
            />
          )}
          <FiChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-zinc-500">No options</div>
          ) : (
            options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => handleToggle(option.value)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{option.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
```

### Pattern 4: Backend Query Parameter Handling
**What:** Extend report routes to accept filter parameters
**When to use:** All report endpoints
**Example:**
```javascript
// backend/routes/reports.js - extend existing endpoints
router.get('/dqf', checkPermission('reports', 'view'), asyncHandler(async (req, res) => {
  const {
    driverId,           // Single driver (existing)
    driverIds,          // Multiple drivers (new - comma-separated)
    startDate,          // Filter by hire date or document dates
    endDate,
    status,             // Driver status (active, inactive, etc.)
    complianceStatus,   // overall compliance (compliant, warning, non_compliant)
    format = 'json'
  } = req.query;
  const companyId = req.companyFilter.companyId;

  const query = { companyId };

  // Single driver filter (backward compatible)
  if (driverId) query._id = driverId;

  // Multiple drivers filter
  if (driverIds) {
    const ids = driverIds.split(',').filter(Boolean);
    if (ids.length > 0) query._id = { $in: ids };
  }

  // Status filter
  if (status) query.status = status;

  // Compliance status filter
  if (complianceStatus) query['complianceStatus.overall'] = complianceStatus;

  // Date range filter (on hire date for DQF)
  if (startDate || endDate) {
    query.hireDate = {};
    if (startDate) query.hireDate.$gte = new Date(startDate);
    if (endDate) query.hireDate.$lte = new Date(endDate);
  }

  const drivers = await Driver.find(query).select('-ssn');
  // ... rest of existing logic
}));
```

### Anti-Patterns to Avoid
- **Inline filter logic in page components:** Extract to ReportFilters component for reusability
- **Excessive re-renders:** Use useCallback for filter change handlers, debounce API calls
- **Loading all data then filtering client-side:** Always filter server-side via query params
- **Hardcoded status values:** Use constants or config for status options to keep in sync with backend models
- **Not handling empty filter arrays:** Backend should treat empty array as "no filter" not "match nothing"

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date preset calculations | Manual date math | date-fns with quarterStart/yearStart | Edge cases: leap years, timezone handling, quarter boundaries |
| Click-outside detection | Event listener management | useRef + useEffect pattern | Memory leaks, event cleanup complexity |
| Debounced filter updates | setTimeout management | lodash debounce or useEffect with cleanup | Race conditions, cleanup on unmount |
| Multi-select state | Complex nested state | Simple array of selected IDs | Easier to serialize for URL params |

**Key insight:** The existing codebase already has solid filtering patterns in the Violations and Drivers pages. Copy those patterns rather than inventing new ones.

## Common Pitfalls

### Pitfall 1: Filter State Lost on Navigation
**What goes wrong:** User sets filters, navigates away, returns to find filters reset
**Why it happens:** Filter state stored only in component state
**How to avoid:** Store filters in URL query params using useSearchParams
**Warning signs:** User complaints about losing filter settings

### Pitfall 2: Date Range Edge Cases
**What goes wrong:** "Last 30 days" returns 29 or 31 days depending on how calculated
**Why it happens:** Using naive date subtraction without considering time zones
**How to avoid:** Use date-fns `subDays`, `startOfDay`, `endOfDay` for precise boundaries
**Warning signs:** Off-by-one errors in date-filtered reports

### Pitfall 3: Multi-Select Causes N+1 Backend Queries
**What goes wrong:** Selecting 10 drivers causes 10 separate API calls
**Why it happens:** Filter change triggers API call per selection
**How to avoid:** Debounce filter changes (300-500ms delay before API call)
**Warning signs:** Performance degradation when selecting multiple filters quickly

### Pitfall 4: Backend Returns 0 Results with Multi-ID Filter
**What goes wrong:** Passing driverIds=[] returns no results instead of all results
**Why it happens:** Empty array in $in operator matches nothing
**How to avoid:** Check array length before applying filter: `if (ids.length > 0)`
**Warning signs:** "No results" when user clears all selections

### Pitfall 5: Preset Highlight State Out of Sync
**What goes wrong:** "Last 30 days" button stays highlighted after user manually changes date
**Why it happens:** Preset state not tied to actual date values
**How to avoid:** Compare current dates to preset dates for highlighting, don't track separately
**Warning signs:** Visual inconsistency between buttons and date inputs

## Code Examples

Verified patterns for this codebase:

### Date Presets Utility
```javascript
// frontend/src/utils/datePresets.js
import {
  subDays,
  startOfQuarter,
  startOfYear,
  format,
  startOfDay,
  endOfDay
} from 'date-fns';

/**
 * Generate date range presets for report filtering
 * @returns {Array<{key: string, label: string, startDate: string, endDate: string}>}
 */
export const getDatePresets = () => {
  const today = new Date();
  const formatDate = (date) => format(date, 'yyyy-MM-dd');

  return [
    {
      key: 'last30',
      label: 'Last 30 Days',
      startDate: formatDate(subDays(today, 30)),
      endDate: formatDate(today)
    },
    {
      key: 'thisQuarter',
      label: 'This Quarter',
      startDate: formatDate(startOfQuarter(today)),
      endDate: formatDate(today)
    },
    {
      key: 'ytd',
      label: 'Year to Date',
      startDate: formatDate(startOfYear(today)),
      endDate: formatDate(today)
    },
    {
      key: 'custom',
      label: 'Custom',
      startDate: '',
      endDate: ''
    }
  ];
};

/**
 * Check if current date range matches a preset
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @returns {string|null} - Preset key or null
 */
export const getActivePreset = (startDate, endDate) => {
  const presets = getDatePresets();
  const match = presets.find(p =>
    p.startDate === startDate && p.endDate === endDate
  );
  return match?.key || 'custom';
};
```

### Status Options by Report Type
```javascript
// frontend/src/utils/reportFilterConfig.js

export const REPORT_FILTER_CONFIG = {
  dqf: {
    enableDateRange: true,
    enableDriverFilter: true,
    enableVehicleFilter: false,
    enableStatusFilter: true,
    statusOptions: [
      { value: '', label: 'All Status' },
      { value: 'compliant', label: 'Compliant' },
      { value: 'warning', label: 'Warning' },
      { value: 'non_compliant', label: 'Non-Compliant' }
    ],
    dateFilterField: 'hireDate' // What date field to filter on
  },
  vehicle: {
    enableDateRange: true,
    enableDriverFilter: false,
    enableVehicleFilter: true,
    enableStatusFilter: true,
    statusOptions: [
      { value: '', label: 'All Status' },
      { value: 'compliant', label: 'Compliant' },
      { value: 'warning', label: 'Warning' },
      { value: 'non_compliant', label: 'Non-Compliant' },
      { value: 'out_of_service', label: 'Out of Service' }
    ],
    dateFilterField: 'annualInspection.nextDueDate'
  },
  violations: {
    enableDateRange: true,
    enableDriverFilter: true,
    enableVehicleFilter: true,
    enableStatusFilter: true,
    statusOptions: [
      { value: '', label: 'All Status' },
      { value: 'open', label: 'Open' },
      { value: 'dispute_in_progress', label: 'Dispute In Progress' },
      { value: 'resolved', label: 'Resolved' },
      { value: 'dismissed', label: 'Dismissed' },
      { value: 'upheld', label: 'Upheld' }
    ],
    dateFilterField: 'violationDate'
  },
  audit: {
    enableDateRange: false,  // Audit is a snapshot, not date-filtered
    enableDriverFilter: false,
    enableVehicleFilter: false,
    enableStatusFilter: false,
    statusOptions: []
  }
};
```

### Frontend API Updates for Multi-Select
```javascript
// frontend/src/utils/api.js - extend reportsAPI
export const reportsAPI = {
  getDqfReport: (params) => api.get('/reports/dqf', {
    params: {
      ...params,
      // Convert arrays to comma-separated strings for query params
      driverIds: params.driverIds?.join(','),
      vehicleIds: params.vehicleIds?.join(',')
    },
    responseType: ['pdf', 'csv', 'xlsx'].includes(params.format) ? 'blob' : 'json',
    timeout: 60000 // 60s for large reports with filters
  }),
  getVehicleMaintenanceReport: (params) => api.get('/reports/vehicle-maintenance', {
    params: {
      ...params,
      vehicleIds: params.vehicleIds?.join(',')
    },
    responseType: ['pdf', 'csv', 'xlsx'].includes(params.format) ? 'blob' : 'json',
    timeout: 60000
  }),
  getViolationsReport: (params) => api.get('/reports/violations', {
    params: {
      ...params,
      driverIds: params.driverIds?.join(','),
      vehicleIds: params.vehicleIds?.join(',')
    },
    responseType: ['pdf', 'csv', 'xlsx'].includes(params.format) ? 'blob' : 'json',
    timeout: 60000
  }),
  getAuditReport: (params) => api.get('/reports/audit', {
    params,
    responseType: ['pdf', 'csv', 'xlsx'].includes(params.format) ? 'blob' : 'json',
    timeout: 60000
  })
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| URL search params | React state + debounce | Still valid, choose per UX need | URL params better for shareable links |
| Full-page reload on filter | SPA filter + partial fetch | Standard practice | Better UX, faster response |
| Server renders filtered HTML | API returns JSON, client renders | Standard practice | Separation of concerns |

**Existing codebase patterns:**
- Violations page uses `useState` for filters with `useEffect` triggering refetch
- Drivers page uses the same pattern
- Reports page already has basic dateRange state - extend it

## Open Questions

Things that couldn't be fully resolved:

1. **Should filters persist in URL?**
   - What we know: URL params enable shareable filtered views
   - What's unclear: Do users share report links? Is this UX needed?
   - Recommendation: Start without URL persistence; add in Phase 10+ if users request

2. **Should multi-select have a "Select All" option?**
   - What we know: For 5-10 drivers, individual selection works; for 50+ drivers, "Select All" helps
   - What's unclear: Typical fleet sizes for users
   - Recommendation: Implement "Select All" if list > 20 items; show count in header

3. **Date range validation**
   - What we know: Start date should not be after end date
   - What's unclear: How to handle invalid ranges
   - Recommendation: Disable end dates before start date; show validation message

## Sources

### Primary (HIGH confidence)
- Existing codebase: `frontend/src/pages/Violations.jsx` - Filter UI pattern (lines 546-593)
- Existing codebase: `frontend/src/pages/Drivers.jsx` - Filter state management pattern
- Existing codebase: `backend/routes/reports.js` - Query parameter handling
- Existing codebase: `backend/routes/violations.js` - Multi-filter MongoDB query building
- [date-fns Documentation](https://date-fns.org/docs/Getting-Started) - Date calculation functions
- [react-datepicker npm](https://www.npmjs.com/package/react-datepicker) - Already installed v4.25.0

### Secondary (MEDIUM confidence)
- [React-Select Advanced](https://react-select.com/advanced) - Multi-select patterns (not using but informs design)
- [shadcn/ui Date Range Picker](https://www.shadcn.io/template/johnpolacek-date-range-picker-for-shadcn) - Preset UI inspiration

### Tertiary (LOW confidence)
- Web search results for multi-select best practices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in codebase
- Architecture: HIGH - Patterns derived directly from existing codebase
- Pitfalls: HIGH - Common React/filtering issues well documented

**Research date:** 2026-02-04
**Valid until:** 2026-05-04 (patterns are stable, internal to codebase)
