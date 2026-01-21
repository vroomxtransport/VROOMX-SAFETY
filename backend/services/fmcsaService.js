/**
 * FMCSA Service - Carrier Data Lookup
 *
 * Phase 1: Mock data generation for testing lead capture flow
 * Phase 2 (Future): Real FMCSA SAFER integration via web scraping or API
 */

// Realistic trucking company name components
const companyPrefixes = [
  'American', 'National', 'Express', 'Swift', 'Prime', 'United', 'Highway',
  'Interstate', 'Central', 'Western', 'Eastern', 'Southern', 'Northern',
  'Midwest', 'Pacific', 'Atlantic', 'Mountain', 'Valley', 'Blue Ridge',
  'Golden', 'Silver', 'Eagle', 'Falcon', 'Thunder', 'Lightning', 'Rapid'
];

const companySuffixes = [
  'Trucking', 'Transport', 'Freight', 'Logistics', 'Carriers', 'Express',
  'Hauling', 'Lines', 'Moving', 'Delivery', 'Shipping', 'Distribution'
];

const companyTypes = ['LLC', 'Inc', 'Corp', 'Co', 'LTD', 'LP'];

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

// Generate weighted random score (more realistic distribution)
function generateWeightedScore() {
  // Most carriers have moderate scores, fewer have extreme scores
  const random = Math.random();
  if (random < 0.3) {
    // 30% chance of good score (0-40)
    return Math.floor(Math.random() * 40);
  } else if (random < 0.7) {
    // 40% chance of moderate score (40-70)
    return 40 + Math.floor(Math.random() * 30);
  } else if (random < 0.9) {
    // 20% chance of concerning score (70-85)
    return 70 + Math.floor(Math.random() * 15);
  } else {
    // 10% chance of critical score (85-100)
    return 85 + Math.floor(Math.random() * 15);
  }
}

// Generate realistic company name from carrier number seed
function generateCompanyName(seed) {
  // Use seed to generate consistent results for same carrier number
  const seedNum = parseInt(seed.replace(/\D/g, ''), 10) || Math.random() * 1000000;

  const prefixIndex = seedNum % companyPrefixes.length;
  const suffixIndex = Math.floor(seedNum / 10) % companySuffixes.length;
  const typeIndex = Math.floor(seedNum / 100) % companyTypes.length;

  return `${companyPrefixes[prefixIndex]} ${companySuffixes[suffixIndex]} ${companyTypes[typeIndex]}`;
}

// Generate state based on seed
function generateState(seed) {
  const states = [
    'TX', 'CA', 'FL', 'IL', 'OH', 'PA', 'GA', 'NC', 'MI', 'TN',
    'IN', 'AZ', 'MO', 'WI', 'AL', 'SC', 'LA', 'KY', 'OK', 'AR'
  ];
  const seedNum = parseInt(seed.replace(/\D/g, ''), 10) || 0;
  return states[seedNum % states.length];
}

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

    // MC numbers are typically 6-7 digits, DOT are 7-8
    // But we'll accept both formats
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
   * Fetch carrier data - MOCK IMPLEMENTATION
   * In production, this would scrape FMCSA SAFER or use an API
   */
  async fetchCarrierData(carrierInput) {
    const parsed = this.parseCarrierNumber(carrierInput);

    if (!parsed) {
      throw new Error('Invalid carrier number format. Please enter a valid MC# or DOT#.');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    // Generate consistent mock data based on carrier number
    const seed = parsed.number;
    const companyName = generateCompanyName(seed);
    const state = generateState(seed);

    // Generate BASIC scores with some variation
    const basics = {
      unsafeDriving: generateWeightedScore(),
      hosCompliance: generateWeightedScore(),
      vehicleMaintenance: generateWeightedScore(),
      crashIndicator: generateWeightedScore(),
      controlledSubstances: Math.random() > 0.7 ? generateWeightedScore() : null, // 30% have data
      hazmatCompliance: Math.random() > 0.8 ? generateWeightedScore() : null, // 20% have data
      driverFitness: generateWeightedScore()
    };

    const alerts = this.calculateAlerts(basics);

    // Generate fleet size based on seed
    const seedNum = parseInt(seed, 10) || 100;
    const powerUnits = (seedNum % 50) + 1; // 1-50 trucks
    const drivers = powerUnits + Math.floor(Math.random() * powerUnits * 0.3); // slightly more drivers than trucks

    return {
      success: true,
      carrier: {
        legalName: companyName,
        dbaName: null,
        dotNumber: parsed.type === 'DOT' ? parsed.number : (parseInt(seed) * 7 + 1000000).toString().slice(0, 7),
        mcNumber: parsed.type === 'MC' ? parsed.number : (parseInt(seed) * 3 + 100000).toString().slice(0, 6),
        address: {
          street: `${(parseInt(seed) % 9999) + 1} Industrial Blvd`,
          city: 'Commerce',
          state: state,
          zip: ((parseInt(seed) % 90000) + 10000).toString()
        },
        phone: `(${(parseInt(seed) % 900) + 100}) ${(parseInt(seed) % 900) + 100}-${(parseInt(seed) % 9000) + 1000}`,
        operatingStatus: 'ACTIVE',
        entityType: 'CARRIER',
        operationType: 'Interstate',
        cargoTypes: ['General Freight', 'Dry Van'],
        fleetSize: {
          powerUnits,
          drivers
        },
        safetyRating: Math.random() > 0.85 ? 'Satisfactory' : (Math.random() > 0.5 ? 'None' : 'Conditional'),
        outOfServiceRate: {
          vehicle: (Math.random() * 30).toFixed(1),
          driver: (Math.random() * 15).toFixed(1)
        }
      },
      basics,
      alerts,
      inspections: {
        total: Math.floor(Math.random() * 50) + 5,
        last24Months: Math.floor(Math.random() * 30) + 3
      },
      crashes: {
        total: Math.floor(Math.random() * 5),
        last24Months: Math.floor(Math.random() * 3)
      },
      fetchedAt: new Date().toISOString(),
      dataSource: 'MOCK', // Will be 'FMCSA_SAFER' in production
      disclaimer: 'This is simulated data for demonstration purposes. Real CSA scores are available from FMCSA SAFER.'
    };
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
  }
};

module.exports = fmcsaService;
