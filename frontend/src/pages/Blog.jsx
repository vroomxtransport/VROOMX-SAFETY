import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FiCheck, FiArrowRight, FiX, FiClock, FiTag } from 'react-icons/fi';
import PublicHeader from '../components/PublicHeader';
import VroomXLogo from '../components/VroomXLogo';

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedArticle) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedArticle]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setSelectedArticle(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const categories = [
    { id: 'all', label: 'All Posts' },
    { id: 'regulations', label: 'Regulations' },
    { id: 'safety', label: 'Safety Tips' },
    { id: 'case-studies', label: 'Case Studies' },
    { id: 'updates', label: 'Product Updates' },
  ];

  // Featured article
  const featuredArticle = {
    id: 0,
    slug: 'eld-mandate-2026',
    category: 'regulations',
    date: 'Oct 24, 2025',
    title: 'Navigating the 2026 ELD Mandate Updates',
    description: 'The FMCSA has proposed new technical specifications for Electronic Logging Devices. Here is what every safety director needs to know to stay compliant.',
    tag: 'Featured',
    readTime: '8 min read',
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

  const articles = [
    {
      id: 1,
      slug: 'air-mile-radius-exemptions',
      category: 'regulations',
      date: 'Oct 12, 2025',
      title: 'Exemptions Explained: 100 vs 150 Air-Mile Radius',
      description: 'Clarifying the confusion around short-haul exemptions and time records.',
      tag: 'Regulation',
      readTime: '5 min read',
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

  const filteredArticles = activeCategory === 'all'
    ? articles
    : articles.filter(a => a.category === activeCategory);

  // Article Modal Component
  const ArticleModal = ({ article, onClose }) => {
    if (!article) return null;

    return (
      <div
        className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-primary-500/20 backdrop-blur-sm p-4 md:p-8"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-4xl my-8 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:text-primary-500 hover:bg-[#E2E8F0] transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>

          {/* Article Header */}
          <div className="p-8 md:p-12 border-b border-[#E2E8F0]">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="px-3 py-1 rounded-full border border-cta-500/30 bg-cta-500/10 text-cta-500 font-mono text-[10px] uppercase tracking-wide">
                {article.tag}
              </span>
              <span className="flex items-center gap-2 text-[#94A3B8] text-sm">
                <FiClock className="w-4 h-4" />
                {article.readTime}
              </span>
              <span className="text-[#94A3B8] text-sm font-mono">{article.date}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-500 mb-4 font-heading leading-tight">
              {article.title}
            </h1>
            <p className="text-lg text-[#475569]">{article.description}</p>
          </div>

          {/* Article Content */}
          <div
            className="p-8 md:p-12 prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Article Footer */}
          <div className="p-8 md:p-12 border-t border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-[#475569] mb-2">Want to stay compliant?</p>
                <p className="text-primary-500 font-medium">Start your free trial of VroomX Safety today.</p>
              </div>
              <Link
                to="/register"
                className="btn-glow px-8 py-3 rounded-lg font-bold text-white text-sm inline-flex items-center gap-2"
                onClick={onClose}
              >
                Get Started Free
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#F8FAFC]"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
        {/* Blobs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-500/10 blur-[100px] rounded-full animate-blob" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-cta-500/10 blur-[100px] rounded-full animate-blob animation-delay-300" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-primary-300/10 blur-[100px] rounded-full animate-blob animation-delay-200" />
      </div>

      {/* Navigation */}
      <PublicHeader activePage="blog" />

      {/* Blog Hero */}
      <section className="relative z-10 pt-48 pb-12 px-6 md:px-16 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-cta-500/30 bg-cta-500/10 text-cta-500 font-mono text-xs uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-cta-500 animate-pulse"></span>
            VroomX Safety Blog
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-primary-500 mb-6 font-heading">
            Compliance <span className="text-cta-500">Insights.</span>
          </h1>
          <p className="text-xl text-[#475569] max-w-2xl mx-auto leading-relaxed">
            Expert advice on FMCSA regulations, audit preparation, and fleet safety trends.
          </p>
        </div>
      </section>

      {/* Blog Content */}
      <section className="relative z-10 py-12 px-6 md:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-4 mb-16 border-b border-[#E2E8F0] pb-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-cta-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] font-bold'
                    : 'bg-white border border-[#E2E8F0] hover:border-cta-500/50 text-[#475569] hover:text-primary-500'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Featured Article */}
          <div className="mb-16">
            <div
              className="bg-white rounded-3xl overflow-hidden border border-[#E2E8F0] shadow-lg hover:shadow-xl hover:border-cta-500/30 group relative cursor-pointer transition-all duration-300"
              onClick={() => setSelectedArticle(featuredArticle)}
            >
              <div className="grid md:grid-cols-2 gap-0">
                <div className="h-64 md:h-auto bg-gradient-to-br from-primary-500 to-primary-600 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/40 to-primary-400/40 group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-24 h-24 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="px-3 py-1 rounded-full border border-cta-500/30 bg-cta-500/10 text-cta-500 font-mono text-[10px] uppercase tracking-wide">Featured</span>
                    <span className="text-[#94A3B8] text-xs font-mono">{featuredArticle.date}</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-primary-500 mb-4 leading-tight group-hover:text-cta-500 transition-colors font-heading">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-[#475569] mb-8 leading-relaxed">
                    {featuredArticle.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-cta-500 font-bold group-hover:gap-3 transition-all">
                    Read Full Article
                    <FiArrowRight className="w-5 h-5" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Article Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-2xl overflow-hidden flex flex-col border border-[#E2E8F0] shadow-md hover:shadow-lg hover:border-cta-500/30 group cursor-pointer transition-all duration-300"
                onClick={() => setSelectedArticle(article)}
              >
                <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-500 relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/30 to-transparent group-hover:from-cta-500/30 transition-colors duration-300" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-primary-500 font-mono uppercase font-bold">
                    {article.tag}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-[#94A3B8] font-mono">{article.date}</span>
                    <span className="text-xs text-[#CBD5E1]">•</span>
                    <span className="text-xs text-[#94A3B8]">{article.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold text-primary-500 mb-3 group-hover:text-cta-500 transition-colors font-heading">
                    {article.title}
                  </h3>
                  <p className="text-sm text-[#475569] mb-4 flex-1">{article.description}</p>
                  <span className="text-sm text-cta-500 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read Article
                    <FiArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 px-6 md:px-16 text-center relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-primary-500/5 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-primary-500 mb-8 tracking-tight font-heading">
            Ready to Simplify <span className="text-cta-500">Compliance?</span>
          </h2>
          <p className="text-xl text-[#475569] mb-10 max-w-xl mx-auto">
            Join hundreds of owner-operators and small fleets who trust VroomX to keep them FMCSA compliant.
          </p>
          <Link
            to="/register"
            className="btn-glow px-12 py-5 rounded-full font-bold text-white text-lg inline-flex items-center gap-2 mb-6"
          >
            Start Your Free 3-Day Trial
            <FiArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[#475569]">
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-success-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-success-500" />
              Setup in 10 minutes
            </span>
            <span className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-success-500" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 md:px-16 bg-primary-500 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Top Section - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <VroomXLogo size="md" showText={true} textColor="light" animate={true} linkToHome={true} />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                AI-powered FMCSA compliance made simple for owner-operators and small fleets.
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-3">
                <li><Link to="/#features" className="text-gray-400 text-sm hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/#pricing" className="text-gray-400 text-sm hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/#csa-checker" className="text-gray-400 text-sm hover:text-white transition-colors">Free CSA Checker</Link></li>
                <li><Link to="/api" className="text-gray-400 text-sm hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><Link to="/blog" className="text-gray-400 text-sm hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/fmcsa-guide" className="text-gray-400 text-sm hover:text-white transition-colors">FMCSA Guide</Link></li>
                <li><Link to="/dataq-help" className="text-gray-400 text-sm hover:text-white transition-colors">DataQ Help</Link></li>
                <li><Link to="/support" className="text-gray-400 text-sm hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-gray-400 text-sm hover:text-white transition-colors">About</Link></li>
                <li><Link to="/contact" className="text-gray-400 text-sm hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/privacy" className="text-gray-400 text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-400 text-sm hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; 2026 VroomX Safety. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm">
              Made with <span className="text-cta-500">❤️</span> for truckers
            </p>
          </div>
        </div>
      </footer>

      {/* Article Modal */}
      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  );
};

export default Blog;
