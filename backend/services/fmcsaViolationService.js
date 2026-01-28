/**
 * FMCSA Violation Service - Scrapes inspection and violation data from FMCSA SMS
 *
 * Data Sources:
 * - SMS Inspections: https://ai.fmcsa.dot.gov/SMS/Carrier/{DOT}/Inspections.aspx
 * - SMS Inspection Detail: https://ai.fmcsa.dot.gov/SMS/Carrier/{DOT}/Inspections/{ReportNumber}.aspx
 */

const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const NodeCache = require('node-cache');
const FMCSAInspection = require('../models/FMCSAInspection');
const Company = require('../models/Company');
const { BASIC_MAP_REVERSE } = require('../config/fmcsaCompliance');

// Cache for 6 hours (FMCSA updates weekly)
const cache = new NodeCache({ stdTTL: 21600, checkperiod: 600 });

// Browser instance for reuse
let browserInstance = null;

// BASIC category mapping from FMCSA terminology to our enum
const BASIC_MAPPING = {
  'Unsafe Driving': 'unsafe_driving',
  'HOS Compliance': 'hours_of_service',
  'Hours of Service': 'hours_of_service',
  'Vehicle Maintenance': 'vehicle_maintenance',
  'Vehicle Maint': 'vehicle_maintenance',
  'Controlled Substances/Alcohol': 'controlled_substances',
  'Drugs/Alcohol': 'controlled_substances',
  'Driver Fitness': 'driver_fitness',
  'Crash Indicator': 'crash_indicator',
  'Hazmat Compliance': 'hazmat',
  'Hazmat': 'hazmat'
};

// Severity weight estimation based on violation code patterns
const SEVERITY_ESTIMATES = {
  // Out-of-service violations are typically higher severity
  oos: 8,
  // Speeding violations
  '392.2': 5,
  // Hours of Service
  '395': 6,
  // Vehicle equipment
  '393': 4,
  // Driver qualification
  '391': 5,
  // Drugs/Alcohol
  '382': 10,
  // Default
  default: 5
};

const fmcsaViolationService = {
  /**
   * Get or create browser instance
   */
  async getBrowser() {
    if (!browserInstance || !browserInstance.isConnected()) {
      const isCloud = process.env.RENDER === 'true' ||
                      process.env.AWS_LAMBDA_FUNCTION_NAME ||
                      process.env.VERCEL ||
                      process.env.NODE_ENV === 'production';

      const isLocal = process.env.PUPPETEER_EXECUTABLE_PATH ||
                      (!isCloud && process.env.NODE_ENV === 'development');

      let executablePath;
      let args;

      if (isLocal) {
        executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'];
      } else {
        executablePath = await chromium.executablePath();
        args = [...chromium.args, '--disable-gpu', '--disable-dev-shm-usage', '--single-process', '--no-zygote'];
      }

      browserInstance = await puppeteer.launch({
        args,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath,
        headless: true,
        ignoreHTTPSErrors: process.env.NODE_ENV === 'development'
      });
    }
    return browserInstance;
  },

  /**
   * Map FMCSA BASIC name to our enum value
   */
  mapBasicCategory(fmcsaBasic) {
    if (!fmcsaBasic) return 'vehicle_maintenance'; // Default
    const normalized = fmcsaBasic.trim();
    return BASIC_MAPPING[normalized] || 'vehicle_maintenance';
  },

  /**
   * Estimate severity weight from violation code
   */
  estimateSeverity(code, isOOS) {
    if (isOOS) return SEVERITY_ESTIMATES.oos;
    if (!code) return SEVERITY_ESTIMATES.default;

    // Check for matching patterns
    for (const [pattern, weight] of Object.entries(SEVERITY_ESTIMATES)) {
      if (pattern !== 'default' && pattern !== 'oos' && code.startsWith(pattern)) {
        return weight;
      }
    }
    return SEVERITY_ESTIMATES.default;
  },

  /**
   * Fetch inspection list from FMCSA SMS
   * Returns array of inspection summaries with links to details
   */
  async fetchInspectionList(dotNumber) {
    const cacheKey = `inspections:${dotNumber}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`[FMCSA Violations] Cache hit for DOT ${dotNumber}`);
      return cached;
    }

    let page = null;
    const browser = await this.getBrowser();

    try {
      page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      // Navigate to inspections page
      const url = `https://ai.fmcsa.dot.gov/SMS/Carrier/${dotNumber}/Inspections.aspx`;
      console.log(`[FMCSA Violations] Fetching inspections from: ${url}`);

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for table to load
      await page.waitForSelector('table', { timeout: 10000 }).catch(() => null);

      // Extract inspection data from table
      const inspections = await page.evaluate(() => {
        const results = [];
        const rows = document.querySelectorAll('table tr');

        rows.forEach((row, index) => {
          // Skip header row
          if (index === 0) return;

          const cells = row.querySelectorAll('td');
          if (cells.length < 4) return;

          // Parse inspection row data
          // Typical columns: Report #, Date, State, Level, OOS
          const reportLink = cells[0]?.querySelector('a');
          const reportNumber = reportLink?.textContent?.trim() || cells[0]?.textContent?.trim();

          if (!reportNumber || reportNumber === 'Report #') return;

          const inspection = {
            reportNumber,
            inspectionDate: cells[1]?.textContent?.trim(),
            state: cells[2]?.textContent?.trim(),
            inspectionLevel: parseInt(cells[3]?.textContent?.trim()) || null,
            vehicleOOS: cells[4]?.textContent?.toLowerCase().includes('yes') || false,
            driverOOS: cells[5]?.textContent?.toLowerCase().includes('yes') || false,
            totalViolations: parseInt(cells[6]?.textContent?.trim()) || 0,
            detailUrl: reportLink?.href || null
          };

          results.push(inspection);
        });

        return results;
      });

      console.log(`[FMCSA Violations] Found ${inspections.length} inspections for DOT ${dotNumber}`);

      // Cache the results
      cache.set(cacheKey, inspections);

      return inspections;
    } catch (error) {
      console.error(`[FMCSA Violations] Error fetching inspection list:`, error.message);
      return [];
    } finally {
      if (page) await page.close().catch(() => {});
    }
  },

  /**
   * Fetch detailed violation data for a specific inspection
   */
  async fetchInspectionDetails(dotNumber, reportNumber) {
    let page = null;
    const browser = await this.getBrowser();

    try {
      page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      // Try different URL patterns for inspection details
      const urls = [
        `https://ai.fmcsa.dot.gov/SMS/Carrier/${dotNumber}/Inspections/${reportNumber}.aspx`,
        `https://ai.fmcsa.dot.gov/SMS/Carrier/${dotNumber}/Inspection.aspx?report=${reportNumber}`
      ];

      let violations = [];

      for (const url of urls) {
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

          // Extract violations from detail page
          violations = await page.evaluate(() => {
            const results = [];

            // Look for violation tables/sections
            const violationRows = document.querySelectorAll('.violation, [class*="violation"], table tr');

            violationRows.forEach(row => {
              const text = row.textContent || '';

              // Parse CFR code (e.g., "395.8(a)(1)")
              const codeMatch = text.match(/(\d{3}\.\d+[a-zA-Z]?\([^)]+\)?)/);

              // Parse BASIC category
              const basicMatch = text.match(/(Unsafe Driving|HOS|Hours of Service|Vehicle Maint|Controlled|Driver Fitness|Hazmat|Crash)/i);

              // Check for OOS
              const isOOS = text.toLowerCase().includes('oos') ||
                           text.toLowerCase().includes('out of service') ||
                           text.toLowerCase().includes('out-of-service');

              if (codeMatch || basicMatch) {
                results.push({
                  code: codeMatch ? codeMatch[1] : null,
                  description: text.substring(0, 200).trim(),
                  basicRaw: basicMatch ? basicMatch[1] : null,
                  oos: isOOS,
                  unit: text.toLowerCase().includes('driver') ? 'driver' :
                        text.toLowerCase().includes('vehicle') ? 'vehicle' :
                        text.toLowerCase().includes('hazmat') ? 'hazmat' : 'other'
                });
              }
            });

            return results;
          });

          if (violations.length > 0) break;
        } catch (e) {
          console.log(`[FMCSA Violations] URL attempt failed: ${url}`);
        }
      }

      // Process violations with BASIC mapping and severity
      return violations.map(v => ({
        code: v.code,
        description: v.description,
        basic: this.mapBasicCategory(v.basicRaw),
        severityWeight: this.estimateSeverity(v.code, v.oos),
        oos: v.oos,
        unit: v.unit
      }));
    } catch (error) {
      console.error(`[FMCSA Violations] Error fetching inspection details:`, error.message);
      return [];
    } finally {
      if (page) await page.close().catch(() => {});
    }
  },

  /**
   * Sync all inspections and violations for a company
   * @param {ObjectId} companyId - Company ID
   * @param {boolean} forceRefresh - Bypass cache
   * @returns {object} Sync results
   */
  async syncViolationHistory(companyId, forceRefresh = false) {
    try {
      const company = await Company.findById(companyId);
      if (!company?.dotNumber) {
        return { success: false, message: 'Company DOT number not found' };
      }

      const dotNumber = company.dotNumber;
      console.log(`[FMCSA Violations] Starting sync for DOT ${dotNumber}, Company: ${companyId}`);

      // Fetch inspection list
      const inspections = await this.fetchInspectionList(dotNumber);

      if (!inspections.length) {
        return {
          success: true,
          message: 'No inspections found',
          imported: 0,
          total: 0
        };
      }

      let imported = 0;
      let updated = 0;
      let errors = 0;

      // Process each inspection
      for (const insp of inspections) {
        try {
          // Check if already exists
          const existing = await FMCSAInspection.findOne({
            companyId,
            reportNumber: insp.reportNumber
          });

          if (existing && !forceRefresh) {
            // Already have this inspection
            continue;
          }

          // Parse inspection date
          let inspectionDate;
          try {
            inspectionDate = new Date(insp.inspectionDate);
            if (isNaN(inspectionDate.getTime())) {
              inspectionDate = new Date();
            }
          } catch {
            inspectionDate = new Date();
          }

          // Fetch detailed violations if available
          let violations = [];
          if (insp.totalViolations > 0) {
            violations = await this.fetchInspectionDetails(dotNumber, insp.reportNumber);
          }

          // Create or update inspection record
          const inspectionData = {
            companyId,
            reportNumber: insp.reportNumber,
            inspectionDate,
            state: insp.state,
            inspectionLevel: insp.inspectionLevel,
            inspectionType: 'roadside',
            vehicleOOS: insp.vehicleOOS,
            driverOOS: insp.driverOOS,
            hazmatOOS: false,
            totalViolations: violations.length || insp.totalViolations,
            violations,
            importedAt: new Date(),
            source: 'fmcsa_sms'
          };

          if (existing) {
            await FMCSAInspection.updateOne(
              { _id: existing._id },
              { $set: inspectionData }
            );
            updated++;
          } else {
            const newInspection = new FMCSAInspection(inspectionData);
            newInspection.calculateTimeWeights();
            await newInspection.save();
            imported++;
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          console.error(`[FMCSA Violations] Error processing inspection ${insp.reportNumber}:`, err.message);
          errors++;
        }
      }

      // Update company's last sync timestamp
      await Company.updateOne(
        { _id: companyId },
        {
          $set: {
            'fmcsaData.lastViolationSync': new Date(),
            'fmcsaData.inspectionCount': inspections.length
          }
        }
      );

      console.log(`[FMCSA Violations] Sync complete. Imported: ${imported}, Updated: ${updated}, Errors: ${errors}`);

      return {
        success: true,
        message: `Synced ${imported} new, ${updated} updated inspections`,
        imported,
        updated,
        errors,
        total: inspections.length
      };
    } catch (error) {
      console.error(`[FMCSA Violations] Sync failed:`, error.message);
      return {
        success: false,
        message: error.message,
        imported: 0
      };
    }
  },

  /**
   * Get sync status for a company
   */
  async getSyncStatus(companyId) {
    const company = await Company.findById(companyId).select('fmcsaData.lastViolationSync fmcsaData.inspectionCount');
    const inspectionCount = await FMCSAInspection.countDocuments({ companyId });

    return {
      lastSync: company?.fmcsaData?.lastViolationSync || null,
      inspectionCount,
      canSync: true // Could add rate limiting logic here
    };
  },

  /**
   * Get inspection history for a company
   */
  async getInspections(companyId, options = {}) {
    const { page = 1, limit = 20, dateFrom, dateTo, state, hasViolations } = options;

    const query = { companyId };

    if (dateFrom || dateTo) {
      query.inspectionDate = {};
      if (dateFrom) query.inspectionDate.$gte = new Date(dateFrom);
      if (dateTo) query.inspectionDate.$lte = new Date(dateTo);
    }

    if (state) {
      query.state = state.toUpperCase();
    }

    if (hasViolations !== undefined) {
      query.totalViolations = hasViolations ? { $gt: 0 } : 0;
    }

    const [inspections, total] = await Promise.all([
      FMCSAInspection.find(query)
        .sort({ inspectionDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FMCSAInspection.countDocuments(query)
    ]);

    return {
      inspections,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Get violation summary by BASIC category
   */
  async getViolationSummary(companyId) {
    const summary = await FMCSAInspection.aggregate([
      { $match: { companyId: new (require('mongoose').Types.ObjectId)(companyId) } },
      { $unwind: '$violations' },
      {
        $group: {
          _id: '$violations.basic',
          count: { $sum: 1 },
          oosCount: { $sum: { $cond: ['$violations.oos', 1, 0] } },
          totalSeverity: { $sum: '$violations.severityWeight' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Also get totals
    const totals = await FMCSAInspection.aggregate([
      { $match: { companyId: new (require('mongoose').Types.ObjectId)(companyId) } },
      {
        $group: {
          _id: null,
          totalInspections: { $sum: 1 },
          totalViolations: { $sum: '$totalViolations' },
          vehicleOOSCount: { $sum: { $cond: ['$vehicleOOS', 1, 0] } },
          driverOOSCount: { $sum: { $cond: ['$driverOOS', 1, 0] } }
        }
      }
    ]);

    return {
      byBasic: summary,
      totals: totals[0] || { totalInspections: 0, totalViolations: 0, vehicleOOSCount: 0, driverOOSCount: 0 }
    };
  }
};

module.exports = fmcsaViolationService;
