// Landing Page Data - Extracted from Landing.jsx for maintainability

export const heroTexts = ['ZERO STRESS.', 'NO MESS.'];

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
    question: "How long are violations on my CSA score?",
    answer: {
      intro: "Roadside inspection results and violations remain in your <span class='text-white font-semibold'>SMS BASICs</span> for:",
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

export const testimonials = [
  {
    quote: 'We went from missing expirations every month to <span class="text-primary-500 font-bold">zero compliance violations</span> in the past year. The SMS BASICs tracking alone has saved us from an intervention.',
    name: 'Sarah Jenkins',
    role: 'Safety Director',
    fleet: '45 Trucks',
    featured: true,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face'
  },
  {
    quote: 'The DQF management is a lifesaver. I used to spend hours auditing files manually. Now I just check the dashboard once a week.',
    name: 'Mike Ross',
    role: 'Owner Operator',
    fleet: '3 Trucks',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    quote: "Finally, software that feels modern. It's fast, looks great, and actually makes sense. My drivers even use the portal without complaining.",
    name: 'David Chen',
    role: 'Fleet Mgr',
    fleet: '120 Trucks',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    quote: 'Audit readiness reports are worth the subscription alone. We passed our New Entrant Audit with zero issues thanks to the checklists.',
    name: 'Elena Rodriguez',
    role: 'Compliance Officer',
    fleet: '',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  },
  {
    quote: 'I was skeptical about the AI alerts, but they actually predicted a maintenance issue before it became a violation. Impressive tech.',
    name: 'Marcus Johnson',
    role: 'Ops Director',
    fleet: '85 Trucks',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
  }
];

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
    question: "How does the free trial work?",
    answer: "Start your 3-day free trial with no credit card required. You get full access to all features in your chosen plan. If you love it, simply add your payment method to continue. If not, your account automatically pauses—no charges, no hassle."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use bank-level 256-bit SSL encryption for all data transfers. Your information is stored on SOC2-compliant servers with daily backups. We never sell or share your data with third parties."
  },
  {
    question: "Can I switch plans later?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, the change takes effect at your next billing cycle."
  },
  {
    question: "What happens if I add more drivers?",
    answer: "Our pricing scales with your fleet. Solo plan includes 1 driver, Fleet includes 3 drivers (+$6/driver after), and Pro includes 10 drivers (+$5/driver after). You can add or remove drivers anytime from your dashboard."
  },
  {
    question: "Do you integrate with ELD providers?",
    answer: "Yes, we integrate with most major ELD providers including KeepTruckin, Samsara, and Omnitracs. This allows automatic Hours of Service data sync and violation monitoring."
  },
  {
    question: "How accurate is the CSA score checker?",
    answer: "Our CSA checker pulls data directly from the FMCSA SMS database, the same source enforcement officers use. We update scores weekly and provide 24-month historical tracking for all 7 BASICs."
  }
];

export const pricingPlans = [
  {
    name: 'Solo',
    subtitle: 'For Owner-Operators',
    monthlyPrice: 19,
    annualPrice: 15,
    drivers: '1 driver included',
    features: [
      'Full DQF Management',
      'AI Regulation Assistant',
      'CSA Score Tracking',
      'Document Expiry Alerts',
      '100 AI queries/month'
    ],
    popular: false,
    color: 'primary',
    hasTrial: false
  },
  {
    name: 'Fleet',
    subtitle: 'For Small Fleets (2-10 drivers)',
    monthlyPrice: 39,
    annualPrice: 31,
    drivers: '3 drivers included',
    extraDriver: '+$6/driver after 3',
    features: [
      'Everything in Solo',
      '3 drivers included',
      'Up to 3 Companies',
      'AI Violation Reader',
      'DataQ Draft Generator',
      'Multi-user Access',
      'Priority Support'
    ],
    popular: true,
    color: 'cta',
    hasTrial: true
  },
  {
    name: 'Pro',
    subtitle: 'For Growing Fleets (10-50 drivers)',
    monthlyPrice: 89,
    annualPrice: 71,
    drivers: '10 drivers included',
    extraDriver: '+$5/driver after 10',
    features: [
      'Everything in Fleet',
      '10 drivers included',
      'Up to 10 Companies',
      'Advanced CSA Analytics',
      'Custom Reports & API Access',
      'Dedicated Support'
    ],
    popular: false,
    color: 'primary',
    hasTrial: true
  }
];

export const comparisonFeatures = [
  { feature: 'CSA Score Tracking', vroomx: true, spreadsheets: false, other: 'limited' },
  { feature: 'AI Regulation Assistant', vroomx: true, spreadsheets: false, other: false },
  { feature: 'Automatic Expiry Alerts', vroomx: true, spreadsheets: false, other: true },
  { feature: 'DataQ Challenge Support', vroomx: true, spreadsheets: false, other: false },
  { feature: 'Mobile Access', vroomx: true, spreadsheets: 'limited', other: true },
  { feature: 'FMCSA Data Integration', vroomx: true, spreadsheets: false, other: 'limited' },
  { feature: 'Setup Time', vroomx: '10 min', spreadsheets: 'Hours', other: '1-2 days' },
  { feature: 'Starting Price', vroomx: '$19/mo', spreadsheets: 'Free*', other: '$50+/mo' },
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
    description: '49 CFR 396 vehicle tracking with annual inspection scheduling and maintenance logs.',
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
  { icon: 'FiAward', title: 'SOC2 Compliant', subtitle: 'Enterprise security', color: 'cta' },
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
