# VroomX FMCSA Integration Guide

## Current State Analysis

### What You Already Have ✅

Your codebase already has a **robust FMCSA integration** in place:

| Component | Status | Location |
|-----------|--------|----------|
| FMCSA Service | ✅ Built | `/backend/services/fmcsaService.js` |
| CSA Checker (Public) | ✅ Working | `/backend/routes/csaChecker.js` |
| Company Model | ✅ Has smsBasics | `/backend/models/Company.js` |
| Dashboard Route | ✅ Returns BASICs | `/backend/routes/dashboard.js` |

### How It Currently Works

```
PUBLIC CSA CHECKER (Lead Magnet):
User enters DOT# → fmcsaService.fetchCarrierData() → Real FMCSA data via Puppeteer scraping

AUTHENTICATED DASHBOARD:
User logs in → Dashboard fetches company.smsBasics → Shows stored BASICs (not live FMCSA)
```

### The Gap 🔴

**Problem:** When a user registers/logs in, their `smsBasics` in the Company model is EMPTY (`null` values). The dashboard shows "0%" for all BASICs because it reads from the database, not from live FMCSA data.

**Solution:** Auto-fetch FMCSA data when:
1. User registers with DOT number
2. User logs in (if data is stale/missing)
3. Periodic background sync

---

## Solution: Auto-Sync FMCSA Data

### Option 1: Official FMCSA API (Recommended) ⭐

**Pros:**
- Free & official
- Reliable, no scraping
- Returns structured JSON

**Cons:**
- Full CSA percentiles are NOT publicly available via API
- Only basic safety data (inspections, crashes, OOS rates)

**API Details:**
```
Base URL: https://mobile.fmcsa.dot.gov/qc/services/
Auth: WebKey (free registration required)
Endpoints:
  /carriers/{dotNumber} - Basic carrier info
  /carriers/{dotNumber}/basics - BASICs data (limited)
  /carriers/{dotNumber}/complete - All carrier details
```

**Registration:**
1. Go to: https://mobile.fmcsa.dot.gov/QCDevsite/
2. Sign in with Login.gov
3. Generate a WebKey

### Option 2: Keep Current Puppeteer Scraping (Works Now)

**Pros:**
- Already built and working
- Gets REAL percentile scores from SMS pages

**Cons:**
- Slower (browser automation)
- Can break if FMCSA changes HTML
- Resource-intensive in cloud

---

## Implementation Plan

### Step 1: Create FMCSA Sync Service

Create a new service that syncs FMCSA data to the Company model:

**File: `/backend/services/fmcsaSyncService.js`**

```javascript
const fmcsaService = require('./fmcsaService');
const Company = require('../models/Company');

const fmcsaSyncService = {
  /**
   * Sync FMCSA data for a company
   * Call this on registration and periodically
   */
  async syncCompanyData(companyId) {
    try {
      const company = await Company.findById(companyId);
      if (!company || !company.dotNumber) {
        console.log('[FMCSA Sync] No DOT number for company:', companyId);
        return null;
      }

      // Check if data is fresh (less than 6 hours old)
      const lastSync = company.smsBasics?.lastUpdated;
      if (lastSync && (Date.now() - new Date(lastSync).getTime()) < 6 * 60 * 60 * 1000) {
        console.log('[FMCSA Sync] Data is fresh, skipping sync');
        return company.smsBasics;
      }

      console.log(`[FMCSA Sync] Fetching data for DOT ${company.dotNumber}`);

      // Use existing fmcsaService to fetch real data
      const fmcsaData = await fmcsaService.fetchCarrierData(company.dotNumber);

      if (!fmcsaData.success) {
        console.error('[FMCSA Sync] Failed to fetch:', fmcsaData.error);
        return null;
      }

      // Update company with FMCSA data
      const updatedCompany = await Company.findByIdAndUpdate(
        companyId,
        {
          // Update carrier info
          name: fmcsaData.carrier.legalName || company.name,
          mcNumber: fmcsaData.carrier.mcNumber || company.mcNumber,
          'address.street': fmcsaData.carrier.address?.street || company.address?.street,
          'address.city': fmcsaData.carrier.address?.city || company.address?.city,
          'address.state': fmcsaData.carrier.address?.state || company.address?.state,
          'address.zipCode': fmcsaData.carrier.address?.zip || company.address?.zipCode,
          phone: fmcsaData.carrier.phone || company.phone,
          'fleetSize.powerUnits': fmcsaData.carrier.fleetSize?.powerUnits || company.fleetSize?.powerUnits,
          'fleetSize.drivers': fmcsaData.carrier.fleetSize?.drivers || company.fleetSize?.drivers,

          // Update SMS BASICs
          smsBasics: {
            unsafeDriving: fmcsaData.basics?.unsafeDriving,
            hoursOfService: fmcsaData.basics?.hosCompliance,
            vehicleMaintenance: fmcsaData.basics?.vehicleMaintenance,
            controlledSubstances: fmcsaData.basics?.controlledSubstances,
            driverFitness: fmcsaData.basics?.driverFitness,
            crashIndicator: fmcsaData.basics?.crashIndicator,
            lastUpdated: new Date()
          },

          // Store additional FMCSA data
          fmcsaData: {
            inspections: fmcsaData.inspections,
            crashes: fmcsaData.crashes,
            operatingStatus: fmcsaData.carrier.operatingStatus,
            safetyRating: fmcsaData.carrier.safetyRating,
            outOfServiceRate: fmcsaData.carrier.outOfServiceRate,
            lastFetched: new Date(),
            dataSource: 'FMCSA_SAFER'
          }
        },
        { new: true }
      );

      console.log(`[FMCSA Sync] Updated company ${company.dotNumber} with FMCSA data`);
      return updatedCompany.smsBasics;

    } catch (error) {
      console.error('[FMCSA Sync] Error:', error.message);
      return null;
    }
  },

  /**
   * Sync on user login if data is stale
   */
  async syncOnLogin(userId) {
    try {
      const User = require('../models/User');
      const user = await User.findById(userId).populate('companyId');

      if (user?.companyId) {
        return await this.syncCompanyData(user.companyId._id || user.companyId);
      }
    } catch (error) {
      console.error('[FMCSA Sync] Login sync error:', error.message);
    }
    return null;
  },

  /**
   * Force refresh - bypasses cache
   */
  async forceRefresh(companyId) {
    const company = await Company.findById(companyId);
    if (company?.dotNumber) {
      // Clear cache first
      fmcsaService.clearCache(company.dotNumber);
    }
    return this.syncCompanyData(companyId);
  }
};

module.exports = fmcsaSyncService;
```

### Step 2: Update Registration Flow

Modify `/backend/routes/auth.js` to sync FMCSA data when user registers:

```javascript
// In the register route, after creating the company:
const fmcsaSyncService = require('../services/fmcsaSyncService');

// After company is created with DOT number:
if (company.dotNumber) {
  // Async - don't wait for it to complete
  fmcsaSyncService.syncCompanyData(company._id).catch(err => {
    console.error('Background FMCSA sync failed:', err.message);
  });
}
```

### Step 3: Update Login Flow

Add FMCSA sync check on login:

```javascript
// In the login route, after successful auth:
const fmcsaSyncService = require('../services/fmcsaSyncService');

// After generating token, trigger background sync:
fmcsaSyncService.syncOnLogin(user._id).catch(err => {
  console.error('Login FMCSA sync failed:', err.message);
});
```

### Step 4: Add Manual Refresh Endpoint

Add to `/backend/routes/dashboard.js`:

```javascript
const fmcsaSyncService = require('../services/fmcsaSyncService');

// @route   POST /api/dashboard/refresh-fmcsa
// @desc    Force refresh FMCSA data from SAFER
// @access  Private
router.post('/refresh-fmcsa', asyncHandler(async (req, res) => {
  const companyId = req.user.companyId._id || req.user.companyId;

  const smsBasics = await fmcsaSyncService.forceRefresh(companyId);

  if (!smsBasics) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch FMCSA data. Please try again later.'
    });
  }

  res.json({
    success: true,
    message: 'FMCSA data refreshed successfully',
    smsBasics
  });
}));
```

### Step 5: Update Company Model

Add `fmcsaData` field to store additional FMCSA info:

```javascript
// Add to Company schema:
fmcsaData: {
  inspections: {
    total: Number,
    last24Months: Number
  },
  crashes: {
    total: Number,
    last24Months: Number
  },
  operatingStatus: String,
  safetyRating: String,
  outOfServiceRate: {
    vehicle: Number,
    driver: Number
  },
  lastFetched: Date,
  dataSource: String
}
```

### Step 6: Add Refresh Button to Dashboard

In the frontend Dashboard, add a "Refresh FMCSA Data" button:

```jsx
const handleRefreshFMCSA = async () => {
  setRefreshing(true);
  try {
    await dashboardAPI.post('/refresh-fmcsa');
    await fetchDashboard(); // Reload dashboard data
    toast.success('FMCSA data updated!');
  } catch (err) {
    toast.error('Failed to refresh FMCSA data');
  } finally {
    setRefreshing(false);
  }
};
```

---

## Data Flow After Implementation

```
REGISTRATION:
1. User enters DOT# during signup
2. Backend creates Company with DOT#
3. fmcsaSyncService.syncCompanyData() runs in background
4. Puppeteer fetches real CSA scores from FMCSA SMS
5. Company.smsBasics populated with real percentiles

LOGIN:
1. User logs in
2. fmcsaSyncService.syncOnLogin() checks if data is stale (>6 hours)
3. If stale, fetches fresh data from FMCSA
4. Company.smsBasics updated

DASHBOARD:
1. Dashboard loads, calls GET /api/dashboard
2. Returns company.smsBasics (now populated with real data!)
3. BASICs display real FMCSA percentiles

MANUAL REFRESH:
1. User clicks "Refresh FMCSA Data" button
2. POST /api/dashboard/refresh-fmcsa
3. Forces fresh fetch from FMCSA (bypasses cache)
4. Dashboard updates with latest data
```

---

## Important Notes

### CSA Percentile Limitations

The FMCSA does **NOT** provide full CSA percentile scores via their public API. The official QCMobile API only gives:
- Basic carrier info
- Inspection counts
- Crash totals
- Out-of-service rates
- Some BASIC data (limited)

**To get actual percentile scores**, you must either:
1. Use Puppeteer to scrape the SMS pages (current implementation)
2. Have the carrier authenticate with their DOT PIN (not practical)

Your current implementation already handles this via Puppeteer scraping of:
- `https://ai.fmcsa.dot.gov/SMS/Carrier/{DOT}/BASIC/{BasicName}.aspx`

### Rate Limiting & Caching

- Current cache TTL: 6 hours
- FMCSA updates scores weekly (every Monday)
- Recommendation: Sync once daily max, or on user request

### Cloud Deployment Considerations

Puppeteer requires Chromium. Your code already handles this with:
- `@sparticuz/chromium` for cloud environments (Render, AWS Lambda)
- Local Chrome for development

Make sure your deployment has enough memory (512MB+ recommended for Puppeteer).

---

## Quick Implementation Checklist

- [ ] Create `/backend/services/fmcsaSyncService.js`
- [ ] Add `fmcsaData` field to Company model
- [ ] Update registration route to trigger sync
- [ ] Update login route to trigger sync check
- [ ] Add `/api/dashboard/refresh-fmcsa` endpoint
- [ ] Add "Refresh" button to Dashboard UI
- [ ] Test with real DOT numbers
- [ ] Deploy and verify Puppeteer works in cloud

---

## Testing

Test with these real DOT numbers:
- `2247598` - Werner Enterprises (large carrier)
- `24012` - J.B. Hunt (large carrier)
- `584942` - Swift Transportation

These are large carriers with full BASIC data available.
