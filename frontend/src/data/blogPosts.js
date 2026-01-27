// Blog Data - Extracted from Blog.jsx

export const categories = [
  { id: 'all', label: 'All Posts' },
  { id: 'regulations', label: 'Regulations' },
  { id: 'safety', label: 'Safety Tips' },
  { id: 'case-studies', label: 'Case Studies' },
  { id: 'updates', label: 'Product Updates' },
];

export const featuredArticle = {
  id: 0,
  slug: 'eld-mandate-2026',
  category: 'regulations',
  date: 'Oct 24, 2025',
  title: 'Navigating the 2026 ELD Mandate Updates',
  description: 'The FMCSA has proposed new technical specifications for Electronic Logging Devices. Here is what every safety director needs to know to stay compliant.',
  tag: 'Featured',
  readTime: '8 min read',
  image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=600&fit=crop',
  content: `
    <p class="text-lg text-[#475569] mb-6">The Federal Motor Carrier Safety Administration (FMCSA) has announced significant updates to the Electronic Logging Device (ELD) mandate, set to take effect in 2026. These changes aim to enhance data accuracy, improve cybersecurity, and streamline compliance processes for motor carriers.</p>

    <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Key Changes in the 2026 Update</h2>

    <p class="text-[#475569] mb-4">The proposed rule introduces several critical modifications that every fleet manager and safety director should understand:</p>

    <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
      <li><strong class="text-[#1E3A5F]">Enhanced Data Transfer Protocol:</strong> ELDs must now support real-time data transmission to enforcement officers via secure API connections.</li>
      <li><strong class="text-[#1E3A5F]">Cybersecurity Requirements:</strong> All devices must meet NIST cybersecurity framework standards, including encrypted data storage and transmission.</li>
      <li><strong class="text-[#1E3A5F]">GPS Accuracy Standards:</strong> Location data must be accurate within 50 meters, down from the current 100-meter threshold.</li>
      <li><strong class="text-[#1E3A5F]">Driver Authentication:</strong> Multi-factor authentication will be required for driver login to prevent record falsification.</li>
    </ul>

    <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Timeline for Compliance</h2>

    <p class="text-[#475569] mb-4">The FMCSA has outlined a phased implementation approach:</p>

    <div class="bg-[#F1F5F9] rounded-xl p-6 mb-6 border border-[#E2E8F0]">
      <div class="space-y-4">
        <div class="flex items-start gap-4">
          <span class="text-[#F97316] font-mono font-bold">Q1 2026</span>
          <span class="text-[#475569]">Final rule publication and manufacturer certification begins</span>
        </div>
        <div class="flex items-start gap-4">
          <span class="text-[#F97316] font-mono font-bold">Q3 2026</span>
          <span class="text-[#475569]">New device installations must comply with updated standards</span>
        </div>
        <div class="flex items-start gap-4">
          <span class="text-[#F97316] font-mono font-bold">Q1 2027</span>
          <span class="text-[#475569]">All existing devices must be upgraded or replaced</span>
        </div>
      </div>
    </div>

    <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">What This Means for Your Fleet</h2>

    <p class="text-[#475569] mb-4">Carriers should begin planning now to ensure a smooth transition. Key action items include:</p>

    <ol class="list-decimal list-inside text-[#475569] mb-6 space-y-2">
      <li>Contact your ELD provider to understand their upgrade timeline</li>
      <li>Budget for potential device replacements or software updates</li>
      <li>Train drivers on new authentication procedures</li>
      <li>Review your data retention policies to meet new requirements</li>
    </ol>

    <p class="text-[#475569]">VroomX Safety is committed to keeping you informed as these regulations develop. Our platform will automatically update to reflect any changes in compliance requirements, ensuring your fleet stays ahead of the curve.</p>
  `
};

export const articles = [
  {
    id: 1,
    slug: 'air-mile-radius-exemptions',
    category: 'regulations',
    date: 'Oct 12, 2025',
    title: 'Exemptions Explained: 100 vs 150 Air-Mile Radius',
    description: 'Clarifying the confusion around short-haul exemptions and time records.',
    tag: 'Regulation',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop',
    content: `
      <p class="text-lg text-[#475569] mb-6">One of the most misunderstood areas of Hours of Service regulations is the short-haul exemption. Many carriers incorrectly assume they qualify, leading to violations during roadside inspections.</p>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">The 100 Air-Mile Radius Exemption</h2>

      <p class="text-[#475569] mb-4">Under 49 CFR §395.1(e)(1), drivers operating within a 100 air-mile radius may use time records instead of maintaining a full Record of Duty Status (RODS) if they meet ALL of the following conditions:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li>Operate within a 100 air-mile radius of their normal work reporting location</li>
        <li>Return to the work reporting location and are released within 12 consecutive hours</li>
        <li>Have at least 10 consecutive hours off duty before returning to duty</li>
        <li>Do not exceed 11 hours driving following 10 consecutive hours off duty</li>
      </ul>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">The 150 Air-Mile Radius Exemption</h2>

      <p class="text-[#475569] mb-4">The 150 air-mile radius exemption under §395.1(e)(2) applies to drivers of property-carrying vehicles who:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li>Operate within a 150 air-mile radius of their work reporting location</li>
        <li>Return to the work reporting location within 14 consecutive hours</li>
        <li>Do not drive after the 14th hour</li>
        <li>Are released within 14 hours from coming on duty</li>
      </ul>

      <div class="bg-[#EFF6FF] border border-[#1E3A5F]/30 rounded-xl p-6 mb-6">
        <h3 class="text-lg font-bold text-[#1E3A5F] mb-2">Important Note</h3>
        <p class="text-[#475569]">Air miles are not the same as road miles. 100 air miles equals approximately 115 road miles. Always calculate using air-mile distances to ensure compliance.</p>
      </div>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Common Mistakes to Avoid</h2>

      <ol class="list-decimal list-inside text-[#475569] mb-6 space-y-2">
        <li><strong class="text-[#1E3A5F]">Exceeding the radius:</strong> Even one trip outside the radius disqualifies the exemption for that day</li>
        <li><strong class="text-[#1E3A5F]">Poor time record documentation:</strong> Time records must show start time, end time, and total hours</li>
        <li><strong class="text-[#1E3A5F]">Not returning to work location:</strong> Drivers must physically return, not just end their shift</li>
      </ol>
    `
  },
  {
    id: 2,
    slug: 'conditional-rating-costs',
    category: 'safety',
    date: 'Sep 28, 2025',
    title: 'The Real Cost of a "Conditional" Rating',
    description: 'How your safety rating impacts insurance premiums and broker relationships.',
    tag: 'Safety',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=800&h=600&fit=crop',
    content: `
      <p class="text-lg text-[#475569] mb-6">A "Conditional" safety rating might seem like just a warning, but the financial and operational impacts can be devastating. Understanding these costs is crucial for prioritizing compliance efforts.</p>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Insurance Premium Increases</h2>

      <p class="text-[#475569] mb-4">Insurance companies view safety ratings as primary risk indicators. A Conditional rating typically results in:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li><strong class="text-[#1E3A5F]">20-40% premium increases</strong> upon renewal</li>
        <li>Some insurers may refuse to renew coverage entirely</li>
        <li>Higher deductibles required for the same coverage levels</li>
        <li>Loss of preferred pricing programs</li>
      </ul>

      <div class="bg-[#F1F5F9] rounded-xl p-6 mb-6 border border-[#E2E8F0]">
        <h3 class="text-lg font-bold text-[#1E3A5F] mb-4">Cost Example: 50-Truck Fleet</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-[#94A3B8]">Satisfactory Rating Premium:</span>
            <span class="text-[#1E3A5F] font-bold block">$450,000/year</span>
          </div>
          <div>
            <span class="text-[#94A3B8]">Conditional Rating Premium:</span>
            <span class="text-danger-500 font-bold block">$585,000/year</span>
          </div>
          <div class="col-span-2 pt-4 border-t border-[#E2E8F0]">
            <span class="text-[#94A3B8]">Annual Cost Increase:</span>
            <span class="text-danger-500 font-bold text-xl block">$135,000</span>
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Lost Business Opportunities</h2>

      <p class="text-[#475569] mb-4">Many shippers and brokers have strict carrier qualification requirements:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li>Major retailers often require "Satisfactory" ratings</li>
        <li>Freight brokers may remove you from preferred carrier lists</li>
        <li>Government contracts typically require satisfactory ratings</li>
        <li>Some shippers conduct quarterly reviews and may terminate contracts</li>
      </ul>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Path to Recovery</h2>

      <p class="text-[#475569] mb-4">The FMCSA allows carriers to request a new rating review after correcting deficiencies. Key steps include:</p>

      <ol class="list-decimal list-inside text-[#475569] mb-6 space-y-2">
        <li>Address all acute and critical violations identified in the review</li>
        <li>Implement documented corrective action plans</li>
        <li>Request a safety rating upgrade through FMCSA portal</li>
        <li>Prepare for a potential follow-up compliance review</li>
      </ol>
    `
  },
  {
    id: 3,
    slug: 'digitizing-dq-files',
    category: 'updates',
    date: 'Sep 15, 2025',
    title: 'Digitizing Driver Qualification Files',
    description: 'Why sticking to paper filings is costing you more than just storage space.',
    tag: 'Tech',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop',
    content: `
      <p class="text-lg text-[#475569] mb-6">In an era where compliance reviews can be conducted remotely, maintaining paper-based Driver Qualification files creates unnecessary risk and inefficiency.</p>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">The Hidden Costs of Paper</h2>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li><strong class="text-[#1E3A5F]">Storage expenses:</strong> Filing cabinets, office space, and off-site storage add up quickly</li>
        <li><strong class="text-[#1E3A5F]">Retrieval time:</strong> Finding specific documents can take 15-30 minutes per request</li>
        <li><strong class="text-[#1E3A5F]">Document degradation:</strong> Paper deteriorates, fades, and can be damaged by water or fire</li>
        <li><strong class="text-[#1E3A5F]">Compliance gaps:</strong> Manual tracking of expirations leads to missed renewals</li>
      </ul>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Benefits of Digital DQ Files</h2>

      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div class="bg-[#F0FDF4] rounded-xl p-4 border border-[#22C55E]/20">
          <h3 class="text-[#22C55E] font-bold mb-2">Instant Access</h3>
          <p class="text-[#475569] text-sm">Find any document in seconds, from anywhere</p>
        </div>
        <div class="bg-[#F0FDF4] rounded-xl p-4 border border-[#22C55E]/20">
          <h3 class="text-[#22C55E] font-bold mb-2">Automated Alerts</h3>
          <p class="text-[#475569] text-sm">Never miss a CDL or medical card expiration</p>
        </div>
        <div class="bg-[#F0FDF4] rounded-xl p-4 border border-[#22C55E]/20">
          <h3 class="text-[#22C55E] font-bold mb-2">Audit Ready</h3>
          <p class="text-[#475569] text-sm">Generate complete driver files in one click</p>
        </div>
        <div class="bg-[#F0FDF4] rounded-xl p-4 border border-[#22C55E]/20">
          <h3 class="text-[#22C55E] font-bold mb-2">Secure Backup</h3>
          <p class="text-[#475569] text-sm">Cloud storage with redundant backups</p>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Required DQ File Documents</h2>

      <p class="text-[#475569] mb-4">Under 49 CFR Part 391, each driver qualification file must contain:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li>Driver's application for employment</li>
        <li>Motor vehicle record (MVR) from each state</li>
        <li>Road test certificate or equivalent</li>
        <li>Medical examiner's certificate</li>
        <li>Annual review of driving record</li>
        <li>Previous employer verification (3 years)</li>
        <li>Drug and alcohol testing records</li>
      </ul>
    `
  },
  {
    id: 4,
    slug: 'remote-audit-preparation',
    category: 'regulations',
    date: 'Aug 30, 2025',
    title: 'Preparing for a Remote Audit',
    description: 'Step-by-step checklist to ensure your digital records pass inspection.',
    tag: 'Audit',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
    content: `
      <p class="text-lg text-[#475569] mb-6">Remote compliance reviews have become standard practice since the FMCSA modernized its audit procedures. Being prepared for a virtual inspection is now just as important as an on-site review.</p>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Pre-Audit Checklist</h2>

      <div class="space-y-3 mb-6">
        <div class="flex items-start gap-3 p-3 bg-[#F1F5F9] rounded-lg">
          <div class="w-6 h-6 rounded bg-[#1E3A5F]/10 flex items-center justify-center text-[#1E3A5F] text-sm font-bold">1</div>
          <div>
            <span class="text-[#1E3A5F] font-medium">Verify all driver files are complete</span>
            <p class="text-[#94A3B8] text-sm">Check for missing documents, expired certifications, and unsigned forms</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3 bg-[#F1F5F9] rounded-lg">
          <div class="w-6 h-6 rounded bg-[#1E3A5F]/10 flex items-center justify-center text-[#1E3A5F] text-sm font-bold">2</div>
          <div>
            <span class="text-[#1E3A5F] font-medium">Organize vehicle maintenance records</span>
            <p class="text-[#94A3B8] text-sm">Annual inspections, DVIR logs, and scheduled maintenance documentation</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3 bg-[#F1F5F9] rounded-lg">
          <div class="w-6 h-6 rounded bg-[#1E3A5F]/10 flex items-center justify-center text-[#1E3A5F] text-sm font-bold">3</div>
          <div>
            <span class="text-[#1E3A5F] font-medium">Prepare Hours of Service records</span>
            <p class="text-[#94A3B8] text-sm">ELD data, supporting documents, and driver logs for the review period</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3 bg-[#F1F5F9] rounded-lg">
          <div class="w-6 h-6 rounded bg-[#1E3A5F]/10 flex items-center justify-center text-[#1E3A5F] text-sm font-bold">4</div>
          <div>
            <span class="text-[#1E3A5F] font-medium">Review drug and alcohol testing program</span>
            <p class="text-[#94A3B8] text-sm">Random testing rates, MRO documentation, and Clearinghouse queries</p>
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Technical Requirements</h2>

      <p class="text-[#475569] mb-4">For a successful remote audit, ensure you have:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li>Stable internet connection for video conferencing</li>
        <li>Screen sharing capability to display documents</li>
        <li>Digital copies of all records in searchable PDF format</li>
        <li>Quiet, private space for the review session</li>
      </ul>

      <div class="bg-[#FEF9C3] border border-[#EAB308]/30 rounded-xl p-6 mb-6">
        <h3 class="text-lg font-bold text-[#A16207] mb-2">Pro Tip</h3>
        <p class="text-[#475569]">Conduct a mock audit with your team before the scheduled review. This helps identify gaps and ensures everyone knows how to locate requested documents quickly.</p>
      </div>
    `
  },
  {
    id: 5,
    slug: 'retaining-top-talent',
    category: 'safety',
    date: 'Aug 12, 2025',
    title: 'Retaining Top Talent in Tough Times',
    description: 'Strategies for keeping your best drivers happy and compliant.',
    tag: 'Career',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop',
    content: `
      <p class="text-lg text-[#475569] mb-6">Driver turnover remains one of the trucking industry's biggest challenges, with annual rates exceeding 90% at many carriers. Retaining experienced, safety-conscious drivers directly impacts your compliance scores and bottom line.</p>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">The Cost of Driver Turnover</h2>

      <p class="text-[#475569] mb-4">Replacing a single driver can cost between $5,000 and $10,000 when you factor in:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li>Recruiting and advertising expenses</li>
        <li>Background checks and drug testing</li>
        <li>Training and orientation time</li>
        <li>Lost productivity during the transition</li>
        <li>Increased accident risk with new drivers</li>
      </ul>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Retention Strategies That Work</h2>

      <div class="space-y-4 mb-6">
        <div class="bg-[#F1F5F9] rounded-xl p-5 border border-[#E2E8F0]">
          <h3 class="text-[#1E3A5F] font-bold mb-2">Competitive Compensation</h3>
          <p class="text-[#475569]">Regular pay reviews, performance bonuses, and transparent pay structures help drivers feel valued.</p>
        </div>
        <div class="bg-[#F1F5F9] rounded-xl p-5 border border-[#E2E8F0]">
          <h3 class="text-[#1E3A5F] font-bold mb-2">Quality Home Time</h3>
          <p class="text-[#475569]">Predictable schedules and genuine commitment to getting drivers home when promised builds trust.</p>
        </div>
        <div class="bg-[#F1F5F9] rounded-xl p-5 border border-[#E2E8F0]">
          <h3 class="text-[#1E3A5F] font-bold mb-2">Modern Equipment</h3>
          <p class="text-[#475569]">Well-maintained trucks with current technology show investment in driver comfort and safety.</p>
        </div>
        <div class="bg-[#F1F5F9] rounded-xl p-5 border border-[#E2E8F0]">
          <h3 class="text-[#1E3A5F] font-bold mb-2">Recognition Programs</h3>
          <p class="text-[#475569]">Safety awards, milestone celebrations, and public acknowledgment of achievements boost morale.</p>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">The Compliance Connection</h2>

      <p class="text-[#475569] mb-4">Experienced drivers are your best compliance asset. They understand regulations, maintain better logs, and have fewer accidents. Investing in retention is investing in your safety scores.</p>
    `
  },
  {
    id: 6,
    slug: 'ai-fleet-management',
    category: 'updates',
    date: 'Jul 22, 2025',
    title: 'AI in Fleet Management',
    description: 'How artificial intelligence is changing the way we handle compliance and routing.',
    tag: 'Tech',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop',
    content: `
      <p class="text-lg text-[#475569] mb-6">Artificial intelligence is revolutionizing fleet management, from predictive maintenance to automated compliance monitoring. Understanding these technologies helps carriers stay competitive.</p>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">AI-Powered Compliance Monitoring</h2>

      <p class="text-[#475569] mb-4">Modern AI systems can continuously analyze your fleet data to:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li><strong class="text-[#1E3A5F]">Predict violations:</strong> Identify patterns that typically lead to compliance issues</li>
        <li><strong class="text-[#1E3A5F]">Monitor HOS in real-time:</strong> Alert dispatchers before drivers exceed limits</li>
        <li><strong class="text-[#1E3A5F]">Track document expirations:</strong> Automated reminders for renewals</li>
        <li><strong class="text-[#1E3A5F]">Analyze inspection trends:</strong> Pinpoint recurring maintenance issues</li>
      </ul>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Smart Route Optimization</h2>

      <p class="text-[#475569] mb-4">AI routing goes beyond simple GPS navigation:</p>

      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div class="bg-[#EFF6FF] rounded-xl p-4 border border-[#3B82F6]/20">
          <h3 class="text-[#3B82F6] font-bold mb-2">Weather Integration</h3>
          <p class="text-[#475569] text-sm">Automatically adjusts routes based on severe weather forecasts</p>
        </div>
        <div class="bg-[#EFF6FF] rounded-xl p-4 border border-[#3B82F6]/20">
          <h3 class="text-[#3B82F6] font-bold mb-2">Traffic Prediction</h3>
          <p class="text-[#475569] text-sm">Uses historical data to anticipate congestion before it happens</p>
        </div>
        <div class="bg-[#EFF6FF] rounded-xl p-4 border border-[#3B82F6]/20">
          <h3 class="text-[#3B82F6] font-bold mb-2">HOS Compliance</h3>
          <p class="text-[#475569] text-sm">Factors in required breaks and drive time limits</p>
        </div>
        <div class="bg-[#EFF6FF] rounded-xl p-4 border border-[#3B82F6]/20">
          <h3 class="text-[#3B82F6] font-bold mb-2">Fuel Optimization</h3>
          <p class="text-[#475569] text-sm">Considers fuel prices along the route for cost savings</p>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">The Future of Fleet AI</h2>

      <p class="text-[#475569] mb-4">Emerging technologies on the horizon include:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li>Natural language interfaces for compliance questions</li>
        <li>Automated DataQ challenge preparation</li>
        <li>Predictive safety scoring before inspections</li>
        <li>Computer vision for pre-trip inspection assistance</li>
      </ul>

      <p class="text-[#475569]">VroomX Safety integrates AI throughout our platform, helping you stay ahead of compliance requirements while reducing manual workload.</p>
    `
  },
];
