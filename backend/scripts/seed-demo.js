/**
 * Demo Account Seed Script
 * Creates a demo user with realistic sample data for the live demo feature
 *
 * Run: node backend/scripts/seed-demo.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Company = require('../models/Company');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Document = require('../models/Document');
const Violation = require('../models/Violation');
const FMCSAInspection = require('../models/FMCSAInspection');
const Alert = require('../models/Alert');

// Demo account constants
const DEMO_EMAIL = 'demo@vroomxsafety.com';
const DEMO_PASSWORD = 'DemoAccount123!';
const DEMO_DOT_NUMBER = '999999';
const DEMO_COMPANY_NAME = 'Demo Trucking Co';

// Helper to get dates relative to today
const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const daysAgo = (days) => daysFromNow(-days);

async function seedDemo() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean up existing demo data
    console.log('\nCleaning up existing demo data...');
    const existingUser = await User.findOne({ email: DEMO_EMAIL });
    if (existingUser) {
      const existingCompany = await Company.findOne({ dotNumber: DEMO_DOT_NUMBER });
      if (existingCompany) {
        await Driver.deleteMany({ companyId: existingCompany._id });
        await Vehicle.deleteMany({ companyId: existingCompany._id });
        await Document.deleteMany({ companyId: existingCompany._id });
        await Violation.deleteMany({ companyId: existingCompany._id });
        await FMCSAInspection.deleteMany({ companyId: existingCompany._id });
        await Alert.deleteMany({ companyId: existingCompany._id });
        await Company.deleteOne({ _id: existingCompany._id });
      }
      await User.deleteOne({ _id: existingUser._id });
      console.log('Cleaned up existing demo data');
    }

    // 1. Create Demo User first (company requires ownerId)
    console.log('\nCreating demo user...');
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);
    const user = await User.create({
      email: DEMO_EMAIL,
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      isDemo: true, // Special flag for demo accounts
      isActive: true,
      emailVerified: true,
      companies: [], // Will be updated after company creation
      subscription: {
        plan: 'fleet',
        status: 'active',
        trialEndsAt: daysFromNow(30),
        currentPeriodEnd: daysFromNow(30)
      }
    });
    console.log(`Created user: ${user.email}`);

    // 2. Create Demo Company with user as owner
    console.log('\nCreating demo company...');
    const company = await Company.create({
      name: DEMO_COMPANY_NAME,
      dotNumber: DEMO_DOT_NUMBER,
      mcNumber: 'MC-999999',
      ownerId: user._id,
      phone: '(555) 123-4567',
      email: 'demo@demotrucking.com',
      address: '1234 Highway Drive, Dallas, TX 75001',
      carrierType: 'general_freight',
      fleetSize: {
        powerUnits: 8,
        drivers: 6
      },
      // Simulated SMS BASICs data
      smsBasics: {
        unsafeDriving: 45,
        hoursOfService: 62,
        vehicleMaintenance: 78,
        controlledSubstances: 0,
        driverFitness: 35,
        crashIndicator: 28,
        lastUpdated: new Date()
      },
      fmcsaData: {
        carrier: {
          legalName: DEMO_COMPANY_NAME,
          dbaName: 'Demo Trucking',
          operatingStatus: 'AUTHORIZED',
          safetyRating: 'SATISFACTORY',
          ratingDate: daysAgo(180)
        },
        inspections: {
          vehicleInspections: 24,
          vehicleOOS: 3,
          vehicleOOSPercent: 12.5,
          driverInspections: 18,
          driverOOS: 2,
          driverOOSPercent: 11.1
        },
        crashes: {
          fatal: 0,
          injury: 1,
          tow: 2,
          total: 3
        },
        lastSync: new Date()
      }
    });
    console.log(`Created company: ${company.name} (DOT# ${company.dotNumber})`);

    // 3. Update user with company membership
    console.log('\nLinking user to company...');
    user.companies = [{
      companyId: company._id,
      role: 'admin',
      isActive: true,
      joinedAt: new Date(),
      permissions: {
        drivers: { view: true, edit: true, delete: true },
        vehicles: { view: true, edit: true, delete: true },
        violations: { view: true, edit: true, delete: true },
        drugAlcohol: { view: true, edit: true, delete: true },
        documents: { view: true, upload: true, delete: true },
        reports: { view: true, export: true }
      }
    }];
    user.activeCompanyId = company._id;
    await user.save();
    console.log(`Linked user to company: ${company.name}`);

    // 3. Create Demo Drivers
    console.log('\nCreating demo drivers...');
    const drivers = await Driver.insertMany([
      {
        companyId: company._id,
        firstName: 'Mike',
        lastName: 'Rodriguez',
        email: 'mike.r@demotrucking.com',
        phone: '(555) 234-5678',
        dateOfBirth: new Date('1985-06-15'),
        hireDate: daysAgo(730), // 2 years ago
        status: 'active',
        driverType: 'company_driver',
        cdl: {
          number: 'TX12345678',
          state: 'TX',
          class: 'A',
          endorsements: ['H', 'T'],
          expiryDate: daysFromNow(45), // Expiring soon!
          issueDate: daysAgo(1460)
        },
        medicalCard: {
          expiryDate: daysFromNow(180),
          issueDate: daysAgo(545),
          examinerName: 'Dr. Smith'
        },
        clearinghouse: {
          lastQueryDate: daysAgo(30),
          status: 'clear'
        }
      },
      {
        companyId: company._id,
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.j@demotrucking.com',
        phone: '(555) 345-6789',
        dateOfBirth: new Date('1990-03-22'),
        hireDate: daysAgo(365),
        status: 'active',
        driverType: 'company_driver',
        cdl: {
          number: 'TX87654321',
          state: 'TX',
          class: 'A',
          endorsements: ['T'],
          expiryDate: daysFromNow(400),
          issueDate: daysAgo(1095)
        },
        medicalCard: {
          expiryDate: daysAgo(15), // EXPIRED!
          issueDate: daysAgo(745),
          examinerName: 'Dr. Williams'
        },
        clearinghouse: {
          lastQueryDate: daysAgo(60),
          status: 'clear'
        }
      },
      {
        companyId: company._id,
        firstName: 'James',
        lastName: 'Thompson',
        email: 'james.t@demotrucking.com',
        phone: '(555) 456-7890',
        dateOfBirth: new Date('1978-11-08'),
        hireDate: daysAgo(1095),
        status: 'active',
        driverType: 'company_driver',
        cdl: {
          number: 'TX11223344',
          state: 'TX',
          class: 'A',
          endorsements: ['H', 'N', 'T'],
          expiryDate: daysFromNow(600),
          issueDate: daysAgo(825)
        },
        medicalCard: {
          expiryDate: daysFromNow(90),
          issueDate: daysAgo(640),
          examinerName: 'Dr. Davis'
        },
        clearinghouse: {
          lastQueryDate: daysAgo(45),
          status: 'clear'
        }
      },
      {
        companyId: company._id,
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.g@demotrucking.com',
        phone: '(555) 567-8901',
        dateOfBirth: new Date('1988-07-30'),
        hireDate: daysAgo(180),
        status: 'active',
        driverType: 'company_driver',
        cdl: {
          number: 'TX55667788',
          state: 'TX',
          class: 'A',
          endorsements: ['T'],
          expiryDate: daysFromNow(800),
          issueDate: daysAgo(260)
        },
        medicalCard: {
          expiryDate: daysFromNow(520),
          issueDate: daysAgo(210),
          examinerName: 'Dr. Martinez'
        },
        clearinghouse: {
          lastQueryDate: daysAgo(15),
          status: 'clear'
        }
      },
      {
        companyId: company._id,
        firstName: 'Robert',
        lastName: 'Wilson',
        email: 'robert.w@demotrucking.com',
        phone: '(555) 678-9012',
        dateOfBirth: new Date('1982-01-18'),
        hireDate: daysAgo(500),
        status: 'suspended',
        driverType: 'company_driver',
        cdl: {
          number: 'TX99887766',
          state: 'TX',
          class: 'A',
          endorsements: ['H'],
          expiryDate: daysFromNow(200),
          issueDate: daysAgo(1200)
        },
        medicalCard: {
          expiryDate: daysFromNow(30),
          issueDate: daysAgo(700),
          examinerName: 'Dr. Brown'
        },
        clearinghouse: {
          lastQueryDate: daysAgo(90),
          status: 'violation_found'
        }
      },
      {
        companyId: company._id,
        firstName: 'David',
        lastName: 'Lee',
        email: 'david.l@demotrucking.com',
        phone: '(555) 789-0123',
        dateOfBirth: new Date('1992-09-05'),
        hireDate: daysAgo(60),
        status: 'active',
        driverType: 'company_driver',
        cdl: {
          number: 'TX44332211',
          state: 'TX',
          class: 'A',
          endorsements: [],
          expiryDate: daysFromNow(1200),
          issueDate: daysAgo(200)
        },
        medicalCard: {
          expiryDate: daysFromNow(700),
          issueDate: daysAgo(30),
          examinerName: 'Dr. Taylor'
        },
        clearinghouse: {
          lastQueryDate: daysAgo(5),
          status: 'clear'
        }
      }
    ]);
    console.log(`Created ${drivers.length} drivers`);

    // 4. Create Demo Vehicles
    console.log('\nCreating demo vehicles...');
    const vehicles = await Vehicle.insertMany([
      {
        companyId: company._id,
        unitNumber: 'T-101',
        vin: '1HGBH41JXMN109186',
        vehicleType: 'tractor',
        make: 'Freightliner',
        model: 'Cascadia',
        year: 2022,
        status: 'active',
        licensePlate: {
          number: 'TX-ABC-1234',
          state: 'TX',
          expiryDate: daysFromNow(180)
        },
        annualInspection: {
          lastInspectionDate: daysAgo(300),
          nextDueDate: daysFromNow(65), // Due soon
          inspector: 'ABC Truck Service'
        },
        registration: {
          expiryDate: daysFromNow(180)
        },
        insurance: {
          expiryDate: daysFromNow(240)
        }
      },
      {
        companyId: company._id,
        unitNumber: 'T-102',
        vin: '2HGBH41JXMN109187',
        vehicleType: 'tractor',
        make: 'Peterbilt',
        model: '579',
        year: 2021,
        status: 'active',
        licensePlate: {
          number: 'TX-DEF-5678',
          state: 'TX',
          expiryDate: daysFromNow(90)
        },
        annualInspection: {
          lastInspectionDate: daysAgo(400),
          nextDueDate: daysAgo(35), // OVERDUE!
          inspector: 'Quick Lube Truck Stop'
        },
        registration: {
          expiryDate: daysFromNow(90)
        },
        insurance: {
          expiryDate: daysFromNow(240)
        }
      },
      {
        companyId: company._id,
        unitNumber: 'T-103',
        vin: '3HGBH41JXMN109188',
        vehicleType: 'tractor',
        make: 'Kenworth',
        model: 'W900',
        year: 2020,
        status: 'maintenance',
        licensePlate: {
          number: 'TX-GHI-9012',
          state: 'TX',
          expiryDate: daysFromNow(45)
        },
        annualInspection: {
          lastInspectionDate: daysAgo(180),
          nextDueDate: daysFromNow(185),
          inspector: 'Demo Truck Repair'
        },
        registration: {
          expiryDate: daysFromNow(45)
        },
        insurance: {
          expiryDate: daysFromNow(240)
        }
      },
      {
        companyId: company._id,
        unitNumber: 'TR-201',
        vin: '4HGBH41JXMN109189',
        vehicleType: 'trailer',
        make: 'Great Dane',
        model: 'Champion',
        year: 2019,
        status: 'active',
        licensePlate: {
          number: 'TX-JKL-3456',
          state: 'TX',
          expiryDate: daysFromNow(300)
        },
        annualInspection: {
          lastInspectionDate: daysAgo(60),
          nextDueDate: daysFromNow(305),
          inspector: 'ABC Truck Service'
        }
      },
      {
        companyId: company._id,
        unitNumber: 'TR-202',
        vin: '5HGBH41JXMN109190',
        vehicleType: 'trailer',
        make: 'Wabash',
        model: 'DuraPlate',
        year: 2021,
        status: 'active',
        licensePlate: {
          number: 'TX-MNO-7890',
          state: 'TX',
          expiryDate: daysFromNow(200)
        },
        annualInspection: {
          lastInspectionDate: daysAgo(120),
          nextDueDate: daysFromNow(245),
          inspector: 'ABC Truck Service'
        }
      }
    ]);
    console.log(`Created ${vehicles.length} vehicles`);

    // 5. Create Demo Violations
    console.log('\nCreating demo violations...');
    const violations = await Violation.insertMany([
      {
        companyId: company._id,
        inspectionNumber: 'TX2024001234',
        violationDate: daysAgo(45),
        basic: 'hours_of_service',
        violationType: '395.8(a)',
        description: 'No record of duty status (ELD)',
        severityWeight: 5,
        driverId: drivers[0]._id,
        outOfService: false,
        status: 'open',
        location: 'Dallas, TX'
      },
      {
        companyId: company._id,
        inspectionNumber: 'TX2024001235',
        violationDate: daysAgo(90),
        basic: 'vehicle_maintenance',
        violationType: '393.9(a)',
        description: 'Inoperative required lamp',
        severityWeight: 3,
        vehicleId: vehicles[0]._id,
        outOfService: false,
        status: 'resolved',
        location: 'Houston, TX'
      },
      {
        companyId: company._id,
        inspectionNumber: 'TX2024001236',
        violationDate: daysAgo(30),
        basic: 'unsafe_driving',
        violationType: '392.2',
        description: 'Speeding 6-10 mph over limit',
        severityWeight: 4,
        driverId: drivers[2]._id,
        outOfService: false,
        status: 'open',
        location: 'Austin, TX'
      },
      {
        companyId: company._id,
        inspectionNumber: 'TX2024001237',
        violationDate: daysAgo(120),
        basic: 'vehicle_maintenance',
        violationType: '393.47(e)',
        description: 'Brake out of adjustment',
        severityWeight: 6,
        vehicleId: vehicles[1]._id,
        outOfService: true,
        status: 'upheld',
        location: 'San Antonio, TX'
      },
      {
        companyId: company._id,
        inspectionNumber: 'TX2024001238',
        violationDate: daysAgo(60),
        basic: 'driver_fitness',
        violationType: '391.41(a)',
        description: 'Medical certificate expired',
        severityWeight: 5,
        driverId: drivers[1]._id,
        outOfService: true,
        status: 'open',
        location: 'El Paso, TX'
      },
      {
        companyId: company._id,
        inspectionNumber: 'TX2024001239',
        violationDate: daysAgo(200),
        basic: 'hours_of_service',
        violationType: '395.3(a)(1)',
        description: 'Driving beyond 11 hour limit',
        severityWeight: 7,
        driverId: drivers[0]._id,
        outOfService: false,
        status: 'resolved',
        location: 'Fort Worth, TX'
      }
    ]);
    console.log(`Created ${violations.length} violations`);

    // 6. Create Demo Alerts
    console.log('\nCreating demo alerts...');
    const alerts = await Alert.insertMany([
      {
        companyId: company._id,
        type: 'critical',
        category: 'driver',
        title: 'Medical Card Expired',
        message: 'Sarah Johnson\'s medical card expired 15 days ago. Driver cannot operate until renewed.',
        entityType: 'driver',
        entityId: drivers[1]._id,
        status: 'active',
        daysRemaining: -15,
        deduplicationKey: `demo_driver_medical_${drivers[1]._id}`
      },
      {
        companyId: company._id,
        type: 'warning',
        category: 'driver',
        title: 'CDL Expiring Soon',
        message: 'Mike Rodriguez\'s CDL expires in 45 days. Schedule renewal appointment.',
        entityType: 'driver',
        entityId: drivers[0]._id,
        status: 'active',
        daysRemaining: 45,
        deduplicationKey: `demo_driver_cdl_${drivers[0]._id}`
      },
      {
        companyId: company._id,
        type: 'critical',
        category: 'vehicle',
        title: 'Annual Inspection Overdue',
        message: 'Vehicle T-102 annual inspection is 35 days overdue. Vehicle is out of compliance.',
        entityType: 'vehicle',
        entityId: vehicles[1]._id,
        status: 'active',
        daysRemaining: -35,
        deduplicationKey: `demo_vehicle_inspection_${vehicles[1]._id}`
      },
      {
        companyId: company._id,
        type: 'warning',
        category: 'vehicle',
        title: 'Annual Inspection Due Soon',
        message: 'Vehicle T-101 annual inspection due in 65 days.',
        entityType: 'vehicle',
        entityId: vehicles[0]._id,
        status: 'active',
        daysRemaining: 65,
        deduplicationKey: `demo_vehicle_inspection_${vehicles[0]._id}`
      },
      {
        companyId: company._id,
        type: 'warning',
        category: 'csa_score',
        title: 'Vehicle Maintenance BASIC Alert',
        message: 'Your Vehicle Maintenance BASIC is at 78%, above the 65% intervention threshold.',
        status: 'active',
        deduplicationKey: 'demo_csa_vehicle_maintenance'
      },
      {
        companyId: company._id,
        type: 'info',
        category: 'violation',
        title: 'Violation May Be Challengeable',
        message: 'The HOS violation from TX2024001234 may be eligible for DataQ challenge. Review details.',
        entityType: 'violation',
        entityId: violations[0]._id,
        status: 'active',
        deduplicationKey: `demo_violation_challenge_${violations[0]._id}`
      },
      {
        companyId: company._id,
        type: 'warning',
        category: 'driver',
        title: 'Clearinghouse Violation Found',
        message: 'Robert Wilson has a violation in the FMCSA Drug & Alcohol Clearinghouse. Review required.',
        entityType: 'driver',
        entityId: drivers[4]._id,
        status: 'active',
        deduplicationKey: `demo_driver_clearinghouse_${drivers[4]._id}`
      }
    ]);
    console.log(`Created ${alerts.length} alerts`);

    // Summary
    console.log('\n========================================');
    console.log('DEMO ACCOUNT CREATED SUCCESSFULLY');
    console.log('========================================');
    console.log(`Email: ${DEMO_EMAIL}`);
    console.log(`Password: ${DEMO_PASSWORD}`);
    console.log(`Company: ${DEMO_COMPANY_NAME}`);
    console.log(`DOT#: ${DEMO_DOT_NUMBER}`);
    console.log('----------------------------------------');
    console.log(`Drivers: ${drivers.length}`);
    console.log(`Vehicles: ${vehicles.length}`);
    console.log(`Violations: ${violations.length}`);
    console.log(`Alerts: ${alerts.length}`);
    console.log('========================================\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo data:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedDemo();
