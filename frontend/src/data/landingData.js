// Landing Page Data - Extracted from Landing.jsx for maintainability

export const heroTexts = ['TRACK EXPIRATIONS.', 'FEAR AUDITS.', 'FILE PAPERWORK.', 'FIGHT THE FMCSA.'];

export const chatQA = [
  {
    question: "Do I need an ELD under 100 miles?",
    answer: {
      intro: "If you meet the <span class='text-white font-semibold'>short-haul exemption</span> under <span class='text-primary-400 font-mono text-xs bg-primary-500/10 px-1 py-0.5 rounded border border-primary-500/20'>49 CFR §395.1(e)</span>, you are exempt from ELD use as long as:",
      bullets: [
        "You operate within a 150 air-mile radius",
        "You return to the work reporting location each day",
        "You drive no more than 11 hours"
      ],
      source: "FMCSA Rules & Regulations"
    }
  },
  {
    question: "When does my medical card expire?",
    answer: {
      intro: "Medical certificates are valid for <span class='text-white font-semibold'>up to 24 months</span>. However, certain conditions may require more frequent certification:",
      bullets: [
        "High blood pressure may require annual recertification",
        "Diabetes requiring insulin requires annual exams",
        "Vision waivers must be renewed annually"
      ],
      source: "49 CFR §391.45"
    }
  },
  {
    question: "How long are violations on my CSA (Compliance, Safety, Accountability) score?",
    answer: {
      intro: "Roadside inspection results and violations remain in your <span class='text-white font-semibold'>SMS BASICs (Behavior Analysis and Safety Improvement Categories)</span> for:",
      bullets: [
        "24 months from the inspection date",
        "Older violations carry less weight (time-weighting)",
        "Crash results stay for 24 months as well"
      ],
      source: "FMCSA SMS Methodology"
    }
  },
  {
    question: "What triggers a DOT audit?",
    answer: {
      intro: "FMCSA may schedule an <span class='text-white font-semibold'>intervention</span> based on:",
      bullets: [
        "High BASIC percentiles (above thresholds)",
        "Complaints filed against your carrier",
        "Serious crashes or fatalities",
        "Random New Entrant Safety Audits"
      ],
      source: "FMCSA Compliance & Enforcement"
    }
  }
];

export const valueProps = [
  {
    stat: '$16,340',
    label: 'Average fine for one expired medical card',
    source: 'FMCSA Penalty Schedule'
  },
  {
    stat: '24 months',
    label: 'How long violations stay on your CSA score',
    source: 'FMCSA SMS Methodology'
  },
  {
    stat: '5 minutes',
    label: 'Time to set up VroomX and sync your FMCSA data',
    source: 'VroomX Average'
  },
  {
    stat: '7 BASICs',
    label: 'All SMS categories monitored in real-time',
    source: 'Complete FMCSA Coverage'
  },
  {
    stat: '40%',
    label: 'Average DataQ challenge success rate',
    source: 'Industry Average'
  },
  {
    stat: '$29/mo',
    label: 'Starting price for full compliance protection',
    source: 'Owner-Operator Plan'
  }
];

// Backward compatibility alias
export { valueProps as testimonials };

export const blogPosts = [
  {
    category: 'Regulation',
    date: 'Oct 12, 2025',
    title: '2026 FMCSA Proposed Rule Changes',
    excerpt: "New proposals for electronic IDs on CMVs and what it means for your fleet's privacy.",
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop'
  },
  {
    category: 'Tech',
    date: 'Sep 28, 2025',
    title: 'Digitizing Driver Qualification Files',
    excerpt: 'Why sticking to paper filings is costing you more than just storage space.',
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&h=400&fit=crop'
  },
  {
    category: 'Safety',
    date: 'Sep 15, 2025',
    title: 'Preparing for a Remote Audit',
    excerpt: 'Step-by-step checklist to ensure your digital records pass inspection.',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&h=400&fit=crop'
  }
];

export const faqData = [
  {
    question: "How is VroomX different from telematics platforms?",
    answer: "Telematics platforms do fleet tracking, ELDs, dashcams, and dozens of other things — with compliance features bolted on. We ONLY do document compliance: DQF (Driver Qualification Files) files, expiration tracking, CSA monitoring, and audit prep. If you already have an ELD you like, you don't need to replace it. We work alongside it. If you're paying $30-50/truck/month and only using the compliance features, you're overpaying."
  },
  {
    question: "Do I need to switch from my current ELD?",
    answer: "Nope. We're not an ELD. We're not trying to replace your telematics. Think of us as your compliance filing cabinet in the cloud. Your ELD tracks hours. We track documents. They work great together."
  },
  {
    question: "How does the free trial work?",
    answer: "Start your 7-day free trial with no credit card required. You get full access to every feature in VroomX. Pick the plan that fits your fleet — Owner-Operator at $29/mo, Small Fleet at $79/mo, or Fleet Pro at $149/mo. If you love it, your subscription starts automatically. If not, your account pauses — no charges, no hassle."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use 256-bit AES encryption for stored data and SSL/TLS encryption for all data transfers. Your information is stored on secure servers with daily backups. We never sell or share your data with third parties."
  },
  {
    question: "What plans do you offer?",
    answer: "We have three plans to fit any fleet size. Owner-Operator ($29/mo) covers 1 driver — perfect for independent operators. Small Fleet ($79/mo) includes 5 drivers for growing operations. Fleet Pro ($149/mo) includes 15 drivers for larger fleets. All plans include every feature. Save even more with annual billing."
  },
  {
    question: "What happens if I add more drivers?",
    answer: "Each plan includes a set number of drivers — 1 for Owner-Operator, 5 for Small Fleet, and 15 for Fleet Pro. If you need more drivers, you can upgrade to the next tier at any time. All plans include every compliance feature."
  },
  {
    question: "How accurate is the CSA score checker?",
    answer: "Our CSA checker pulls data directly from the FMCSA SMS database, the same source enforcement officers use. We update scores weekly and provide 24-month historical tracking for all 7 BASICs."
  }
];

export const pricingPlans = [
  {
    name: 'Owner-Operator',
    planId: 'owner_operator',
    price: 29,
    annualPrice: 261,
    drivers: '1 driver',
    popular: false,
    features: [
      'Full DQF Management',
      'AI Regulation Assistant',
      'CSA Score Tracking',
      'Document Expiry Alerts',
      'DataQ AI Analysis',
      'DataQ Draft Generator',
      'Custom Reports',
      'Email Support'
    ]
  },
  {
    name: 'Small Fleet',
    planId: 'small_fleet',
    price: 79,
    annualPrice: 711,
    drivers: '5 drivers included',
    popular: true,
    features: [
      'Full DQF Management',
      'AI Regulation Assistant',
      'CSA Score Tracking',
      'Document Expiry Alerts',
      'DataQ AI Analysis',
      'DataQ Draft Generator',
      'Multi-user Access',
      'Advanced CSA Analytics',
      'Custom Reports',
      'Priority Email Support'
    ]
  },
  {
    name: 'Fleet Pro',
    planId: 'fleet_pro',
    price: 149,
    annualPrice: 1341,
    drivers: '15 drivers included',
    popular: false,
    features: [
      'Full DQF Management',
      'AI Regulation Assistant',
      'CSA Score Tracking',
      'Document Expiry Alerts',
      'DataQ AI Analysis',
      'DataQ Draft Generator',
      'Multi-user Access',
      'Advanced CSA Analytics',
      'Custom Reports',
      'Priority Email Support',
      'Dedicated Account Manager'
    ]
  }
];

// Legacy export for backward compatibility (used by Pricing.jsx)
export const pricingPlan = {
  name: 'VroomX Complete',
  price: 29,
  trialDays: 7,
  anchorPrice: 468,
  features: [
    '1 Driver (Owner-Operator)',
    'Full DQF Management',
    'AI Regulation Assistant',
    'CSA Score Tracking',
    'Document Expiry Alerts',
    'DataQ AI Analysis',
    'DataQ Draft Generator',
    'Multi-user Access',
    'Advanced CSA Analytics',
    'Custom Reports',
    'Priority Email Support'
  ]
};

export const comparisonFeatures = [
  { feature: 'CSA Score Tracking', vroomx: true, spreadsheets: false, other: 'limited' },
  { feature: 'AI Regulation Assistant', vroomx: true, spreadsheets: false, other: false },
  { feature: 'Automatic Expiry Alerts', vroomx: true, spreadsheets: false, other: true },
  { feature: 'DataQ Challenge Support', vroomx: true, spreadsheets: false, other: false },
  { feature: 'Mobile Access', vroomx: true, spreadsheets: 'limited', other: true },
  { feature: 'FMCSA Data Integration', vroomx: true, spreadsheets: false, other: 'limited' },
  { feature: 'Setup Time', vroomx: '10 min', spreadsheets: 'Hours', other: '1-2 days' },
  { feature: 'Starting Price', vroomx: 'From $29/mo', spreadsheets: 'Free*', other: '$50+/mo' },
];

export const features = [
  {
    icon: 'FiUsers',
    title: 'Driver Qualification',
    description: 'Automated DQF management with smart alerts for CDL, Medical Cards, and MVRs. Never miss a deadline again.',
    tags: ['Expirations', 'MVRs', 'Clearinghouse']
  },
  {
    icon: 'FiTruck',
    title: 'Vehicle Compliance',
    description: '49 CFR (Federal Motor Carrier Safety Regulations) Part 396 vehicle tracking with annual inspection scheduling and maintenance logs.',
    tags: ['Inspections', 'Maintenance']
  },
  {
    icon: 'FiBarChart2',
    title: 'SMS BASICs Monitoring',
    description: 'Track all 6 BASIC categories with percentile visualization and threshold alerts.',
    tags: ['Percentiles', 'Thresholds']
  },
  {
    icon: 'FiAlertTriangle',
    title: 'Violation & DataQ',
    description: 'Track roadside inspections and violations with DataQ challenge submission support.',
    tags: ['Violations', 'Challenges']
  },
  {
    icon: 'FiDroplet',
    title: 'Drug & Alcohol Program',
    description: '49 CFR 382 compliance with random pool management and Clearinghouse integration.',
    tags: ['Testing', 'Pool Mgmt']
  },
  {
    icon: 'FiClipboard',
    title: 'Audit Readiness',
    description: 'Mock audit checklist and one-click PDF reports for instant compliance verification.',
    tags: ['Reports', 'Checklists']
  }
];

export const statsBar = [
  { value: '6+', label: 'SMS BASICs Tracked' },
  { value: '49 CFR', label: 'Compliance Built-In' },
  { value: '30/14/7', label: 'Day Expiration Alerts' },
  { value: 'DataQ', label: 'Challenge Support' }
];

export const trustBadges = [
  { icon: 'FiLock', title: 'SSL Secure', subtitle: '256-bit encryption', color: 'success' },
  { icon: 'FiDatabase', title: 'FMCSA Data', subtitle: 'Official SMS source', color: 'primary' },
  { icon: 'FiAward', title: 'Bank-Level Security', subtitle: 'AES-256 at rest, TLS in transit', color: 'cta' },
  { icon: 'FiHeadphones', title: 'US Support', subtitle: 'Real humans, fast', color: 'purple' }
];

export const problemItems = [
  { icon: 'FiAlertTriangle', title: 'Missed Expirations', desc: 'Medical cards and CDLs expiring without notice cost thousands in fines.', color: 'red' },
  { icon: 'FiBarChart2', title: 'Rising BASICs', desc: 'One bad inspection can ruin your safety score for 24 months.', color: 'amber' },
  { icon: 'FiFileText', title: 'Scattered Docs', desc: 'Driver files in one place, maintenance in another. Audit chaos.', color: 'primary' },
  { icon: 'FiClipboard', title: 'Unfiled DataQs', desc: 'Wrong violations staying on your record because challenges are hard.', color: 'purple' }
];

export const aiQuestions = [
  { q: 'What triggers a post-accident drug test?', icon: 'FiDroplet' },
  { q: 'How long do violations stay on my CSA score?', icon: 'FiBarChart2' },
  { q: 'When is a medical card required?', icon: 'FiFileText' }
];
