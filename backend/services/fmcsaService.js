/**
 * FMCSA Service - Real Carrier Data Lookup via SAFER Web Scraping
 *
 * Fetches real CSA scores and carrier information from FMCSA SAFER system
 * Uses Puppeteer for SMS pages that require JavaScript rendering
 */

const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const puppeteer = require('puppeteer');

// Browser instance for reuse
let browserInstance = null;

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
   */
  async getBrowser() {
    if (!browserInstance || !browserInstance.isConnected()) {
      console.log('[FMCSA] Launching Puppeteer browser...');
      browserInstance = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080'
        ]
      });
    }
    return browserInstance;
  },

  /**
   * Fetch CSA BASIC scores from SMS system using Puppeteer
   * SMS page requires JavaScript rendering to display BASIC percentiles
   */
  async fetchCSAScores(dotNumber) {
    const url = SAFER_URLS.smsProfile(dotNumber);
    let page = null;

    try {
      console.log(`[FMCSA] Fetching CSA scores for DOT ${dotNumber} via Puppeteer...`);

      const browser = await this.getBrowser();
      page = await browser.newPage();

      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Navigate to SMS page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for BASIC list to load (the JavaScript-rendered content)
      await page.waitForSelector('#BASICList', { timeout: 10000 }).catch(() => {
        console.log('[FMCSA] BASICList not found, page may not have BASIC data');
      });

      // Give extra time for all JS to execute
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Extract BASIC scores from the rendered page
      const data = await page.evaluate(() => {
        const basics = {
          unsafeDriving: null,
          hosCompliance: null,
          vehicleMaintenance: null,
          crashIndicator: null,
          controlledSubstances: null,
          hazmatCompliance: null,
          driverFitness: null
        };

        let inspections = { total: 0, last24Months: 0 };
        let crashes = { total: 0, last24Months: 0 };

        // BASIC name to key mapping
        const basicMapping = {
          'unsafe driving': 'unsafeDriving',
          'unsafedriving': 'unsafeDriving',
          'hours-of-service': 'hosCompliance',
          'hos compliance': 'hosCompliance',
          'hoscompliance': 'hosCompliance',
          'vehicle maintenance': 'vehicleMaintenance',
          'vehiclemaint': 'vehicleMaintenance',
          'crash indicator': 'crashIndicator',
          'crashindicator': 'crashIndicator',
          'controlled substances': 'controlledSubstances',
          'drugsalcohol': 'controlledSubstances',
          'drugs/alcohol': 'controlledSubstances',
          'hazmat compliance': 'hazmatCompliance',
          'hazmat': 'hazmatCompliance',
          'driver fitness': 'driverFitness',
          'driverfitness': 'driverFitness'
        };

        // Method 1: Look for BASIC items in the list
        const basicItems = document.querySelectorAll('#BASICList li');
        basicItems.forEach(item => {
          // Get BASIC name from class or text
          const className = item.className.toLowerCase().replace(/\s+/g, '');
          const nameElement = item.querySelector('.basicName');
          const name = nameElement ? nameElement.textContent.trim().toLowerCase() : '';

          // Look for percentile value - usually in a span or displayed in the item
          const percentileElement = item.querySelector('.percentile, .score, [class*="percent"]');
          let percentile = null;

          if (percentileElement) {
            const text = percentileElement.textContent.trim();
            const match = text.match(/(\d{1,3})/);
            if (match) percentile = parseInt(match[1], 10);
          }

          // Also check for percentile bar width (some SMS versions use CSS width)
          const barElement = item.querySelector('.bar, .percentile-bar, [class*="bar"]');
          if (!percentile && barElement) {
            const style = barElement.getAttribute('style') || '';
            const widthMatch = style.match(/width:\s*(\d+)/i);
            if (widthMatch) percentile = parseInt(widthMatch[1], 10);
          }

          // Also look for text like "45%" or "Percentile: 45"
          if (!percentile) {
            const itemText = item.textContent;
            const percentMatch = itemText.match(/(\d{1,3})(?:\s*%|\s*percentile)/i);
            if (percentMatch) percentile = parseInt(percentMatch[1], 10);
          }

          // Map to correct BASIC
          const key = basicMapping[className] || basicMapping[name];
          if (key && percentile !== null && percentile >= 0 && percentile <= 100) {
            basics[key] = percentile;
          }
        });

        // Method 2: Look for inspection/crash statistics
        const statsSection = document.querySelector('#inspCrashStats, .stats, [class*="inspection"]');
        if (statsSection) {
          const text = statsSection.textContent;

          const inspMatch = text.match(/(\d+)\s*(?:total\s+)?inspections?/i);
          if (inspMatch) {
            inspections.last24Months = parseInt(inspMatch[1], 10);
            inspections.total = inspections.last24Months;
          }

          const crashMatch = text.match(/(\d+)\s*(?:total\s+)?crash/i);
          if (crashMatch) {
            crashes.last24Months = parseInt(crashMatch[1], 10);
            crashes.total = crashes.last24Months;
          }
        }

        // Method 3: Check for "insufficient data" or "not evaluated" indicators
        const pageText = document.body.textContent.toLowerCase();
        const hasInsufficientData = pageText.includes('insufficient data') ||
                                    pageText.includes('not evaluated') ||
                                    pageText.includes('no data available');

        // Method 4: Look for explicit percentile displays anywhere on page
        const allText = document.body.innerHTML;
        const explicitPercentiles = [
          { pattern: /unsafe\s*driving[^<]*?(\d{1,3})\s*%/gi, key: 'unsafeDriving' },
          { pattern: /hours?-?of-?service[^<]*?(\d{1,3})\s*%/gi, key: 'hosCompliance' },
          { pattern: /vehicle\s*maint[^<]*?(\d{1,3})\s*%/gi, key: 'vehicleMaintenance' },
          { pattern: /crash\s*indicator[^<]*?(\d{1,3})\s*%/gi, key: 'crashIndicator' },
          { pattern: /controlled\s*subst[^<]*?(\d{1,3})\s*%/gi, key: 'controlledSubstances' },
          { pattern: /drugs?\/?alcohol[^<]*?(\d{1,3})\s*%/gi, key: 'controlledSubstances' },
          { pattern: /hazmat[^<]*?(\d{1,3})\s*%/gi, key: 'hazmatCompliance' },
          { pattern: /driver\s*fitness[^<]*?(\d{1,3})\s*%/gi, key: 'driverFitness' }
        ];

        explicitPercentiles.forEach(({ pattern, key }) => {
          if (basics[key] === null) {
            const match = allText.match(pattern);
            if (match && match[1]) {
              const val = parseInt(match[1], 10);
              if (val >= 0 && val <= 100) {
                basics[key] = val;
              }
            }
          }
        });

        return {
          basics,
          inspections,
          crashes,
          hasInsufficientData,
          debug: {
            basicItemsFound: basicItems.length,
            pageTitle: document.title
          }
        };
      });

      console.log(`[FMCSA] CSA scores extracted:`, JSON.stringify(data.basics));

      return {
        basics: data.basics,
        inspections: data.inspections,
        crashes: data.crashes
      };

    } catch (error) {
      console.error('[FMCSA] Error fetching SMS scores with Puppeteer:', error.message);
      return null;
    } finally {
      if (page) {
        await page.close().catch(() => {});
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
      console.log(`[FMCSA] Cache hit for DOT ${dotNumber}`);
      return { ...cached, fromCache: true };
    }

    console.log(`[FMCSA] Fetching real data for DOT ${dotNumber}`);

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
        disclaimer: null // No disclaimer for real data
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
