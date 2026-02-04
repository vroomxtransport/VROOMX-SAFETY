---
phase: 10
plan: 03
subsystem: reports
tags: [dataq, accidents, maintenance, mongodb-aggregation, pdf-reports]
dependency-graph:
  requires: ["08-export-foundation", "10-02"]
  provides: ["DataQ Challenge History Report", "Accident Summary Report", "Maintenance Cost Report"]
  affects: ["scheduled-reports", "audit-readiness"]
tech-stack:
  added: []
  patterns: ["MongoDB aggregation pipeline for cost analysis", "Currency formatting helper"]
key-files:
  created: []
  modified:
    - backend/routes/reports.js
    - frontend/src/utils/api.js
    - frontend/src/pages/Reports.jsx
    - frontend/src/utils/reportFilterConfig.js
decisions:
  - key: "success-rate-calculation"
    choice: "accepted / (accepted + denied) excluding pending/withdrawn"
    reason: "Only resolved challenges should count toward success rate"
  - key: "csa-points-saved-estimate"
    choice: "Use severity weight of accepted challenges"
    reason: "Severity weight is the direct CSA impact factor"
  - key: "aggregation-by-vendor"
    choice: "Filter by provider.name exists and not empty"
    reason: "Exclude records without vendor info from vendor breakdown"
metrics:
  duration: "3min"
  completed: "2026-02-04"
---

# Phase 10 Plan 03: DataQ, Accident, Maintenance Reports Summary

DataQ Challenge History with success rates and CSA points saved estimation, Accident Summary with DOT reportable categorization and cost totals, Maintenance Cost Report with MongoDB aggregation by vehicle/category/vendor.

## What Was Built

### 1. DataQ Challenge History Report (`GET /api/reports/dataq-history`)

**Query Parameters:**
- `format`: json (default), csv, xlsx, pdf
- `startDate`, `endDate`: Filter by challenge submission date
- `driverIds`: Comma-separated driver IDs

**Features:**
- Lists all violations with DataQ challenges submitted
- Calculates success rate: `accepted / (accepted + denied)` - excludes pending/withdrawn
- Estimates CSA points saved from accepted challenges (sum of severity weights)
- Groups by status: accepted, denied, pending/under_review, withdrawn

**Response Summary:**
```javascript
{
  totalSubmissions: 15,
  accepted: 8,
  denied: 4,
  pending: 2,
  withdrawn: 1,
  successRate: 67, // percentage
  estimatedCsaPointsSaved: 24
}
```

### 2. Accident Summary Report (`GET /api/reports/accident-summary`)

**Query Parameters:**
- `format`: json (default), csv, xlsx, pdf
- `startDate`, `endDate`: Filter by accident date
- `driverIds`, `vehicleIds`: Comma-separated IDs

**Features:**
- Lists all accidents with DOT reportable status
- Categorizes by recordable criteria: fatalities, injuries, tow-aways
- Calculates total estimated cost across all accidents
- Counts total injuries and fatalities
- Formats costs as currency ($X,XXX.XX)

**Response Summary:**
```javascript
{
  totalAccidents: 12,
  dotReportable: 5,
  totalInjuries: 3,
  totalFatalities: 0,
  totalEstimatedCost: 45000,
  byRecordableCriteria: {
    fatalities: 0,
    injuries: 2,
    towAways: 3
  }
}
```

### 3. Maintenance Cost Report (`GET /api/reports/maintenance-costs`)

**Query Parameters:**
- `format`: json (default), csv, xlsx, pdf
- `startDate`, `endDate`: Filter by service date
- `vehicleIds`: Comma-separated vehicle IDs

**Features:**
- Uses MongoDB aggregation pipeline for efficient grouping
- Aggregates by vehicle with lookup to get unit numbers
- Aggregates by record type (category)
- Aggregates by vendor (provider.name)
- Separates labor and parts costs
- PDF shows top 10 by vehicle and top 10 by vendor

**Response Structure:**
```javascript
{
  summary: { totalCost, laborCost, partsCost, recordCount },
  byVehicle: [{ vehicleId, unitNumber, totalCost, laborCost, partsCost, recordCount }],
  byCategory: [{ category, totalCost, recordCount }],
  byVendor: [{ vendor, totalCost, recordCount }]
}
```

### 4. Frontend Integration

**API Methods Added:**
- `reportsAPI.getDataQHistoryReport(params)`
- `reportsAPI.getAccidentSummaryReport(params)`
- `reportsAPI.getMaintenanceCostReport(params)`

**Report Cards Added:**
- DataQ Challenge History (indigo, FiFileText icon)
- Accident Summary (red, FiAlertTriangle icon)
- Maintenance Cost Report (green, FiDollarSign icon)

**Filter Configurations:**
| Report | Date Range | Drivers | Vehicles | Status |
|--------|-----------|---------|----------|--------|
| dataq-history | Yes | Yes | No | No |
| accident-summary | Yes | Yes | Yes | No |
| maintenance-costs | Yes | No | Yes | No |

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Success rate calculation | Accepted/(Accepted+Denied) | Only resolved challenges should count; pending/withdrawn are inconclusive |
| CSA points saved estimate | Sum of severity weights | Severity weight is the direct CSA impact factor per FMCSA methodology |
| Vendor aggregation filter | provider.name exists && != '' | Exclude records without vendor information from vendor analysis |
| Currency formatting | Intl.NumberFormat USD | Standard US currency format for consistency |

## Deviations from Plan

None - plan executed exactly as written.

## Test Commands

```bash
# DataQ Challenge History
curl -X GET "http://localhost:5001/api/reports/dataq-history?format=json" -H "Authorization: Bearer $TOKEN"

# Accident Summary
curl -X GET "http://localhost:5001/api/reports/accident-summary?format=json" -H "Authorization: Bearer $TOKEN"

# Maintenance Costs
curl -X GET "http://localhost:5001/api/reports/maintenance-costs?format=json" -H "Authorization: Bearer $TOKEN"
```

## Success Criteria Verification

- [x] User can generate DataQ Challenge History Report (NRPT-01)
- [x] DataQ shows submissions, outcomes, success rate (NRPT-02)
- [x] DataQ shows estimated CSA points saved (NRPT-03)
- [x] User can generate Accident Summary Report (NRPT-04)
- [x] Accident shows DOT reportable, injuries, fatalities, costs (NRPT-05)
- [x] User can generate Maintenance Cost Report (NRPT-06)
- [x] Maintenance shows spending by vehicle, category, vendor (NRPT-07)
- [x] All reports include DOT number and timestamp in PDF header (FMCS-08)
- [x] PDF formatting consistent and audit-ready (FMCS-09)

## Next Phase Readiness

Phase 10 Plan 03 complete. Reports page now has 9 report types:
1. Driver Qualification Files
2. Vehicle Maintenance
3. Violations Summary
4. Comprehensive Audit Report
5. Document Expiration Report
6. Drug & Alcohol Summary
7. DataQ Challenge History (new)
8. Accident Summary (new)
9. Maintenance Cost Report (new)

Ready for Plan 04: Scheduled Reports Expansion (add new report types to scheduled report system).
