/**
 * FMCSA Violation Codes Database
 * Maps violation codes to BASIC categories, CFR references, and severity weights
 *
 * Based on FMCSA Compliance, Safety, Accountability (CSA) program
 */

const VIOLATION_CODES = {
  // ============================================
  // UNSAFE DRIVING - 49 CFR Part 392
  // ============================================
  '392.2': { description: 'Operating a CMV while ill or fatigued', basic: 'unsafe_driving', severityBase: 5, cfrPart: '392', oosEligible: false, isMoving: false },
  '392.2S': { description: 'Speeding', basic: 'unsafe_driving', severityBase: 5, cfrPart: '392', oosEligible: false, isMoving: true },
  '392.2-SLLS': { description: 'Speeding 1-5 mph over limit', basic: 'unsafe_driving', severityBase: 1, cfrPart: '392', oosEligible: false, isMoving: true },
  '392.2-SLMS': { description: 'Speeding 6-10 mph over limit', basic: 'unsafe_driving', severityBase: 4, cfrPart: '392', oosEligible: false, isMoving: true },
  '392.2-SLMNS': { description: 'Speeding 11-14 mph over limit', basic: 'unsafe_driving', severityBase: 5, cfrPart: '392', oosEligible: false, isMoving: true },
  '392.2-SL15': { description: 'Speeding 15+ mph over limit', basic: 'unsafe_driving', severityBase: 7, cfrPart: '392', oosEligible: false, isMoving: true },
  '392.2C': { description: 'Failure to use caution for hazardous conditions', basic: 'unsafe_driving', severityBase: 5, cfrPart: '392', oosEligible: false, isMoving: true },
  '392.2LC': { description: 'Improper lane change', basic: 'unsafe_driving', severityBase: 5, cfrPart: '392', oosEligible: false, isMoving: true },
  '392.2FYR': { description: 'Failure to yield right of way', basic: 'unsafe_driving', severityBase: 5, cfrPart: '392', oosEligible: false, isMoving: true },
  '392.2R': { description: 'Reckless driving', basic: 'unsafe_driving', severityBase: 10, cfrPart: '392', oosEligible: true, isMoving: true },
  '392.2T': { description: 'Following too closely/tailgating', basic: 'unsafe_driving', severityBase: 5, cfrPart: '392', oosEligible: false, isMoving: true },
  '392.2FTC': { description: 'Failure to obey traffic control device', basic: 'unsafe_driving', severityBase: 5, cfrPart: '392', oosEligible: false, isMoving: true },
  '392.2P': { description: 'Improper passing', basic: 'unsafe_driving', severityBase: 4, cfrPart: '392', oosEligible: false, isMoving: true },
  '392.2U': { description: 'Improper turns', basic: 'unsafe_driving', severityBase: 4, cfrPart: '392', oosEligible: false, isMoving: true },
  '392.4': { description: 'Drugs - Use of amphetamines, narcotics, etc.', basic: 'controlled_substances', severityBase: 10, cfrPart: '392', oosEligible: true, isMoving: false },
  '392.5': { description: 'Alcohol - Possession/use while on duty', basic: 'controlled_substances', severityBase: 10, cfrPart: '392', oosEligible: true, isMoving: false },
  '392.5A2': { description: 'Alcohol - Under the influence', basic: 'controlled_substances', severityBase: 10, cfrPart: '392', oosEligible: true, isMoving: false },
  '392.6': { description: 'Scheduling run to necessitate speeding', basic: 'unsafe_driving', severityBase: 5, cfrPart: '392', oosEligible: false, isMoving: true },
  '392.7': { description: 'Unsafe equipment operation', basic: 'vehicle_maintenance', severityBase: 5, cfrPart: '392', oosEligible: false, isMoving: false },
  '392.9': { description: 'Operating unsafe/improperly loaded CMV', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '392', oosEligible: true, isMoving: false },
  '392.10': { description: 'Railroad crossing violation', basic: 'unsafe_driving', severityBase: 7, cfrPart: '392', oosEligible: false, isMoving: true },
  '392.14': { description: 'Failure to use hazard warning flashers', basic: 'unsafe_driving', severityBase: 2, cfrPart: '392', oosEligible: false, isMoving: false },
  '392.16': { description: 'Seat belt violation', basic: 'unsafe_driving', severityBase: 7, cfrPart: '392', oosEligible: false, isMoving: true },
  '392.22': { description: 'Stopped vehicle failure to use hazard warning', basic: 'unsafe_driving', severityBase: 5, cfrPart: '392', oosEligible: false, isMoving: false },
  '392.60': { description: 'Unauthorized passenger', basic: 'unsafe_driving', severityBase: 4, cfrPart: '392', oosEligible: false, isMoving: false },
  '392.71': { description: 'Using/equipping radar detector', basic: 'unsafe_driving', severityBase: 3, cfrPart: '392', oosEligible: false, isMoving: false },
  '392.80': { description: 'Texting while driving', basic: 'unsafe_driving', severityBase: 10, cfrPart: '392', oosEligible: true, isMoving: true },
  '392.82': { description: 'Using hand-held mobile phone', basic: 'unsafe_driving', severityBase: 10, cfrPart: '392', oosEligible: true, isMoving: true },

  // ============================================
  // HOURS OF SERVICE - 49 CFR Part 395
  // ============================================
  '395.3A': { description: '11-Hour driving limit violation', basic: 'hours_of_service', severityBase: 7, cfrPart: '395', oosEligible: true, isMoving: false },
  '395.3A2': { description: '14-Hour rule violation', basic: 'hours_of_service', severityBase: 7, cfrPart: '395', oosEligible: true, isMoving: false },
  '395.3B': { description: '60/70 Hour rule violation', basic: 'hours_of_service', severityBase: 7, cfrPart: '395', oosEligible: true, isMoving: false },
  '395.3C': { description: '34-Hour restart violation', basic: 'hours_of_service', severityBase: 5, cfrPart: '395', oosEligible: false, isMoving: false },
  '395.5': { description: 'HOS violation - Passenger carrier', basic: 'hours_of_service', severityBase: 7, cfrPart: '395', oosEligible: true, isMoving: false },
  '395.8': { description: 'Record of duty status (log) violation', basic: 'hours_of_service', severityBase: 5, cfrPart: '395', oosEligible: false, isMoving: false },
  '395.8A': { description: 'Log not current (up to date)', basic: 'hours_of_service', severityBase: 5, cfrPart: '395', oosEligible: false, isMoving: false },
  '395.8E': { description: 'False log entry/ELD data', basic: 'hours_of_service', severityBase: 7, cfrPart: '395', oosEligible: true, isMoving: false },
  '395.8F': { description: 'Failing to retain RODS', basic: 'hours_of_service', severityBase: 4, cfrPart: '395', oosEligible: false, isMoving: false },
  '395.8H': { description: 'Driver failing to submit RODS', basic: 'hours_of_service', severityBase: 4, cfrPart: '395', oosEligible: false, isMoving: false },
  '395.8K': { description: 'ELD information packet not available', basic: 'hours_of_service', severityBase: 2, cfrPart: '395', oosEligible: false, isMoving: false },
  '395.15': { description: 'On-board recording device failure', basic: 'hours_of_service', severityBase: 4, cfrPart: '395', oosEligible: false, isMoving: false },
  '395.22': { description: 'ELD violation', basic: 'hours_of_service', severityBase: 4, cfrPart: '395', oosEligible: false, isMoving: false },
  '395.24': { description: 'Driver not in possession of ELD info packet', basic: 'hours_of_service', severityBase: 2, cfrPart: '395', oosEligible: false, isMoving: false },
  '395.26': { description: 'ELD recording/transfer failure', basic: 'hours_of_service', severityBase: 5, cfrPart: '395', oosEligible: false, isMoving: false },
  '395.30': { description: 'Operator not using ELD', basic: 'hours_of_service', severityBase: 5, cfrPart: '395', oosEligible: false, isMoving: false },

  // ============================================
  // DRIVER FITNESS - 49 CFR Part 391
  // ============================================
  '391.11': { description: 'Driver not qualified', basic: 'driver_fitness', severityBase: 6, cfrPart: '391', oosEligible: true, isMoving: false },
  '391.11B2': { description: 'Operating without valid CDL', basic: 'driver_fitness', severityBase: 8, cfrPart: '391', oosEligible: true, isMoving: false },
  '391.11B4': { description: 'CDL wrong class', basic: 'driver_fitness', severityBase: 5, cfrPart: '391', oosEligible: true, isMoving: false },
  '391.11B5': { description: 'No required endorsement', basic: 'driver_fitness', severityBase: 5, cfrPart: '391', oosEligible: true, isMoving: false },
  '391.11B6': { description: 'Operating with CDL restriction violation', basic: 'driver_fitness', severityBase: 4, cfrPart: '391', oosEligible: false, isMoving: false },
  '391.15': { description: 'CDL disqualified/suspended/revoked', basic: 'driver_fitness', severityBase: 10, cfrPart: '391', oosEligible: true, isMoving: false },
  '391.21': { description: 'No employment application on file', basic: 'driver_fitness', severityBase: 2, cfrPart: '391', oosEligible: false, isMoving: false },
  '391.23': { description: 'Driving record inquiry violation', basic: 'driver_fitness', severityBase: 2, cfrPart: '391', oosEligible: false, isMoving: false },
  '391.25': { description: 'Annual MVR review not completed', basic: 'driver_fitness', severityBase: 2, cfrPart: '391', oosEligible: false, isMoving: false },
  '391.27': { description: 'Certification of violations not completed', basic: 'driver_fitness', severityBase: 2, cfrPart: '391', oosEligible: false, isMoving: false },
  '391.31': { description: 'Road test not completed', basic: 'driver_fitness', severityBase: 3, cfrPart: '391', oosEligible: false, isMoving: false },
  '391.41': { description: 'No valid medical certificate', basic: 'driver_fitness', severityBase: 5, cfrPart: '391', oosEligible: true, isMoving: false },
  '391.43': { description: 'Medical examination not performed', basic: 'driver_fitness', severityBase: 3, cfrPart: '391', oosEligible: false, isMoving: false },
  '391.45': { description: 'Medical certificate not in driver possession', basic: 'driver_fitness', severityBase: 2, cfrPart: '391', oosEligible: false, isMoving: false },
  '391.51': { description: 'DQ file not maintained', basic: 'driver_fitness', severityBase: 2, cfrPart: '391', oosEligible: false, isMoving: false },

  // ============================================
  // CONTROLLED SUBSTANCES/ALCOHOL - 49 CFR Part 382
  // ============================================
  '382.115': { description: 'Failing to implement alcohol/drug program', basic: 'controlled_substances', severityBase: 6, cfrPart: '382', oosEligible: false, isMoving: false },
  '382.301': { description: 'Pre-employment test not conducted', basic: 'controlled_substances', severityBase: 5, cfrPart: '382', oosEligible: false, isMoving: false },
  '382.303': { description: 'Post-accident test not conducted', basic: 'controlled_substances', severityBase: 5, cfrPart: '382', oosEligible: false, isMoving: false },
  '382.305': { description: 'Random testing violation', basic: 'controlled_substances', severityBase: 5, cfrPart: '382', oosEligible: false, isMoving: false },
  '382.307': { description: 'Reasonable suspicion test not conducted', basic: 'controlled_substances', severityBase: 5, cfrPart: '382', oosEligible: false, isMoving: false },
  '382.309': { description: 'Return-to-duty test not conducted', basic: 'controlled_substances', severityBase: 5, cfrPart: '382', oosEligible: false, isMoving: false },
  '382.311': { description: 'Follow-up testing not conducted', basic: 'controlled_substances', severityBase: 5, cfrPart: '382', oosEligible: false, isMoving: false },
  '382.401': { description: 'D&A records not maintained', basic: 'controlled_substances', severityBase: 3, cfrPart: '382', oosEligible: false, isMoving: false },
  '382.405': { description: 'Test results records not available', basic: 'controlled_substances', severityBase: 3, cfrPart: '382', oosEligible: false, isMoving: false },
  '382.501': { description: 'Positive drug test - using driver', basic: 'controlled_substances', severityBase: 10, cfrPart: '382', oosEligible: true, isMoving: false },
  '382.503': { description: 'Refused D&A test', basic: 'controlled_substances', severityBase: 10, cfrPart: '382', oosEligible: true, isMoving: false },
  '382.505': { description: 'Return-to-duty process not followed', basic: 'controlled_substances', severityBase: 5, cfrPart: '382', oosEligible: false, isMoving: false },
  '382.601': { description: 'D&A testing policy not provided', basic: 'controlled_substances', severityBase: 2, cfrPart: '382', oosEligible: false, isMoving: false },
  '382.701': { description: 'Clearinghouse query not conducted', basic: 'controlled_substances', severityBase: 5, cfrPart: '382', oosEligible: false, isMoving: false },
  '382.703': { description: 'Clearinghouse information not obtained', basic: 'controlled_substances', severityBase: 4, cfrPart: '382', oosEligible: false, isMoving: false },

  // ============================================
  // VEHICLE MAINTENANCE - 49 CFR Part 393 (Equipment)
  // ============================================
  '393.9': { description: 'Inoperative required lamp', basic: 'vehicle_maintenance', severityBase: 3, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.11': { description: 'Lamp mounting/visibility violation', basic: 'vehicle_maintenance', severityBase: 2, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.13': { description: 'Retro-reflective sheeting violation', basic: 'vehicle_maintenance', severityBase: 2, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.17': { description: 'Lamp/lighting not required type', basic: 'vehicle_maintenance', severityBase: 2, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.19': { description: 'Hazard warning lamp violation', basic: 'vehicle_maintenance', severityBase: 3, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.22': { description: 'Combination lamp/reflector violation', basic: 'vehicle_maintenance', severityBase: 2, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.24': { description: 'Headlamp violation', basic: 'vehicle_maintenance', severityBase: 4, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.25': { description: 'Lamp/reflector mounting violation', basic: 'vehicle_maintenance', severityBase: 2, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.40': { description: 'Inadequate brakes', basic: 'vehicle_maintenance', severityBase: 7, cfrPart: '393', oosEligible: true, isMoving: false },
  '393.42': { description: 'Brake system violation', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '393', oosEligible: true, isMoving: false },
  '393.43': { description: 'Brake connections violation', basic: 'vehicle_maintenance', severityBase: 5, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.45': { description: 'Brake tubing/hose violation', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '393', oosEligible: true, isMoving: false },
  '393.47': { description: 'Brake lining/drum/rotor violation', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '393', oosEligible: true, isMoving: false },
  '393.48': { description: 'Brake out of adjustment', basic: 'vehicle_maintenance', severityBase: 4, cfrPart: '393', oosEligible: true, isMoving: false },
  '393.50': { description: 'ABS malfunction', basic: 'vehicle_maintenance', severityBase: 4, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.51': { description: 'Brake warning system violation', basic: 'vehicle_maintenance', severityBase: 3, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.53': { description: 'Automatic brake adjuster violation', basic: 'vehicle_maintenance', severityBase: 4, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.55': { description: 'Air brake violation', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '393', oosEligible: true, isMoving: false },
  '393.60': { description: 'Glazing/window violation', basic: 'vehicle_maintenance', severityBase: 3, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.62': { description: 'Wiper/defroster violation', basic: 'vehicle_maintenance', severityBase: 3, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.65': { description: 'Fuel system violation', basic: 'vehicle_maintenance', severityBase: 5, cfrPart: '393', oosEligible: true, isMoving: false },
  '393.67': { description: 'Liquid fuel tank violation', basic: 'vehicle_maintenance', severityBase: 5, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.70': { description: 'Coupling device violation', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '393', oosEligible: true, isMoving: false },
  '393.71': { description: 'Fifth wheel violation', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '393', oosEligible: true, isMoving: false },
  '393.75': { description: 'Tire violation', basic: 'vehicle_maintenance', severityBase: 5, cfrPart: '393', oosEligible: true, isMoving: false },
  '393.76': { description: 'Sleeper berth violation', basic: 'vehicle_maintenance', severityBase: 3, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.77': { description: 'Heater violation', basic: 'vehicle_maintenance', severityBase: 3, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.78': { description: 'Windshield mounting/condition', basic: 'vehicle_maintenance', severityBase: 3, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.80': { description: 'Exhaust system violation', basic: 'vehicle_maintenance', severityBase: 4, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.81': { description: 'Horn inoperative', basic: 'vehicle_maintenance', severityBase: 2, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.82': { description: 'Speedometer inoperative', basic: 'vehicle_maintenance', severityBase: 2, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.83': { description: 'Exhaust discharge violation', basic: 'vehicle_maintenance', severityBase: 3, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.86': { description: 'Rear end protection violation', basic: 'vehicle_maintenance', severityBase: 4, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.87': { description: 'Flags for projection', basic: 'vehicle_maintenance', severityBase: 2, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.88': { description: 'Television receiver violation', basic: 'vehicle_maintenance', severityBase: 2, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.89': { description: 'Bus driveshaft protection', basic: 'vehicle_maintenance', severityBase: 4, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.90': { description: 'Bus warning device violation', basic: 'vehicle_maintenance', severityBase: 3, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.93': { description: 'Seats/belts violation', basic: 'vehicle_maintenance', severityBase: 4, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.95': { description: 'Emergency equipment violation', basic: 'vehicle_maintenance', severityBase: 4, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.100': { description: 'Cargo securement violation', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '393', oosEligible: true, isMoving: false },
  '393.102': { description: 'Cargo securement system', basic: 'vehicle_maintenance', severityBase: 5, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.104': { description: 'Blocking/bracing violation', basic: 'vehicle_maintenance', severityBase: 5, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.106': { description: 'Tiedown violation', basic: 'vehicle_maintenance', severityBase: 5, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.201': { description: 'Frame/cab/body violation', basic: 'vehicle_maintenance', severityBase: 5, cfrPart: '393', oosEligible: true, isMoving: false },
  '393.203': { description: 'Cab/body components', basic: 'vehicle_maintenance', severityBase: 4, cfrPart: '393', oosEligible: false, isMoving: false },
  '393.205': { description: 'Wheel/rim violation', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '393', oosEligible: true, isMoving: false },
  '393.207': { description: 'Suspension violation', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '393', oosEligible: true, isMoving: false },
  '393.209': { description: 'Steering mechanism violation', basic: 'vehicle_maintenance', severityBase: 8, cfrPart: '393', oosEligible: true, isMoving: false },

  // ============================================
  // VEHICLE MAINTENANCE - 49 CFR Part 396 (Inspection/Repair)
  // ============================================
  '396.3': { description: 'Unsafe operation of motor vehicle', basic: 'vehicle_maintenance', severityBase: 5, cfrPart: '396', oosEligible: true, isMoving: false },
  '396.3A1': { description: 'Parts/accessories not in safe condition', basic: 'vehicle_maintenance', severityBase: 7, cfrPart: '396', oosEligible: true, isMoving: false },
  '396.5': { description: 'Oil/grease leak hazard', basic: 'vehicle_maintenance', severityBase: 4, cfrPart: '396', oosEligible: false, isMoving: false },
  '396.7': { description: 'Vehicle not properly inspected/maintained', basic: 'vehicle_maintenance', severityBase: 4, cfrPart: '396', oosEligible: false, isMoving: false },
  '396.9': { description: 'Using defective/unsafe equipment', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '396', oosEligible: true, isMoving: false },
  '396.11': { description: 'DVIR violation', basic: 'vehicle_maintenance', severityBase: 4, cfrPart: '396', oosEligible: false, isMoving: false },
  '396.13': { description: 'Failing to correct defects noted on DVIR', basic: 'vehicle_maintenance', severityBase: 5, cfrPart: '396', oosEligible: false, isMoving: false },
  '396.17': { description: 'Annual inspection violation', basic: 'vehicle_maintenance', severityBase: 4, cfrPart: '396', oosEligible: true, isMoving: false },
  '396.19': { description: 'Inspection not performed by qualified inspector', basic: 'vehicle_maintenance', severityBase: 3, cfrPart: '396', oosEligible: false, isMoving: false },
  '396.21': { description: 'Periodic inspection marking violation', basic: 'vehicle_maintenance', severityBase: 2, cfrPart: '396', oosEligible: false, isMoving: false },
  '396.23': { description: 'Equivalent inspection not maintained', basic: 'vehicle_maintenance', severityBase: 3, cfrPart: '396', oosEligible: false, isMoving: false },

  // ============================================
  // HAZARDOUS MATERIALS - 49 CFR Parts 171-180
  // ============================================
  '171.2': { description: 'HazMat violation', basic: 'vehicle_maintenance', severityBase: 7, cfrPart: '171', oosEligible: true, isMoving: false },
  '172.200': { description: 'HazMat shipping paper violation', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '172', oosEligible: true, isMoving: false },
  '172.300': { description: 'HazMat marking violation', basic: 'vehicle_maintenance', severityBase: 5, cfrPart: '172', oosEligible: false, isMoving: false },
  '172.400': { description: 'HazMat labeling violation', basic: 'vehicle_maintenance', severityBase: 5, cfrPart: '172', oosEligible: false, isMoving: false },
  '172.500': { description: 'HazMat placarding violation', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '172', oosEligible: true, isMoving: false },
  '172.600': { description: 'HazMat emergency info violation', basic: 'vehicle_maintenance', severityBase: 5, cfrPart: '172', oosEligible: false, isMoving: false },
  '173.24': { description: 'HazMat packaging violation', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '173', oosEligible: true, isMoving: false },
  '177.800': { description: 'HazMat segregation violation', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '177', oosEligible: true, isMoving: false },
  '177.804': { description: 'HazMat no shipping papers', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '177', oosEligible: true, isMoving: false },
  '177.817': { description: 'HazMat shipping papers not accessible', basic: 'vehicle_maintenance', severityBase: 4, cfrPart: '177', oosEligible: false, isMoving: false },
  '177.823': { description: 'HazMat movement - no placards', basic: 'vehicle_maintenance', severityBase: 6, cfrPart: '177', oosEligible: true, isMoving: false },
  '177.834': { description: 'HazMat loading/unloading violation', basic: 'vehicle_maintenance', severityBase: 5, cfrPart: '177', oosEligible: false, isMoving: false }
};

/**
 * Lookup a violation code and get its details
 * @param {string} code - Raw violation code from inspection
 * @returns {Object} Violation details with BASIC, severity, etc.
 */
function lookupViolationCode(code) {
  if (!code) return { unknown: true, code, isMoving: false };

  // Normalize the code
  const normalized = normalizeCode(code);

  // Try exact match first
  if (VIOLATION_CODES[normalized]) {
    return {
      ...VIOLATION_CODES[normalized],
      code: normalized,
      originalCode: code
    };
  }

  // Try partial match (for codes like 392.2 with sub-codes)
  const baseCode = normalized.split(/[A-Z]/)[0];
  if (VIOLATION_CODES[baseCode]) {
    return {
      ...VIOLATION_CODES[baseCode],
      code: baseCode,
      originalCode: code,
      subCode: normalized.replace(baseCode, '')
    };
  }

  // Try to determine BASIC from CFR part
  const cfrMatch = normalized.match(/^(\d{3})/);
  if (cfrMatch) {
    const cfrPart = cfrMatch[1];
    const basic = mapCFRPartToBasic(cfrPart);
    return {
      code: normalized,
      originalCode: code,
      basic,
      severityBase: 5, // Default severity
      cfrPart,
      unknown: true,
      isMoving: false
    };
  }

  return {
    unknown: true,
    code,
    basic: 'vehicle_maintenance', // Default
    severityBase: 5,
    isMoving: false
  };
}

/**
 * Normalize violation code format
 * Handles variations like "396.3(a)(1)" -> "396.3A1"
 */
function normalizeCode(rawCode) {
  if (!rawCode) return '';

  return rawCode
    .toUpperCase()
    .replace(/[()]/g, '')
    .replace(/\s+/g, '')
    .replace(/§/g, '')
    .trim();
}

/**
 * Map CFR part number to BASIC category
 */
function mapCFRPartToBasic(cfrPart) {
  const mapping = {
    '392': 'unsafe_driving',
    '395': 'hours_of_service',
    '391': 'driver_fitness',
    '382': 'controlled_substances',
    '393': 'vehicle_maintenance',
    '396': 'vehicle_maintenance',
    '171': 'vehicle_maintenance',
    '172': 'vehicle_maintenance',
    '173': 'vehicle_maintenance',
    '177': 'vehicle_maintenance'
  };

  return mapping[cfrPart] || 'vehicle_maintenance';
}

/**
 * Get all violation codes for a specific BASIC
 */
function getViolationsByBasic(basic) {
  return Object.entries(VIOLATION_CODES)
    .filter(([_, details]) => details.basic === basic)
    .map(([code, details]) => ({ code, ...details }));
}

/**
 * Get all OOS-eligible violations
 */
function getOOSViolations() {
  return Object.entries(VIOLATION_CODES)
    .filter(([_, details]) => details.oosEligible)
    .map(([code, details]) => ({ code, ...details }));
}

/**
 * Get all moving violations
 */
function getMovingViolations() {
  return Object.entries(VIOLATION_CODES)
    .filter(([_, details]) => details.isMoving)
    .map(([code, details]) => ({ code, ...details }));
}

/**
 * Check if a violation code is a moving violation
 */
function isMovingViolation(code) {
  const result = lookupViolationCode(code);
  return result.isMoving === true;
}

// Error codes commonly associated with data entry mistakes or procedural issues
// Used by dataQAnalysisService and rdrDecisionTreeService
const ERROR_PRONE_VIOLATION_CODES = {
  '391.41': { boost: 15, reason: 'Medical certificate issues often involve clerical errors' },
  '391.45': { boost: 12, reason: 'Medical examiner certification status can be verified' },
  '395.8': { boost: 18, reason: 'ELD data can provide contradicting evidence' },
  '395.3': { boost: 15, reason: 'Hours violations often involve complex calculations' },
  '393.9': { boost: 10, reason: 'Inoperative equipment may have been fixed on scene' },
  '393.45': { boost: 12, reason: 'Brake adjustment can be verified with documentation' },
  '393.47': { boost: 10, reason: 'Brake tubing issues may be misidentified' },
  '392.2': { boost: 8, reason: 'State/local law violations may not apply to CMV' },
  '392.16': { boost: 10, reason: 'Seat belt violations may have extenuating circumstances' }
};

module.exports = {
  VIOLATION_CODES,
  ERROR_PRONE_VIOLATION_CODES,
  lookupViolationCode,
  normalizeCode,
  mapCFRPartToBasic,
  getViolationsByBasic,
  getOOSViolations,
  getMovingViolations,
  isMovingViolation
};
