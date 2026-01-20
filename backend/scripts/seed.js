/**
 * Seed Script for VroomX Safety
 * Populates the database with realistic dummy data for testing/demo
 *
 * Usage:
 *   npm run seed         - Add seed data (preserves existing)
 *   npm run seed:fresh   - Clear all data first, then seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');

// Import models
const Company = require('../models/Company');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Violation = require('../models/Violation');
const DrugAlcoholTest = require('../models/DrugAlcoholTest');

// Check for --fresh flag
const isFresh = process.argv.includes('--fresh');

// Helper functions
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};
const daysAgo = (days) => daysFromNow(-days);

// Generate random VIN (simplified)
const generateVIN = () => {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  return vin;
};

// Generate CDL number (state-specific format simulation)
const generateCDL = (state) => {
  const prefix = state.substring(0, 1);
  const num = Math.floor(Math.random() * 900000000) + 100000000;
  return `${prefix}${num}`;
};

// Data arrays
const firstNames = ['James', 'Michael', 'Robert', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald'];
const lastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin'];
const cities = ['Dallas', 'Houston', 'Phoenix', 'Atlanta', 'Denver', 'Chicago', 'Memphis', 'Nashville', 'Los Angeles', 'Indianapolis'];
const states = ['TX', 'CA', 'FL', 'GA', 'AZ', 'IL', 'TN', 'OH', 'PA', 'NC'];
const truckMakes = ['Freightliner', 'Kenworth', 'Peterbilt', 'Volvo', 'International', 'Mack'];
const truckModels = {
  'Freightliner': ['Cascadia', 'Columbia', 'Century'],
  'Kenworth': ['T680', 'W900', 'T880'],
  'Peterbilt': ['579', '389', '567'],
  'Volvo': ['VNL 860', 'VNL 760', 'VNR 640'],
  'International': ['LT', 'LoneStar', 'HX'],
  'Mack': ['Anthem', 'Pinnacle', 'Granite']
};
const trailerTypes = ['dry_van', 'reefer', 'flatbed'];

// Violation data
const violationData = {
  unsafe_driving: [
    { type: 'Speeding', code: '392.2S', weight: 5 },
    { type: 'Speeding 15+ MPH over', code: '392.2S15', weight: 8 },
    { type: 'Following too closely', code: '392.2FC', weight: 5 },
    { type: 'Improper lane change', code: '392.2LC', weight: 4 },
    { type: 'Reckless driving', code: '392.2RD', weight: 10 }
  ],
  hours_of_service: [
    { type: 'Driving beyond 11-hour limit', code: '395.3A1', weight: 7 },
    { type: 'Driving beyond 14-hour limit', code: '395.3A2', weight: 7 },
    { type: 'No logbook', code: '395.8A', weight: 5 },
    { type: 'False log entry', code: '395.8E', weight: 7 },
    { type: 'Insufficient break time', code: '395.3A3', weight: 5 }
  ],
  vehicle_maintenance: [
    { type: 'Brake out of adjustment', code: '393.47A', weight: 6 },
    { type: 'Inoperative lights', code: '393.9', weight: 4 },
    { type: 'Tire tread depth', code: '393.75A', weight: 5 },
    { type: 'Oil/grease leak', code: '393.83A', weight: 3 },
    { type: 'Defective coupling devices', code: '393.70A', weight: 7 }
  ],
  driver_fitness: [
    { type: 'No valid CDL', code: '383.23A2', weight: 8 },
    { type: 'No medical certificate', code: '391.41A', weight: 6 },
    { type: 'Operating without proper endorsement', code: '383.93', weight: 5 }
  ],
  controlled_substances: [
    { type: 'Possession of alcohol', code: '392.5A1', weight: 10 },
    { type: 'Use of drugs', code: '392.4', weight: 10 }
  ]
};

async function connectDB() {
  let uri = process.env.MONGODB_URI;
  let mongod = null;

  if (!uri || uri.includes('localhost')) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log('Connected to local MongoDB');
    } catch (error) {
      console.log('Starting in-memory MongoDB for seeding...');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('Connected to in-memory MongoDB');
    }
  } else {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  }

  return mongod;
}

async function clearData() {
  console.log('\nClearing existing data...');
  await Promise.all([
    Company.deleteMany({}),
    User.deleteMany({}),
    Driver.deleteMany({}),
    Vehicle.deleteMany({}),
    Violation.deleteMany({}),
    DrugAlcoholTest.deleteMany({})
  ]);
  console.log('All data cleared.');
}

async function seedCompany() {
  console.log('\nCreating company...');

  const company = await Company.create({
    name: 'Highway Express Transport LLC',
    dotNumber: '1234567',
    mcNumber: 'MC-987654',
    address: {
      street: '4500 Industrial Blvd',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75247',
      country: 'USA'
    },
    phone: '(214) 555-0100',
    email: 'dispatch@highwayexpress.com',
    carrierType: 'general_freight',
    fleetSize: {
      powerUnits: 25,
      drivers: 30
    },
    smsBasics: {
      unsafeDriving: 45,
      hoursOfService: 62,
      vehicleMaintenance: 38,
      controlledSubstances: 0,
      driverFitness: 25,
      crashIndicator: 55,
      lastUpdated: new Date()
    },
    documents: {
      mcs150: {
        filingDate: daysAgo(180),
        nextDueDate: daysFromNow(545)
      },
      ucr: {
        year: new Date().getFullYear(),
        status: 'registered'
      },
      insurance: {
        provider: 'Great West Casualty',
        policyNumber: 'GWC-2024-7891234',
        expiryDate: daysFromNow(280),
        coverageAmount: 1000000
      },
      irp: {
        registrationDate: daysAgo(90),
        expiryDate: daysFromNow(275)
      },
      ifta: {
        licenseNumber: 'IFTA-TX-123456',
        expiryDate: daysFromNow(350)
      }
    },
    settings: {
      alertEmailEnabled: true,
      alertDaysBefore: 30,
      randomDrugTestRate: 50,
      randomAlcoholTestRate: 10
    },
    subscription: {
      plan: 'professional',
      validUntil: daysFromNow(365),
      maxDrivers: 50,
      maxVehicles: 75
    },
    isActive: true
  });

  console.log(`  Created: ${company.name} (DOT: ${company.dotNumber})`);
  return company;
}

async function seedUsers(company) {
  console.log('\nCreating users...');

  const hashedPassword = await bcrypt.hash('Password123!', 12);

  const users = await User.insertMany([
    {
      email: 'admin@highwayexpress.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Administrator',
      role: 'admin',
      companyId: company._id,
      isActive: true,
      permissions: {
        drivers: { view: true, edit: true, delete: true },
        vehicles: { view: true, edit: true, delete: true },
        violations: { view: true, edit: true, delete: true },
        drugAlcohol: { view: true, edit: true, delete: true },
        documents: { view: true, upload: true, delete: true },
        reports: { view: true, export: true }
      }
    },
    {
      email: 'safety@highwayexpress.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Thompson',
      role: 'safety_manager',
      companyId: company._id,
      isActive: true,
      permissions: {
        drivers: { view: true, edit: true, delete: false },
        vehicles: { view: true, edit: true, delete: false },
        violations: { view: true, edit: true, delete: false },
        drugAlcohol: { view: true, edit: true, delete: false },
        documents: { view: true, upload: true, delete: false },
        reports: { view: true, export: true }
      }
    },
    {
      email: 'dispatch@highwayexpress.com',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Reynolds',
      role: 'dispatcher',
      companyId: company._id,
      isActive: true,
      permissions: {
        drivers: { view: true, edit: false, delete: false },
        vehicles: { view: true, edit: false, delete: false },
        violations: { view: true, edit: false, delete: false },
        drugAlcohol: { view: false, edit: false, delete: false },
        documents: { view: true, upload: false, delete: false },
        reports: { view: true, export: false }
      }
    }
  ]);

  users.forEach(u => console.log(`  Created user: ${u.email} (${u.role})`));
  return users;
}

async function seedDrivers(company) {
  console.log('\nCreating drivers...');

  const drivers = [];

  for (let i = 0; i < 10; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const state = states[i % states.length];
    const hireDate = daysAgo(randomInt(180, 1500));

    // Determine compliance scenario
    let cdlExpiry, medicalExpiry, mvrDate, clearinghouseDate;
    let status = 'active';

    if (i < 5) {
      // Compliant drivers (CDL 6+ months out, medical 3+ months out)
      cdlExpiry = daysFromNow(randomInt(180, 730));
      medicalExpiry = daysFromNow(randomInt(90, 365));
      mvrDate = daysAgo(randomInt(30, 300));
      clearinghouseDate = daysAgo(randomInt(30, 300));
    } else if (i < 8) {
      // Warning drivers (documents expiring soon)
      cdlExpiry = daysFromNow(randomInt(20, 60));
      medicalExpiry = daysFromNow(randomInt(15, 45));
      mvrDate = daysAgo(randomInt(320, 350));
      clearinghouseDate = daysAgo(randomInt(320, 350));
    } else {
      // Non-compliant drivers
      cdlExpiry = daysAgo(randomInt(10, 90));
      medicalExpiry = daysAgo(randomInt(5, 60));
      mvrDate = daysAgo(randomInt(400, 500));
      clearinghouseDate = daysAgo(randomInt(400, 500));
      status = i === 9 ? 'suspended' : 'active';
    }

    const driver = await Driver.create({
      companyId: company._id,
      firstName,
      lastName,
      dateOfBirth: randomDate(new Date(1965, 0, 1), new Date(1995, 11, 31)),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      phone: `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
      address: {
        street: `${randomInt(100, 9999)} ${randomElement(['Oak', 'Main', 'Cedar', 'Pine', 'Elm'])} ${randomElement(['St', 'Ave', 'Blvd', 'Dr'])}`,
        city: cities[i % cities.length],
        state: state,
        zipCode: String(randomInt(10000, 99999))
      },
      employeeId: `DRV-${String(i + 1).padStart(4, '0')}`,
      hireDate,
      status,
      cdl: {
        number: generateCDL(state),
        state,
        class: 'A',
        endorsements: i % 3 === 0 ? ['H', 'N'] : (i % 2 === 0 ? ['T'] : []),
        restrictions: [],
        issueDate: daysAgo(randomInt(365, 2000)),
        expiryDate: cdlExpiry
      },
      medicalCard: {
        examinerName: `Dr. ${randomElement(lastNames)}`,
        examinerNPI: String(randomInt(1000000000, 9999999999)),
        examDate: daysAgo(randomInt(30, 365)),
        expiryDate: medicalExpiry,
        certificationType: 'interstate',
        restrictions: i === 7 ? ['Corrective lenses required'] : []
      },
      documents: {
        employmentApplication: {
          dateReceived: hireDate,
          complete: true
        },
        roadTest: {
          date: new Date(hireDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          examinerName: 'Safety Director',
          result: 'pass'
        },
        mvrReviews: [{
          reviewDate: mvrDate,
          reviewerName: 'Sarah Thompson',
          violations: i >= 8 ? [{ date: daysAgo(randomInt(100, 300)), description: 'Speeding 10-15 over', points: 2 }] : [],
          approved: true
        }]
      },
      clearinghouse: {
        lastQueryDate: clearinghouseDate,
        queryType: 'full',
        status: 'clear',
        consentDate: hireDate
      }
    });

    drivers.push(driver);
    console.log(`  Created driver: ${driver.fullName} (${driver.complianceStatus.overall})`);
  }

  return drivers;
}

async function seedVehicles(company, drivers) {
  console.log('\nCreating vehicles...');

  const vehicles = [];

  // Create 10 tractors
  for (let i = 0; i < 10; i++) {
    const make = truckMakes[i % truckMakes.length];
    const model = randomElement(truckModels[make]);
    const year = randomInt(2018, 2024);
    const state = states[i % states.length];

    // Determine compliance scenario
    let inspectionDue, pmDue, regExpiry;
    let vehicleStatus = 'active';

    if (i < 7) {
      // Compliant vehicles
      inspectionDue = daysFromNow(randomInt(60, 300));
      pmDue = daysFromNow(randomInt(30, 75));
      regExpiry = daysFromNow(randomInt(90, 365));
    } else if (i < 9) {
      // Warning vehicles
      inspectionDue = daysFromNow(randomInt(10, 25));
      pmDue = daysFromNow(randomInt(5, 12));
      regExpiry = daysFromNow(randomInt(20, 45));
    } else {
      // Non-compliant vehicle
      inspectionDue = daysAgo(randomInt(10, 45));
      pmDue = daysAgo(randomInt(5, 20));
      regExpiry = daysAgo(randomInt(5, 30));
      vehicleStatus = 'out_of_service';
    }

    const lastInspection = new Date(inspectionDue);
    lastInspection.setFullYear(lastInspection.getFullYear() - 1);

    const currentOdometer = randomInt(150000, 650000);
    const lastPmOdometer = currentOdometer - randomInt(5000, 20000);

    const vehicle = await Vehicle.create({
      companyId: company._id,
      unitNumber: `T-${String(i + 101).padStart(3, '0')}`,
      vin: generateVIN(),
      vehicleType: 'tractor',
      make,
      model,
      year,
      licensePlate: {
        number: `${state}${randomInt(100, 999)}${String.fromCharCode(65 + randomInt(0, 25))}${String.fromCharCode(65 + randomInt(0, 25))}`,
        state,
        expiryDate: regExpiry
      },
      gvwr: randomInt(18000, 26000),
      gcwr: 80000,
      axles: 3,
      fuelType: 'diesel',
      color: randomElement(['White', 'Black', 'Blue', 'Red', 'Silver']),
      assignedDriver: i < drivers.length ? drivers[i]._id : null,
      status: vehicleStatus,
      inServiceDate: daysAgo(randomInt(365, 2000)),
      annualInspection: {
        lastInspectionDate: lastInspection,
        nextDueDate: inspectionDue,
        inspectorName: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
        inspectorNumber: `INSP-${randomInt(10000, 99999)}`,
        location: `${cities[i % cities.length]}, ${states[i % states.length]}`,
        result: vehicleStatus === 'out_of_service' ? 'fail' : 'pass',
        defectsFound: vehicleStatus === 'out_of_service' ? [{
          description: 'Brake adjustment out of spec',
          severity: 'out_of_service',
          repaired: false
        }] : []
      },
      maintenanceLog: [
        {
          date: daysAgo(randomInt(30, 90)),
          odometer: lastPmOdometer,
          maintenanceType: 'preventive',
          category: 'engine',
          description: 'Oil change, filter replacement, fluid top-off',
          severity: 'low',
          partsUsed: [
            { partNumber: 'OIL-15W40', description: '15W-40 Engine Oil', quantity: 10, cost: 89.90 },
            { partNumber: 'FLT-OIL', description: 'Oil Filter', quantity: 1, cost: 24.99 }
          ],
          laborHours: 1.5,
          laborCost: 112.50,
          totalCost: 227.39,
          performedBy: 'In-house mechanic'
        }
      ],
      pmSchedule: {
        intervalMiles: 25000,
        intervalDays: 90,
        lastPmDate: daysAgo(randomInt(30, 80)),
        lastPmOdometer,
        nextPmDueDate: pmDue,
        nextPmDueOdometer: lastPmOdometer + 25000
      },
      currentOdometer: {
        reading: currentOdometer,
        lastUpdated: daysAgo(randomInt(1, 7))
      },
      registration: {
        state,
        expiryDate: regExpiry
      },
      insurance: {
        provider: 'Great West Casualty',
        policyNumber: `GWC-VEH-${randomInt(100000, 999999)}`,
        expiryDate: daysFromNow(280)
      }
    });

    vehicles.push(vehicle);
    console.log(`  Created tractor: ${vehicle.unitNumber} - ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.complianceStatus.overall})`);
  }

  // Create 5 trailers
  for (let i = 0; i < 5; i++) {
    const trailerType = trailerTypes[i % trailerTypes.length];
    const year = randomInt(2015, 2023);
    const state = states[i % states.length];

    const inspectionDue = daysFromNow(randomInt(60, 300));
    const lastInspection = new Date(inspectionDue);
    lastInspection.setFullYear(lastInspection.getFullYear() - 1);

    const vehicle = await Vehicle.create({
      companyId: company._id,
      unitNumber: `TR-${String(i + 201).padStart(3, '0')}`,
      vin: generateVIN(),
      vehicleType: 'trailer',
      make: randomElement(['Great Dane', 'Wabash', 'Utility', 'Vanguard', 'Hyundai Translead']),
      model: trailerType === 'reefer' ? 'Reefer 53ft' : (trailerType === 'flatbed' ? 'Flatbed 48ft' : 'Dry Van 53ft'),
      year,
      licensePlate: {
        number: `${state}TRL${randomInt(1000, 9999)}`,
        state,
        expiryDate: daysFromNow(randomInt(180, 365))
      },
      gvwr: 34000,
      axles: 2,
      status: 'active',
      inServiceDate: daysAgo(randomInt(500, 2500)),
      annualInspection: {
        lastInspectionDate: lastInspection,
        nextDueDate: inspectionDue,
        inspectorName: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
        inspectorNumber: `INSP-${randomInt(10000, 99999)}`,
        result: 'pass'
      },
      registration: {
        state,
        expiryDate: daysFromNow(randomInt(180, 365))
      }
    });

    vehicles.push(vehicle);
    console.log(`  Created trailer: ${vehicle.unitNumber} - ${vehicle.year} ${vehicle.make} (${vehicle.complianceStatus.overall})`);
  }

  return vehicles;
}

async function seedViolations(company, drivers, vehicles) {
  console.log('\nCreating violations...');

  const violations = [];
  const basics = Object.keys(violationData);

  for (let i = 0; i < 20; i++) {
    const basic = basics[i % basics.length];
    const violationInfo = randomElement(violationData[basic]);
    const driver = randomElement(drivers.filter(d => d.status === 'active'));
    const vehicle = randomElement(vehicles.filter(v => v.vehicleType === 'tractor'));
    const violationDate = daysAgo(randomInt(30, 700));

    // Status distribution
    let status;
    if (i < 12) {
      status = 'resolved';
    } else if (i < 16) {
      status = 'open';
    } else if (i < 18) {
      status = 'dismissed';
    } else {
      status = 'dispute_in_progress';
    }

    const violation = await Violation.create({
      companyId: company._id,
      inspectionNumber: `TX${new Date(violationDate).getFullYear()}${randomInt(100000, 999999)}`,
      violationDate,
      location: {
        city: randomElement(cities),
        state: randomElement(states),
        address: `I-${randomElement(['10', '20', '30', '35', '40', '45'])} Mile ${randomInt(10, 400)}`
      },
      driverId: driver._id,
      vehicleId: vehicle._id,
      basic,
      violationType: violationInfo.type,
      violationCode: violationInfo.code,
      description: `${violationInfo.type} - ${basic.replace('_', ' ')} violation`,
      severityWeight: violationInfo.weight,
      outOfService: violationInfo.weight >= 8 && Math.random() > 0.5,
      crashRelated: false,
      inspectionType: 'roadside',
      inspectionLevel: randomElement([1, 2, 3]),
      inspectorName: `Officer ${randomElement(lastNames)}`,
      inspectorBadge: `DPS-${randomInt(1000, 9999)}`,
      issuingAgency: `${randomElement(states)} DPS`,
      status,
      fineAmount: violationInfo.weight * randomInt(50, 150),
      finePaid: status === 'resolved',
      paymentDate: status === 'resolved' ? daysAgo(randomInt(10, 100)) : null,
      resolution: status === 'resolved' ? {
        date: daysAgo(randomInt(10, 100)),
        action: 'Fine paid, corrective training completed',
        notes: 'Driver completed refresher safety training'
      } : (status === 'dismissed' ? {
        date: daysAgo(randomInt(10, 100)),
        action: 'DataQ challenge accepted',
        notes: 'Violation removed from record after successful challenge'
      } : null),
      dataQChallenge: status === 'dispute_in_progress' ? {
        submitted: true,
        submissionDate: daysAgo(randomInt(5, 30)),
        caseNumber: `DQ-${randomInt(100000, 999999)}`,
        challengeType: 'data_error',
        reason: 'Incorrect vehicle information recorded',
        status: 'under_review'
      } : undefined
    });

    violations.push(violation);
    console.log(`  Created violation: ${violation.violationType} (${violation.basic}) - ${violation.status}`);
  }

  return violations;
}

async function seedDrugAlcoholTests(company, drivers) {
  console.log('\nCreating drug & alcohol tests...');

  const tests = [];
  const activeDrivers = drivers.filter(d => d.status !== 'terminated');

  // Pre-employment tests (one per driver)
  for (const driver of activeDrivers) {
    const test = await DrugAlcoholTest.create({
      companyId: company._id,
      driverId: driver._id,
      testType: 'pre_employment',
      testDate: new Date(driver.hireDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before hire
      testTime: '09:00',
      drugTest: {
        performed: true,
        specimenId: `SPEC-${randomInt(100000, 999999)}`,
        collectionSite: {
          name: 'Quest Diagnostics',
          address: `${randomInt(100, 999)} Medical Center Dr, ${randomElement(cities)}, ${randomElement(states)}`,
          phone: `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`
        },
        collectorName: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
        mroName: `Dr. ${randomElement(lastNames)}`,
        labName: 'Quest Diagnostics',
        result: 'negative',
        verifiedDate: new Date(driver.hireDate.getTime() - 3 * 24 * 60 * 60 * 1000)
      },
      alcoholTest: {
        performed: false
      },
      overallResult: 'negative',
      consent: {
        signed: true,
        signedDate: new Date(driver.hireDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      },
      chainOfCustody: {
        ccfNumber: `CCF-${randomInt(1000000, 9999999)}`
      },
      status: 'completed'
    });

    tests.push(test);
    console.log(`  Created pre-employment test for: ${driver.fullName}`);
  }

  // Random tests (spread across the year)
  for (let i = 0; i < 10; i++) {
    const driver = randomElement(activeDrivers);
    const testDate = daysAgo(randomInt(30, 365));
    const includeAlcohol = Math.random() > 0.7;

    const test = await DrugAlcoholTest.create({
      companyId: company._id,
      driverId: driver._id,
      testType: 'random',
      testDate,
      testTime: `${randomInt(8, 16)}:${randomInt(0, 5)}0`,
      drugTest: {
        performed: true,
        specimenId: `SPEC-${randomInt(100000, 999999)}`,
        collectionSite: {
          name: randomElement(['Quest Diagnostics', 'LabCorp', 'Concentra']),
          address: `${randomInt(100, 999)} Industrial Pkwy, ${randomElement(cities)}, ${randomElement(states)}`
        },
        collectorName: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
        mroName: `Dr. ${randomElement(lastNames)}`,
        labName: randomElement(['Quest Diagnostics', 'LabCorp']),
        result: 'negative',
        verifiedDate: new Date(testDate.getTime() + 3 * 24 * 60 * 60 * 1000)
      },
      alcoholTest: {
        performed: includeAlcohol,
        batName: includeAlcohol ? `${randomElement(firstNames)} ${randomElement(lastNames)}` : undefined,
        screeningResult: includeAlcohol ? 0.000 : undefined,
        result: includeAlcohol ? 'negative' : undefined
      },
      overallResult: 'negative',
      consent: {
        signed: true,
        signedDate: testDate
      },
      chainOfCustody: {
        ccfNumber: `CCF-${randomInt(1000000, 9999999)}`
      },
      status: 'completed',
      clearinghouse: {
        reported: false
      }
    });

    tests.push(test);
    console.log(`  Created random test for: ${driver.fullName}`);
  }

  // Post-accident tests
  for (let i = 0; i < 3; i++) {
    const driver = randomElement(activeDrivers);
    const testDate = daysAgo(randomInt(60, 300));

    const test = await DrugAlcoholTest.create({
      companyId: company._id,
      driverId: driver._id,
      testType: 'post_accident',
      testDate,
      testTime: `${randomInt(10, 20)}:${randomInt(0, 5)}0`,
      drugTest: {
        performed: true,
        specimenId: `SPEC-${randomInt(100000, 999999)}`,
        collectionSite: {
          name: 'Emergency Collection Site',
          address: `${randomElement(cities)} Hospital, ${randomElement(states)}`
        },
        result: 'negative',
        verifiedDate: new Date(testDate.getTime() + 2 * 24 * 60 * 60 * 1000)
      },
      alcoholTest: {
        performed: true,
        screeningResult: 0.000,
        confirmationResult: 0.000,
        result: 'negative'
      },
      overallResult: 'negative',
      accidentInfo: {
        date: testDate,
        location: `${randomElement(cities)}, ${randomElement(states)}`,
        description: 'Minor collision at truck stop',
        citation: false,
        fatality: false,
        bodilyInjury: false,
        vehicleTowed: false
      },
      consent: {
        signed: true,
        signedDate: testDate
      },
      chainOfCustody: {
        ccfNumber: `CCF-${randomInt(1000000, 9999999)}`
      },
      status: 'completed'
    });

    tests.push(test);
    console.log(`  Created post-accident test for: ${driver.fullName}`);
  }

  // Reasonable suspicion tests
  for (let i = 0; i < 2; i++) {
    const driver = randomElement(activeDrivers);
    const testDate = daysAgo(randomInt(90, 400));

    const test = await DrugAlcoholTest.create({
      companyId: company._id,
      driverId: driver._id,
      testType: 'reasonable_suspicion',
      testDate,
      testTime: '14:30',
      drugTest: {
        performed: true,
        specimenId: `SPEC-${randomInt(100000, 999999)}`,
        collectionSite: {
          name: 'Concentra Urgent Care',
          address: `${randomInt(100, 999)} Commerce St, ${randomElement(cities)}, ${randomElement(states)}`
        },
        result: 'negative',
        verifiedDate: new Date(testDate.getTime() + 3 * 24 * 60 * 60 * 1000)
      },
      alcoholTest: {
        performed: true,
        screeningResult: 0.000,
        result: 'negative'
      },
      overallResult: 'negative',
      reasonableSuspicion: {
        observerName: 'Sarah Thompson',
        observerTitle: 'Safety Manager',
        observations: 'Driver exhibited signs of fatigue and disorientation. Follow-up determined driver had not slept well due to family emergency.',
        observationDate: testDate,
        observationTime: '13:45',
        trainingCompleted: true
      },
      consent: {
        signed: true,
        signedDate: testDate
      },
      chainOfCustody: {
        ccfNumber: `CCF-${randomInt(1000000, 9999999)}`
      },
      status: 'completed'
    });

    tests.push(test);
    console.log(`  Created reasonable suspicion test for: ${driver.fullName}`);
  }

  return tests;
}

async function printSummary() {
  console.log('\n' + '='.repeat(50));
  console.log('SEED COMPLETE - Summary');
  console.log('='.repeat(50));

  const counts = await Promise.all([
    Company.countDocuments(),
    User.countDocuments(),
    Driver.countDocuments(),
    Vehicle.countDocuments(),
    Violation.countDocuments(),
    DrugAlcoholTest.countDocuments()
  ]);

  console.log(`
  Companies:        ${counts[0]}
  Users:            ${counts[1]}
  Drivers:          ${counts[2]}
  Vehicles:         ${counts[3]}
  Violations:       ${counts[4]}
  Drug/Alcohol Tests: ${counts[5]}
  `);

  // Driver compliance breakdown
  const driverStats = await Driver.aggregate([
    { $group: { _id: '$complianceStatus.overall', count: { $sum: 1 } } }
  ]);
  console.log('Driver Compliance Status:');
  driverStats.forEach(s => console.log(`  ${s._id}: ${s.count}`));

  // Vehicle compliance breakdown
  const vehicleStats = await Vehicle.aggregate([
    { $group: { _id: '$complianceStatus.overall', count: { $sum: 1 } } }
  ]);
  console.log('\nVehicle Compliance Status:');
  vehicleStats.forEach(s => console.log(`  ${s._id}: ${s.count}`));

  // Violation breakdown by BASIC
  const violationStats = await Violation.aggregate([
    { $group: { _id: '$basic', count: { $sum: 1 } } }
  ]);
  console.log('\nViolations by BASIC:');
  violationStats.forEach(s => console.log(`  ${s._id}: ${s.count}`));

  console.log('\n' + '='.repeat(50));
  console.log('Login Credentials:');
  console.log('='.repeat(50));
  console.log(`
  Admin:
    Email: admin@highwayexpress.com
    Password: Password123!

  Safety Manager:
    Email: safety@highwayexpress.com
    Password: Password123!

  Dispatcher:
    Email: dispatch@highwayexpress.com
    Password: Password123!
  `);
}

async function main() {
  let mongod = null;

  try {
    console.log('VroomX Safety - Database Seeder');
    console.log('=========================================');

    mongod = await connectDB();

    if (isFresh) {
      await clearData();
    }

    const company = await seedCompany();
    const users = await seedUsers(company);
    const drivers = await seedDrivers(company);
    const vehicles = await seedVehicles(company, drivers);
    const violations = await seedViolations(company, drivers, vehicles);
    const tests = await seedDrugAlcoholTests(company, drivers);

    await printSummary();

    console.log('\nSeeding completed successfully!');

  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
    process.exit(0);
  }
}

main();
