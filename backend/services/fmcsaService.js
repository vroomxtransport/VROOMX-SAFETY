/**
 * FMCSA Service - Real Carrier Data Lookup via SAFER Web Scraping
 *
 * Fetches real CSA scores and carrier information from FMCSA SAFER system
 */

const cheerio = require('cheerio');
const NodeCache = require('node-cache');

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
   * Fetch CSA BASIC scores from SMS system
   */
  async fetchCSAScores(dotNumber) {
    const url = SAFER_URLS.smsProfile(dotNumber);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        // SMS might not have data for all carriers
        return null;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

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

      // Parse BASIC scores - SMS uses specific div/span patterns
      // Look for percentile values in various formats

      // Method 1: Look for data-percentile attributes or percentile classes
      $('[class*="percentile"], [class*="Percentile"]').each((i, el) => {
        const text = $(el).text().trim();
        const value = parseInt(text.replace('%', ''), 10);
        if (!isNaN(value)) {
          // Try to determine which BASIC this belongs to
          const parent = $(el).closest('tr, div, section');
          const parentText = parent.text().toLowerCase();

          if (parentText.includes('unsafe driving')) {
            basics.unsafeDriving = value;
          } else if (parentText.includes('hos') || parentText.includes('hours of service')) {
            basics.hosCompliance = value;
          } else if (parentText.includes('vehicle maint')) {
            basics.vehicleMaintenance = value;
          } else if (parentText.includes('crash')) {
            basics.crashIndicator = value;
          } else if (parentText.includes('controlled') || parentText.includes('substance')) {
            basics.controlledSubstances = value;
          } else if (parentText.includes('hazmat')) {
            basics.hazmatCompliance = value;
          } else if (parentText.includes('driver fitness')) {
            basics.driverFitness = value;
          }
        }
      });

      // Method 2: Parse from table structures
      $('table tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 2) {
          const label = $(cells[0]).text().trim().toLowerCase();
          const valueText = $(cells[cells.length - 1]).text().trim();
          const value = parseInt(valueText.replace(/[^0-9]/g, ''), 10);

          if (!isNaN(value) && value >= 0 && value <= 100) {
            if (label.includes('unsafe driving')) {
              basics.unsafeDriving = value;
            } else if (label.includes('hos') || label.includes('hours')) {
              basics.hosCompliance = value;
            } else if (label.includes('vehicle')) {
              basics.vehicleMaintenance = value;
            } else if (label.includes('crash')) {
              basics.crashIndicator = value;
            } else if (label.includes('controlled') || label.includes('substance')) {
              basics.controlledSubstances = value;
            } else if (label.includes('hazmat')) {
              basics.hazmatCompliance = value;
            } else if (label.includes('fitness')) {
              basics.driverFitness = value;
            }
          }
        }
      });

      // Method 3: Look for specific SMS HTML patterns
      const htmlLower = html.toLowerCase();

      // Try regex patterns for percentile values
      const basicPatterns = [
        { key: 'unsafeDriving', patterns: [/unsafe\s*driving[^0-9]*(\d{1,3})/i] },
        { key: 'hosCompliance', patterns: [/hos\s*compliance[^0-9]*(\d{1,3})/i, /hours\s*of\s*service[^0-9]*(\d{1,3})/i] },
        { key: 'vehicleMaintenance', patterns: [/vehicle\s*maint[^0-9]*(\d{1,3})/i] },
        { key: 'crashIndicator', patterns: [/crash\s*indicator[^0-9]*(\d{1,3})/i] },
        { key: 'controlledSubstances', patterns: [/controlled\s*substances?[^0-9]*(\d{1,3})/i] },
        { key: 'hazmatCompliance', patterns: [/hazmat[^0-9]*(\d{1,3})/i] },
        { key: 'driverFitness', patterns: [/driver\s*fitness[^0-9]*(\d{1,3})/i] }
      ];

      basicPatterns.forEach(({ key, patterns }) => {
        if (basics[key] === null) {
          for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              const value = parseInt(match[1], 10);
              if (value >= 0 && value <= 100) {
                basics[key] = value;
                break;
              }
            }
          }
        }
      });

      // Parse inspection counts
      const inspectionMatch = html.match(/(\d+)\s*inspections?/i);
      if (inspectionMatch) {
        inspections.last24Months = parseInt(inspectionMatch[1], 10);
        inspections.total = inspections.last24Months;
      }

      // Parse crash counts
      const crashMatch = html.match(/(\d+)\s*crash/i);
      if (crashMatch) {
        crashes.last24Months = parseInt(crashMatch[1], 10);
        crashes.total = crashes.last24Months;
      }

      return { basics, inspections, crashes };
    } catch (error) {
      console.error('Error fetching SMS scores:', error.message);
      return null;
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
