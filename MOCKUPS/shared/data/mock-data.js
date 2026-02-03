// VroomX Safety Platform - Mock Data for HTML Mockups
// This file provides realistic demo data for all pages

const MOCK_DATA = {
  // Company Info
  company: {
    name: "ABC Trucking LLC",
    dotNumber: "3456789",
    mcNumber: "MC-123456",
    address: "1234 Highway Dr, Dallas, TX 75201",
    phone: "(555) 123-4567",
    totalDrivers: 12,
    totalVehicles: 15,
    complianceScore: 87
  },

  // Current User
  user: {
    firstName: "John",
    lastName: "Smith",
    email: "john@abctrucking.com",
    role: "Safety Manager",
    avatar: null,
    initials: "JS"
  },

  // Dashboard Stats
  dashboardStats: {
    activeDrivers: 12,
    fleetVehicles: 15,
    expiringDocs: 3,
    openViolations: 2,
    complianceScore: 87,
    driversCompliant: 9,
    driversWarning: 2,
    driversNonCompliant: 1,
    upcomingInspections: 2,
    pendingTasks: 5
  },

  // SMS BASICs Scores
  smsBasics: [
    { name: "Unsafe Driving", shortName: "UD", percentile: 15, threshold: 65, status: "compliant", trend: "down", change: -3 },
    { name: "HOS Compliance", shortName: "HOS", percentile: 42, threshold: 65, status: "warning", trend: "up", change: 5 },
    { name: "Vehicle Maintenance", shortName: "VM", percentile: 8, threshold: 80, status: "compliant", trend: "down", change: -2 },
    { name: "Controlled Substances", shortName: "CS", percentile: 0, threshold: 80, status: "compliant", trend: "stable", change: 0 },
    { name: "Driver Fitness", shortName: "DF", percentile: 12, threshold: 80, status: "compliant", trend: "down", change: -1 },
    { name: "Hazmat Compliance", shortName: "HM", percentile: null, threshold: 80, status: "na", trend: "stable", change: 0 },
    { name: "Crash Indicator", shortName: "CI", percentile: 28, threshold: 65, status: "compliant", trend: "up", change: 2 }
  ],

  // Drivers
  drivers: [
    {
      id: "DRV001",
      firstName: "James",
      lastName: "Wilson",
      employeeId: "EMP-1001",
      cdlNumber: "D12345678",
      cdlState: "TX",
      cdlClass: "A",
      endorsements: ["H", "N", "T"],
      cdlExpiry: "2025-08-15",
      medCardExpiry: "2025-03-22",
      clearinghouseExpiry: "2025-06-10",
      mvrExpiry: "2025-02-28",
      hireDate: "2022-03-15",
      status: "active",
      complianceStatus: "compliant",
      phone: "(555) 123-4567",
      email: "james.wilson@abctrucking.com",
      dob: "1985-06-12",
      address: "456 Oak Street, Dallas, TX 75201"
    },
    {
      id: "DRV002",
      firstName: "Maria",
      lastName: "Garcia",
      employeeId: "EMP-1002",
      cdlNumber: "C87654321",
      cdlState: "TX",
      cdlClass: "A",
      endorsements: ["N", "T"],
      cdlExpiry: "2025-02-20",
      medCardExpiry: "2025-01-15",
      clearinghouseExpiry: "2025-04-01",
      mvrExpiry: "2025-03-15",
      hireDate: "2021-06-01",
      status: "active",
      complianceStatus: "warning",
      phone: "(555) 234-5678",
      email: "maria.garcia@abctrucking.com",
      dob: "1990-09-23",
      address: "789 Pine Ave, Fort Worth, TX 76102"
    },
    {
      id: "DRV003",
      firstName: "Robert",
      lastName: "Johnson",
      employeeId: "EMP-1003",
      cdlNumber: "A11223344",
      cdlState: "TX",
      cdlClass: "A",
      endorsements: ["H", "N"],
      cdlExpiry: "2026-01-10",
      medCardExpiry: "2024-12-01",
      clearinghouseExpiry: "2025-05-15",
      mvrExpiry: "2025-01-30",
      hireDate: "2020-02-10",
      status: "active",
      complianceStatus: "non-compliant",
      phone: "(555) 345-6789",
      email: "robert.johnson@abctrucking.com",
      dob: "1978-03-05",
      address: "321 Elm Blvd, Arlington, TX 76010"
    },
    {
      id: "DRV004",
      firstName: "Sarah",
      lastName: "Williams",
      employeeId: "EMP-1004",
      cdlNumber: "B55667788",
      cdlState: "TX",
      cdlClass: "A",
      endorsements: ["T"],
      cdlExpiry: "2025-11-30",
      medCardExpiry: "2025-07-20",
      clearinghouseExpiry: "2025-08-01",
      mvrExpiry: "2025-06-15",
      hireDate: "2023-01-15",
      status: "active",
      complianceStatus: "compliant",
      phone: "(555) 456-7890",
      email: "sarah.williams@abctrucking.com",
      dob: "1992-11-18",
      address: "654 Maple Dr, Plano, TX 75024"
    },
    {
      id: "DRV005",
      firstName: "Michael",
      lastName: "Brown",
      employeeId: "EMP-1005",
      cdlNumber: "C99887766",
      cdlState: "TX",
      cdlClass: "A",
      endorsements: ["H", "N", "T"],
      cdlExpiry: "2025-09-25",
      medCardExpiry: "2025-04-10",
      clearinghouseExpiry: "2025-07-20",
      mvrExpiry: "2025-05-01",
      hireDate: "2019-08-20",
      status: "active",
      complianceStatus: "compliant",
      phone: "(555) 567-8901",
      email: "michael.brown@abctrucking.com",
      dob: "1983-07-22",
      address: "987 Cedar Lane, Irving, TX 75061"
    },
    {
      id: "DRV006",
      firstName: "Jennifer",
      lastName: "Davis",
      employeeId: "EMP-1006",
      cdlNumber: "D44332211",
      cdlState: "TX",
      cdlClass: "A",
      endorsements: ["N"],
      cdlExpiry: "2025-12-15",
      medCardExpiry: "2025-06-30",
      clearinghouseExpiry: "2025-09-10",
      mvrExpiry: "2025-07-25",
      hireDate: "2022-11-01",
      status: "active",
      complianceStatus: "warning",
      phone: "(555) 678-9012",
      email: "jennifer.davis@abctrucking.com",
      dob: "1988-04-30",
      address: "147 Birch St, Garland, TX 75040"
    },
    {
      id: "DRV007",
      firstName: "David",
      lastName: "Martinez",
      employeeId: "EMP-1007",
      cdlNumber: "E77889900",
      cdlState: "TX",
      cdlClass: "A",
      endorsements: ["H", "T"],
      cdlExpiry: "2026-03-20",
      medCardExpiry: "2025-10-15",
      clearinghouseExpiry: "2025-11-30",
      mvrExpiry: "2025-09-20",
      hireDate: "2021-04-15",
      status: "active",
      complianceStatus: "compliant",
      phone: "(555) 789-0123",
      email: "david.martinez@abctrucking.com",
      dob: "1995-01-08",
      address: "258 Walnut Ave, Mesquite, TX 75150"
    },
    {
      id: "DRV008",
      firstName: "Lisa",
      lastName: "Anderson",
      employeeId: "EMP-1008",
      cdlNumber: "F11002233",
      cdlState: "TX",
      cdlClass: "B",
      endorsements: ["P"],
      cdlExpiry: "2025-07-10",
      medCardExpiry: "2025-02-28",
      clearinghouseExpiry: "2025-03-15",
      mvrExpiry: "2025-04-01",
      hireDate: "2023-06-01",
      status: "active",
      complianceStatus: "compliant",
      phone: "(555) 890-1234",
      email: "lisa.anderson@abctrucking.com",
      dob: "1991-08-14",
      address: "369 Spruce Ct, Richardson, TX 75080"
    },
    {
      id: "DRV009",
      firstName: "Thomas",
      lastName: "Taylor",
      employeeId: "EMP-1009",
      cdlNumber: "G44556677",
      cdlState: "OK",
      cdlClass: "A",
      endorsements: ["H", "N", "T"],
      cdlExpiry: "2025-05-30",
      medCardExpiry: "2025-08-12",
      clearinghouseExpiry: "2025-06-25",
      mvrExpiry: "2025-03-10",
      hireDate: "2020-09-15",
      status: "active",
      complianceStatus: "compliant",
      phone: "(555) 901-2345",
      email: "thomas.taylor@abctrucking.com",
      dob: "1980-12-03",
      address: "741 Hickory Blvd, McKinney, TX 75069"
    },
    {
      id: "DRV010",
      firstName: "Amanda",
      lastName: "Moore",
      employeeId: "EMP-1010",
      cdlNumber: "H88990011",
      cdlState: "TX",
      cdlClass: "A",
      endorsements: ["N", "T"],
      cdlExpiry: "2025-10-20",
      medCardExpiry: "2025-05-18",
      clearinghouseExpiry: "2025-04-30",
      mvrExpiry: "2025-06-05",
      hireDate: "2022-07-20",
      status: "active",
      complianceStatus: "compliant",
      phone: "(555) 012-3456",
      email: "amanda.moore@abctrucking.com",
      dob: "1987-05-27",
      address: "852 Ash Way, Frisco, TX 75034"
    },
    {
      id: "DRV011",
      firstName: "Christopher",
      lastName: "Jackson",
      employeeId: "EMP-1011",
      cdlNumber: "I22334455",
      cdlState: "TX",
      cdlClass: "A",
      endorsements: ["H"],
      cdlExpiry: "2026-02-14",
      medCardExpiry: "2025-09-30",
      clearinghouseExpiry: "2025-10-15",
      mvrExpiry: "2025-08-20",
      hireDate: "2021-12-01",
      status: "active",
      complianceStatus: "compliant",
      phone: "(555) 123-4567",
      email: "christopher.jackson@abctrucking.com",
      dob: "1984-10-19",
      address: "963 Cherry St, Denton, TX 76201"
    },
    {
      id: "DRV012",
      firstName: "Jessica",
      lastName: "White",
      employeeId: "EMP-1012",
      cdlNumber: "J66778899",
      cdlState: "TX",
      cdlClass: "A",
      endorsements: ["N", "T"],
      cdlExpiry: "2025-06-08",
      medCardExpiry: "2025-11-25",
      clearinghouseExpiry: "2025-12-10",
      mvrExpiry: "2025-10-30",
      hireDate: "2023-03-10",
      status: "active",
      complianceStatus: "compliant",
      phone: "(555) 234-5678",
      email: "jessica.white@abctrucking.com",
      dob: "1993-02-14",
      address: "174 Poplar Rd, Lewisville, TX 75067"
    }
  ],

  // Vehicles
  vehicles: [
    {
      id: "VEH001",
      unitNumber: "101",
      type: "Tractor",
      make: "Freightliner",
      model: "Cascadia",
      year: 2022,
      vin: "1FUJGBDV5CLBP1234",
      licensePlate: "ABC-1234",
      state: "TX",
      registrationExpiry: "2025-12-31",
      lastInspection: "2025-01-10",
      nextPMDue: "2025-03-15",
      status: "active",
      mileage: 125000,
      assignedDriver: "James Wilson"
    },
    {
      id: "VEH002",
      unitNumber: "102",
      type: "Tractor",
      make: "Peterbilt",
      model: "579",
      year: 2021,
      vin: "1XPWD49X1GD123456",
      licensePlate: "DEF-5678",
      state: "TX",
      registrationExpiry: "2025-10-15",
      lastInspection: "2025-01-05",
      nextPMDue: "2025-02-28",
      status: "active",
      mileage: 185000,
      assignedDriver: "Maria Garcia"
    },
    {
      id: "VEH003",
      unitNumber: "103",
      type: "Tractor",
      make: "Kenworth",
      model: "T680",
      year: 2023,
      vin: "1XKYD49X3GD789012",
      licensePlate: "GHI-9012",
      state: "TX",
      registrationExpiry: "2026-03-20",
      lastInspection: "2024-12-20",
      nextPMDue: "2025-04-01",
      status: "active",
      mileage: 45000,
      assignedDriver: "Robert Johnson"
    },
    {
      id: "VEH004",
      unitNumber: "104",
      type: "Tractor",
      make: "Volvo",
      model: "VNL 760",
      year: 2022,
      vin: "4V4NC9EH1GN123456",
      licensePlate: "JKL-3456",
      state: "TX",
      registrationExpiry: "2025-08-30",
      lastInspection: "2025-01-12",
      nextPMDue: "2025-03-20",
      status: "active",
      mileage: 98000,
      assignedDriver: "Sarah Williams"
    },
    {
      id: "VEH005",
      unitNumber: "105",
      type: "Tractor",
      make: "International",
      model: "LT",
      year: 2020,
      vin: "3HSDJSJR1LN123456",
      licensePlate: "MNO-7890",
      state: "TX",
      registrationExpiry: "2025-06-15",
      lastInspection: "2024-12-15",
      nextPMDue: "2025-02-15",
      status: "active",
      mileage: 220000,
      assignedDriver: "Michael Brown"
    },
    {
      id: "VEH006",
      unitNumber: "201",
      type: "Trailer",
      make: "Utility",
      model: "4000D-X",
      year: 2021,
      vin: "1UYVS2539CU123456",
      licensePlate: "TRL-1001",
      state: "TX",
      registrationExpiry: "2025-11-30",
      lastInspection: "2025-01-08",
      nextPMDue: "2025-04-15",
      status: "active",
      mileage: null,
      assignedDriver: null
    },
    {
      id: "VEH007",
      unitNumber: "202",
      type: "Trailer",
      make: "Great Dane",
      model: "Everest",
      year: 2022,
      vin: "1GRAA0622CB123456",
      licensePlate: "TRL-1002",
      state: "TX",
      registrationExpiry: "2026-01-15",
      lastInspection: "2025-01-02",
      nextPMDue: "2025-03-25",
      status: "active",
      mileage: null,
      assignedDriver: null
    },
    {
      id: "VEH008",
      unitNumber: "203",
      type: "Trailer",
      make: "Wabash",
      model: "DuraPlate",
      year: 2020,
      vin: "1JJV532D1FL123456",
      licensePlate: "TRL-1003",
      state: "TX",
      registrationExpiry: "2025-05-20",
      lastInspection: "2024-12-28",
      nextPMDue: "2025-02-20",
      status: "maintenance",
      mileage: null,
      assignedDriver: null
    },
    {
      id: "VEH009",
      unitNumber: "106",
      type: "Tractor",
      make: "Mack",
      model: "Anthem",
      year: 2023,
      vin: "1M1AN07Y5GM123456",
      licensePlate: "PQR-2345",
      state: "TX",
      registrationExpiry: "2026-02-28",
      lastInspection: "2025-01-15",
      nextPMDue: "2025-04-10",
      status: "active",
      mileage: 32000,
      assignedDriver: "Jennifer Davis"
    },
    {
      id: "VEH010",
      unitNumber: "107",
      type: "Tractor",
      make: "Freightliner",
      model: "Cascadia",
      year: 2021,
      vin: "1FUJGBDV7CLBP5678",
      licensePlate: "STU-6789",
      state: "TX",
      registrationExpiry: "2025-09-10",
      lastInspection: "2025-01-03",
      nextPMDue: "2025-03-05",
      status: "active",
      mileage: 165000,
      assignedDriver: "David Martinez"
    },
    {
      id: "VEH011",
      unitNumber: "204",
      type: "Trailer",
      make: "Hyundai",
      model: "Translead",
      year: 2022,
      vin: "3H3V532D2ML123456",
      licensePlate: "TRL-1004",
      state: "TX",
      registrationExpiry: "2025-12-20",
      lastInspection: "2025-01-11",
      nextPMDue: "2025-04-05",
      status: "active",
      mileage: null,
      assignedDriver: null
    },
    {
      id: "VEH012",
      unitNumber: "205",
      type: "Trailer",
      make: "Utility",
      model: "4000D-X",
      year: 2023,
      vin: "1UYVS2531DU654321",
      licensePlate: "TRL-1005",
      state: "TX",
      registrationExpiry: "2026-04-30",
      lastInspection: "2025-01-14",
      nextPMDue: "2025-04-20",
      status: "active",
      mileage: null,
      assignedDriver: null
    },
    {
      id: "VEH013",
      unitNumber: "108",
      type: "Tractor",
      make: "Peterbilt",
      model: "389",
      year: 2019,
      vin: "1XPWD40X9GD654321",
      licensePlate: "VWX-0123",
      state: "TX",
      registrationExpiry: "2025-04-15",
      lastInspection: "2024-12-22",
      nextPMDue: "2025-02-10",
      status: "active",
      mileage: 285000,
      assignedDriver: "Thomas Taylor"
    },
    {
      id: "VEH014",
      unitNumber: "109",
      type: "Tractor",
      make: "Kenworth",
      model: "W900",
      year: 2020,
      vin: "1XKWD49X5GD987654",
      licensePlate: "YZA-4567",
      state: "OK",
      registrationExpiry: "2025-07-25",
      lastInspection: "2025-01-07",
      nextPMDue: "2025-03-12",
      status: "active",
      mileage: 195000,
      assignedDriver: "Amanda Moore"
    },
    {
      id: "VEH015",
      unitNumber: "110",
      type: "Tractor",
      make: "Volvo",
      model: "VNL 860",
      year: 2024,
      vin: "4V4NC9EH3PN012345",
      licensePlate: "BCD-8901",
      state: "TX",
      registrationExpiry: "2026-06-30",
      lastInspection: "2025-01-16",
      nextPMDue: "2025-04-25",
      status: "active",
      mileage: 12000,
      assignedDriver: "Christopher Jackson"
    }
  ],

  // Violations
  violations: [
    {
      id: "VIO001",
      code: "395.8(a)",
      description: "Failing to maintain complete driver's record of duty status",
      date: "2025-01-15",
      driver: "James Wilson",
      driverId: "DRV001",
      severity: "warning",
      basicCategory: "HOS Compliance",
      status: "open",
      points: 5,
      location: "I-35, Dallas TX",
      inspectionNumber: "TXP123456789"
    },
    {
      id: "VIO002",
      code: "393.75(a)",
      description: "Tire - flat and/or audible air leak",
      date: "2025-01-10",
      driver: "Maria Garcia",
      driverId: "DRV002",
      severity: "critical",
      basicCategory: "Vehicle Maintenance",
      status: "open",
      points: 8,
      location: "US-75, Sherman TX",
      inspectionNumber: "TXP987654321"
    },
    {
      id: "VIO003",
      code: "395.3(a)(2)",
      description: "Driving beyond 14 hour duty period",
      date: "2024-12-20",
      driver: "Robert Johnson",
      driverId: "DRV003",
      severity: "critical",
      basicCategory: "HOS Compliance",
      status: "resolved",
      points: 7,
      location: "I-20, Abilene TX",
      inspectionNumber: "TXP456789123"
    },
    {
      id: "VIO004",
      code: "392.2",
      description: "Speeding 6-10 miles per hour over limit",
      date: "2025-01-08",
      driver: "Sarah Williams",
      driverId: "DRV004",
      severity: "warning",
      basicCategory: "Unsafe Driving",
      status: "pending",
      points: 4,
      location: "I-45, Houston TX",
      inspectionNumber: "TXP321654987"
    },
    {
      id: "VIO005",
      code: "391.41(a)",
      description: "Operating without valid medical certificate",
      date: "2024-12-15",
      driver: "Robert Johnson",
      driverId: "DRV003",
      severity: "critical",
      basicCategory: "Driver Fitness",
      status: "open",
      points: 10,
      location: "I-10, El Paso TX",
      inspectionNumber: "TXP159753486"
    },
    {
      id: "VIO006",
      code: "393.45(b)",
      description: "Brake connections - inadequate",
      date: "2024-11-28",
      driver: "Michael Brown",
      driverId: "DRV005",
      severity: "warning",
      basicCategory: "Vehicle Maintenance",
      status: "resolved",
      points: 5,
      location: "US-287, Amarillo TX",
      inspectionNumber: "TXP753951426"
    },
    {
      id: "VIO007",
      code: "395.8(e)",
      description: "False report of driver's record of duty status",
      date: "2025-01-18",
      driver: "Jennifer Davis",
      driverId: "DRV006",
      severity: "critical",
      basicCategory: "HOS Compliance",
      status: "pending",
      points: 10,
      location: "I-30, Texarkana TX",
      inspectionNumber: "TXP426951753"
    },
    {
      id: "VIO008",
      code: "392.16",
      description: "Failing to use seat belt while operating CMV",
      date: "2024-10-05",
      driver: "David Martinez",
      driverId: "DRV007",
      severity: "minor",
      basicCategory: "Unsafe Driving",
      status: "resolved",
      points: 3,
      location: "I-35, San Antonio TX",
      inspectionNumber: "TXP852741963"
    }
  ],

  // Documents
  documents: [
    {
      id: "DOC001",
      name: "CDL - James Wilson",
      type: "cdl",
      category: "Driver Qualification",
      driver: "James Wilson",
      driverId: "DRV001",
      expiryDate: "2025-08-15",
      uploadDate: "2024-08-20",
      status: "valid",
      fileType: "PDF"
    },
    {
      id: "DOC002",
      name: "Medical Card - James Wilson",
      type: "medical_card",
      category: "Driver Qualification",
      driver: "James Wilson",
      driverId: "DRV001",
      expiryDate: "2025-03-22",
      uploadDate: "2024-03-25",
      status: "expiring_soon",
      fileType: "PDF"
    },
    {
      id: "DOC003",
      name: "CDL - Maria Garcia",
      type: "cdl",
      category: "Driver Qualification",
      driver: "Maria Garcia",
      driverId: "DRV002",
      expiryDate: "2025-02-20",
      uploadDate: "2024-02-22",
      status: "expiring_soon",
      fileType: "PDF"
    },
    {
      id: "DOC004",
      name: "Medical Card - Maria Garcia",
      type: "medical_card",
      category: "Driver Qualification",
      driver: "Maria Garcia",
      driverId: "DRV002",
      expiryDate: "2025-01-15",
      uploadDate: "2024-01-18",
      status: "expired",
      fileType: "PDF"
    },
    {
      id: "DOC005",
      name: "MVR - Robert Johnson",
      type: "mvr",
      category: "Driver Qualification",
      driver: "Robert Johnson",
      driverId: "DRV003",
      expiryDate: "2025-01-30",
      uploadDate: "2024-01-15",
      status: "expiring_soon",
      fileType: "PDF"
    },
    {
      id: "DOC006",
      name: "Clearinghouse Query - Sarah Williams",
      type: "clearinghouse",
      category: "Drug & Alcohol",
      driver: "Sarah Williams",
      driverId: "DRV004",
      expiryDate: "2025-08-01",
      uploadDate: "2024-08-05",
      status: "valid",
      fileType: "PDF"
    },
    {
      id: "DOC007",
      name: "Registration - Unit 101",
      type: "registration",
      category: "Vehicle",
      vehicle: "Unit 101",
      vehicleId: "VEH001",
      expiryDate: "2025-12-31",
      uploadDate: "2024-12-15",
      status: "valid",
      fileType: "PDF"
    },
    {
      id: "DOC008",
      name: "Annual Inspection - Unit 101",
      type: "annual_inspection",
      category: "Vehicle",
      vehicle: "Unit 101",
      vehicleId: "VEH001",
      expiryDate: "2026-01-10",
      uploadDate: "2025-01-10",
      status: "valid",
      fileType: "PDF"
    },
    {
      id: "DOC009",
      name: "Insurance Certificate",
      type: "insurance",
      category: "Company",
      expiryDate: "2025-06-30",
      uploadDate: "2024-06-15",
      status: "valid",
      fileType: "PDF"
    },
    {
      id: "DOC010",
      name: "Operating Authority",
      type: "authority",
      category: "Company",
      expiryDate: null,
      uploadDate: "2023-01-10",
      status: "valid",
      fileType: "PDF"
    }
  ],

  // Alerts
  alerts: [
    {
      id: "ALT001",
      type: "warning",
      title: "CDL Expiring Soon",
      message: "Maria Garcia's CDL expires in 14 days on Feb 20, 2025",
      date: "2025-01-25",
      severity: "warning",
      category: "Documents",
      entityType: "driver",
      entityId: "DRV002",
      isRead: false
    },
    {
      id: "ALT002",
      type: "critical",
      title: "Medical Card Expired",
      message: "Maria Garcia's medical card expired on Jan 15, 2025. Driver is non-compliant.",
      date: "2025-01-16",
      severity: "critical",
      category: "Documents",
      entityType: "driver",
      entityId: "DRV002",
      isRead: false
    },
    {
      id: "ALT003",
      type: "warning",
      title: "MVR Expiring Soon",
      message: "Robert Johnson's MVR expires in 5 days on Jan 30, 2025",
      date: "2025-01-25",
      severity: "warning",
      category: "Documents",
      entityType: "driver",
      entityId: "DRV003",
      isRead: true
    },
    {
      id: "ALT004",
      type: "info",
      title: "PM Due Soon",
      message: "Unit 105 is due for preventive maintenance on Feb 15, 2025",
      date: "2025-01-20",
      severity: "info",
      category: "Maintenance",
      entityType: "vehicle",
      entityId: "VEH005",
      isRead: false
    },
    {
      id: "ALT005",
      type: "critical",
      title: "New Violation Recorded",
      message: "Jennifer Davis received an HOS violation on Jan 18, 2025",
      date: "2025-01-18",
      severity: "critical",
      category: "Violations",
      entityType: "driver",
      entityId: "DRV006",
      isRead: false
    },
    {
      id: "ALT006",
      type: "warning",
      title: "Registration Expiring",
      message: "Unit 108 registration expires in 75 days on Apr 15, 2025",
      date: "2025-01-20",
      severity: "warning",
      category: "Vehicles",
      entityType: "vehicle",
      entityId: "VEH013",
      isRead: true
    }
  ],

  // Maintenance Records
  maintenance: [
    {
      id: "MNT001",
      vehicleId: "VEH001",
      unitNumber: "101",
      type: "Oil Change",
      description: "Full synthetic oil change with filter replacement",
      date: "2025-01-10",
      mileage: 124500,
      cost: 350,
      vendor: "Fleet Service Center",
      status: "completed",
      nextDue: "2025-04-10",
      nextDueMileage: 149500
    },
    {
      id: "MNT002",
      vehicleId: "VEH002",
      unitNumber: "102",
      type: "Brake Inspection",
      description: "Full brake system inspection and pad replacement",
      date: "2025-01-05",
      mileage: 184800,
      cost: 1250,
      vendor: "Big Rig Brakes Inc",
      status: "completed",
      nextDue: "2025-07-05",
      nextDueMileage: 234800
    },
    {
      id: "MNT003",
      vehicleId: "VEH005",
      unitNumber: "105",
      type: "Preventive Maintenance",
      description: "Scheduled PM - full inspection, fluids, filters",
      date: "2024-11-15",
      mileage: 210000,
      cost: 850,
      vendor: "Fleet Service Center",
      status: "completed",
      nextDue: "2025-02-15",
      nextDueMileage: 235000
    },
    {
      id: "MNT004",
      vehicleId: "VEH008",
      unitNumber: "203",
      type: "Tire Replacement",
      description: "Replace all 8 trailer tires",
      date: "2025-01-20",
      mileage: null,
      cost: 3200,
      vendor: "Tire World",
      status: "in_progress",
      nextDue: null,
      nextDueMileage: null
    }
  ],

  // Tickets
  tickets: [
    {
      id: "TKT001",
      driver: "James Wilson",
      driverId: "DRV001",
      date: "2025-01-12",
      type: "Speeding",
      description: "15 mph over posted limit",
      location: "I-35, Dallas TX",
      fineAmount: 250,
      points: 2,
      status: "pending",
      courtDate: "2025-02-15"
    },
    {
      id: "TKT002",
      driver: "Michael Brown",
      driverId: "DRV005",
      date: "2024-12-05",
      type: "Lane Violation",
      description: "Improper lane change",
      location: "US-287, Amarillo TX",
      fineAmount: 180,
      points: 1,
      status: "paid",
      courtDate: null
    },
    {
      id: "TKT003",
      driver: "Thomas Taylor",
      driverId: "DRV009",
      date: "2024-11-20",
      type: "Equipment Violation",
      description: "Defective tail light",
      location: "I-40, Oklahoma City OK",
      fineAmount: 125,
      points: 0,
      status: "dismissed",
      courtDate: null
    }
  ],

  // Accidents
  accidents: [
    {
      id: "ACC001",
      reportNumber: "ACC-2025-001",
      date: "2025-01-05",
      time: "14:30",
      driver: "Maria Garcia",
      driverId: "DRV002",
      vehicle: "Unit 102",
      vehicleId: "VEH002",
      location: "US-75 & Exit 42, Sherman TX",
      type: "Minor Collision",
      description: "Rear-end collision at low speed in traffic. Minor bumper damage to both vehicles.",
      injuries: false,
      fatalities: 0,
      towRequired: false,
      hazmat: false,
      estimatedDamage: 2500,
      status: "under_review",
      policeReport: "SRM-2025-12345",
      thirdPartyInvolved: true
    },
    {
      id: "ACC002",
      reportNumber: "ACC-2024-008",
      date: "2024-09-15",
      time: "06:45",
      driver: "Robert Johnson",
      driverId: "DRV003",
      vehicle: "Unit 103",
      vehicleId: "VEH003",
      location: "I-20 MP 315, Midland TX",
      type: "Single Vehicle",
      description: "Jackknife incident on wet road. No other vehicles involved.",
      injuries: false,
      fatalities: 0,
      towRequired: true,
      hazmat: false,
      estimatedDamage: 15000,
      status: "closed",
      policeReport: "TXH-2024-98765",
      thirdPartyInvolved: false
    },
    {
      id: "ACC003",
      reportNumber: "ACC-2024-005",
      date: "2024-06-22",
      time: "11:15",
      driver: "David Martinez",
      driverId: "DRV007",
      vehicle: "Unit 107",
      vehicleId: "VEH010",
      location: "FM 1960 & Kuykendahl, Houston TX",
      type: "Property Damage",
      description: "Struck fixed object (light pole) while maneuvering in parking lot.",
      injuries: false,
      fatalities: 0,
      towRequired: false,
      hazmat: false,
      estimatedDamage: 5500,
      status: "closed",
      policeReport: "HPD-2024-456789",
      thirdPartyInvolved: false
    }
  ],

  // Drug & Alcohol Tests
  drugTests: [
    {
      id: "DAT001",
      driver: "James Wilson",
      driverId: "DRV001",
      testType: "Random",
      testDate: "2025-01-18",
      collectionSite: "Quest Diagnostics - Dallas",
      result: "Negative",
      substances: ["Marijuana", "Cocaine", "Amphetamines", "Opiates", "PCP"],
      status: "completed",
      mroReview: true
    },
    {
      id: "DAT002",
      driver: "Maria Garcia",
      driverId: "DRV002",
      testType: "Post-Accident",
      testDate: "2025-01-05",
      collectionSite: "LabCorp - Sherman",
      result: "Negative",
      substances: ["Marijuana", "Cocaine", "Amphetamines", "Opiates", "PCP"],
      status: "completed",
      mroReview: true
    },
    {
      id: "DAT003",
      driver: "Sarah Williams",
      driverId: "DRV004",
      testType: "Pre-Employment",
      testDate: "2023-01-10",
      collectionSite: "Quest Diagnostics - Fort Worth",
      result: "Negative",
      substances: ["Marijuana", "Cocaine", "Amphetamines", "Opiates", "PCP"],
      status: "completed",
      mroReview: true
    },
    {
      id: "DAT004",
      driver: "Michael Brown",
      driverId: "DRV005",
      testType: "Random",
      testDate: "2024-11-12",
      collectionSite: "Concentra - Irving",
      result: "Negative",
      substances: ["Marijuana", "Cocaine", "Amphetamines", "Opiates", "PCP"],
      status: "completed",
      mroReview: true
    },
    {
      id: "DAT005",
      driver: "Thomas Taylor",
      driverId: "DRV009",
      testType: "Reasonable Suspicion",
      testDate: "2024-08-20",
      collectionSite: "Occupational Health - McKinney",
      result: "Negative",
      substances: ["Marijuana", "Cocaine", "Amphetamines", "Opiates", "PCP", "Alcohol"],
      status: "completed",
      mroReview: true
    }
  ],

  // Damage Claims
  damageClaims: [
    {
      id: "CLM001",
      claimNumber: "CLM-2025-001",
      date: "2025-01-08",
      driver: "Maria Garcia",
      driverId: "DRV002",
      vehicle: "Unit 102",
      vehicleId: "VEH002",
      accidentId: "ACC001",
      type: "Collision",
      description: "Bumper damage from rear-end collision",
      estimatedAmount: 2500,
      actualAmount: 2200,
      insuranceClaim: "INS-2025-12345",
      status: "pending",
      deductible: 500
    },
    {
      id: "CLM002",
      claimNumber: "CLM-2024-015",
      date: "2024-09-18",
      driver: "Robert Johnson",
      driverId: "DRV003",
      vehicle: "Unit 103",
      vehicleId: "VEH003",
      accidentId: "ACC002",
      type: "Jackknife",
      description: "Trailer and tractor damage from jackknife incident",
      estimatedAmount: 15000,
      actualAmount: 12800,
      insuranceClaim: "INS-2024-98765",
      status: "paid",
      deductible: 1000
    },
    {
      id: "CLM003",
      claimNumber: "CLM-2024-010",
      date: "2024-06-25",
      driver: "David Martinez",
      driverId: "DRV007",
      vehicle: "Unit 107",
      vehicleId: "VEH010",
      accidentId: "ACC003",
      type: "Property Damage",
      description: "Front bumper and light damage from striking light pole",
      estimatedAmount: 5500,
      actualAmount: 4800,
      insuranceClaim: "INS-2024-45678",
      status: "paid",
      deductible: 500
    }
  ],

  // Tasks
  tasks: [
    {
      id: "TSK001",
      title: "Renew Maria Garcia's CDL",
      description: "CDL expires in 14 days. Schedule renewal appointment and update documentation.",
      dueDate: "2025-02-05",
      priority: "high",
      assignee: "John Smith",
      status: "pending",
      category: "Documents",
      relatedEntity: { type: "driver", id: "DRV002", name: "Maria Garcia" }
    },
    {
      id: "TSK002",
      title: "Schedule Medical Exam - Maria Garcia",
      description: "Medical card expired. Urgent - schedule exam immediately.",
      dueDate: "2025-01-28",
      priority: "critical",
      assignee: "John Smith",
      status: "in_progress",
      category: "Documents",
      relatedEntity: { type: "driver", id: "DRV002", name: "Maria Garcia" }
    },
    {
      id: "TSK003",
      title: "Review HOS Violation - Jennifer Davis",
      description: "New HOS violation received. Review circumstances and discuss with driver.",
      dueDate: "2025-01-30",
      priority: "high",
      assignee: "John Smith",
      status: "pending",
      category: "Violations",
      relatedEntity: { type: "driver", id: "DRV006", name: "Jennifer Davis" }
    },
    {
      id: "TSK004",
      title: "Schedule PM - Unit 105",
      description: "Preventive maintenance due on Feb 15. Schedule with vendor.",
      dueDate: "2025-02-10",
      priority: "medium",
      assignee: "Fleet Manager",
      status: "pending",
      category: "Maintenance",
      relatedEntity: { type: "vehicle", id: "VEH005", name: "Unit 105" }
    },
    {
      id: "TSK005",
      title: "Update Driver Handbook",
      description: "Annual review of driver handbook. Update policies as needed.",
      dueDate: "2025-03-01",
      priority: "low",
      assignee: "John Smith",
      status: "pending",
      category: "Compliance"
    }
  ],

  // Checklists
  checklists: [
    {
      id: "CHK001",
      name: "New Driver Onboarding",
      description: "Complete all required steps for new driver qualification",
      driver: "Jessica White",
      driverId: "DRV012",
      items: [
        { id: 1, task: "Collect CDL copy", completed: true },
        { id: 2, task: "Verify CDL with DMV", completed: true },
        { id: 3, task: "Medical card on file", completed: true },
        { id: 4, task: "Pre-employment drug test", completed: true },
        { id: 5, task: "MVR obtained", completed: true },
        { id: 6, task: "Clearinghouse query", completed: true },
        { id: 7, task: "Background check", completed: true },
        { id: 8, task: "Road test completed", completed: true },
        { id: 9, task: "Safety orientation", completed: false },
        { id: 10, task: "Policy acknowledgments signed", completed: false },
        { id: 11, task: "W-4 and I-9 completed", completed: false },
        { id: 12, task: "Equipment issued", completed: false }
      ],
      dueDate: "2025-02-15",
      status: "in_progress"
    },
    {
      id: "CHK002",
      name: "Annual Driver Review - James Wilson",
      description: "Complete annual driver qualification file review",
      driver: "James Wilson",
      driverId: "DRV001",
      items: [
        { id: 1, task: "Review driving record", completed: true },
        { id: 2, task: "Verify medical card current", completed: true },
        { id: 3, task: "Annual Clearinghouse query", completed: true },
        { id: 4, task: "Review violation history", completed: true },
        { id: 5, task: "Update emergency contacts", completed: false },
        { id: 6, task: "Driver performance review", completed: false }
      ],
      dueDate: "2025-03-15",
      status: "in_progress"
    },
    {
      id: "CHK003",
      name: "Quarterly Safety Audit",
      description: "Q1 2025 internal safety audit",
      items: [
        { id: 1, task: "Review all DQF files", completed: false },
        { id: 2, task: "Audit vehicle inspection reports", completed: false },
        { id: 3, task: "Review HOS compliance", completed: false },
        { id: 4, task: "Check D&A program compliance", completed: false },
        { id: 5, task: "Verify maintenance records", completed: false },
        { id: 6, task: "Review accident files", completed: false },
        { id: 7, task: "Prepare audit report", completed: false }
      ],
      dueDate: "2025-03-31",
      status: "not_started"
    }
  ],

  // Navigation items (matches Layout.jsx)
  navigation: {
    primary: [
      { name: "Dashboard", href: "dashboard.html", icon: "home" },
      { name: "VroomX AI", href: "ai-assistant.html", icon: "message-circle", badge: "AI" },
      { name: "Alerts", href: "alerts.html", icon: "activity", alertCount: 5 },
      { name: "Tasks", href: "tasks.html", icon: "check-square" }
    ],
    management: [
      { name: "FMCSA Dashboard", href: "compliance.html", icon: "bar-chart-2" },
      { name: "Driver Files", href: "drivers.html", icon: "users" },
      { name: "Vehicle Files", href: "vehicles.html", icon: "truck" },
      { name: "Maintenance", href: "maintenance.html", icon: "tool" }
    ],
    tracking: [
      { name: "Tickets", href: "tickets.html", icon: "tag" },
      { name: "Accidents", href: "accidents.html", icon: "alert-octagon" },
      { name: "Damage Claims", href: "damage-claims.html", icon: "dollar-sign" },
      { name: "Drug & Alcohol", href: "drug-alcohol.html", icon: "droplet" }
    ],
    tools: [
      { name: "Documents", href: "documents.html", icon: "folder" },
      { name: "Checklists", href: "checklists.html", icon: "clipboard" },
      { name: "Reports", href: "reports.html", icon: "file-text" }
    ]
  },

  // Pricing Plans
  pricing: [
    {
      name: "Solo",
      price: 29,
      priceAnnual: 24,
      description: "Perfect for owner-operators",
      drivers: "1 driver included",
      features: [
        "Full DQF Management",
        "Document Storage",
        "Expiration Alerts",
        "Mobile Access",
        "Email Support"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Fleet",
      price: 79,
      priceAnnual: 66,
      description: "For growing fleets",
      drivers: "3 drivers included",
      extraDriverPrice: 6,
      features: [
        "Everything in Solo",
        "Unlimited Vehicles",
        "FMCSA Integration",
        "Violation Tracking",
        "Maintenance Scheduling",
        "Priority Support",
        "Team Access"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Pro",
      price: 199,
      priceAnnual: 166,
      description: "For enterprise fleets",
      drivers: "10 drivers included",
      extraDriverPrice: 5,
      features: [
        "Everything in Fleet",
        "VroomX AI Assistant",
        "Advanced Analytics",
        "Custom Reports",
        "API Access",
        "Dedicated Support",
        "SSO Integration",
        "Audit Trail"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ],

  // Testimonials
  testimonials: [
    {
      quote: "VroomX cut our audit prep time from 2 weeks to 2 hours. The automatic alerts saved us from multiple compliance issues.",
      author: "Mike Thompson",
      role: "Safety Director",
      company: "Thompson Freight LLC",
      location: "Dallas, TX",
      image: null,
      rating: 5,
      result: { metric: "95%", label: "Prep Time Saved" }
    },
    {
      quote: "Finally, a system built by people who understand trucking. No more spreadsheet chaos. Our CSA scores improved 30% in 6 months.",
      author: "Sandra Chen",
      role: "Fleet Manager",
      company: "Pacific Coast Carriers",
      location: "Los Angeles, CA",
      image: null,
      rating: 5,
      result: { metric: "30%", label: "CSA Improvement" }
    },
    {
      quote: "The AI document extraction is incredible. Upload a med card photo and it fills everything in. Saves hours every week.",
      author: "Robert Hayes",
      role: "Owner-Operator",
      company: "Hayes Trucking",
      location: "Houston, TX",
      image: null,
      rating: 5,
      result: { metric: "5hrs", label: "Saved Weekly" }
    }
  ],

  // FAQ
  faq: [
    {
      question: "How long does it take to get set up?",
      answer: "Most fleets are up and running in under 30 minutes. Our AI-powered document import can process your existing files automatically. We also offer free migration assistance for larger fleets."
    },
    {
      question: "Do you integrate with ELD providers?",
      answer: "Yes! We integrate with all major ELD providers including KeepTruckin, Samsara, Omnitracs, and more. HOS data syncs automatically to help track compliance."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-level 256-bit encryption, SOC 2 Type II certified data centers, and automatic backups. Your data is never shared with third parties."
    },
    {
      question: "Can I try before I buy?",
      answer: "Yes! All plans include a 14-day free trial with full access to all features. No credit card required to start."
    },
    {
      question: "What happens if I need help?",
      answer: "Our support team includes former DOT auditors and fleet safety managers. We offer email, chat, and phone support depending on your plan. Average response time is under 2 hours."
    },
    {
      question: "Do you pull FMCSA data automatically?",
      answer: "Yes. We sync with SAFER, SMS, and other FMCSA databases daily. Your inspection history, violations, and CSA scores update automatically."
    }
  ]
};

// Export for use in HTML files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MOCK_DATA;
}
