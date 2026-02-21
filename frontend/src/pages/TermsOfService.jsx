import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import { FooterSection } from '../components/landing';
import { FiAlertTriangle, FiInfo, FiAlertCircle, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import useForceLightMode from '../hooks/useForceLightMode';

const TermsOfService = () => {
  useForceLightMode();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PublicHeader activePage="terms" variant="light" />

      {/* Hero Section */}
      <div className="pt-32 pb-12 px-4 bg-primary-500">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-outfit text-white">Terms of Service</h1>
          <p className="text-white/80">
            <span className="text-cta-500 font-semibold">Effective Date:</span> January 25, 2026 |
            <span className="text-cta-500 font-semibold ml-2">Last Updated:</span> January 25, 2026
          </p>
        </div>
      </div>

      {/* Important Notice */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-amber-700 font-semibold mb-2 flex items-center gap-2 font-outfit">
            <FiAlertTriangle /> Important Legal Agreement
          </h3>
          <p className="text-gray-600 text-sm">By accessing or using VroomX Safety, you agree to be bound by these Terms of Service. If you do not agree to all terms, you may not use our platform. These Terms constitute a legally binding agreement between you and VroomX Safety.</p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="max-w-4xl mx-auto px-4 mt-6 mb-8">
        <div className="bg-cta-500/10 border-l-4 border-cta-500 rounded-r-lg p-6">
          <p className="text-gray-700">
            <strong className="text-primary-500">Plain Language Summary:</strong> VroomX Safety provides FMCSA compliance management tools. You're responsible for the accuracy of your data and maintaining your own regulatory compliance. We provide tools to help, but we're not a substitute for professional legal or compliance advice.
          </p>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="max-w-4xl mx-auto px-4 mb-12">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
          <h3 className="text-cta-500 font-semibold mb-4 font-outfit">Table of Contents</h3>
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-2 list-decimal list-inside text-gray-600 text-sm">
            <li><a href="#definitions" className="hover:text-cta-500 transition-colors">Definitions</a></li>
            <li><a href="#account" className="hover:text-cta-500 transition-colors">Account Registration</a></li>
            <li><a href="#services" className="hover:text-cta-500 transition-colors">Services Description</a></li>
            <li><a href="#subscription" className="hover:text-cta-500 transition-colors">Subscription & Billing</a></li>
            <li><a href="#user-responsibilities" className="hover:text-cta-500 transition-colors">User Responsibilities</a></li>
            <li><a href="#acceptable-use" className="hover:text-cta-500 transition-colors">Acceptable Use Policy</a></li>
            <li><a href="#intellectual-property" className="hover:text-cta-500 transition-colors">Intellectual Property</a></li>
            <li><a href="#data-ownership" className="hover:text-cta-500 transition-colors">Data Ownership</a></li>
            <li><a href="#disclaimers" className="hover:text-cta-500 transition-colors">Disclaimers</a></li>
            <li><a href="#limitation" className="hover:text-cta-500 transition-colors">Limitation of Liability</a></li>
            <li><a href="#indemnification" className="hover:text-cta-500 transition-colors">Indemnification</a></li>
            <li><a href="#termination" className="hover:text-cta-500 transition-colors">Termination</a></li>
            <li><a href="#disputes" className="hover:text-cta-500 transition-colors">Dispute Resolution</a></li>
            <li><a href="#general" className="hover:text-cta-500 transition-colors">General Provisions</a></li>
            <li><a href="#contact" className="hover:text-cta-500 transition-colors">Contact Information</a></li>
          </ol>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-4 pb-20 space-y-12">

        {/* Section 1 */}
        <section id="definitions">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
            Definitions
          </h2>

          <p className="text-gray-600 mb-4">In these Terms of Service:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li><strong className="text-primary-500">"VroomX Safety," "we," "us," "our"</strong> refers to VroomX Safety and its affiliates.</li>
            <li><strong className="text-primary-500">"Platform" or "Services"</strong> refers to the VroomX Safety web application, mobile apps, APIs, and related services.</li>
            <li><strong className="text-primary-500">"User," "you," "your"</strong> refers to any individual or entity that accesses or uses the Platform.</li>
            <li><strong className="text-primary-500">"Account"</strong> refers to your registered account on the Platform.</li>
            <li><strong className="text-primary-500">"Content"</strong> refers to any data, documents, text, images, or materials uploaded to or generated by the Platform.</li>
            <li><strong className="text-primary-500">"Driver Data"</strong> refers to information about drivers including DQF records, documents, and compliance information.</li>
            <li><strong className="text-primary-500">"Subscription"</strong> refers to your paid plan providing access to Platform features.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section id="account">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
            Account Registration
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">2.1 Eligibility</h3>
          <p className="text-gray-600 mb-2">To use VroomX Safety, you must:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Be at least 18 years of age</li>
            <li>Have legal authority to enter into this agreement</li>
            <li>If registering on behalf of a company, have authority to bind that company</li>
            <li>Provide accurate, complete, and current information</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">2.2 Account Security</h3>
          <p className="text-gray-600 mb-2">You are responsible for:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Maintaining the confidentiality of your login credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized access</li>
            <li>Ensuring your account information remains accurate and up-to-date</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">2.3 Account Types</h3>
          <p className="text-gray-600 mb-2">VroomX Safety offers different account roles:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li><strong className="text-primary-500">Admin:</strong> Full access to all features, user management, and billing</li>
            <li><strong className="text-primary-500">Manager:</strong> Access to compliance features, can manage drivers</li>
            <li><strong className="text-primary-500">User:</strong> Limited access based on permissions set by Admin</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section id="services">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">3</span>
            Services Description
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">3.1 Platform Features</h3>
          <p className="text-gray-600 mb-2">VroomX Safety provides the following services:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Driver Qualification File (DQF) management and tracking</li>
            <li>Document storage and expiration monitoring</li>
            <li>CSA score tracking and analysis</li>
            <li>FMCSA data synchronization from SAFER Web</li>
            <li>AI-powered regulation assistance</li>
            <li>Compliance alerts and notifications</li>
            <li>DataQ violation challenge assistance</li>
            <li>Reporting and analytics</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">3.2 Service Availability</h3>
          <p className="text-gray-600 mb-2">We strive for 99.9% uptime but do not guarantee uninterrupted access. We may:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Perform scheduled maintenance (with advance notice when possible)</li>
            <li>Experience occasional outages due to factors beyond our control</li>
            <li>Modify, update, or discontinue features with reasonable notice</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">3.3 Third-Party Data</h3>
          <p className="text-gray-600 mb-4">Data retrieved from FMCSA, state DMVs, and other government sources is provided as-is. We do not guarantee the accuracy, completeness, or timeliness of third-party data.</p>

          <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold flex items-center gap-2 mb-2 font-outfit text-primary-500">
              <FiInfo className="text-cta-500" /> AI Features Disclaimer
            </h4>
            <p className="text-gray-600 text-sm">Our AI Regulation Assistant provides general information and suggestions. AI-generated content should be reviewed by qualified professionals and does not constitute legal advice.</p>
          </div>
        </section>

        {/* Section 4 */}
        <section id="subscription">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">4</span>
            Subscription & Billing
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">4.1 Pricing Plans</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="bg-primary-500 text-white border border-[#E2E8F0] p-3 text-left font-semibold">Plan</th>
                  <th className="bg-primary-500 text-white border border-[#E2E8F0] p-3 text-left font-semibold">Monthly Price</th>
                  <th className="bg-primary-500 text-white border border-[#E2E8F0] p-3 text-left font-semibold">Drivers Included</th>
                  <th className="bg-primary-500 text-white border border-[#E2E8F0] p-3 text-left font-semibold">Additional Drivers</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="bg-white"><td className="border border-[#E2E8F0] p-3">Owner-Operator</td><td className="border border-[#E2E8F0] p-3">$29/month</td><td className="border border-[#E2E8F0] p-3">1 driver</td><td className="border border-[#E2E8F0] p-3">N/A</td></tr>
                <tr className="bg-gray-50"><td className="border border-[#E2E8F0] p-3">Small Fleet</td><td className="border border-[#E2E8F0] p-3">$79/month</td><td className="border border-[#E2E8F0] p-3">5 drivers</td><td className="border border-[#E2E8F0] p-3">$8/driver/month</td></tr>
                <tr className="bg-white"><td className="border border-[#E2E8F0] p-3">Fleet Pro</td><td className="border border-[#E2E8F0] p-3">$149/month</td><td className="border border-[#E2E8F0] p-3">15 drivers</td><td className="border border-[#E2E8F0] p-3">$6/driver/month</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-600 mt-4">Annual billing is available at 25% off ($261/yr, $711/yr, $1,341/yr).</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">4.2 Payment Terms</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Subscriptions are billed in advance on a monthly or annual basis</li>
            <li>Payment is due at the start of each billing cycle</li>
            <li>All fees are non-refundable except as required by law or stated in our refund policy</li>
            <li>We accept major credit cards and ACH payments</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">4.3 Price Changes</h3>
          <p className="text-gray-600">We may change pricing with 30 days' notice. Price increases will not affect your current billing cycle and will take effect at your next renewal.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">4.4 Failed Payments</h3>
          <p className="text-gray-600 mb-2">If payment fails:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>We will attempt to charge your payment method up to 3 times</li>
            <li>You will receive email notifications about the failed payment</li>
            <li>After 14 days of non-payment, your account may be suspended</li>
            <li>After 30 days, your account may be terminated</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">4.5 Refund Policy</h3>
          <p className="text-gray-600 mb-2">We offer a 14-day money-back guarantee for new subscriptions. After 14 days, refunds are provided only for:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Extended service outages (more than 24 consecutive hours)</li>
            <li>Billing errors</li>
            <li>As required by applicable law</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section id="user-responsibilities">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">5</span>
            User Responsibilities
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">5.1 Data Accuracy</h3>
          <p className="text-gray-600 mb-2">You are solely responsible for:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>The accuracy and completeness of all data you enter</li>
            <li>Verifying that documents and information are current and valid</li>
            <li>Maintaining your own compliance with FMCSA regulations</li>
            <li>Backing up your data (though we maintain our own backups)</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">5.2 Compliance Responsibility</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
            <h4 className="text-red-600 font-semibold flex items-center gap-2 mb-2 font-outfit">
              <FiAlertCircle /> Critical Disclaimer
            </h4>
            <p className="text-gray-600 text-sm">VroomX Safety is a compliance management TOOL, not a compliance guarantee. You remain fully responsible for ensuring your operations comply with all applicable FMCSA, DOT, and state regulations. Our platform helps you organize and track compliance data but does not replace the need for qualified safety and compliance professionals.</p>
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">5.3 Document Authenticity</h3>
          <p className="text-gray-600">You warrant that all documents uploaded are authentic and have not been altered, forged, or falsified. Uploading fraudulent documents is strictly prohibited and may result in immediate account termination and legal action.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">5.4 Driver Consent</h3>
          <p className="text-gray-600">Before entering driver personal information into VroomX Safety, you must obtain appropriate consent from drivers for the collection, storage, and processing of their data in accordance with applicable privacy laws.</p>
        </section>

        {/* Section 6 */}
        <section id="acceptable-use">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">6</span>
            Acceptable Use Policy
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">6.1 Prohibited Activities</h3>
          <p className="text-gray-600 mb-2">You agree NOT to:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Use the Platform for any illegal purpose</li>
            <li>Upload false, fraudulent, or misleading information</li>
            <li>Attempt to gain unauthorized access to the Platform or other users' accounts</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Platform</li>
            <li>Use automated tools to scrape, crawl, or extract data</li>
            <li>Transmit viruses, malware, or other harmful code</li>
            <li>Interfere with or disrupt the Platform's operation</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Resell or redistribute access to the Platform without authorization</li>
            <li>Use the AI features to generate content that is illegal, harmful, or violates regulations</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">6.2 Enforcement</h3>
          <p className="text-gray-600 mb-2">We reserve the right to:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Investigate suspected violations</li>
            <li>Suspend or terminate accounts that violate these terms</li>
            <li>Report illegal activities to law enforcement</li>
            <li>Remove content that violates our policies</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section id="intellectual-property">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">7</span>
            Intellectual Property
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">7.1 Our Intellectual Property</h3>
          <p className="text-gray-600 mb-2">VroomX Safety owns all rights to:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>The Platform software, code, and architecture</li>
            <li>Our trademarks, logos, and branding</li>
            <li>Documentation, tutorials, and training materials</li>
            <li>AI models and algorithms (excluding outputs specific to your data)</li>
            <li>Any improvements or modifications to the Platform</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">7.2 License Grant</h3>
          <p className="text-gray-600">We grant you a limited, non-exclusive, non-transferable license to use the Platform for your internal business purposes during your active subscription.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">7.3 Feedback</h3>
          <p className="text-gray-600">If you provide suggestions, ideas, or feedback about the Platform, we may use them without compensation or attribution to you.</p>
        </section>

        {/* Section 8 */}
        <section id="data-ownership">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">8</span>
            Data Ownership
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">8.1 Your Data</h3>
          <p className="text-gray-600 mb-2">You retain all ownership rights to the data you upload to VroomX Safety, including:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Driver information and documents</li>
            <li>Company records and compliance data</li>
            <li>Any content you create within the Platform</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">8.2 License to Use Your Data</h3>
          <p className="text-gray-600 mb-2">You grant us a limited license to:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Store, process, and display your data to provide the Services</li>
            <li>Create backups for disaster recovery</li>
            <li>Generate anonymized, aggregated analytics (that cannot identify you)</li>
            <li>Use your data with AI features to provide personalized services</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">8.3 Data Export</h3>
          <p className="text-gray-600">You may export your data at any time through the Platform's export features. Upon account termination, you will have 30 days to export your data before it is permanently deleted.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">8.4 Data Protection</h3>
          <p className="text-gray-600">Our handling of your data is governed by our <Link to="/privacy" className="text-cta-500 hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference.</p>
        </section>

        {/* Section 9 */}
        <section id="disclaimers">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">9</span>
            Disclaimers
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">9.1 "As Is" Provision</h3>
          <p className="text-gray-600 mb-2 uppercase">THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 uppercase text-sm">
            <li>WARRANTIES OF MERCHANTABILITY</li>
            <li>FITNESS FOR A PARTICULAR PURPOSE</li>
            <li>NON-INFRINGEMENT</li>
            <li>ACCURACY OR COMPLETENESS OF CONTENT</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">9.2 No Guarantee of Results</h3>
          <p className="text-gray-600 mb-2">We do not guarantee that:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Using VroomX Safety will ensure FMCSA compliance</li>
            <li>Your CSA scores will improve</li>
            <li>DataQ challenges will be successful</li>
            <li>You will avoid fines, penalties, or audit findings</li>
            <li>Third-party data (FMCSA, DMV, etc.) will be accurate or current</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">9.3 Not Legal Advice</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
            <h4 className="text-red-600 font-semibold flex items-center gap-2 mb-2 font-outfit">
              <FiAlertCircle /> Legal Disclaimer
            </h4>
            <p className="text-gray-600 text-sm">VroomX Safety does not provide legal, regulatory, or professional compliance advice. Information provided by the Platform, including AI-generated content, is for informational purposes only. Consult with qualified attorneys, safety consultants, and compliance professionals for advice specific to your situation.</p>
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">9.4 AI Limitations</h3>
          <p className="text-gray-600">Our AI features may occasionally produce inaccurate, incomplete, or outdated information. AI-generated content should always be reviewed and verified by qualified humans before relying on it for compliance decisions.</p>
        </section>

        {/* Section 10 */}
        <section id="limitation">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">10</span>
            Limitation of Liability
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">10.1 Exclusion of Damages</h3>
          <p className="text-gray-600 mb-2 uppercase">TO THE MAXIMUM EXTENT PERMITTED BY LAW, VROOMX SAFETY SHALL NOT BE LIABLE FOR:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Any indirect, incidental, special, consequential, or punitive damages</li>
            <li>Loss of profits, revenue, data, or business opportunities</li>
            <li>Regulatory fines, penalties, or sanctions</li>
            <li>Costs of substitute services</li>
            <li>Any damages arising from your use of or inability to use the Platform</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">10.2 Cap on Liability</h3>
          <p className="text-gray-600 mb-2 uppercase">OUR TOTAL LIABILITY FOR ALL CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR THE PLATFORM SHALL NOT EXCEED THE GREATER OF:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>The amount you paid us in the 12 months preceding the claim, OR</li>
            <li>One hundred dollars ($100)</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">10.3 Essential Purpose</h3>
          <p className="text-gray-600">These limitations apply even if any remedy fails of its essential purpose and regardless of the theory of liability (contract, tort, strict liability, or otherwise).</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">10.4 Jurisdictional Limitations</h3>
          <p className="text-gray-600">Some jurisdictions do not allow the exclusion of certain warranties or limitations of liability. In such cases, our liability will be limited to the maximum extent permitted by applicable law.</p>
        </section>

        {/* Section 11 */}
        <section id="indemnification">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">11</span>
            Indemnification
          </h2>

          <p className="text-gray-600 mb-2">You agree to indemnify, defend, and hold harmless VroomX Safety, its officers, directors, employees, agents, and affiliates from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Your use of the Platform</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any applicable laws or regulations</li>
            <li>Your violation of any third-party rights</li>
            <li>Any data or content you upload to the Platform</li>
            <li>Your failure to maintain FMCSA compliance</li>
            <li>Any fraudulent or false information you provide</li>
          </ul>
        </section>

        {/* Section 12 */}
        <section id="termination">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">12</span>
            Termination
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">12.1 Termination by You</h3>
          <p className="text-gray-600">You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of your current billing period. You will retain access until then.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">12.2 Termination by Us</h3>
          <p className="text-gray-600 mb-2">We may suspend or terminate your account:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li><strong className="text-primary-500">Immediately</strong> for violations of the Acceptable Use Policy, fraudulent activity, or illegal conduct</li>
            <li><strong className="text-primary-500">With 30 days' notice</strong> for non-payment, repeated Terms violations, or if we discontinue the Platform</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">12.3 Effect of Termination</h3>
          <p className="text-gray-600 mb-2">Upon termination:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Your right to access the Platform ends immediately (or at billing period end for voluntary cancellation)</li>
            <li>You have 30 days to export your data</li>
            <li>After 30 days, your data will be permanently deleted</li>
            <li>You remain responsible for any fees incurred before termination</li>
            <li>Sections 7-11, 13, and 14 survive termination</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">12.4 Refunds on Termination</h3>
          <p className="text-gray-600">No refunds are provided for termination due to Terms violations. For other terminations, refunds are handled per Section 4.5.</p>
        </section>

        {/* Section 13 */}
        <section id="disputes">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">13</span>
            Dispute Resolution
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">13.1 Informal Resolution</h3>
          <p className="text-gray-600">Before filing any formal dispute, you agree to contact us at <a href="mailto:legal@vroomxsafety.com" className="text-cta-500 hover:underline">legal@vroomxsafety.com</a> and attempt to resolve the dispute informally for at least 30 days.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">13.2 Binding Arbitration</h3>
          <p className="text-gray-600">If informal resolution fails, any dispute shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules. Arbitration will take place in Pennsylvania, and the arbitrator's decision will be final and binding.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">13.3 Class Action Waiver</h3>
          <p className="text-gray-600 uppercase">YOU AGREE TO RESOLVE DISPUTES ONLY ON AN INDIVIDUAL BASIS AND WAIVE ANY RIGHT TO PARTICIPATE IN CLASS ACTIONS, CLASS ARBITRATIONS, OR REPRESENTATIVE ACTIONS.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">13.4 Exceptions</h3>
          <p className="text-gray-600">Either party may seek injunctive relief in court for intellectual property infringement or unauthorized access to the Platform.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">13.5 Governing Law</h3>
          <p className="text-gray-600">These Terms are governed by the laws of the Commonwealth of Pennsylvania, United States, without regard to conflict of law principles.</p>
        </section>

        {/* Section 14 */}
        <section id="general">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">14</span>
            General Provisions
          </h2>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">14.1 Entire Agreement</h3>
          <p className="text-gray-600">These Terms, together with our Privacy Policy, constitute the entire agreement between you and VroomX Safety regarding the Platform.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">14.2 Severability</h3>
          <p className="text-gray-600">If any provision is found unenforceable, the remaining provisions will continue in full force.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">14.3 Waiver</h3>
          <p className="text-gray-600">Our failure to enforce any provision does not waive our right to enforce it later.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">14.4 Assignment</h3>
          <p className="text-gray-600">You may not assign your rights under these Terms without our written consent. We may assign our rights to any successor or affiliate.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">14.5 Force Majeure</h3>
          <p className="text-gray-600">We are not liable for delays or failures caused by events beyond our reasonable control, including natural disasters, war, terrorism, strikes, or government actions.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">14.6 Notices</h3>
          <p className="text-gray-600">We will send notices via email to your registered address or through the Platform. You may send notices to <a href="mailto:legal@vroomxsafety.com" className="text-cta-500 hover:underline">legal@vroomxsafety.com</a>.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">14.7 Changes to Terms</h3>
          <p className="text-gray-600">We may modify these Terms at any time. Material changes will be communicated via email and/or in-app notification at least 30 days before taking effect. Continued use after changes become effective constitutes acceptance.</p>

          <h3 className="text-lg font-semibold mt-6 mb-3 font-outfit text-primary-500">14.8 Headings</h3>
          <p className="text-gray-600">Section headings are for convenience only and do not affect interpretation.</p>
        </section>

        {/* Section 15 */}
        <section id="contact">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-cta-500 flex items-center gap-3 font-outfit text-primary-500">
            <span className="bg-cta-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">15</span>
            Contact Information
          </h2>

          <p className="text-gray-600 mb-6">For questions about these Terms of Service, please contact us:</p>

          <div className="bg-gradient-to-br from-primary-500/10 to-primary-500/5 border border-primary-500/20 rounded-xl p-8 text-center">
            <h3 className="text-xl font-semibold mb-4 font-outfit text-primary-500">VroomX Safety Legal Team</h3>
            <p className="text-gray-600 mb-2 flex items-center justify-center gap-2">
              <FiMail className="text-cta-500" /> <a href="mailto:legal@vroomxsafety.com" className="text-cta-500 hover:underline">legal@vroomxsafety.com</a>
            </p>
            <p className="text-gray-600 mb-2 flex items-center justify-center gap-2">
              <FiPhone className="text-cta-500" /> 1-800-VROOMX-1
            </p>
            <p className="text-gray-600 mb-4 flex items-center justify-center gap-2">
              <FiMapPin className="text-cta-500" /> [Your Business Address]
            </p>
            <div className="pt-4 border-t border-[#E2E8F0] text-gray-500 text-sm">
              <p><strong>For support inquiries:</strong> <a href="mailto:support@vroomxsafety.com" className="text-cta-500 hover:underline">support@vroomxsafety.com</a></p>
              <p><strong>For privacy inquiries:</strong> <a href="mailto:privacy@vroomxsafety.com" className="text-cta-500 hover:underline">privacy@vroomxsafety.com</a></p>
            </div>
          </div>
        </section>

        {/* Acknowledgment */}
        <div className="bg-cta-500/10 border-l-4 border-cta-500 rounded-r-lg p-6 mt-12">
          <p className="text-gray-700">
            <strong className="text-primary-500">Acknowledgment:</strong> By creating an account or using VroomX Safety, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
          </p>
        </div>

      </div>

      <FooterSection />
    </div>
  );
};

export default TermsOfService;
