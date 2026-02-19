/**
 * FMCSA Service - Real Carrier Data Lookup via SAFER Web Scraping
 *
 * Fetches real CSA scores and carrier information from FMCSA SAFER system
 * Uses Puppeteer for SMS pages that require JavaScript rendering
 */

const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

// Browser instance for reuse
let browserInstance = null;
let browserPromise = null;

// Cache FMCSA data for 6 hours (data updates weekly anyway)
const cache = new NodeCache({ stdTTL: 21600, checkperiod: 600 });

// BASIC category thresholds for intervention
const BASIC_THRESHOLDS = {
  unsafeDriving: 65,
  hosCompliance: 65,
  crashIndicator: 65,
  vehicleMaintenance: 80,
  controlledSubstances: 80,
  hazmatCompliance: 80,
  driverFitness: 80
};

// FMCSA SAFER URLs
const SAFER_URLS = {
  carrierSnapshot: (dot) => `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${dot}`,
  smsProfile: (dot) => `https://ai.fmcsa.dot.gov/SMS/Carrier/${dot}/Overview.aspx`
};

const fmcsaService = {
  /**
   * Parse user input to determine if it's MC# or DOT#
   */
  parseCarrierNumber(input) {
    if (!input) return null;

    const cleaned = input.toString().replace(/[^0-9]/g, '');

    if (!cleaned || cleaned.length < 5) {
      return null;
    }

    const inputUpper = input.toUpperCase();

    if (inputUpper.includes('MC') || inputUpper.startsWith('MC')) {
      return { type: 'MC', number: cleaned };
    } else if (inputUpper.includes('DOT') || inputUpper.startsWith('DOT')) {
      return { type: 'DOT', number: cleaned };
    } else {
      // Default: shorter numbers are MC, longer are DOT
      return {
        type: cleaned.length <= 7 ? 'MC' : 'DOT',
        number: cleaned
      };
    }
  },

  /**
   * Calculate alerts based on BASIC scores and thresholds
   */
  calculateAlerts(basics) {
    let alerts = 0;
    const alertDetails = [];

    Object.entries(BASIC_THRESHOLDS).forEach(([basic, threshold]) => {
      if (basics[basic] !== undefined && basics[basic] !== null && basics[basic] > threshold) {
        alerts++;
        alertDetails.push({
          basic,
          score: basics[basic],
          threshold,
          status: 'intervention'
        });
      }
    });

    return { count: alerts, details: alertDetails };
  },

  /**
   * Calculate overall risk level based on BASIC scores
   * @param {object} basics - BASIC percentile scores
   * @returns {'HIGH'|'MODERATE'|'LOW'} Risk level
   */
  calculateRiskLevel(basics) {
    if (!basics) return 'MODERATE';

    let aboveThreshold = 0;
    let nearThreshold = 0;
    let above50 = 0;

    for (const [basic, threshold] of Object.entries(BASIC_THRESHOLDS)) {
      const score = basics[basic];
      if (score === null || score === undefined) continue;

      if (score >= threshold) {
        aboveThreshold++;
      } else if (score >= threshold - 10) {
        nearThreshold++;
      }

      if (score >= 50) {
        above50++;
      }
    }

    // HIGH: Any BASIC at/above intervention threshold OR 3+ above 50%
    if (aboveThreshold > 0 || above50 >= 3) return 'HIGH';

    // MODERATE: Any BASIC within 10 points of threshold OR 2+ above 50%
    if (nearThreshold > 0 || above50 >= 2) return 'MODERATE';

    // LOW: All BASICs well below thresholds
    return 'LOW';
  },

  /**
   * Fetch carrier snapshot from FMCSA SAFER
   */
  async fetchCarrierSnapshot(dotNumber) {
    const url = SAFER_URLS.carrierSnapshot(dotNumber);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`FMCSA request failed: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Check if carrier was found
      if (html.includes('Record Not Found') || html.includes('No records matching') || html.includes('No Carrier Records Found')) {
        return null;
      }

      // Check for inactive record
      if (html.includes('RECORD INACTIVE') || html.includes('Record Inactive')) {
        // Still parse what we can but mark as inactive
      }

      // Parse carrier information from the SAFER page
      const carrier = {
        legalName: null,
        dbaName: null,
        dotNumber: dotNumber,
        mcNumber: null,
        address: {
          street: null,
          city: null,
          state: null,
          zip: null
        },
        phone: null,
        operatingStatus: null,
        entityType: null,
        operationType: null,
        cargoTypes: [],
        fleetSize: {
          powerUnits: null,
          drivers: null
        },
        safetyRating: null,
        outOfServiceRate: {
          vehicle: null,
          driver: null
        }
      };

      // SAFER uses TH/TD pairs with class "querylabel" and "queryfield"
      // Parse each row looking for label/value pairs
      $('tr').each((i, row) => {
        const th = $(row).find('th.querylabelbkg, th a.querylabel').first();
        const td = $(row).find('td.queryfield').first();

        if (th.length && td.length) {
          const label = th.text().trim().toLowerCase().replace(':', '');
          const value = td.text().trim().replace(/\s+/g, ' ');

          // Parse various fields based on label
          if (label.includes('legal name')) {
            carrier.legalName = value || null;
          } else if (label.includes('dba name')) {
            carrier.dbaName = value && value !== '&nbsp;' ? value : null;
          } else if (label.includes('usdot number') && !label.includes('status')) {
            const dotMatch = value.match(/(\d{5,8})/);
            if (dotMatch) carrier.dotNumber = dotMatch[1];
          } else if (label.includes('mc/mx/ff') || label.includes('mcs-number')) {
            const mcMatch = value.match(/MC-?(\d+)/i);
            if (mcMatch) carrier.mcNumber = mcMatch[1];
          } else if (label.includes('physical address')) {
            // Address is usually multi-line in the TD
            const addrHtml = td.html() || '';
            const lines = addrHtml.split(/<br\s*\/?>/i).map(l =>
              cheerio.load(l).text().trim()
            ).filter(l => l && !l.includes('&nbsp;'));

            if (lines.length >= 1) carrier.address.street = lines[0];
            if (lines.length >= 2) {
              // Second line usually: "CITY, ST  ZIP"
              const cityLine = lines[1];
              const cityMatch = cityLine.match(/^([^,]+),?\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?/i);
              if (cityMatch) {
                carrier.address.city = cityMatch[1].trim();
                carrier.address.state = cityMatch[2];
                carrier.address.zip = cityMatch[3] || null;
              }
            }
          } else if (label.includes('phone')) {
            const phoneClean = value.replace(/[^0-9()-\s]/g, '').trim();
            if (phoneClean) carrier.phone = phoneClean;
          } else if (label.includes('usdot status')) {
            // Extract status - look for ACTIVE, INACTIVE, OUT-OF-SERVICE
            if (value.includes('ACTIVE') && !value.includes('INACTIVE')) {
              carrier.operatingStatus = 'ACTIVE';
            } else if (value.includes('INACTIVE')) {
              carrier.operatingStatus = 'INACTIVE';
            } else if (value.includes('OUT-OF-SERVICE') || value.includes('OUT OF SERVICE')) {
              carrier.operatingStatus = 'OUT-OF-SERVICE';
            }
          } else if (label.includes('entity type')) {
            carrier.entityType = value;
          } else if (label.includes('operation classification') || label.includes('carrier operation')) {
            carrier.operationType = value;
          } else if (label.includes('power units')) {
            const puMatch = value.match(/(\d+)/);
            if (puMatch) carrier.fleetSize.powerUnits = parseInt(puMatch[1], 10);
          } else if (label.includes('drivers') && !label.includes('driver oos')) {
            const drvMatch = value.match(/(\d+)/);
            if (drvMatch) carrier.fleetSize.drivers = parseInt(drvMatch[1], 10);
          } else if (label.includes('safety rating')) {
            carrier.safetyRating = value || 'None';
          } else if (label.includes('vehicle oos') && label.includes('%')) {
            const oosMatch = value.match(/([\d.]+)\s*%/);
            if (oosMatch) carrier.outOfServiceRate.vehicle = parseFloat(oosMatch[1]);
          } else if (label.includes('driver oos') && label.includes('%')) {
            const oosMatch = value.match(/([\d.]+)\s*%/);
            if (oosMatch) carrier.outOfServiceRate.driver = parseFloat(oosMatch[1]);
          }
        }
      });

      // Also try to parse from specific font tags (SAFER uses old HTML)
      if (!carrier.legalName) {
        // Look for company name in title or specific elements
        const titleMatch = html.match(/<TITLE>.*Company Snapshot\s+(.+?)<\/TITLE>/i);
        if (titleMatch && !titleMatch[1].includes('RECORD')) {
          carrier.legalName = titleMatch[1].trim();
        }
      }

      // Parse MC number from links if not found
      if (!carrier.mcNumber) {
        const mcLink = $('a[href*="MC-"]').first().text();
        const mcMatch = mcLink.match(/MC-?(\d+)/i);
        if (mcMatch) carrier.mcNumber = mcMatch[1];
      }

      // Default status to ACTIVE if we got data but no status parsed
      if (carrier.legalName && !carrier.operatingStatus) {
        carrier.operatingStatus = 'ACTIVE';
      }

      return carrier;
    } catch (error) {
      console.error('Error fetching SAFER snapshot:', error.message);
      throw error;
    }
  },

  /**
   * Get or create browser instance for Puppeteer
   * Uses @sparticuz/chromium-min for cloud environments (Render, Lambda, etc.)
   */
  async getBrowser() {
    if (browserInstance && browserInstance.isConnected()) {
      return browserInstance;
    }

    // Use promise-based lock to prevent concurrent browser launches
    if (browserPromise) {
      return browserPromise;
    }

    browserPromise = (async () => {
      try {
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
          args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ];
        } else {
          try {
            executablePath = await chromium.executablePath();
          } catch (pathError) {
            console.error('[FMCSA] Failed to get Chromium path:', pathError.message);
            throw new Error('Chromium path error: ' + pathError.message);
          }

          args = [
            ...chromium.args,
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--single-process',
            '--no-zygote'
          ];
        }

        browserInstance = await puppeteer.launch({
          args,
          defaultViewport: chromium.defaultViewport || { width: 1920, height: 1080 },
          executablePath,
          headless: chromium.headless ?? true,
          ignoreHTTPSErrors: process.env.NODE_ENV === 'development'
        });

        return browserInstance;
      } catch (launchError) {
        console.error('[FMCSA] Browser launch failed:', launchError.message);
        throw new Error('Browser launch failed: ' + launchError.message);
      } finally {
        browserPromise = null;
      }
    })();

    return browserPromise;
  },

  /**
   * Fetch CSA BASIC scores from SMS system using Puppeteer
   * FMCSA SMS stores percentiles on individual BASIC pages with data-percentile attributes
   */
  async fetchCSAScores(dotNumber) {
    let page = null;
    let browser = null;

    // BASIC pages to scrape - each has data-percentile attribute
    const basicPages = [
      { key: 'unsafeDriving', path: 'UnsafeDriving' },
      { key: 'hosCompliance', path: 'HOSCompliance' },
      { key: 'vehicleMaintenance', path: 'VehicleMaint' },
      { key: 'controlledSubstances', path: 'DrugsAlcohol' },
      { key: 'driverFitness', path: 'DriverFitness' }
      // crashIndicator and hazmatCompliance are "Not Public" for most carriers
    ];

    try {
      browser = await this.getBrowser();
      page = await browser.newPage();

      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      const basics = {
        unsafeDriving: null,
        unsafeDrivingMeasure: null,
        hosCompliance: null,
        hosComplianceMeasure: null,
        vehicleMaintenance: null,
        vehicleMaintenanceMeasure: null,
        crashIndicator: null,
        crashIndicatorMeasure: null,
        controlledSubstances: null,
        controlledSubstancesMeasure: null,
        hazmatCompliance: null,
        driverFitness: null,
        driverFitnessMeasure: null
      };

      let inspections = { total: 0, last24Months: 0 };
      let crashes = { total: 0, last24Months: 0 };

      // First, get overview page for inspection/crash counts
      const overviewUrl = SAFER_URLS.smsProfile(dotNumber);
      await page.goto(overviewUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

      // Extract inspection counts, crash counts, and OOS rates from overview page
      const overviewData = await page.evaluate(() => {
        const text = document.body.textContent;

        // Inspection and crash counts
        const inspMatch = text.match(/Total\s*Inspections[:\s]*(\d+)/i);
        const crashMatch = text.match(/Total\s*Crashes[*:\s]*(\d+)/i);

        // OOS rates from the overview table
        // Format: "Vehicle   33.3   23.2" and "Driver   20.0   6.4"
        // Match: "Vehicle" followed by OOS% and National Avg%
        let vehicleOOSPercent = null, vehicleNationalAvg = null;
        let driverOOSPercent = null, driverNationalAvg = null;

        // Try multiple patterns for OOS rates
        const vehMatch = text.match(/Vehicle[\s\S]{0,30}?(\d+\.?\d+)\s*%?\s+(\d+\.?\d+)/i)
          || text.match(/Vehicle\s+OOS[:\s]*(\d+\.?\d+)%/i);
        if (vehMatch) {
          vehicleOOSPercent = parseFloat(vehMatch[1]);
          vehicleNationalAvg = vehMatch[2] ? parseFloat(vehMatch[2]) : null;
        }

        const drvMatch = text.match(/Driver[\s\S]{0,30}?(\d+\.?\d+)\s*%?\s+(\d+\.?\d+)/i)
          || text.match(/Driver\s+OOS[:\s]*(\d+\.?\d+)%/i);
        if (drvMatch) {
          driverOOSPercent = parseFloat(drvMatch[1]);
          driverNationalAvg = drvMatch[2] ? parseFloat(drvMatch[2]) : null;
        }

        // Fatal/injury/tow crash breakdown
        const fatalMatch = text.match(/Fatal\s*(?:Crashes)?[:\s]*(\d+)/i);
        const injuryMatch = text.match(/Injury\s*(?:Crashes)?[:\s]*(\d+)/i);
        const towMatch = text.match(/Tow\s*(?:away)?\s*(?:Crashes)?[:\s]*(\d+)/i);

        return {
          inspections: inspMatch ? parseInt(inspMatch[1], 10) : 0,
          crashes: crashMatch ? parseInt(crashMatch[1], 10) : 0,
          crashDetail: {
            fatal: fatalMatch ? parseInt(fatalMatch[1], 10) : 0,
            injury: injuryMatch ? parseInt(injuryMatch[1], 10) : 0,
            tow: towMatch ? parseInt(towMatch[1], 10) : 0,
            total: crashMatch ? parseInt(crashMatch[1], 10) : 0
          },
          vehicleOOSPercent,
          vehicleNationalAvg,
          driverOOSPercent,
          driverNationalAvg
        };
      });

      inspections.last24Months = overviewData.inspections;
      inspections.total = overviewData.inspections;
      crashes.last24Months = overviewData.crashes;
      crashes.total = overviewData.crashes;

      // Now fetch each BASIC page to get percentiles
      for (const basic of basicPages) {
        try {
          const basicUrl = `https://ai.fmcsa.dot.gov/SMS/Carrier/${dotNumber}/BASIC/${basic.path}.aspx`;

          await page.goto(basicUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

          // Look for data-percentile attribute AND raw measure value on the page
          const result = await page.evaluate(() => {
            const text = document.body.textContent;
            let percentile = null;
            let rawMeasure = null;

            // Try to get percentile from data attribute
            const resultDiv = document.querySelector('[data-percentile]');
            if (resultDiv) {
              const val = resultDiv.getAttribute('data-percentile');
              const num = parseInt(val, 10);
              if (!isNaN(num) && num >= 0 && num <= 100) {
                percentile = num;
              }
            }

            // Also check for "Percentile:" text
            if (percentile === null) {
              const match = text.match(/Percentile[:\s]*(\d{1,3})/i);
              if (match) {
                const num = parseInt(match[1], 10);
                if (num >= 0 && num <= 100) percentile = num;
              }
            }

            // Always try to get raw measure value (available even without percentiles)
            const measureMatch = text.match(/(?:BASIC\s*)?Measure[:\s]*(\d+\.?\d*)/i)
              || text.match(/Weighted\s*Score[:\s]*(\d+\.?\d*)/i);
            if (measureMatch) {
              rawMeasure = parseFloat(measureMatch[1]);
            }

            return { percentile, rawMeasure };
          });

          if (result.percentile !== null) {
            basics[basic.key] = result.percentile;
          }
          if (result.rawMeasure !== null) {
            basics[`${basic.key}Measure`] = result.rawMeasure;
          }

        } catch (err) {
          // Could not fetch this BASIC score
        }
      }

      return {
        basics,
        inspections,
        crashes,
        // OOS rates and crash details from overview page (reliable fallback for SaferWebAPI)
        vehicleOOSPercent: overviewData.vehicleOOSPercent,
        vehicleNationalAvg: overviewData.vehicleNationalAvg,
        driverOOSPercent: overviewData.driverOOSPercent,
        driverNationalAvg: overviewData.driverNationalAvg,
        crashDetail: overviewData.crashDetail
      };

    } catch (error) {
      console.error('[FMCSA] Error fetching SMS scores with Puppeteer:', error.message);
      console.error('[FMCSA] Full error stack:', error.stack);

      // Return fallback structure instead of null so the rest of the data still works
      return {
        basics: {
          unsafeDriving: null,
          hosCompliance: null,
          vehicleMaintenance: null,
          crashIndicator: null,
          controlledSubstances: null,
          hazmatCompliance: null,
          driverFitness: null
        },
        inspections: { total: 0, last24Months: 0 },
        crashes: { total: 0, last24Months: 0 },
        error: error.message
      };
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
      // Close browser after each request in cloud to free resources
      if (browserInstance && process.env.RENDER === 'true') {
        await browserInstance.close().catch(() => {});
        browserInstance = null;
      }
    }
  },

  /**
   * Fetch carrier data - REAL FMCSA IMPLEMENTATION with caching
   */
  async fetchCarrierData(carrierInput) {
    const parsed = this.parseCarrierNumber(carrierInput);

    if (!parsed) {
      throw new Error('Invalid carrier number format. Please enter a valid MC# or DOT#.');
    }

    // For MC numbers, we need to convert to DOT first
    // For now, assume DOT is provided or treat the number as DOT
    let dotNumber = parsed.number;

    // Check cache first
    const cacheKey = `fmcsa:${dotNumber}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      // Fetch carrier snapshot and CSA scores in parallel
      const [carrier, smsData] = await Promise.all([
        this.fetchCarrierSnapshot(dotNumber),
        this.fetchCSAScores(dotNumber)
      ]);

      if (!carrier) {
        throw new Error('Carrier not found in FMCSA database. Please verify your DOT number.');
      }

      const basics = smsData?.basics || {
        unsafeDriving: null,
        hosCompliance: null,
        vehicleMaintenance: null,
        crashIndicator: null,
        controlledSubstances: null,
        hazmatCompliance: null,
        driverFitness: null
      };

      const alerts = this.calculateAlerts(basics);

      const result = {
        success: true,
        carrier,
        basics,
        alerts,
        inspections: smsData?.inspections || { total: 0, last24Months: 0 },
        crashes: smsData?.crashes || { total: 0, last24Months: 0 },
        fetchedAt: new Date().toISOString(),
        dataSource: 'FMCSA_SAFER',
        disclaimer: null, // No disclaimer for real data
        // OOS rates and national averages from SMS overview page
        vehicleOOSPercent: smsData?.vehicleOOSPercent,
        vehicleNationalAvg: smsData?.vehicleNationalAvg,
        driverOOSPercent: smsData?.driverOOSPercent,
        driverNationalAvg: smsData?.driverNationalAvg,
        crashDetail: smsData?.crashDetail
      };

      // Cache the result
      cache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('[FMCSA] Error fetching data:', error.message);

      // Return error with option to retry
      throw new Error(`Unable to fetch FMCSA data: ${error.message}`);
    }
  },

  /**
   * Quick lookup for registration - just carrier info, no CSA scores needed
   */
  async lookupCarrierForRegistration(dotNumber) {
    const cacheKey = `fmcsa:reg:${dotNumber}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const carrier = await this.fetchCarrierSnapshot(dotNumber);

      if (!carrier || !carrier.legalName) {
        return null;
      }

      const result = {
        success: true,
        carrier: {
          legalName: carrier.legalName,
          dbaName: carrier.dbaName,
          dotNumber: carrier.dotNumber,
          mcNumber: carrier.mcNumber,
          address: carrier.address,
          phone: carrier.phone,
          operatingStatus: carrier.operatingStatus,
          fleetSize: carrier.fleetSize
        },
        fetchedAt: new Date().toISOString(),
        dataSource: 'FMCSA_SAFER'
      };

      // Cache for 6 hours
      cache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('[FMCSA] Registration lookup error:', error.message);
      return null;
    }
  },

  /**
   * Get BASIC category display info
   */
  getBasicInfo() {
    return [
      {
        key: 'unsafeDriving',
        name: 'Unsafe Driving',
        description: 'Speeding, reckless driving, improper lane changes, inattention',
        threshold: 65,
        icon: 'FiAlertTriangle'
      },
      {
        key: 'hosCompliance',
        name: 'HOS Compliance',
        description: 'Hours of Service violations, logbook issues',
        threshold: 65,
        icon: 'FiClock'
      },
      {
        key: 'vehicleMaintenance',
        name: 'Vehicle Maintenance',
        description: 'Brake, light, and other mechanical issues',
        threshold: 80,
        icon: 'FiTruck'
      },
      {
        key: 'crashIndicator',
        name: 'Crash Indicator',
        description: 'Crash involvement patterns',
        threshold: 65,
        icon: 'FiAlertCircle'
      },
      {
        key: 'controlledSubstances',
        name: 'Controlled Substances',
        description: 'Drug and alcohol violations',
        threshold: 80,
        icon: 'FiDroplet'
      },
      {
        key: 'hazmatCompliance',
        name: 'Hazmat Compliance',
        description: 'Hazardous materials handling violations',
        threshold: 80,
        icon: 'FiShield'
      },
      {
        key: 'driverFitness',
        name: 'Driver Fitness',
        description: 'License, medical certification, CDL issues',
        threshold: 80,
        icon: 'FiUser'
      }
    ];
  },

  /**
   * Determine score status based on threshold
   */
  getScoreStatus(score, threshold) {
    if (score === null || score === undefined) {
      return { status: 'none', label: 'No Data', color: 'gray' };
    }
    if (score >= threshold) {
      return { status: 'danger', label: 'Intervention', color: 'red' };
    }
    if (score >= threshold - 15) {
      return { status: 'warning', label: 'Watch', color: 'amber' };
    }
    return { status: 'good', label: 'Good', color: 'green' };
  },

  /**
   * Estimate DataQ challenge opportunities based on BASIC scores
   * Uses heuristic: flagged BASICs likely have ~3 challengeable violations,
   * near-threshold ~1, plus inspection volume bonus. Capped at 25.
   */
  estimateDataQOpportunities(basics, inspections, crashes) {
    if (!basics) return { estimatedCount: 0, categories: [], hasOpportunities: false };

    const basicInfo = this.getBasicInfo();
    let estimatedCount = 0;
    const categories = [];

    for (const [basic, threshold] of Object.entries(BASIC_THRESHOLDS)) {
      const score = basics[basic];
      if (score === null || score === undefined) continue;

      const info = basicInfo.find(b => b.key === basic);
      const name = info ? info.name : basic;

      if (score >= threshold) {
        estimatedCount += 3;
        categories.push({ basic, name, score, threshold, status: 'flagged' });
      } else if (score >= threshold - 15) {
        estimatedCount += 1;
        categories.push({ basic, name, score, threshold, status: 'near_threshold' });
      }
    }

    // Bonus for high inspection volume
    if ((inspections?.last24Months || 0) > 10) {
      estimatedCount += Math.floor(inspections.last24Months / 15);
    }

    estimatedCount = Math.min(estimatedCount, 25);

    return { estimatedCount, categories, hasOpportunities: estimatedCount > 0 };
  },

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(dotNumber) {
    if (dotNumber) {
      cache.del(`fmcsa:${dotNumber}`);
      cache.del(`fmcsa:reg:${dotNumber}`);
    } else {
      cache.flushAll();
    }
  }
};

module.exports = fmcsaService;
