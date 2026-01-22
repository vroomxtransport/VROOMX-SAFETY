/**
 * Seed Route - Populates database with dummy data
 * Only available in development mode
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Import models
const Company = require('../models/Company');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Violation = require('../models/Violation');
const DrugAlcoholTest = require('../models/DrugAlcoholTest');
const Ticket = require('../models/Ticket');

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

const generateVIN = () => {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  return vin;
};

const generateCDL = (state) => {
  const prefix = state.substring(0, 1);
  const num = Math.floor(Math.random() * 900000000) + 100000000;
  return `${prefix}${num}`;
};

// Data arrays
const firstNames = ['James', 'Michael', 'Robert', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Charles'];
const lastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson'];
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

const violationData = {
  unsafe_driving: [
    { type: 'Speeding', code: '392.2S', weight: 5 },
    { type: 'Speeding 15+ MPH over', code: '392.2S15', weight: 8 },
    { type: 'Following too closely', code: '392.2FC', weight: 5 },
    { type: 'Improper lane change', code: '392.2LC', weight: 4 }
  ],
  hours_of_service: [
    { type: 'Driving beyond 11-hour limit', code: '395.3A1', weight: 7 },
    { type: 'No logbook', code: '395.8A', weight: 5 },
    { type: 'False log entry', code: '395.8E', weight: 7 }
  ],
  vehicle_maintenance: [
    { type: 'Brake out of adjustment', code: '393.47A', weight: 6 },
    { type: 'Inoperative lights', code: '393.9', weight: 4 },
    { type: 'Tire tread depth', code: '393.75A', weight: 5 }
  ],
  driver_fitness: [
    { type: 'No valid CDL', code: '383.23A2', weight: 8 },
    { type: 'No medical certificate', code: '391.41A', weight: 6 }
  ],
  controlled_substances: [
    { type: 'Possession of alcohol', code: '392.5A1', weight: 10 }
  ]
};

// POST /api/seed - Seed the database
router.post('/', async (req, res) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Seeding not allowed in production' });
  }

  try {
    const results = {
      company: null,
      users: [],
      drivers: [],
      vehicles: [],
      violations: [],
      tests: [],
      tickets: []
    };

    // Check if data already exists
    const existingCompany = await Company.findOne({ dotNumber: '1234567' });
    if (existingCompany) {
      return res.status(400).json({
        error: 'Seed data already exists',
        message: 'Database already contains seed data. Use DELETE /api/seed first to clear it.'
      });
    }

    // Create admin user first (needed for company ownerId)
    // Note: User model's pre-save hook will hash the password
    const plainPassword = 'Password123!';
    const adminUser = await User.create({
      email: 'admin@highwayexpress.com',
      password: plainPassword,
      firstName: 'John',
      lastName: 'Administrator',
      role: 'admin',
      isActive: true,
      permissions: {
        drivers: { view: true, edit: true, delete: true },
        vehicles: { view: true, edit: true, delete: true },
        violations: { view: true, edit: true, delete: true },
        drugAlcohol: { view: true, edit: true, delete: true },
        documents: { view: true, upload: true, delete: true },
        reports: { view: true, export: true }
      }
    });

    // Create Company with ownerId
    const company = await Company.create({
      name: 'Highway Express Transport LLC',
      dotNumber: '1234567',
      mcNumber: 'MC-987654',
      ownerId: adminUser._id,
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
      fleetSize: { powerUnits: 25, drivers: 30 },
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
        mcs150: { filingDate: daysAgo(180), nextDueDate: daysFromNow(545) },
        ucr: { year: new Date().getFullYear(), status: 'registered' },
        insurance: {
          provider: 'Great West Casualty',
          policyNumber: 'GWC-2024-7891234',
          expiryDate: daysFromNow(280),
          coverageAmount: 1000000
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
    results.company = company;

    // Update admin user with companyId
    adminUser.companyId = company._id;
    await adminUser.save();

    // Create additional Users (using create() so pre-save hooks run for password hashing)
    const users = [adminUser];
    const safetyUser = await User.create({
      email: 'safety@highwayexpress.com',
      password: plainPassword,
      firstName: 'Sarah',
      lastName: 'Thompson',
      role: 'safety_manager',
      companyId: company._id,
      isActive: true
    });
    const dispatchUser = await User.create({
      email: 'dispatch@highwayexpress.com',
      password: plainPassword,
      firstName: 'Mike',
      lastName: 'Reynolds',
      role: 'dispatcher',
      companyId: company._id,
      isActive: true
    });
    users.push(safetyUser, dispatchUser);
    results.users = users;

    // Create Drivers
    const drivers = [];
    for (let i = 0; i < 10; i++) {
      const firstName = firstNames[i];
      const lastName = lastNames[i];
      const state = states[i % states.length];
      const hireDate = daysAgo(randomInt(180, 1500));

      let cdlExpiry, medicalExpiry, mvrDate, clearinghouseDate;
      let status = 'active';

      if (i < 5) {
        cdlExpiry = daysFromNow(randomInt(180, 730));
        medicalExpiry = daysFromNow(randomInt(90, 365));
        mvrDate = daysAgo(randomInt(30, 300));
        clearinghouseDate = daysAgo(randomInt(30, 300));
      } else if (i < 8) {
        cdlExpiry = daysFromNow(randomInt(20, 60));
        medicalExpiry = daysFromNow(randomInt(15, 45));
        mvrDate = daysAgo(randomInt(320, 350));
        clearinghouseDate = daysAgo(randomInt(320, 350));
      } else {
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
          street: `${randomInt(100, 9999)} ${randomElement(['Oak', 'Main', 'Cedar', 'Pine'])} ${randomElement(['St', 'Ave', 'Blvd'])}`,
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
          issueDate: daysAgo(randomInt(365, 2000)),
          expiryDate: cdlExpiry
        },
        medicalCard: {
          examinerName: `Dr. ${randomElement(lastNames)}`,
          examinerNPI: String(randomInt(1000000000, 9999999999)),
          examDate: daysAgo(randomInt(30, 365)),
          expiryDate: medicalExpiry,
          certificationType: 'interstate'
        },
        documents: {
          employmentApplication: { dateReceived: hireDate, complete: true },
          roadTest: {
            date: new Date(hireDate.getTime() + 7 * 24 * 60 * 60 * 1000),
            examinerName: 'Safety Director',
            result: 'pass'
          },
          mvrReviews: [{
            reviewDate: mvrDate,
            reviewerName: 'Sarah Thompson',
            violations: [],
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
    }
    results.drivers = drivers;

    // Create Vehicles
    const vehicles = [];
    for (let i = 0; i < 10; i++) {
      const make = truckMakes[i % truckMakes.length];
      const model = randomElement(truckModels[make]);
      const year = randomInt(2018, 2024);
      const state = states[i % states.length];

      let inspectionDue, pmDue, regExpiry;
      let vehicleStatus = 'active';

      if (i < 7) {
        inspectionDue = daysFromNow(randomInt(60, 300));
        pmDue = daysFromNow(randomInt(30, 75));
        regExpiry = daysFromNow(randomInt(90, 365));
      } else if (i < 9) {
        inspectionDue = daysFromNow(randomInt(10, 25));
        pmDue = daysFromNow(randomInt(5, 12));
        regExpiry = daysFromNow(randomInt(20, 45));
      } else {
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
        maintenanceLog: [{
          date: daysAgo(randomInt(30, 90)),
          odometer: lastPmOdometer,
          maintenanceType: 'preventive',
          category: 'engine',
          description: 'Oil change, filter replacement',
          severity: 'low',
          totalCost: 227.39,
          performedBy: 'In-house mechanic'
        }],
        pmSchedule: {
          intervalMiles: 25000,
          intervalDays: 90,
          lastPmDate: daysAgo(randomInt(30, 80)),
          lastPmOdometer,
          nextPmDueDate: pmDue,
          nextPmDueOdometer: lastPmOdometer + 25000
        },
        currentOdometer: { reading: currentOdometer, lastUpdated: daysAgo(randomInt(1, 7)) },
        registration: { state, expiryDate: regExpiry },
        insurance: {
          provider: 'Great West Casualty',
          policyNumber: `GWC-VEH-${randomInt(100000, 999999)}`,
          expiryDate: daysFromNow(280)
        }
      });
      vehicles.push(vehicle);
    }

    // Add 5 trailers
    for (let i = 0; i < 5; i++) {
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
        make: randomElement(['Great Dane', 'Wabash', 'Utility', 'Vanguard']),
        model: randomElement(['Dry Van 53ft', 'Reefer 53ft', 'Flatbed 48ft']),
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
        registration: { state, expiryDate: daysFromNow(randomInt(180, 365)) }
      });
      vehicles.push(vehicle);
    }
    results.vehicles = vehicles;

    // Create Violations
    const violations = [];
    const basics = Object.keys(violationData);
    for (let i = 0; i < 20; i++) {
      const basic = basics[i % basics.length];
      const violationInfo = randomElement(violationData[basic]);
      const driver = randomElement(drivers.filter(d => d.status === 'active'));
      const vehicle = randomElement(vehicles.filter(v => v.vehicleType === 'tractor'));
      const violationDate = daysAgo(randomInt(30, 700));

      let status = i < 12 ? 'resolved' : (i < 16 ? 'open' : (i < 18 ? 'dismissed' : 'dispute_in_progress'));

      const violation = await Violation.create({
        companyId: company._id,
        inspectionNumber: `TX${new Date(violationDate).getFullYear()}${randomInt(100000, 999999)}`,
        violationDate,
        location: {
          city: randomElement(cities),
          state: randomElement(states),
          address: `I-${randomElement(['10', '20', '35', '40'])} Mile ${randomInt(10, 400)}`
        },
        driverId: driver._id,
        vehicleId: vehicle._id,
        basic,
        violationType: violationInfo.type,
        violationCode: violationInfo.code,
        description: `${violationInfo.type} - ${basic.replace('_', ' ')} violation`,
        severityWeight: violationInfo.weight,
        outOfService: violationInfo.weight >= 8 && Math.random() > 0.5,
        inspectionType: 'roadside',
        inspectionLevel: randomElement([1, 2, 3]),
        inspectorName: `Officer ${randomElement(lastNames)}`,
        issuingAgency: `${randomElement(states)} DPS`,
        status,
        fineAmount: violationInfo.weight * randomInt(50, 150),
        finePaid: status === 'resolved'
      });
      violations.push(violation);
    }
    results.violations = violations;

    // Create Drug & Alcohol Tests
    const tests = [];
    const activeDrivers = drivers.filter(d => d.status !== 'terminated');

    // Pre-employment tests
    for (const driver of activeDrivers) {
      const test = await DrugAlcoholTest.create({
        companyId: company._id,
        driverId: driver._id,
        testType: 'pre_employment',
        testDate: new Date(driver.hireDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        testTime: '09:00',
        drugTest: {
          performed: true,
          specimenId: `SPEC-${randomInt(100000, 999999)}`,
          collectionSite: { name: 'Quest Diagnostics', address: `${randomElement(cities)}, ${randomElement(states)}` },
          collectorName: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
          mroName: `Dr. ${randomElement(lastNames)}`,
          labName: 'Quest Diagnostics',
          result: 'negative',
          verifiedDate: new Date(driver.hireDate.getTime() - 3 * 24 * 60 * 60 * 1000)
        },
        alcoholTest: { performed: false },
        overallResult: 'negative',
        consent: { signed: true, signedDate: new Date(driver.hireDate.getTime() - 7 * 24 * 60 * 60 * 1000) },
        chainOfCustody: { ccfNumber: `CCF-${randomInt(1000000, 9999999)}` },
        status: 'completed'
      });
      tests.push(test);
    }

    // Random tests
    for (let i = 0; i < 10; i++) {
      const driver = randomElement(activeDrivers);
      const testDate = daysAgo(randomInt(30, 365));
      const test = await DrugAlcoholTest.create({
        companyId: company._id,
        driverId: driver._id,
        testType: 'random',
        testDate,
        testTime: `${randomInt(8, 16)}:00`,
        drugTest: {
          performed: true,
          specimenId: `SPEC-${randomInt(100000, 999999)}`,
          collectionSite: { name: randomElement(['Quest Diagnostics', 'LabCorp', 'Concentra']) },
          result: 'negative',
          verifiedDate: new Date(testDate.getTime() + 3 * 24 * 60 * 60 * 1000)
        },
        alcoholTest: { performed: Math.random() > 0.7, result: 'negative' },
        overallResult: 'negative',
        consent: { signed: true, signedDate: testDate },
        chainOfCustody: { ccfNumber: `CCF-${randomInt(1000000, 9999999)}` },
        status: 'completed'
      });
      tests.push(test);
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
        drugTest: { performed: true, result: 'negative' },
        alcoholTest: { performed: true, screeningResult: 0.000, result: 'negative' },
        overallResult: 'negative',
        accidentInfo: {
          date: testDate,
          location: `${randomElement(cities)}, ${randomElement(states)}`,
          description: 'Minor collision'
        },
        consent: { signed: true, signedDate: testDate },
        status: 'completed'
      });
      tests.push(test);
    }
    results.tests = tests;

    // Create Tickets
    const tickets = [];
    const ticketTypes = ['speeding', 'logbook', 'equipment', 'parking', 'weight', 'lane_violation', 'red_light', 'stop_sign', 'other'];
    const ticketStatuses = ['open', 'pending_court', 'fighting', 'dismissed', 'paid', 'points_reduced', 'deferred'];
    const attorneys = [
      { name: 'James Mitchell', firm: 'Mitchell Traffic Law', phone: '(214) 555-1234', email: 'jmitchell@mtlaw.com' },
      { name: 'Sarah Chen', firm: 'Highway Legal Services', phone: '(972) 555-5678', email: 'schen@highwaylegal.com' },
      { name: 'Robert Walker', firm: 'Walker & Associates', phone: '(469) 555-9012', email: 'rwalker@walkerlaw.com' },
      null, null // Some tickets without attorneys
    ];
    const ticketDescriptions = {
      speeding: ['Speeding 15 mph over limit', 'Speeding in construction zone', 'Speeding 10 mph over limit', 'Speeding in school zone'],
      logbook: ['ELD malfunction - paper log violation', 'Falsified log entry', 'Missing log book pages'],
      equipment: ['Expired fire extinguisher', 'Broken tail light', 'Cracked windshield', 'Missing reflective triangles'],
      parking: ['Unauthorized parking at rest area', 'Blocking loading dock', 'No parking zone violation'],
      weight: ['Overweight on axle', 'Exceeded gross weight limit', 'Improper load distribution'],
      lane_violation: ['Improper lane change', 'Failure to yield', 'Crossing median'],
      red_light: ['Running red light', 'Failure to stop at intersection'],
      stop_sign: ['Rolling stop', 'Failure to stop at stop sign'],
      other: ['Following too closely', 'Failure to use turn signal', 'Improper backing']
    };

    for (let i = 0; i < 12; i++) {
      const driver = randomElement(activeDrivers);
      const ticketType = ticketTypes[i % ticketTypes.length];
      const ticketDate = daysAgo(randomInt(10, 400));
      const status = ticketStatuses[i % ticketStatuses.length];
      const attorney = randomElement(attorneys);

      let courtDate = null;
      let courtDecision = 'not_yet';
      let dataQDecision = 'not_filed';
      let paymentDate = null;
      let paymentMethod = null;

      // Set court date for tickets that need it
      if (['pending_court', 'fighting'].includes(status)) {
        courtDate = daysFromNow(randomInt(7, 60));
      } else if (['dismissed', 'paid', 'points_reduced', 'deferred'].includes(status)) {
        courtDate = daysAgo(randomInt(5, 60));
        if (status === 'dismissed') {
          courtDecision = 'dismissed';
          dataQDecision = Math.random() > 0.5 ? 'accepted' : 'not_filed';
        } else if (status === 'paid') {
          courtDecision = 'guilty';
          paymentDate = new Date(courtDate.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000);
          paymentMethod = randomElement(['credit_card', 'check', 'cash', 'money_order']);
        } else if (status === 'points_reduced') {
          courtDecision = 'reduced';
          paymentDate = new Date(courtDate.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000);
          paymentMethod = randomElement(['credit_card', 'check']);
        } else if (status === 'deferred') {
          courtDecision = 'deferred';
        }
      }

      // Some tickets have DataQ filed
      if (status === 'fighting' && Math.random() > 0.5) {
        dataQDecision = randomElement(['pending', 'accepted', 'denied']);
      }

      const baseFine = randomInt(100, 500);
      const points = status === 'dismissed' ? 0 : (status === 'points_reduced' ? randomInt(0, 2) : randomInt(2, 6));

      const ticket = await Ticket.create({
        companyId: company._id,
        driverId: driver._id,
        ticketNumber: `TKT-${new Date().getFullYear()}-${String(i + 1).padStart(5, '0')}`,
        ticketDate,
        ticketType,
        description: randomElement(ticketDescriptions[ticketType]),
        location: {
          city: randomElement(cities),
          state: randomElement(states),
          address: `${randomElement(['I-10', 'I-20', 'I-35', 'US-75', 'Hwy 287'])} Mile ${randomInt(10, 300)}`
        },
        status,
        courtDate,
        courtName: courtDate ? `${randomElement(cities)} Municipal Court` : null,
        courtDecision,
        attorney: attorney || undefined,
        dataQDecision,
        dataQFiledDate: dataQDecision !== 'not_filed' ? daysAgo(randomInt(5, 30)) : null,
        fineAmount: baseFine,
        points,
        finePaid: status === 'paid' || status === 'points_reduced',
        paymentDate,
        paymentMethod,
        notes: i % 3 === 0 ? `Initial review completed by safety manager on ${new Date(ticketDate.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}.` : ''
      });
      tickets.push(ticket);
    }
    results.tickets = tickets;

    res.json({
      success: true,
      message: 'Database seeded successfully!',
      summary: {
        company: 1,
        users: results.users.length,
        drivers: results.drivers.length,
        vehicles: results.vehicles.length,
        violations: results.violations.length,
        drugAlcoholTests: results.tests.length,
        tickets: results.tickets.length
      },
      credentials: {
        admin: { email: 'admin@highwayexpress.com', password: 'Password123!' },
        safetyManager: { email: 'safety@highwayexpress.com', password: 'Password123!' },
        dispatcher: { email: 'dispatch@highwayexpress.com', password: 'Password123!' }
      }
    });

  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Failed to seed database', details: error.message });
  }
});

// DELETE /api/seed - Clear seed data
router.delete('/', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not allowed in production' });
  }

  try {
    await Promise.all([
      Company.deleteMany({ dotNumber: '1234567' }),
      User.deleteMany({ email: { $in: ['admin@highwayexpress.com', 'safety@highwayexpress.com', 'dispatch@highwayexpress.com'] } }),
      Driver.deleteMany({}),
      Vehicle.deleteMany({}),
      Violation.deleteMany({}),
      DrugAlcoholTest.deleteMany({}),
      Ticket.deleteMany({})
    ]);

    res.json({ success: true, message: 'Seed data cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear data', details: error.message });
  }
});

// DELETE /api/seed/all - Clear ALL data (users, companies, everything)
router.delete('/all', async (req, res) => {
  try {
    const results = await Promise.all([
      User.deleteMany({}),
      Company.deleteMany({}),
      Driver.deleteMany({}),
      Vehicle.deleteMany({}),
      Violation.deleteMany({}),
      DrugAlcoholTest.deleteMany({}),
      Ticket.deleteMany({})
    ]);

    res.json({
      success: true,
      message: 'All data cleared',
      deleted: {
        users: results[0].deletedCount,
        companies: results[1].deletedCount,
        drivers: results[2].deletedCount,
        vehicles: results[3].deletedCount,
        violations: results[4].deletedCount,
        drugAlcoholTests: results[5].deletedCount,
        tickets: results[6].deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear all data', details: error.message });
  }
});

module.exports = router;
