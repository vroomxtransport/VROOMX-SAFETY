import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import { FooterSection } from '../components/landing';
import { FiShield, FiLock, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import useForceLightMode from '../hooks/useForceLightMode';

const PrivacyPolicy = () => {
  useForceLightMode();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PublicHeader activePage="privacy" variant="light" />

      {/* Hero Section */}
      <div className="pt-32 pb-12 px-4 bg-primary-500">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-outfit text-white">Privacy Policy</h1>
          <p className="text-white/80">
            <span className="text-cta-400 font-semibold">Effective Date:</span> January 25, 2026 |
            <span className="text-cta-400 font-semibold ml-2">Last Updated:</span> January 25, 2026
          </p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="max-w-4xl mx-auto px-4 -mt-6 mb-8 relative z-10">
        <div className="bg-white border-l-4 border-cta-500 rounded-lg p-6 shadow-lg">
          <p className="text-gray-700">
            <strong className="text-primary-500">Summary:</strong> VroomX Safety ("we," "us," or "our") is committed to protecting your privacy. This policy explains how we collect, use, share, and protect your personal information when you use our FMCSA compliance management platform.
          </p>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="max-w-4xl mx-auto px-4 mb-12">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
          <h3 className="text-cta-500 font-semibold mb-4 font-outfit">Table of Contents</h3>
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-2 list-decimal list-inside text-gray-600 text-sm">
            <li><a href="#information-we-collect" className="hover:text-cta-500 transition-colors">Information We Collect</a></li>
            <li><a href="#how-we-use" className="hover:text-cta-500 transition-colors">How We Use Your Information</a></li>
            <li><a href="#information-sharing" className="hover:text-cta-500 transition-colors">Information Sharing</a></li>
            <li><a href="#data-retention" className="hover:text-cta-500 transition-colors">Data Retention</a></li>
            <li><a href="#data-security" className="hover:text-cta-500 transition-colors">Data Security</a></li>
            <li><a href="#your-rights" className="hover:text-cta-500 transition-colors">Your Rights & Choices</a></li>
            <li><a href="#cookies" className="hover:text-cta-500 transition-colors">Cookies & Tracking</a></li>
            <li><a href="#third-party" className="hover:text-cta-500 transition-colors">Third-Party Services</a></li>
            <li><a href="#children" className="hover:text-cta-500 transition-colors">Children's Privacy</a></li>
            <li><a href="#international" className="hover:text-cta-500 transition-colors">International Data Transfers</a></li>
            <li><a href="#changes" className="hover:text-cta-500 transition-colors">Changes to This Policy</a></li>
            <li><a href="#contact" className="hover:text-cta-500 transition-colors">Contact Us</a></li>
          </ol>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-4 pb-20 space-y-12">

        {/* Section 1 */}
        <section id="information-we-collect">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
            Information We Collect
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">1.1 Information You Provide</h3>
          <p className="text-gray-600 mb-4">We collect information you voluntarily provide when using VroomX Safety:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li><strong className="text-primary-500">Account Information:</strong> Name, email address, phone number, company name, USDOT number, MC number, and billing information when you create an account.</li>
            <li><strong className="text-primary-500">Driver Information:</strong> Driver names, CDL numbers, medical card information, employment history, and other Driver Qualification File (DQF) data you enter into the platform.</li>
            <li><strong className="text-primary-500">Documents:</strong> Copies of CDLs, medical certificates, MVRs, drug test results, training certificates, and other compliance documents you upload.</li>
            <li><strong className="text-primary-500">Communications:</strong> Messages you send us, support tickets, and feedback you provide.</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">1.2 Information We Collect Automatically</h3>
          <p className="text-gray-600 mb-4">When you use our platform, we automatically collect:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li><strong className="text-primary-500">Usage Data:</strong> Pages visited, features used, time spent on platform, and interaction patterns.</li>
            <li><strong className="text-primary-500">Device Information:</strong> Browser type, operating system, device identifiers, and IP address.</li>
            <li><strong className="text-primary-500">Log Data:</strong> Access times, error logs, and referral URLs.</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">1.3 Information from Third Parties</h3>
          <p className="text-gray-600 mb-4">We may receive information from external sources:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li><strong className="text-primary-500">FMCSA Data:</strong> Carrier safety data, inspection results, crash records, and CSA scores from the FMCSA SAFER Web system.</li>
            <li><strong className="text-primary-500">ELD Providers:</strong> Hours of Service data if you connect your ELD system (with your authorization).</li>
            <li><strong className="text-primary-500">Payment Processors:</strong> Transaction confirmations from Stripe or other payment providers.</li>
          </ul>

          <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 mt-6 shadow-sm">
            <h4 className="font-semibold flex items-center gap-2 mb-2 font-outfit text-primary-500">
              <FiShield className="text-cta-500" /> Sensitive Information Notice
            </h4>
            <p className="text-gray-600 text-sm">We collect sensitive information including CDL numbers, medical information, and drug test results solely for FMCSA compliance purposes. This data is encrypted and access-controlled.</p>
          </div>
        </section>

        {/* Section 2 */}
        <section id="how-we-use">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
            How We Use Your Information
          </h2>

          <p className="text-gray-600 mb-4">We use the information we collect to:</p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="bg-primary-500 text-white border border-[#E2E8F0] p-3 text-left font-semibold">Purpose</th>
                  <th className="bg-primary-500 text-white border border-[#E2E8F0] p-3 text-left font-semibold">Examples</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="bg-white"><td className="border border-[#E2E8F0] p-3"><strong className="text-primary-500">Provide Services</strong></td><td className="border border-[#E2E8F0] p-3">Process DQF data, track document expirations, monitor CSA scores, generate compliance reports</td></tr>
                <tr className="bg-gray-50"><td className="border border-[#E2E8F0] p-3"><strong className="text-primary-500">Send Notifications</strong></td><td className="border border-[#E2E8F0] p-3">Expiration alerts, CSA score changes, compliance warnings, system updates</td></tr>
                <tr className="bg-white"><td className="border border-[#E2E8F0] p-3"><strong className="text-primary-500">Improve Platform</strong></td><td className="border border-[#E2E8F0] p-3">Analyze usage patterns, fix bugs, develop new features, enhance user experience</td></tr>
                <tr className="bg-gray-50"><td className="border border-[#E2E8F0] p-3"><strong className="text-primary-500">Customer Support</strong></td><td className="border border-[#E2E8F0] p-3">Respond to inquiries, troubleshoot issues, provide technical assistance</td></tr>
                <tr className="bg-white"><td className="border border-[#E2E8F0] p-3"><strong className="text-primary-500">Billing & Payments</strong></td><td className="border border-[#E2E8F0] p-3">Process subscriptions, send invoices, manage account status</td></tr>
                <tr className="bg-gray-50"><td className="border border-[#E2E8F0] p-3"><strong className="text-primary-500">Legal Compliance</strong></td><td className="border border-[#E2E8F0] p-3">Comply with laws, respond to legal requests, enforce our terms</td></tr>
                <tr className="bg-white"><td className="border border-[#E2E8F0] p-3"><strong className="text-primary-500">AI Features</strong></td><td className="border border-[#E2E8F0] p-3">Power our AI Regulation Assistant, document analysis, and compliance recommendations</td></tr>
              </tbody>
            </table>
          </div>

          <div className="bg-cta-50 border-l-4 border-cta-500 rounded-r-lg p-4 mt-6">
            <p className="text-gray-700">
              <strong className="text-primary-500">AI Processing:</strong> Our AI features analyze your data to provide regulation guidance and compliance recommendations. AI processing occurs on secure servers and your data is not used to train AI models for other customers.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section id="information-sharing">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">3</span>
            Information Sharing
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">3.1 We Do NOT Sell Your Data</h3>
          <p className="text-gray-600 mb-4">We do not sell, rent, or trade your personal information or driver data to third parties for marketing purposes.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">3.2 When We May Share Information</h3>
          <p className="text-gray-600 mb-4">We may share your information in limited circumstances:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li><strong className="text-primary-500">Service Providers:</strong> With vendors who help us operate (cloud hosting, email delivery, payment processing) under strict confidentiality agreements.</li>
            <li><strong className="text-primary-500">With Your Consent:</strong> When you authorize sharing with ELD providers, TMS systems, or other integrations.</li>
            <li><strong className="text-primary-500">Legal Requirements:</strong> If required by law, subpoena, court order, or government request.</li>
            <li><strong className="text-primary-500">Safety & Fraud Prevention:</strong> To protect rights, safety, or property of VroomX, our users, or the public.</li>
            <li><strong className="text-primary-500">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (you will be notified).</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">3.3 Aggregated & De-identified Data</h3>
          <p className="text-gray-600">We may share aggregated, anonymized data that cannot identify you (e.g., industry-wide compliance statistics) for research or benchmarking purposes.</p>
        </section>

        {/* Section 4 */}
        <section id="data-retention">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">4</span>
            Data Retention
          </h2>

          <p className="text-gray-600 mb-4">We retain your data based on the following criteria:</p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="bg-primary-500 text-white border border-[#E2E8F0] p-3 text-left font-semibold">Data Type</th>
                  <th className="bg-primary-500 text-white border border-[#E2E8F0] p-3 text-left font-semibold">Retention Period</th>
                  <th className="bg-primary-500 text-white border border-[#E2E8F0] p-3 text-left font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="bg-white"><td className="border border-[#E2E8F0] p-3">Account Information</td><td className="border border-[#E2E8F0] p-3">Duration of account + 3 years</td><td className="border border-[#E2E8F0] p-3">Business records, potential disputes</td></tr>
                <tr className="bg-gray-50"><td className="border border-[#E2E8F0] p-3">Driver Qualification Files</td><td className="border border-[#E2E8F0] p-3">3 years after driver leaves employment</td><td className="border border-[#E2E8F0] p-3">FMCSA requirement (49 CFR 391.51)</td></tr>
                <tr className="bg-white"><td className="border border-[#E2E8F0] p-3">Drug & Alcohol Records</td><td className="border border-[#E2E8F0] p-3">5 years</td><td className="border border-[#E2E8F0] p-3">DOT requirement (49 CFR 382.401)</td></tr>
                <tr className="bg-gray-50"><td className="border border-[#E2E8F0] p-3">Accident Records</td><td className="border border-[#E2E8F0] p-3">3 years from accident date</td><td className="border border-[#E2E8F0] p-3">FMCSA requirement</td></tr>
                <tr className="bg-white"><td className="border border-[#E2E8F0] p-3">Billing Records</td><td className="border border-[#E2E8F0] p-3">7 years</td><td className="border border-[#E2E8F0] p-3">Tax and accounting requirements</td></tr>
                <tr className="bg-gray-50"><td className="border border-[#E2E8F0] p-3">Usage Logs</td><td className="border border-[#E2E8F0] p-3">1 year</td><td className="border border-[#E2E8F0] p-3">Security and troubleshooting</td></tr>
              </tbody>
            </table>
          </div>

          <p className="text-gray-600 mt-4">You may request deletion of your data subject to legal retention requirements. See "Your Rights" section below.</p>
        </section>

        {/* Section 5 */}
        <section id="data-security">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">5</span>
            Data Security
          </h2>

          <p className="text-gray-600 mb-4">We implement robust security measures to protect your data:</p>

          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li><strong className="text-primary-500">Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256).</li>
            <li><strong className="text-primary-500">Access Controls:</strong> Role-based access, multi-factor authentication, and audit logging.</li>
            <li><strong className="text-primary-500">Infrastructure:</strong> Hosted on SOC 2 Type II certified cloud infrastructure with 24/7 monitoring.</li>
            <li><strong className="text-primary-500">Regular Audits:</strong> Penetration testing, vulnerability scanning, and security assessments.</li>
            <li><strong className="text-primary-500">Employee Training:</strong> All staff complete security awareness training.</li>
            <li><strong className="text-primary-500">Incident Response:</strong> Documented procedures for detecting and responding to security incidents.</li>
          </ul>

          <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 mt-6 shadow-sm">
            <h4 className="font-semibold flex items-center gap-2 mb-2 font-outfit text-primary-500">
              <FiLock className="text-cta-500" /> Breach Notification
            </h4>
            <p className="text-gray-600 text-sm">In the event of a data breach affecting your personal information, we will notify you within 72 hours as required by applicable law, and provide details about the incident and steps you can take.</p>
          </div>
        </section>

        {/* Section 6 */}
        <section id="your-rights">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">6</span>
            Your Rights & Choices
          </h2>

          <p className="text-gray-600 mb-4">Depending on your location, you may have the following rights:</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">6.1 Access & Portability</h3>
          <p className="text-gray-600 mb-4">You can request a copy of your personal data in a structured, machine-readable format.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">6.2 Correction</h3>
          <p className="text-gray-600 mb-4">You can update or correct inaccurate information through your account settings or by contacting us.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">6.3 Deletion</h3>
          <p className="text-gray-600 mb-4">You can request deletion of your data, subject to legal retention requirements (e.g., FMCSA-mandated records).</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">6.4 Opt-Out Options</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li><strong className="text-primary-500">Marketing Emails:</strong> Unsubscribe link in every email or manage in account settings.</li>
            <li><strong className="text-primary-500">Push Notifications:</strong> Disable in your device or browser settings.</li>
            <li><strong className="text-primary-500">SMS Alerts:</strong> Reply STOP to opt out or manage in notification preferences.</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">6.5 California Residents (CCPA)</h3>
          <p className="text-gray-600 mb-2">California residents have additional rights including:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Right to know what personal information is collected</li>
            <li>Right to delete personal information</li>
            <li>Right to opt-out of sale (we do not sell data)</li>
            <li>Right to non-discrimination for exercising rights</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">6.6 How to Exercise Your Rights</h3>
          <p className="text-gray-600">To exercise any of these rights, contact us at <a href="mailto:privacy@vroomxsafety.com" className="text-cta-500 hover:underline">privacy@vroomxsafety.com</a> or use the request form in your account settings. We will respond within 30 days.</p>
        </section>

        {/* Section 7 */}
        <section id="cookies">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">7</span>
            Cookies & Tracking Technologies
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">7.1 Types of Cookies We Use</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="bg-primary-500 text-white border border-[#E2E8F0] p-3 text-left font-semibold">Cookie Type</th>
                  <th className="bg-primary-500 text-white border border-[#E2E8F0] p-3 text-left font-semibold">Purpose</th>
                  <th className="bg-primary-500 text-white border border-[#E2E8F0] p-3 text-left font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="bg-white"><td className="border border-[#E2E8F0] p-3">Essential</td><td className="border border-[#E2E8F0] p-3">Authentication, security, basic functionality</td><td className="border border-[#E2E8F0] p-3">Session</td></tr>
                <tr className="bg-gray-50"><td className="border border-[#E2E8F0] p-3">Functional</td><td className="border border-[#E2E8F0] p-3">Remember preferences, settings</td><td className="border border-[#E2E8F0] p-3">1 year</td></tr>
                <tr className="bg-white"><td className="border border-[#E2E8F0] p-3">Analytics</td><td className="border border-[#E2E8F0] p-3">Understand usage patterns, improve platform</td><td className="border border-[#E2E8F0] p-3">2 years</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">7.2 Managing Cookies</h3>
          <p className="text-gray-600 mb-4">You can control cookies through your browser settings. Note that disabling essential cookies may affect platform functionality.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">7.3 Do Not Track</h3>
          <p className="text-gray-600">We currently do not respond to "Do Not Track" browser signals as there is no industry standard for compliance.</p>
        </section>

        {/* Section 8 */}
        <section id="third-party">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">8</span>
            Third-Party Services
          </h2>

          <p className="text-gray-600 mb-4">Our platform integrates with or uses the following third-party services:</p>

          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li><strong className="text-primary-500">Cloud Infrastructure:</strong> Amazon Web Services (AWS) or Google Cloud Platform</li>
            <li><strong className="text-primary-500">Payment Processing:</strong> Stripe</li>
            <li><strong className="text-primary-500">Email Delivery:</strong> SendGrid or AWS SES</li>
            <li><strong className="text-primary-500">Analytics:</strong> Google Analytics, Mixpanel</li>
            <li><strong className="text-primary-500">AI Services:</strong> Anthropic (Claude) for AI features</li>
            <li><strong className="text-primary-500">SMS Notifications:</strong> Twilio</li>
          </ul>

          <p className="text-gray-600 mt-4">Each third-party service has its own privacy policy governing their use of your data. We recommend reviewing their policies.</p>
        </section>

        {/* Section 9 */}
        <section id="children">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">9</span>
            Children's Privacy
          </h2>

          <p className="text-gray-600">VroomX Safety is a business-to-business platform not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.</p>
        </section>

        {/* Section 10 */}
        <section id="international">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">10</span>
            International Data Transfers
          </h2>

          <p className="text-gray-600 mb-4">VroomX Safety is based in the United States. If you access our platform from outside the U.S., your information will be transferred to and processed in the United States, which may have different data protection laws than your country.</p>

          <p className="text-gray-600 mb-2">For users in the European Economic Area (EEA), we rely on:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Standard Contractual Clauses approved by the European Commission</li>
            <li>Your explicit consent where applicable</li>
          </ul>
        </section>

        {/* Section 11 */}
        <section id="changes">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">11</span>
            Changes to This Policy
          </h2>

          <p className="text-gray-600 mb-2">We may update this Privacy Policy from time to time. When we make material changes:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>We will update the "Last Updated" date at the top</li>
            <li>We will notify you via email and/or in-app notification</li>
            <li>For significant changes, we may require you to re-acknowledge the policy</li>
          </ul>

          <p className="text-gray-600 mt-4">Your continued use of VroomX Safety after changes become effective constitutes acceptance of the updated policy.</p>
        </section>

        {/* Section 12 */}
        <section id="contact">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">12</span>
            Contact Us
          </h2>

          <p className="text-gray-600 mb-6">If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>

          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-8 text-center text-white">
            <h3 className="text-xl font-semibold mb-4 font-outfit">VroomX Safety Privacy Team</h3>
            <p className="text-white/90 mb-2 flex items-center justify-center gap-2">
              <FiMail className="text-cta-400" /> <a href="mailto:privacy@vroomxsafety.com" className="text-cta-400 hover:underline">privacy@vroomxsafety.com</a>
            </p>
            <p className="text-white/90 mb-2 flex items-center justify-center gap-2">
              <FiPhone className="text-cta-400" /> 1-800-VROOMX-1
            </p>
            <p className="text-white/90 mb-4 flex items-center justify-center gap-2">
              <FiMapPin className="text-cta-400" /> [Your Business Address]
            </p>
            <p className="text-white/70 text-sm pt-4 border-t border-white/20">
              For data protection inquiries in the EU, contact our Data Protection Officer at <a href="mailto:dpo@vroomxsafety.com" className="text-cta-400 hover:underline">dpo@vroomxsafety.com</a>
            </p>
          </div>
        </section>

      </div>

      <FooterSection />
    </div>
  );
};

export default PrivacyPolicy;
