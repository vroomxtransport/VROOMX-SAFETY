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
  {
    id: 7,
    slug: 'pre-trip-inspection-best-practices',
    category: 'safety',
    date: 'Jul 10, 2025',
    title: 'Pre-Trip Inspection Best Practices',
    description: 'Master the art of thorough pre-trip inspections to avoid costly violations and keep your fleet safe.',
    tag: 'Safety',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    content: `
      <p class="text-lg text-[#475569] mb-6">Pre-trip inspections are your first line of defense against roadside violations and accidents. Under 49 CFR §396.13, drivers must complete a thorough inspection before operating any commercial motor vehicle.</p>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Required Inspection Areas</h2>

      <p class="text-[#475569] mb-4">Every pre-trip inspection must cover these critical areas:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li><strong class="text-[#1E3A5F]">Brakes:</strong> Check air pressure, listen for leaks, test parking brake</li>
        <li><strong class="text-[#1E3A5F]">Tires:</strong> Inspect tread depth (4/32" steer, 2/32" drive), check for damage and proper inflation</li>
        <li><strong class="text-[#1E3A5F]">Lights:</strong> All headlights, taillights, brake lights, and turn signals must function</li>
        <li><strong class="text-[#1E3A5F]">Mirrors:</strong> Properly adjusted and free of cracks or damage</li>
        <li><strong class="text-[#1E3A5F]">Steering:</strong> Check for excessive play, inspect power steering fluid</li>
        <li><strong class="text-[#1E3A5F]">Coupling devices:</strong> Fifth wheel, kingpin, safety chains properly secured</li>
      </ul>

      <div class="bg-[#FEF9C3] border border-[#EAB308]/30 rounded-xl p-6 mb-6">
        <h3 class="text-lg font-bold text-[#A16207] mb-2">Common Violation Alert</h3>
        <p class="text-[#475569]">Brake system violations account for over 30% of all out-of-service orders. Pay extra attention to brake adjustment, air leaks, and worn components.</p>
      </div>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">DVIR Requirements</h2>

      <p class="text-[#475569] mb-4">The Driver Vehicle Inspection Report (DVIR) must document:</p>

      <ol class="list-decimal list-inside text-[#475569] mb-6 space-y-2">
        <li>Date and time of inspection</li>
        <li>Vehicle identification (unit number, license plate)</li>
        <li>Any defects or deficiencies discovered</li>
        <li>Driver's signature certifying the inspection was completed</li>
        <li>Certification that previous defects were repaired (if applicable)</li>
      </ol>

      <p class="text-[#475569]">Remember: A thorough 15-minute pre-trip inspection can save you hours of delays and thousands in fines. Make it a habit, not a hassle.</p>
    `
  },
  {
    id: 8,
    slug: 'understanding-csa-scores-basics',
    category: 'regulations',
    date: 'Jun 28, 2025',
    title: 'Understanding CSA Scores and BASICs',
    description: 'A complete breakdown of the CSA scoring system and how each BASIC category affects your carrier rating.',
    tag: 'CSA',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    content: `
      <p class="text-lg text-[#475569] mb-6">The Compliance, Safety, Accountability (CSA) program uses Safety Measurement System (SMS) scores to identify high-risk carriers. Understanding how these scores work is essential for maintaining good standing with the FMCSA.</p>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">The 7 BASICs Explained</h2>

      <div class="space-y-4 mb-6">
        <div class="bg-[#F1F5F9] rounded-xl p-4 border border-[#E2E8F0]">
          <h3 class="text-[#1E3A5F] font-bold mb-1">1. Unsafe Driving (65% threshold)</h3>
          <p class="text-[#475569] text-sm">Speeding, reckless driving, improper lane changes, failure to use seatbelt</p>
        </div>
        <div class="bg-[#F1F5F9] rounded-xl p-4 border border-[#E2E8F0]">
          <h3 class="text-[#1E3A5F] font-bold mb-1">2. Hours of Service (65% threshold)</h3>
          <p class="text-[#475569] text-sm">Driving over hours, false log entries, no log book</p>
        </div>
        <div class="bg-[#F1F5F9] rounded-xl p-4 border border-[#E2E8F0]">
          <h3 class="text-[#1E3A5F] font-bold mb-1">3. Driver Fitness (80% threshold)</h3>
          <p class="text-[#475569] text-sm">Invalid CDL, medical certificate issues, lack of required endorsements</p>
        </div>
        <div class="bg-[#F1F5F9] rounded-xl p-4 border border-[#E2E8F0]">
          <h3 class="text-[#1E3A5F] font-bold mb-1">4. Controlled Substances (80% threshold)</h3>
          <p class="text-[#475569] text-sm">Drug or alcohol possession, positive test results, refusal to test</p>
        </div>
        <div class="bg-[#F1F5F9] rounded-xl p-4 border border-[#E2E8F0]">
          <h3 class="text-[#1E3A5F] font-bold mb-1">5. Vehicle Maintenance (80% threshold)</h3>
          <p class="text-[#475569] text-sm">Brake defects, lighting issues, tire problems, cargo securement</p>
        </div>
        <div class="bg-[#F1F5F9] rounded-xl p-4 border border-[#E2E8F0]">
          <h3 class="text-[#1E3A5F] font-bold mb-1">6. Hazardous Materials (80% threshold)</h3>
          <p class="text-[#475569] text-sm">Improper placarding, leaking containers, documentation errors</p>
        </div>
        <div class="bg-[#F1F5F9] rounded-xl p-4 border border-[#E2E8F0]">
          <h3 class="text-[#1E3A5F] font-bold mb-1">7. Crash Indicator (65% threshold)</h3>
          <p class="text-[#475569] text-sm">DOT-recordable crashes regardless of fault</p>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">How Scores Are Calculated</h2>

      <p class="text-[#475569] mb-4">SMS percentiles compare your performance against similar carriers based on:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li>Violations from the past 24 months (weighted by recency)</li>
        <li>Number of inspections and power units</li>
        <li>Severity of violations (severity weights vary by violation type)</li>
        <li>Time since violation (more recent = higher weight)</li>
      </ul>

      <p class="text-[#475569]">Monitor your scores monthly and address any upward trends before they trigger FMCSA intervention.</p>
    `
  },
  {
    id: 9,
    slug: 'drug-alcohol-testing-compliance',
    category: 'regulations',
    date: 'Jun 15, 2025',
    title: 'Drug & Alcohol Testing Compliance',
    description: 'Everything carriers need to know about DOT drug and alcohol testing requirements and the Clearinghouse.',
    tag: 'D&A Testing',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=600&fit=crop',
    content: `
      <p class="text-lg text-[#475569] mb-6">Drug and alcohol testing is a critical component of DOT compliance under 49 CFR Part 382. Violations in this area carry severe penalties and can result in immediate driver disqualification.</p>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Required Testing Types</h2>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li><strong class="text-[#1E3A5F]">Pre-Employment:</strong> Required before driver performs safety-sensitive functions</li>
        <li><strong class="text-[#1E3A5F]">Random:</strong> Minimum 50% of drivers for drugs, 10% for alcohol annually</li>
        <li><strong class="text-[#1E3A5F]">Post-Accident:</strong> Within 8 hours (alcohol) or 32 hours (drugs) of qualifying accidents</li>
        <li><strong class="text-[#1E3A5F]">Reasonable Suspicion:</strong> When trained supervisor observes signs of impairment</li>
        <li><strong class="text-[#1E3A5F]">Return-to-Duty:</strong> After violation, before resuming safety-sensitive duties</li>
        <li><strong class="text-[#1E3A5F]">Follow-Up:</strong> At least 6 tests in first 12 months after return-to-duty</li>
      </ul>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">FMCSA Clearinghouse Requirements</h2>

      <p class="text-[#475569] mb-4">Since January 2020, all carriers must:</p>

      <div class="bg-[#EFF6FF] border border-[#1E3A5F]/30 rounded-xl p-6 mb-6">
        <ul class="list-disc list-inside text-[#475569] space-y-2">
          <li>Query the Clearinghouse before hiring any CDL driver</li>
          <li>Conduct annual queries on all current drivers</li>
          <li>Report positive tests and refusals within 3 business days</li>
          <li>Report return-to-duty test results</li>
        </ul>
      </div>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Consequences of Non-Compliance</h2>

      <p class="text-[#475569] mb-4">Failing to maintain a proper D&A program can result in:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li>Fines up to $16,000 per violation</li>
        <li>Driver disqualification for 1-3 years (first offense)</li>
        <li>Lifetime ban for second offense</li>
        <li>Increased insurance premiums</li>
        <li>Loss of operating authority</li>
      </ul>
    `
  },
  {
    id: 10,
    slug: 'hours-of-service-rules-simplified',
    category: 'regulations',
    date: 'Jun 1, 2025',
    title: 'Hours of Service Rules Simplified',
    description: 'A clear breakdown of HOS regulations for property-carrying drivers, including exceptions and the 2020 updates.',
    tag: 'HOS',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?w=800&h=600&fit=crop',
    content: `
      <p class="text-lg text-[#475569] mb-6">Hours of Service regulations under 49 CFR Part 395 are designed to prevent fatigue-related accidents. Understanding these rules is essential for every commercial driver.</p>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Key HOS Limits for Property-Carrying Drivers</h2>

      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div class="bg-[#F0FDF4] rounded-xl p-4 border border-[#22C55E]/20">
          <h3 class="text-[#22C55E] font-bold mb-2">11-Hour Driving Limit</h3>
          <p class="text-[#475569] text-sm">Maximum driving time after 10 consecutive hours off duty</p>
        </div>
        <div class="bg-[#F0FDF4] rounded-xl p-4 border border-[#22C55E]/20">
          <h3 class="text-[#22C55E] font-bold mb-2">14-Hour Window</h3>
          <p class="text-[#475569] text-sm">All driving must occur within 14 hours of coming on duty</p>
        </div>
        <div class="bg-[#F0FDF4] rounded-xl p-4 border border-[#22C55E]/20">
          <h3 class="text-[#22C55E] font-bold mb-2">60/70-Hour Limit</h3>
          <p class="text-[#475569] text-sm">Maximum on-duty time in 7/8 consecutive days</p>
        </div>
        <div class="bg-[#F0FDF4] rounded-xl p-4 border border-[#22C55E]/20">
          <h3 class="text-[#22C55E] font-bold mb-2">30-Minute Break</h3>
          <p class="text-[#475569] text-sm">Required after 8 hours of driving (can be on-duty not driving)</p>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">2020 Rule Updates</h2>

      <p class="text-[#475569] mb-4">The September 2020 final rule introduced key flexibilities:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li><strong class="text-[#1E3A5F]">Short-haul exception:</strong> Extended to 150 air-mile radius</li>
        <li><strong class="text-[#1E3A5F]">Adverse driving conditions:</strong> 2-hour extension for both 11 and 14-hour limits</li>
        <li><strong class="text-[#1E3A5F]">30-minute break:</strong> Can now be satisfied with on-duty not driving time</li>
        <li><strong class="text-[#1E3A5F]">Sleeper berth:</strong> Split into 7/3 hour periods (both qualifying)</li>
      </ul>

      <div class="bg-[#FEF9C3] border border-[#EAB308]/30 rounded-xl p-6 mb-6">
        <h3 class="text-lg font-bold text-[#A16207] mb-2">Pro Tip</h3>
        <p class="text-[#475569]">The 34-hour restart completely resets your 60/70-hour clock. Plan your week to maximize this reset when possible.</p>
      </div>
    `
  },
  {
    id: 11,
    slug: 'roadside-inspection-survival-guide',
    category: 'safety',
    date: 'May 20, 2025',
    title: 'Roadside Inspection Survival Guide',
    description: 'What to expect during a DOT roadside inspection and how to minimize your chances of an out-of-service order.',
    tag: 'Inspections',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=800&h=600&fit=crop',
    content: `
      <p class="text-lg text-[#475569] mb-6">Roadside inspections can be stressful, but proper preparation significantly reduces your risk of violations. Here's what every driver needs to know.</p>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Inspection Levels</h2>

      <div class="space-y-3 mb-6">
        <div class="flex items-start gap-3 p-3 bg-[#F1F5F9] rounded-lg">
          <div class="w-8 h-8 rounded bg-[#1E3A5F] flex items-center justify-center text-white text-sm font-bold">I</div>
          <div>
            <span class="text-[#1E3A5F] font-medium">North American Standard</span>
            <p class="text-[#94A3B8] text-sm">Most comprehensive - includes driver credentials, vehicle mechanical, and cargo (37 steps)</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3 bg-[#F1F5F9] rounded-lg">
          <div class="w-8 h-8 rounded bg-[#1E3A5F] flex items-center justify-center text-white text-sm font-bold">II</div>
          <div>
            <span class="text-[#1E3A5F] font-medium">Walk-Around</span>
            <p class="text-[#94A3B8] text-sm">Driver interview and walk-around vehicle inspection without going under vehicle</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3 bg-[#F1F5F9] rounded-lg">
          <div class="w-8 h-8 rounded bg-[#1E3A5F] flex items-center justify-center text-white text-sm font-bold">III</div>
          <div>
            <span class="text-[#1E3A5F] font-medium">Driver-Only</span>
            <p class="text-[#94A3B8] text-sm">Credentials, log book, medical card, seatbelt, and shipping papers</p>
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Top Out-of-Service Violations</h2>

      <ol class="list-decimal list-inside text-[#475569] mb-6 space-y-2">
        <li>Brake system defects (adjustment, air leaks, worn components)</li>
        <li>Hours of Service violations (over hours, falsified logs)</li>
        <li>Tire violations (tread depth, damage, improper inflation)</li>
        <li>Lighting defects (inoperative lights, reflectors)</li>
        <li>Driver license or medical certificate issues</li>
      </ol>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">During the Inspection</h2>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li>Be professional and cooperative with the inspector</li>
        <li>Have all documents organized and readily accessible</li>
        <li>Know your rights - you can request a supervisor if needed</li>
        <li>Ask for clarification if you don't understand a violation</li>
        <li>Review the inspection report carefully before signing</li>
      </ul>
    `
  },
  {
    id: 12,
    slug: 'medical-card-requirements-cdl-drivers',
    category: 'regulations',
    date: 'May 8, 2025',
    title: 'Medical Card Requirements for CDL Drivers',
    description: 'Complete guide to DOT physical examinations, disqualifying conditions, and keeping your medical certification current.',
    tag: 'Medical',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop',
    content: `
      <p class="text-lg text-[#475569] mb-6">Every CDL driver must maintain a valid Medical Examiner's Certificate (MEC) to operate a commercial motor vehicle. Understanding the requirements helps ensure uninterrupted certification.</p>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Basic Requirements</h2>

      <p class="text-[#475569] mb-4">Under 49 CFR Part 391.41, drivers must meet these physical qualifications:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li><strong class="text-[#1E3A5F]">Vision:</strong> 20/40 acuity in each eye (with or without correction), 70° peripheral vision</li>
        <li><strong class="text-[#1E3A5F]">Hearing:</strong> Perceive forced whisper at 5 feet or pass audiometric test</li>
        <li><strong class="text-[#1E3A5F]">Blood Pressure:</strong> Less than 140/90 for 2-year certification</li>
        <li><strong class="text-[#1E3A5F]">No loss of limb:</strong> Unless granted a Skill Performance Evaluation (SPE) certificate</li>
        <li><strong class="text-[#1E3A5F]">No insulin use:</strong> Unless certified under the Federal Diabetes Exemption Program</li>
      </ul>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Certification Periods</h2>

      <div class="bg-[#F1F5F9] rounded-xl p-6 mb-6 border border-[#E2E8F0]">
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-[#475569]">No medical conditions</span>
            <span class="text-[#1E3A5F] font-bold">2 years</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-[#475569]">Stage 1 hypertension (140-159/90-99)</span>
            <span class="text-[#1E3A5F] font-bold">1 year</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-[#475569]">Stage 2 hypertension (160-179/100-109)</span>
            <span class="text-[#F97316] font-bold">1 year (one-time)</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-[#475569]">Diabetes (insulin-using, exemption holders)</span>
            <span class="text-[#1E3A5F] font-bold">1 year max</span>
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">National Registry Requirements</h2>

      <p class="text-[#475569] mb-4">Your DOT physical must be conducted by a medical examiner listed on the FMCSA National Registry. After passing:</p>

      <ol class="list-decimal list-inside text-[#475569] mb-6 space-y-2">
        <li>Examiner submits results to FMCSA within 24 hours</li>
        <li>Provide copy of MEC to your employer</li>
        <li>Submit MEC to your state DMV within 15 days</li>
        <li>Carry original MEC while driving until DMV updates your record</li>
      </ol>
    `
  },
  {
    id: 13,
    slug: 'vehicle-maintenance-49-cfr-396',
    category: 'safety',
    date: 'Apr 25, 2025',
    title: 'Vehicle Maintenance Under 49 CFR 396',
    description: 'Understanding your regulatory obligations for systematic vehicle inspection, repair, and maintenance programs.',
    tag: 'Maintenance',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop',
    content: `
      <p class="text-lg text-[#475569] mb-6">Federal regulations require motor carriers to systematically inspect, repair, and maintain all commercial vehicles under their control. A well-documented maintenance program is essential for compliance and safety.</p>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Key Regulatory Requirements</h2>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li><strong class="text-[#1E3A5F]">§396.3 Inspection, repair, and maintenance:</strong> Every carrier must maintain vehicles in safe operating condition</li>
        <li><strong class="text-[#1E3A5F]">§396.11 Driver vehicle inspection reports:</strong> Daily DVIRs documenting vehicle condition</li>
        <li><strong class="text-[#1E3A5F]">§396.17 Periodic inspection:</strong> Annual inspection by qualified inspector</li>
        <li><strong class="text-[#1E3A5F]">§396.21 Minimum periodic inspection standards:</strong> Appendix G criteria must be met</li>
      </ul>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Annual Inspection Requirements</h2>

      <p class="text-[#475569] mb-4">The annual inspection must cover at minimum:</p>

      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div class="bg-[#F1F5F9] rounded-xl p-4 border border-[#E2E8F0]">
          <h3 class="text-[#1E3A5F] font-bold mb-2">Brake System</h3>
          <p class="text-[#475569] text-sm">Service brakes, parking brake, brake drums/rotors, brake adjustment</p>
        </div>
        <div class="bg-[#F1F5F9] rounded-xl p-4 border border-[#E2E8F0]">
          <h3 class="text-[#1E3A5F] font-bold mb-2">Steering</h3>
          <p class="text-[#475569] text-sm">Steering wheel, steering column, front axle, steering gear box</p>
        </div>
        <div class="bg-[#F1F5F9] rounded-xl p-4 border border-[#E2E8F0]">
          <h3 class="text-[#1E3A5F] font-bold mb-2">Lighting & Electrical</h3>
          <p class="text-[#475569] text-sm">All lights, reflectors, electrical wiring</p>
        </div>
        <div class="bg-[#F1F5F9] rounded-xl p-4 border border-[#E2E8F0]">
          <h3 class="text-[#1E3A5F] font-bold mb-2">Suspension</h3>
          <p class="text-[#475569] text-sm">Springs, spring hangers, U-bolts, shock absorbers</p>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Record Retention</h2>

      <p class="text-[#475569] mb-4">Maintain these records for the following periods:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li>DVIRs: 3 months minimum</li>
        <li>Annual inspection reports: 14 months (until next annual)</li>
        <li>Maintenance records: Life of vehicle + 6 months</li>
        <li>Roadside inspection reports: 12 months</li>
      </ul>
    `
  },
  {
    id: 14,
    slug: 'new-entrant-safety-audit-preparation',
    category: 'regulations',
    date: 'Apr 10, 2025',
    title: 'New Entrant Safety Audit Preparation',
    description: 'A comprehensive guide to preparing for and passing your FMCSA new entrant safety audit.',
    tag: 'Audit',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
    content: `
      <p class="text-lg text-[#475569] mb-6">New motor carriers must pass a safety audit within 18 months of receiving operating authority. Failing this audit can result in revocation of your authority and an "Unsatisfactory" safety rating.</p>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">What the Audit Covers</h2>

      <p class="text-[#475569] mb-4">FMCSA auditors will review your compliance with these six factors:</p>

      <ol class="list-decimal list-inside text-[#475569] mb-6 space-y-2">
        <li><strong class="text-[#1E3A5F]">General:</strong> Operating authority, insurance, process agents</li>
        <li><strong class="text-[#1E3A5F]">Driver:</strong> Qualification files, licensing, drug testing</li>
        <li><strong class="text-[#1E3A5F]">Operational:</strong> Hours of service, ELD compliance</li>
        <li><strong class="text-[#1E3A5F]">Vehicle:</strong> Maintenance records, annual inspections</li>
        <li><strong class="text-[#1E3A5F]">Hazmat:</strong> (if applicable) Training, security plans</li>
        <li><strong class="text-[#1E3A5F]">Accidents:</strong> Recordable accident register</li>
      </ol>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Essential Documents Checklist</h2>

      <div class="bg-[#EFF6FF] border border-[#1E3A5F]/30 rounded-xl p-6 mb-6">
        <ul class="list-disc list-inside text-[#475569] space-y-2">
          <li>Complete Driver Qualification Files (all required documents)</li>
          <li>Drug and alcohol testing records and policy</li>
          <li>Hours of Service records (ELD or paper logs)</li>
          <li>Vehicle maintenance files and DVIRs</li>
          <li>Proof of insurance (MCS-90 or BMC-91)</li>
          <li>Copies of operating authority</li>
          <li>Accident register (last 3 years)</li>
        </ul>
      </div>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Common Reasons for Failure</h2>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li>Incomplete driver qualification files</li>
        <li>No drug and alcohol testing program</li>
        <li>Missing or falsified hours of service records</li>
        <li>Inadequate vehicle maintenance documentation</li>
        <li>Operating without proper insurance</li>
      </ul>

      <div class="bg-[#FEF9C3] border border-[#EAB308]/30 rounded-xl p-6 mb-6">
        <h3 class="text-lg font-bold text-[#A16207] mb-2">Audit Tip</h3>
        <p class="text-[#475569]">Conduct a self-audit using the FMCSA's Safety Audit checklist before your official audit. This gives you time to correct deficiencies.</p>
      </div>
    `
  },
  {
    id: 15,
    slug: 'dataq-challenges-removing-violations',
    category: 'case-studies',
    date: 'Mar 28, 2025',
    title: 'DataQs Challenges: Removing Unfair Violations',
    description: 'How to identify challengeable violations and successfully use the DataQs system to improve your safety record.',
    tag: 'DataQ',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop',
    content: `
      <p class="text-lg text-[#475569] mb-6">The FMCSA's DataQs system allows carriers to challenge inaccurate inspection and crash data. Successfully removing unfair violations can significantly improve your CSA scores.</p>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Types of Challengeable Violations</h2>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li><strong class="text-[#1E3A5F]">Incorrect carrier information:</strong> Wrong DOT number, name, or address</li>
        <li><strong class="text-[#1E3A5F]">Driver not employed:</strong> Violation assigned to wrong carrier</li>
        <li><strong class="text-[#1E3A5F]">Equipment not owned/leased:</strong> Vehicle not under your control</li>
        <li><strong class="text-[#1E3A5F]">Intermodal equipment:</strong> Defects attributable to equipment provider</li>
        <li><strong class="text-[#1E3A5F]">Crash not recordable:</strong> Doesn't meet severity threshold</li>
        <li><strong class="text-[#1E3A5F]">Incorrect violation:</strong> Citation doesn't match actual condition</li>
      </ul>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">DataQs Process Steps</h2>

      <div class="space-y-3 mb-6">
        <div class="flex items-start gap-3 p-3 bg-[#F1F5F9] rounded-lg">
          <div class="w-6 h-6 rounded bg-[#1E3A5F]/10 flex items-center justify-center text-[#1E3A5F] text-sm font-bold">1</div>
          <div>
            <span class="text-[#1E3A5F] font-medium">Register on DataQs website</span>
            <p class="text-[#94A3B8] text-sm">Create account at dataqs.fmcsa.dot.gov</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3 bg-[#F1F5F9] rounded-lg">
          <div class="w-6 h-6 rounded bg-[#1E3A5F]/10 flex items-center justify-center text-[#1E3A5F] text-sm font-bold">2</div>
          <div>
            <span class="text-[#1E3A5F] font-medium">Submit Request for Data Review (RDR)</span>
            <p class="text-[#94A3B8] text-sm">Identify the specific data you're challenging</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3 bg-[#F1F5F9] rounded-lg">
          <div class="w-6 h-6 rounded bg-[#1E3A5F]/10 flex items-center justify-center text-[#1E3A5F] text-sm font-bold">3</div>
          <div>
            <span class="text-[#1E3A5F] font-medium">Provide supporting documentation</span>
            <p class="text-[#94A3B8] text-sm">Lease agreements, repair receipts, photos, statements</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3 bg-[#F1F5F9] rounded-lg">
          <div class="w-6 h-6 rounded bg-[#1E3A5F]/10 flex items-center justify-center text-[#1E3A5F] text-sm font-bold">4</div>
          <div>
            <span class="text-[#1E3A5F] font-medium">State reviews and responds</span>
            <p class="text-[#94A3B8] text-sm">Typically within 30-60 days</p>
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Success Rate Tips</h2>

      <p class="text-[#475569] mb-4">To maximize your chances of a successful challenge:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li>Submit challenges promptly (within 2 years of violation)</li>
        <li>Include clear, specific documentation</li>
        <li>Reference the exact regulation in question</li>
        <li>Be factual and professional in your explanation</li>
        <li>Follow up if no response within 60 days</li>
      </ul>
    `
  },
  {
    id: 16,
    slug: 'fleet-safety-technology-trends-2026',
    category: 'updates',
    date: 'Mar 15, 2025',
    title: 'Fleet Safety Technology Trends 2026',
    description: 'Emerging technologies transforming fleet safety, from AI-powered cameras to predictive maintenance systems.',
    tag: 'Technology',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop',
    content: `
      <p class="text-lg text-[#475569] mb-6">Technology is revolutionizing fleet safety. Here's what forward-thinking carriers are implementing in 2026 to reduce accidents, improve compliance, and lower costs.</p>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">AI-Powered Dash Cameras</h2>

      <p class="text-[#475569] mb-4">Modern dash cams do far more than record video:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li><strong class="text-[#1E3A5F]">Real-time driver coaching:</strong> Alerts for distracted driving, following distance, lane departure</li>
        <li><strong class="text-[#1E3A5F]">Automatic event detection:</strong> Captures hard braking, collisions, near-misses</li>
        <li><strong class="text-[#1E3A5F]">Exoneration footage:</strong> Protect against fraudulent claims</li>
        <li><strong class="text-[#1E3A5F]">Insurance discounts:</strong> Many insurers offer 10-15% premium reductions</li>
      </ul>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Advanced Driver Assistance Systems (ADAS)</h2>

      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div class="bg-[#EFF6FF] rounded-xl p-4 border border-[#3B82F6]/20">
          <h3 class="text-[#3B82F6] font-bold mb-2">Collision Mitigation</h3>
          <p class="text-[#475569] text-sm">Automatic emergency braking when forward collision detected</p>
        </div>
        <div class="bg-[#EFF6FF] rounded-xl p-4 border border-[#3B82F6]/20">
          <h3 class="text-[#3B82F6] font-bold mb-2">Lane Keep Assist</h3>
          <p class="text-[#475569] text-sm">Steering corrections when drifting out of lane</p>
        </div>
        <div class="bg-[#EFF6FF] rounded-xl p-4 border border-[#3B82F6]/20">
          <h3 class="text-[#3B82F6] font-bold mb-2">Adaptive Cruise Control</h3>
          <p class="text-[#475569] text-sm">Maintains safe following distance automatically</p>
        </div>
        <div class="bg-[#EFF6FF] rounded-xl p-4 border border-[#3B82F6]/20">
          <h3 class="text-[#3B82F6] font-bold mb-2">Blind Spot Detection</h3>
          <p class="text-[#475569] text-sm">Warnings when vehicles in adjacent lanes</p>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4 font-heading">Predictive Maintenance</h2>

      <p class="text-[#475569] mb-4">IoT sensors and machine learning now enable:</p>

      <ul class="list-disc list-inside text-[#475569] mb-6 space-y-2">
        <li>Early detection of brake wear and tire issues</li>
        <li>Engine fault prediction before breakdowns occur</li>
        <li>Optimized maintenance schedules reducing downtime</li>
        <li>Integration with shop management systems</li>
      </ul>

      <p class="text-[#475569]">Investing in safety technology isn't just good practice—it's becoming a competitive necessity as shippers increasingly require technology-equipped carriers.</p>
    `
  },
];
