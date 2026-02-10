/**
 * FMCSA Violation Code Seed Data
 *
 * 50 commonly challenged violation codes across all BASIC categories.
 * Used by POST /api/violation-codes/seed to populate the ViolationCode collection.
 *
 * Severity weights follow the FMCSA SMS methodology:
 *   1 = minimal, 3 = low, 5 = moderate, 7 = high, 10 = critical
 *
 * OOS weight is 0 if violation is not an out-of-service condition, otherwise 1-2.
 */

module.exports = [
  // ==================== VEHICLE MAINTENANCE (11) ====================
  {
    code: '393.47E',
    description: 'Brakes - Defective brake component(s)',
    basic: 'vehicle_maintenance',
    severityWeight: 7,
    oosWeight: 4,
    fmcsrSection: '393.47(e)',
    fmcsrText: 'No CMV shall be operated with any braking component in a defective condition that would reduce braking efficiency.',
    cvsaOosCriteria: 'Any condition that results in reduced braking efficiency below 50% of original design capability.',
    commonOfficerErrors: [
      'Cited for temporary condition that self-corrected',
      'Air brake pressure within normal range at time of re-test',
      'Brake adjustment within specifications at re-check'
    ],
    challengeAngles: [
      'Brake adjustment was within specifications at time of inspection',
      'Condition was intermittent and not present during re-inspection',
      'Inspector measurement method was incorrect per CVSA procedures'
    ],
    isMovingViolation: false
  },
  {
    code: '393.45',
    description: 'Brake tubing and hose adequacy',
    basic: 'vehicle_maintenance',
    severityWeight: 7,
    oosWeight: 4,
    fmcsrSection: '393.45',
    fmcsrText: 'All brake tubing and brake hose must be adequately supported against snagging, catching, or kinking and must be installed to prevent chafing.',
    cvsaOosCriteria: 'Any audible air leak at brake tubing or hose connection, or any brake hose with a bulge or swelling when air pressure is applied.',
    commonOfficerErrors: [
      'Cited for cosmetic wear that did not affect function',
      'Failed to differentiate between air leak at fitting vs hose failure',
      'Confused condensation drip with brake fluid leak'
    ],
    challengeAngles: [
      'Hose was functional and passed air leak test at repair facility',
      'Wear was cosmetic and did not meet OOS threshold',
      'Inspector did not verify actual brake performance degradation'
    ],
    isMovingViolation: false
  },
  {
    code: '393.9',
    description: 'Inoperative required lamps',
    basic: 'vehicle_maintenance',
    severityWeight: 3,
    oosWeight: 0,
    fmcsrSection: '393.9',
    fmcsrText: 'All lamps required by this subpart must be in operable condition.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Cited for lamp that was functional but dirty',
      'Lamp failed during inspection but was intermittent electrical issue',
      'Wrong lamp cited on inspection report'
    ],
    challengeAngles: [
      'Lamp was operational at time of pre-trip inspection',
      'Failure occurred during inspection due to vibration/temperature',
      'Incorrect lamp location documented on report'
    ],
    isMovingViolation: false
  },
  {
    code: '396.3A1',
    description: 'General parts and accessories in unsafe condition',
    basic: 'vehicle_maintenance',
    severityWeight: 5,
    oosWeight: 2,
    fmcsrSection: '396.3(a)(1)',
    fmcsrText: 'Every motor carrier shall systematically inspect, repair, and maintain all motor vehicles and intermodal equipment subject to its control.',
    cvsaOosCriteria: 'Condition is likely to cause an accident or breakdown that would affect safe operation.',
    commonOfficerErrors: [
      'Vague citation without specifying the defective component',
      'Cited for cosmetic damage that does not affect safety',
      'Did not document severity of condition found'
    ],
    challengeAngles: [
      'Condition cited was cosmetic and did not affect safe operation',
      'Carrier had documented systematic maintenance program in place',
      'Inspector failed to specify which component was defective'
    ],
    isMovingViolation: false
  },
  {
    code: '396.7A',
    description: 'Vehicle not properly lubricated - parts and accessories',
    basic: 'vehicle_maintenance',
    severityWeight: 3,
    oosWeight: 0,
    fmcsrSection: '396.7(a)',
    fmcsrText: 'Every motor carrier shall ensure that each motor vehicle subject to its control is properly lubricated and free of oil and grease leaks.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Cited for minor seepage vs active leak',
      'Residual oil from recent service mistaken for leak',
      'Could not identify source of alleged leak'
    ],
    challengeAngles: [
      'Oil presence was residual from recent maintenance, not an active leak',
      'Minor seepage does not constitute a violation per FMCSA guidance',
      'Lubrication was performed per manufacturer schedule as documented'
    ],
    isMovingViolation: false
  },
  {
    code: '396.13C',
    description: 'Driver failing to report vehicle condition',
    basic: 'vehicle_maintenance',
    severityWeight: 5,
    oosWeight: 0,
    fmcsrSection: '396.13(c)',
    fmcsrText: 'The driver shall report, and the motor carrier shall prepare a report in writing at the completion of each day\'s work for each vehicle operated.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Driver had DVIR but inspector did not ask to see it',
      'Electronic DVIR not accepted by inspector',
      'Cited when condition developed after last DVIR was completed'
    ],
    challengeAngles: [
      'DVIR was completed and available but not requested by inspector',
      'Electronic DVIR system records confirm timely completion',
      'Condition developed after last DVIR and before next required report'
    ],
    isMovingViolation: false
  },
  {
    code: '393.48',
    description: 'Inoperative/defective brakes - Loss of air pressure',
    basic: 'vehicle_maintenance',
    severityWeight: 10,
    oosWeight: 4,
    fmcsrSection: '393.48',
    fmcsrText: 'Air brake system warning device must activate at or above 55 psi on vehicles with air brakes.',
    cvsaOosCriteria: 'Air loss rate exceeds allowable limits or low air warning device fails to activate at 55 psi.',
    commonOfficerErrors: [
      'Tested with engine off causing normal pressure drop',
      'Gauge reading inaccurate or improperly calibrated test equipment',
      'Air leak from test connection point, not from vehicle system'
    ],
    challengeAngles: [
      'Air pressure was within normal operating range during re-test',
      'Testing methodology did not follow CVSA standard procedures',
      'Low air warning activated properly during independent verification'
    ],
    isMovingViolation: false
  },
  {
    code: '393.75A',
    description: 'Flat tire or fabric exposed',
    basic: 'vehicle_maintenance',
    severityWeight: 7,
    oosWeight: 2,
    fmcsrSection: '393.75(a)',
    fmcsrText: 'No motor vehicle shall be operated on any tire that has body ply or belt material exposed through the tread or sidewall.',
    cvsaOosCriteria: 'Any tire with body ply or belt material exposed through tread or sidewall, or flat tire or audible air leak.',
    commonOfficerErrors: [
      'Cited for superficial rubber damage that did not expose cords',
      'Tire was on an inner dual position and not weight-bearing',
      'Damage occurred during inspection process itself'
    ],
    challengeAngles: [
      'Tire had surface damage only with no cord or belt exposure',
      'Photos show tread depth and condition were within legal limits',
      'Tire was replaced at scene and was not in cited condition at trip start'
    ],
    isMovingViolation: false
  },
  {
    code: '393.100',
    description: 'Cargo securement - failure to prevent shifting/loss',
    basic: 'vehicle_maintenance',
    severityWeight: 7,
    oosWeight: 2,
    fmcsrSection: '393.100',
    fmcsrText: 'Cargo must be firmly immobilized or secured on or within a vehicle by structures of adequate strength, dunnage, or tie downs.',
    cvsaOosCriteria: 'Articles of cargo that are not immobilized or secured as required and could shift to the extent that the vehicle stability or maneuverability would be adversely affected.',
    commonOfficerErrors: [
      'Cargo was secure but inspector disagreed with method used',
      'Cited for insufficient tie-downs when cargo type allowed fewer',
      'Did not account for commodity-specific securement rules'
    ],
    challengeAngles: [
      'Cargo securement met commodity-specific requirements in Part 393 Subpart I',
      'Working load limit of tie-downs exceeded minimum aggregate requirement',
      'Inspector applied general rules when commodity-specific rules applied'
    ],
    isMovingViolation: false
  },
  {
    code: '393.207',
    description: 'Suspension - defective spring/spring assembly',
    basic: 'vehicle_maintenance',
    severityWeight: 7,
    oosWeight: 2,
    fmcsrSection: '393.207',
    fmcsrText: 'No vehicle shall have any spring or spring assembly cracked, broken, missing, or shifted out of position.',
    cvsaOosCriteria: 'Any U-bolt loose or missing, any cracked or broken main spring leaf or more than one leaf in any leaf spring assembly.',
    commonOfficerErrors: [
      'Cited for cosmetic crack in spring that was within service limits',
      'Confused helper spring for main leaf spring',
      'Did not properly identify auxiliary vs primary spring assembly'
    ],
    challengeAngles: [
      'Crack was in auxiliary/helper spring, not load-bearing main leaf',
      'Spring assembly was within manufacturer service specifications',
      'Vehicle suspension was functioning properly under load at time of inspection'
    ],
    isMovingViolation: false
  },
  {
    code: '393.11',
    description: 'No or defective lighting devices/reflectors',
    basic: 'vehicle_maintenance',
    severityWeight: 3,
    oosWeight: 0,
    fmcsrSection: '393.11',
    fmcsrText: 'Every motor vehicle must be equipped with the lighting devices and reflectors required by this subpart.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Reflector was present but dirty and not inspected closely',
      'Cited wrong reflector position on the inspection report',
      'Trailer reflective tape faded but still functional'
    ],
    challengeAngles: [
      'Reflector/lighting device was present and functional but obscured by road grime',
      'Inspection report cites incorrect position that does not match vehicle configuration',
      'Reflective tape met FMVSS 108 retroreflectivity standards'
    ],
    isMovingViolation: false
  },

  // ==================== HOURS OF SERVICE (4) ====================
  {
    code: '395.8',
    description: 'Driver not in possession of required records of duty status',
    basic: 'hours_of_service',
    severityWeight: 5,
    oosWeight: 2,
    fmcsrSection: '395.8',
    fmcsrText: 'Every motor carrier shall require every driver to record their duty status for each 24-hour period.',
    cvsaOosCriteria: 'Driver unable to produce records of duty status for the current day and previous 7 consecutive days.',
    commonOfficerErrors: [
      'ELD data was available but inspector could not access device',
      'Driver had paper backup logs for ELD malfunction',
      'Inspector did not allow time for ELD data transfer'
    ],
    challengeAngles: [
      'ELD records were available and transmitted after inspection',
      'Driver was operating under short-haul exemption and not required to maintain RODS',
      'ELD experienced malfunction and driver had paper backup as required'
    ],
    isMovingViolation: false
  },
  {
    code: '395.3A2',
    description: 'Driving beyond 14-hour duty period',
    basic: 'hours_of_service',
    severityWeight: 7,
    oosWeight: 2,
    fmcsrSection: '395.3(a)(2)',
    fmcsrText: 'No motor carrier shall permit or require any driver to drive after the end of the 14th consecutive hour after coming on duty.',
    cvsaOosCriteria: 'Driver has driven or is driving beyond the 14-hour window.',
    commonOfficerErrors: [
      'Did not account for adverse driving conditions exception',
      'Miscalculated on-duty start time from ELD data',
      'Did not apply short-haul exception correctly'
    ],
    challengeAngles: [
      'Adverse driving conditions exception applied per 395.1(b)(1)',
      'Inspector miscalculated the 14-hour window start time',
      'Driver qualified for short-haul exception under 395.1(e)(1)'
    ],
    isMovingViolation: false
  },
  {
    code: '395.22',
    description: 'ELD - hours of service not current',
    basic: 'hours_of_service',
    severityWeight: 5,
    oosWeight: 0,
    fmcsrSection: '395.22',
    fmcsrText: 'A driver must review ELD records and correct any inaccuracies before the mandatory certification.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'ELD was current but display required scrolling to view',
      'Inspector unfamiliar with specific ELD platform interface',
      'Minor timestamp discrepancy within allowable tolerance'
    ],
    challengeAngles: [
      'ELD data was current and accurate; inspector did not navigate the ELD interface fully',
      'Discrepancy was within the allowable data diagnostic tolerance',
      'Driver had corrected the record prior to mandatory certification deadline'
    ],
    isMovingViolation: false
  },
  {
    code: '395.8E5',
    description: 'False report of driver\'s record of duty status',
    basic: 'hours_of_service',
    severityWeight: 10,
    oosWeight: 2,
    fmcsrSection: '395.8(e)(5)',
    fmcsrText: 'No driver shall make a false report regarding their record of duty status.',
    cvsaOosCriteria: 'Evidence of falsified records of duty status.',
    commonOfficerErrors: [
      'Assumed false log based on fuel receipt time vs log discrepancy',
      'Did not account for time zone changes in ELD data',
      'Minor rounding of times treated as intentional falsification'
    ],
    challengeAngles: [
      'Time zone differences between ELD and fuel receipt explain the discrepancy',
      'ELD auto-recorded data was accurate; apparent discrepancy was a display issue',
      'Minor time rounding within 15-minute increment does not constitute falsification'
    ],
    isMovingViolation: false
  },

  // ==================== UNSAFE DRIVING (3) ====================
  {
    code: '392.2',
    description: 'Operating a CMV while using a hand-held mobile telephone',
    basic: 'unsafe_driving',
    severityWeight: 10,
    oosWeight: 0,
    fmcsrSection: '392.82',
    fmcsrText: 'No driver shall use a hand-held mobile telephone while driving a CMV.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Driver was using phone in hands-free mode or mount',
      'Vehicle was stopped or in parking/idle when phone was used',
      'Device was a GPS unit, not a mobile telephone'
    ],
    challengeAngles: [
      'Phone was mounted in a hands-free device compliant with 392.82',
      'Vehicle was stationary and not in motion when phone was observed',
      'Device observed was a standalone GPS unit, not a mobile telephone'
    ],
    isMovingViolation: true
  },
  {
    code: '392.16',
    description: 'Failing to use seat belt while operating CMV',
    basic: 'unsafe_driving',
    severityWeight: 5,
    oosWeight: 0,
    fmcsrSection: '392.16',
    fmcsrText: 'A CMV which has a seat belt assembly installed at the driver\'s seat shall not be driven unless the driver has properly restrained himself/herself with the seat belt assembly.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Seat belt was worn but appeared slack from officer vantage point',
      'Driver had just unbuckled upon stopping for the inspection',
      'Seat belt extender was in use but not recognized by inspector'
    ],
    challengeAngles: [
      'Driver was wearing seat belt but released it when stopping for inspection',
      'Photographic evidence shows seat belt wear marks on clothing',
      'Seat belt was equipped with approved extender that may have appeared improper'
    ],
    isMovingViolation: true
  },
  {
    code: '392.4',
    description: 'Drugs/alcohol - being under the influence while on duty',
    basic: 'unsafe_driving',
    severityWeight: 10,
    oosWeight: 2,
    fmcsrSection: '392.4',
    fmcsrText: 'No driver shall be on duty and possess, be under the influence of, or use any narcotic drug, amphetamine, or other substance that renders the driver incapable of safely operating a CMV.',
    cvsaOosCriteria: 'Driver appears to be impaired or tests positive for controlled substance.',
    commonOfficerErrors: [
      'Prescription medication use was legal and properly documented',
      'Field sobriety test administered improperly',
      'Physical condition mistaken for impairment signs'
    ],
    challengeAngles: [
      'Driver had valid prescription from treating physician with medical clearance to drive',
      'Medical condition caused symptoms that mimicked impairment',
      'Field sobriety test was not administered per NHTSA standardized procedures'
    ],
    isMovingViolation: true
  },

  // ==================== DRIVER FITNESS (5) ====================
  {
    code: '391.41A',
    description: 'Physical qualifications for drivers - general',
    basic: 'driver_fitness',
    severityWeight: 5,
    oosWeight: 2,
    fmcsrSection: '391.41(a)',
    fmcsrText: 'A person shall not drive a CMV unless physically qualified to do so.',
    cvsaOosCriteria: 'Driver does not meet physical qualification requirements and cannot produce valid medical certificate.',
    commonOfficerErrors: [
      'Driver had valid medical card but it was in different vehicle or at office',
      'Medical exemption was valid but not in standard format',
      'Driver had SPE or vision/hearing exemption on file with carrier'
    ],
    challengeAngles: [
      'Driver was physically qualified and medical certificate was on file with carrier',
      'Valid medical examiner certificate was obtained but not in driver possession at time',
      'Driver held valid SPE/exemption letter from FMCSA'
    ],
    isMovingViolation: false
  },
  {
    code: '391.45',
    description: 'Expired or missing medical card',
    basic: 'driver_fitness',
    severityWeight: 5,
    oosWeight: 2,
    fmcsrSection: '391.45',
    fmcsrText: 'Except as provided in 391.67, a motor carrier shall not allow a driver to operate a CMV unless the driver is medically examined and certified as physically qualified.',
    cvsaOosCriteria: 'Driver cannot produce a valid, current medical examiner certificate.',
    commonOfficerErrors: [
      'Medical card was valid but in digital format not recognized by inspector',
      'Inspector did not check National Registry for valid medical examiner',
      'Card had been renewed but driver had old card in possession'
    ],
    challengeAngles: [
      'Medical certificate was current and valid; renewed prior to expiration',
      'Digital medical card was available through carrier ELD system',
      'FMCSA National Registry confirms driver had valid medical certification'
    ],
    isMovingViolation: false
  },
  {
    code: '391.11A',
    description: 'Unqualified driver - general',
    basic: 'driver_fitness',
    severityWeight: 7,
    oosWeight: 2,
    fmcsrSection: '391.11(a)',
    fmcsrText: 'A motor carrier shall not operate a CMV with a driver who is not qualified.',
    cvsaOosCriteria: 'Driver fails to meet one or more minimum qualifications to operate a CMV.',
    commonOfficerErrors: [
      'Driver qualification file was at carrier office, not in cab',
      'Inspector cited general qualification when specific violation would apply',
      'Driver met all qualifications but paperwork was not immediately available'
    ],
    challengeAngles: [
      'Driver was fully qualified; all documentation available at carrier office per regulation',
      'Specific qualification requirement cited was met, as evidenced by carrier records',
      'General qualification citation used instead of specific applicable section'
    ],
    isMovingViolation: false
  },
  {
    code: '383.23A2',
    description: 'Operating a CMV without a CDL',
    basic: 'driver_fitness',
    severityWeight: 10,
    oosWeight: 2,
    fmcsrSection: '383.23(a)(2)',
    fmcsrText: 'No person shall drive a CMV unless such person has passed knowledge and skills tests for the CMV group and endorsements that apply.',
    cvsaOosCriteria: 'Driver does not possess a valid CDL for the class/endorsement required for the vehicle being operated.',
    commonOfficerErrors: [
      'Driver had valid CDL but in a different state after recent move',
      'CDL class was correct but endorsement question was misapplied',
      'Vehicle did not actually require CDL based on GVWR'
    ],
    challengeAngles: [
      'Driver possessed valid CDL issued by another state within transfer period',
      'Vehicle GVWR did not require the CDL class/endorsement cited',
      'CDL and endorsements were valid per state DMV records'
    ],
    isMovingViolation: false
  },
  {
    code: '383.37A',
    description: 'Driving with a suspended/revoked CDL',
    basic: 'driver_fitness',
    severityWeight: 10,
    oosWeight: 2,
    fmcsrSection: '383.37(a)',
    fmcsrText: 'No person shall drive a CMV during any period when their CDL is suspended, revoked, or canceled.',
    cvsaOosCriteria: 'CDL is confirmed suspended, revoked, or canceled.',
    commonOfficerErrors: [
      'Suspension had been resolved but state database not yet updated',
      'Administrative suspension was lifted but record showed lag',
      'Confusion between CDL status and underlying license status'
    ],
    challengeAngles: [
      'CDL suspension had been resolved prior to inspection; state records had update lag',
      'Court documentation shows suspension was lifted before date of inspection',
      'State DMV confirmation shows CDL was valid and active on date of inspection'
    ],
    isMovingViolation: false
  },

  // ==================== CONTROLLED SUBSTANCES / ALCOHOL (3) ====================
  {
    code: '382.115A',
    description: 'Carrier failed to implement drug/alcohol testing program',
    basic: 'controlled_substances',
    severityWeight: 10,
    oosWeight: 0,
    fmcsrSection: '382.115(a)',
    fmcsrText: 'Each employer shall ensure that all alcohol or controlled substances testing conducted under this part complies with the requirements of this part and 49 CFR Part 40.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Carrier had program but documentation was at office not in vehicle',
      'Program was implemented through a consortium not recognized by inspector',
      'Program documentation was digital and inspector required hard copy'
    ],
    challengeAngles: [
      'Carrier has fully compliant D&A testing program through registered consortium',
      'Program records available at carrier office demonstrate full compliance',
      'C/TPA enrollment and testing records confirm active program participation'
    ],
    isMovingViolation: false
  },
  {
    code: '382.301',
    description: 'Pre-employment testing - controlled substances',
    basic: 'controlled_substances',
    severityWeight: 7,
    oosWeight: 0,
    fmcsrSection: '382.301',
    fmcsrText: 'Prior to the first time a driver performs safety-sensitive functions for an employer, the driver shall undergo testing for controlled substances.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Test was completed but results processing was delayed',
      'Driver was exempt under exception for certain employer transfers',
      'Inspector did not verify with carrier before citing'
    ],
    challengeAngles: [
      'Pre-employment test was completed with negative result prior to first safety-sensitive duty',
      'Driver qualified for exception under 382.301(c) based on previous employer testing',
      'Testing records from C/TPA confirm compliance with pre-employment requirement'
    ],
    isMovingViolation: false
  },
  {
    code: '382.305',
    description: 'Random testing - controlled substances',
    basic: 'controlled_substances',
    severityWeight: 7,
    oosWeight: 0,
    fmcsrSection: '382.305',
    fmcsrText: 'Each employer shall ensure that random alcohol and controlled substances tests are unannounced and conducted with a scientifically valid method.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Random selection pool documentation was at carrier, not in vehicle',
      'Carrier used consortium and inspector could not verify on-site',
      'Testing rate was compliant but inspector used wrong calculation'
    ],
    challengeAngles: [
      'Carrier consortium random testing pool and selection records demonstrate compliance',
      'Random testing rate met or exceeded FMCSA minimum required percentage',
      'C/TPA records confirm driver was in random pool with proper selection methodology'
    ],
    isMovingViolation: false
  },

  // ==================== CRASH INDICATOR (6) ====================
  {
    code: '392.2S',
    description: 'Speeding - operating at speed greater than posted limit',
    basic: 'crash_indicator',
    severityWeight: 5,
    oosWeight: 0,
    fmcsrSection: '392.2',
    fmcsrText: 'Every CMV must be operated in accordance with the laws of the jurisdiction in which it is being operated, including speed limits.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Radar/lidar not calibrated per manufacturer specifications',
      'Speed posted sign was obscured or recently changed',
      'Officer tracked wrong vehicle in multi-lane traffic'
    ],
    challengeAngles: [
      'GPS/ELD data shows vehicle was traveling at or below posted speed limit',
      'Speed limit sign was not properly posted or recently changed without adequate notice',
      'Radar/lidar calibration records show equipment was not properly maintained'
    ],
    isMovingViolation: true
  },
  {
    code: '392.2LC',
    description: 'Improper lane change',
    basic: 'crash_indicator',
    severityWeight: 5,
    oosWeight: 0,
    fmcsrSection: '392.2',
    fmcsrText: 'Every CMV must be operated in accordance with the laws of the jurisdiction in which it is being operated, including lane change laws.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Lane change was safe but officer disagreed with timing',
      'Construction zone lane markings were confusing or missing',
      'Driver was avoiding hazard in roadway'
    ],
    challengeAngles: [
      'Dashcam footage shows safe lane change with proper signaling',
      'Lane markings in construction zone were unclear or contradictory',
      'Lane change was necessary to avoid hazard or emergency situation'
    ],
    isMovingViolation: true
  },
  {
    code: '392.2FTY',
    description: 'Failure to yield right of way',
    basic: 'crash_indicator',
    severityWeight: 5,
    oosWeight: 0,
    fmcsrSection: '392.2',
    fmcsrText: 'Every CMV must be operated in accordance with the laws of the jurisdiction, including right-of-way rules.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Right of way assignment was ambiguous in the situation',
      'Other driver caused confusion by not following traffic signals',
      'Intersection control device was malfunctioning'
    ],
    challengeAngles: [
      'Traffic signal or intersection control was malfunctioning at time of incident',
      'Other involved party violated right-of-way rules creating the conflict',
      'Dashcam/witness evidence shows CMV driver had right of way'
    ],
    isMovingViolation: true
  },
  {
    code: '392.2FCD',
    description: 'Following too closely',
    basic: 'crash_indicator',
    severityWeight: 5,
    oosWeight: 0,
    fmcsrSection: '392.2',
    fmcsrText: 'Every CMV must be operated in accordance with the laws of the jurisdiction, including following distance requirements.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Another vehicle cut in front of CMV reducing following distance',
      'Distance estimate was subjective without measurement tools',
      'Traffic conditions required closer following in slow/stop-and-go traffic'
    ],
    challengeAngles: [
      'Another vehicle merged in front of CMV immediately before observation',
      'Forward-facing dashcam shows adequate following distance was maintained',
      'Traffic conditions were stop-and-go making standard following distance inapplicable'
    ],
    isMovingViolation: true
  },
  {
    code: '392.2RD',
    description: 'Reckless driving',
    basic: 'crash_indicator',
    severityWeight: 10,
    oosWeight: 2,
    fmcsrSection: '392.2',
    fmcsrText: 'Every CMV must be operated in accordance with the laws of the jurisdiction in which it is being operated.',
    cvsaOosCriteria: 'Driver operating in a manner that endangers or is likely to endanger persons or property.',
    commonOfficerErrors: [
      'Subjective assessment of driving behavior without specific evidence',
      'Road or weather conditions caused vehicle movement mistaken for reckless operation',
      'Citation was reduced or dismissed in court'
    ],
    challengeAngles: [
      'Court disposition shows citation was dismissed or reduced to lesser offense',
      'ELD and GPS data show vehicle was being operated safely and within speed limits',
      'Road/weather conditions caused vehicle movement that appeared unsafe but was unavoidable'
    ],
    isMovingViolation: true
  },
  {
    code: '392.2TF',
    description: 'Improper turns or failure to signal',
    basic: 'crash_indicator',
    severityWeight: 3,
    oosWeight: 0,
    fmcsrSection: '392.2',
    fmcsrText: 'Every CMV must be operated in accordance with the laws of the jurisdiction, including turning and signaling requirements.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Turn signal was used but officer did not observe it from their position',
      'Wide turn was required due to vehicle length/configuration',
      'Turn was into a facility entrance not a standard intersection'
    ],
    challengeAngles: [
      'Vehicle configuration required wide turn that was executed safely',
      'Turn signals were operational and activated; officer viewing angle was limited',
      'Dashcam evidence shows proper signal use and safe turning execution'
    ],
    isMovingViolation: true
  },

  // ==================== HAZMAT (5) ====================
  {
    code: '397.13',
    description: 'Hazmat - smoking within 25 feet of vehicle',
    basic: 'hazmat',
    severityWeight: 5,
    oosWeight: 0,
    fmcsrSection: '397.13',
    fmcsrText: 'No person shall smoke or carry a lighted cigarette, cigar, or pipe within 25 feet of a motor vehicle which contains Class 1, Class 5, or flammable materials.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Distance estimate was inaccurate - driver was beyond 25 feet',
      'Vehicle did not actually contain restricted hazmat class',
      'Person smoking was not the driver or under carrier control'
    ],
    challengeAngles: [
      'Driver was beyond 25 feet from vehicle when observed',
      'Cargo manifest shows vehicle did not contain Class 1, 5, or flammable materials',
      'Person observed smoking was not the CMV driver or carrier employee'
    ],
    isMovingViolation: false
  },
  {
    code: '172.800',
    description: 'Hazmat - no security plan',
    basic: 'hazmat',
    severityWeight: 5,
    oosWeight: 0,
    fmcsrSection: '172.800',
    fmcsrText: 'Carriers transporting certain hazardous materials must develop and implement a security plan.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Security plan existed at carrier office but not in vehicle',
      'Material transported did not meet threshold quantity requiring plan',
      'Inspector applied wrong table for plan requirement thresholds'
    ],
    challengeAngles: [
      'Security plan was developed and implemented; copy maintained at carrier office per regulation',
      'Quantity of hazmat transported was below threshold requiring a security plan',
      'Material was not a highway route controlled quantity or select agent requiring security plan'
    ],
    isMovingViolation: false
  },
  {
    code: '172.704A',
    description: 'Hazmat - driver not trained/certified',
    basic: 'hazmat',
    severityWeight: 7,
    oosWeight: 2,
    fmcsrSection: '172.704(a)',
    fmcsrText: 'Each hazmat employee shall be trained as required and the training must be completed within 90 days of employment or change in job function.',
    cvsaOosCriteria: 'Driver cannot produce evidence of hazmat training appropriate for the materials being transported.',
    commonOfficerErrors: [
      'Training certificate was at carrier office not in vehicle',
      'Driver was within 90-day grace period for new hazmat function',
      'Training was current but certificate format was unfamiliar to inspector'
    ],
    challengeAngles: [
      'Training records at carrier office confirm driver completed required hazmat training',
      'Driver was within the 90-day new employee training grace period under 172.704(b)',
      'Training certificate was issued by recognized provider and covers all required elements'
    ],
    isMovingViolation: false
  },
  {
    code: '172.200',
    description: 'Hazmat - shipping paper not accessible or missing',
    basic: 'hazmat',
    severityWeight: 7,
    oosWeight: 2,
    fmcsrSection: '172.200',
    fmcsrText: 'Persons offering a hazardous material for transportation must describe the material on a shipping paper.',
    cvsaOosCriteria: 'No shipping papers or papers not accessible by the driver during transportation.',
    commonOfficerErrors: [
      'Shipping papers were in cab but not in exact required location',
      'Electronic shipping papers were available but not accepted',
      'Papers were present but format differed from inspector expectation'
    ],
    challengeAngles: [
      'Shipping papers were in the cab and accessible; exact pouch/location requirement was met',
      'Shipper-prepared shipping papers contained all required information per 172.200-204',
      'Papers were temporarily displaced during pre-inspection activity but were present'
    ],
    isMovingViolation: false
  },
  {
    code: '172.516',
    description: 'Hazmat - vehicle not properly placarded',
    basic: 'hazmat',
    severityWeight: 7,
    oosWeight: 2,
    fmcsrSection: '172.516',
    fmcsrText: 'Each placard on a motor vehicle must be clearly visible and displayed simultaneously on each side and each end of the vehicle.',
    cvsaOosCriteria: 'Placards are missing, damaged to the point of being unreadable, or wrong class placard displayed.',
    commonOfficerErrors: [
      'Placard was present but partially obscured by road debris',
      'Subsidiary placard was not required for the quantity being transported',
      'Wrong placard table applied for the specific material and quantity'
    ],
    challengeAngles: [
      'All required placards were present and properly displayed; road debris obscured one temporarily',
      'Quantity transported was below placard threshold per 172.504 Table 2',
      'Correct placard class was displayed per shipping paper hazmat description'
    ],
    isMovingViolation: false
  },

  // ==================== ADDITIONAL HIGH-FREQUENCY CODES (13) ====================
  {
    code: '393.95A',
    description: 'No or discharged fire extinguisher',
    basic: 'vehicle_maintenance',
    severityWeight: 3,
    oosWeight: 0,
    fmcsrSection: '393.95(a)',
    fmcsrText: 'Each power unit must be equipped with a fire extinguisher that is properly filled, securely mounted, and accessible.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Extinguisher gauge was in green zone but inspector questioned charge',
      'Extinguisher was present but mounting bracket was loose',
      'Extinguisher type was adequate but inspector expected different rating'
    ],
    challengeAngles: [
      'Fire extinguisher pressure gauge indicated fully charged at time of inspection',
      'Extinguisher met UL rating requirement of 5 B:C or above',
      'Mounting was secure; bracket looseness did not render extinguisher inaccessible'
    ],
    isMovingViolation: false
  },
  {
    code: '393.60',
    description: 'Glazing - improper window tint or cracked windshield',
    basic: 'vehicle_maintenance',
    severityWeight: 3,
    oosWeight: 0,
    fmcsrSection: '393.60',
    fmcsrText: 'Glazing in use must comply with FMVSS 205 and must not be cracked, discolored, or obstructed to prevent the driver from having a clear view.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Crack was outside the critical viewing area',
      'Tint was factory-installed and met FMVSS 205 requirements',
      'Star chip did not spread into crack pattern'
    ],
    challengeAngles: [
      'Windshield damage was outside the driver primary viewing area per CVSA criteria',
      'Window tint was factory-installed and met FMVSS 205 light transmittance requirements',
      'Crack did not obstruct clear view of road as defined in 393.60(b)'
    ],
    isMovingViolation: false
  },
  {
    code: '392.9A1',
    description: 'Operating a CMV not in safe operating condition',
    basic: 'vehicle_maintenance',
    severityWeight: 5,
    oosWeight: 2,
    fmcsrSection: '392.9(a)(1)',
    fmcsrText: 'No driver shall operate a motor vehicle which is not in safe operating condition or which is not equipped as required.',
    cvsaOosCriteria: 'Vehicle has condition that is likely to cause an accident or breakdown.',
    commonOfficerErrors: [
      'Condition was pre-existing and known but repair was scheduled',
      'General catch-all citation without specific component identified',
      'Cited for condition that does not affect safe operation'
    ],
    challengeAngles: [
      'Vehicle was in safe operating condition; cited defect was cosmetic or non-safety-related',
      'Inspector used general citation without identifying specific unsafe condition',
      'Pre-trip inspection documented no defects; condition developed en route'
    ],
    isMovingViolation: false
  },
  {
    code: '393.28',
    description: 'Wiper - inoperative or missing windshield wipers',
    basic: 'vehicle_maintenance',
    severityWeight: 3,
    oosWeight: 0,
    fmcsrSection: '393.28',
    fmcsrText: 'Each windshield must have a power-driven wiper on the exterior that effectively cleans the windshield.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Wipers were functional but blades showed normal wear',
      'Wiper operated but streaked due to dirty windshield',
      'Cited during dry weather when wipers were not needed for demonstration'
    ],
    challengeAngles: [
      'Wipers were fully operational; blade wear was within acceptable service life',
      'Wiper streaking was due to windshield contamination not wiper malfunction',
      'Both wipers functioned properly when tested after inspection'
    ],
    isMovingViolation: false
  },
  {
    code: '395.3A1',
    description: 'Driving beyond 11-hour driving limit',
    basic: 'hours_of_service',
    severityWeight: 7,
    oosWeight: 2,
    fmcsrSection: '395.3(a)(1)',
    fmcsrText: 'No motor carrier shall permit or require any driver to drive more than 11 cumulative hours following 10 consecutive hours off duty.',
    cvsaOosCriteria: 'Driver has driven or is driving beyond the 11-hour limit.',
    commonOfficerErrors: [
      'Did not account for split sleeper berth provision',
      'Miscalculated driving time from ELD data download',
      'Did not apply adverse driving condition extension'
    ],
    challengeAngles: [
      'Driver was utilizing split sleeper berth provision under 395.1(g)',
      'ELD data when properly calculated shows driving time was within 11-hour limit',
      'Adverse driving conditions exception under 395.1(b)(1) extended driving time by 2 hours'
    ],
    isMovingViolation: false
  },
  {
    code: '395.3B',
    description: 'Driving beyond 60/70 hour limit',
    basic: 'hours_of_service',
    severityWeight: 7,
    oosWeight: 2,
    fmcsrSection: '395.3(b)',
    fmcsrText: 'No motor carrier shall permit or require a driver to drive after having been on duty 60 hours in 7 consecutive days or 70 hours in 8 consecutive days.',
    cvsaOosCriteria: 'Driver exceeds 60/70 hour limit.',
    commonOfficerErrors: [
      'Did not account for 34-hour restart',
      'Miscalculated cumulative hours using wrong day window',
      'Did not verify carrier operating schedule (7 vs 8 day)'
    ],
    challengeAngles: [
      'Driver completed a valid 34-hour restart that reset the cumulative clock',
      'Carrier operates on 8-day/70-hour schedule; inspector calculated using 7-day/60-hour',
      'ELD cumulative hours calculation confirms driver was within limits'
    ],
    isMovingViolation: false
  },
  {
    code: '393.42',
    description: 'No or defective parking brake',
    basic: 'vehicle_maintenance',
    severityWeight: 7,
    oosWeight: 2,
    fmcsrSection: '393.42',
    fmcsrText: 'Every CMV must be equipped with a parking brake adequate to hold the vehicle on any grade.',
    cvsaOosCriteria: 'Parking brake will not hold vehicle stationary on a grade.',
    commonOfficerErrors: [
      'Parking brake tested on steep grade exceeding normal operating conditions',
      'Brake held vehicle but released slowly',
      'Air system was not fully charged before parking brake test'
    ],
    challengeAngles: [
      'Parking brake held vehicle on grade within normal operating conditions',
      'Air system was not fully charged at time of test affecting results',
      'Subsequent testing at certified repair facility confirmed parking brake functionality'
    ],
    isMovingViolation: false
  },
  {
    code: '396.17A',
    description: 'No or expired periodic inspection (annual)',
    basic: 'vehicle_maintenance',
    severityWeight: 3,
    oosWeight: 2,
    fmcsrSection: '396.17(a)',
    fmcsrText: 'Every CMV must have been inspected within the preceding 12 months as part of a periodic (annual) inspection.',
    cvsaOosCriteria: 'Vehicle does not have evidence of a periodic inspection conducted within the last 12 months.',
    commonOfficerErrors: [
      'Inspection sticker was present but inspector could not read date',
      'Vehicle had been recently inspected but sticker fell off',
      'State inspection accepted in lieu of federal annual was not recognized'
    ],
    challengeAngles: [
      'Annual inspection was current; sticker was damaged or illegible but records available',
      'Inspection documentation from qualified inspector confirms inspection was within 12 months',
      'State periodic inspection program accepted under 396.23 was completed timely'
    ],
    isMovingViolation: false
  },
  {
    code: '393.83',
    description: 'Exhaust system location/condition',
    basic: 'vehicle_maintenance',
    severityWeight: 5,
    oosWeight: 0,
    fmcsrSection: '393.83',
    fmcsrText: 'The exhaust system of every motor vehicle must be free from leaks at any point and must discharge exhaust beyond the cab.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Minor surface corrosion cited as exhaust leak',
      'Exhaust discoloration treated as structural defect',
      'Soot deposits around joints treated as active leak'
    ],
    challengeAngles: [
      'Exhaust system had no active leaks; discoloration was cosmetic from normal operation',
      'Soot deposits at joints were from normal condensation not indicating active leak',
      'Post-inspection emissions test confirmed system was sealed and functioning properly'
    ],
    isMovingViolation: false
  },
  {
    code: '393.76',
    description: 'Sleeper berth requirement violation',
    basic: 'vehicle_maintenance',
    severityWeight: 3,
    oosWeight: 0,
    fmcsrSection: '393.76',
    fmcsrText: 'Sleeper berths must meet size, shape, ventilation, protection against exhaust, and access requirements.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Personal items in sleeper treated as non-compliant bedding',
      'Ventilation system was functional but vent position was questioned',
      'Sleeper met all dimensions but inspector measured incorrectly'
    ],
    challengeAngles: [
      'Sleeper berth meets all dimensional and safety requirements per 393.76',
      'Ventilation system was operational and met airflow requirements',
      'Interior dimensions of sleeper berth verified to be within compliance at certified facility'
    ],
    isMovingViolation: false
  },
  {
    code: '382.503',
    description: 'Possession of alcohol while on duty',
    basic: 'controlled_substances',
    severityWeight: 10,
    oosWeight: 2,
    fmcsrSection: '382.503',
    fmcsrText: 'No driver shall be on duty or operate a CMV while the driver possesses alcohol.',
    cvsaOosCriteria: 'Driver found in possession of alcohol while on duty.',
    commonOfficerErrors: [
      'Sealed container in personal belongings or sleeper was not accessible',
      'Product was non-alcoholic beverage with similar packaging',
      'Alcohol belonged to a passenger, not the driver'
    ],
    challengeAngles: [
      'Item was a non-alcoholic beverage; packaging was similar to alcoholic product',
      'Sealed container was in personal storage area of sleeper, not in driver reach',
      'Alcohol belonged to authorized passenger and was not accessible to driver while driving'
    ],
    isMovingViolation: false
  },
  {
    code: '177.800',
    description: 'Hazmat - driver training requirements',
    basic: 'hazmat',
    severityWeight: 7,
    oosWeight: 0,
    fmcsrSection: '177.800',
    fmcsrText: 'A carrier may not transport a hazardous material by motor vehicle unless each person who will operate the vehicle is trained as required.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Training was completed but carrier records were not in vehicle',
      'Driver had general hazmat training but inspector required function-specific documentation',
      'Training was current but certificate did not list specific materials being hauled'
    ],
    challengeAngles: [
      'Driver training records at carrier office confirm all required hazmat training was completed',
      'Training included function-specific components as required by 177.800(b)',
      'Training certificate covers the hazard classes being transported per curriculum documentation'
    ],
    isMovingViolation: false
  },
  {
    code: '393.65',
    description: 'All trucks/tractors must have rear-vision mirrors',
    basic: 'vehicle_maintenance',
    severityWeight: 3,
    oosWeight: 0,
    fmcsrSection: '393.80',
    fmcsrText: 'Every bus, truck, and truck tractor shall be equipped with two rear-vision mirrors, one at each side.',
    cvsaOosCriteria: null,
    commonOfficerErrors: [
      'Mirror was present but vibration caused slight misalignment',
      'Minor crack in mirror housing did not affect reflective surface',
      'Convex mirror was intact but flat mirror had small blemish'
    ],
    challengeAngles: [
      'Both mirrors were present and provided adequate rear vision as required',
      'Mirror housing damage was cosmetic and did not impair reflective surface visibility',
      'Driver demonstrated adequate rear visibility using both mirrors at roadside'
    ],
    isMovingViolation: false
  }
];
