import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiDollarSign, FiAlertTriangle, FiTrendingUp, FiShield, FiSearch,
  FiCheckCircle, FiArrowRight, FiBarChart2, FiFileText, FiMail,
  FiChevronDown, FiTruck, FiPercent
} from 'react-icons/fi';
import PublicHeader from '../components/PublicHeader';
import { FooterSection } from '../components/landing';
import SEO from '../components/SEO';
import useForceLightMode from '../hooks/useForceLightMode';

// Cost calculation constants
const VIOLATION_COST_MAP = {
  'Unsafe Driving': { key: 'unsafeDriving', avgFine: 2500, insuranceImpact: 0.05, threshold: 65 },
  'HOS Compliance': { key: 'hosCompliance', avgFine: 1600, insuranceImpact: 0.03, threshold: 65 },
  'Vehicle Maintenance': { key: 'vehicleMaintenance', avgFine: 3200, insuranceImpact: 0.04, threshold: 80 },
  'Controlled Substances': { key: 'controlledSubstances', avgFine: 5000, insuranceImpact: 0.08, threshold: 80 },
  'Hazmat Compliance': { key: 'hazmatCompliance', avgFine: 4000, insuranceImpact: 0.06, threshold: 80 },
  'Driver Fitness': { key: 'driverFitness', avgFine: 1200, insuranceImpact: 0.02, threshold: 80 },
  'Crash Indicator': { key: 'crashIndicator', avgFine: 0, insuranceImpact: 0.10, threshold: 65 },
};

const BASE_INSURANCE_PREMIUM = 12000;

function calculateCosts(basics, inspections) {
  const results = [];
  let totalFines = 0;
  let totalInsuranceImpact = 0;
  let basicsAboveThreshold = 0;

  for (const [name, config] of Object.entries(VIOLATION_COST_MAP)) {
    const score = basics?.[config.key];
    if (score == null) continue;

    const aboveThreshold = score >= config.threshold;
    if (aboveThreshold) basicsAboveThreshold++;

    // Estimate violations based on score severity (higher percentile = more violations likely)
    const estimatedViolations = aboveThreshold ? Math.ceil(score / 20) : Math.max(1, Math.floor(score / 30));
    const estimatedFine = estimatedViolations * config.avgFine;
    const insuranceImpact = aboveThreshold ? config.insuranceImpact : 0;

    totalFines += estimatedFine;
    totalInsuranceImpact += insuranceImpact;

    results.push({
      name,
      score,
      threshold: config.threshold,
      aboveThreshold,
      estimatedViolations,
      estimatedFine,
      insuranceImpact,
      avgFine: config.avgFine,
    });
  }

  const insurancePremiumIncrease = Math.round(BASE_INSURANCE_PREMIUM * totalInsuranceImpact);
  const totalAnnualCost = totalFines + insurancePremiumIncrease;

  return {
    breakdowns: results.sort((a, b) => b.estimatedFine - a.estimatedFine),
    totalFines,
    insurancePremiumIncrease,
    totalAnnualCost,
    basicsAboveThreshold,
    totalInsuranceImpactPercent: Math.round(totalInsuranceImpact * 100),
  };
}

function findChallengeableViolations(dataQOpportunities) {
  if (!dataQOpportunities) return null;

  const challengeable = dataQOpportunities.opportunities || [];
  const potentialSavings = dataQOpportunities.estimatedScoreReduction || 0;

  return {
    count: challengeable.length,
    opportunities: challengeable,
    potentialSavings,
  };
}

// FAQ data for this page
const faqData = [
  {
    question: 'How are violation costs calculated?',
    answer: 'We use FMCSA average fine ranges per BASIC category combined with your CSA percentile scores to estimate annual costs. These are approximations based on industry data — actual fines vary by violation type and severity.',
  },
  {
    question: 'How do violations affect my insurance premiums?',
    answer: 'Carriers with BASICs above intervention thresholds typically face 15-30% insurance premium increases. We estimate impact based on which BASICs exceed thresholds and their relative severity to insurers.',
  },
  {
    question: 'What are DataQ challenges?',
    answer: 'DataQ is FMCSA\'s process for requesting corrections to safety data. If a violation has errors, incorrect information, or procedural issues, you can challenge it — potentially removing it from your record and improving your scores.',
  },
  {
    question: 'Can I reduce these costs?',
    answer: 'Yes. Proactive compliance management, DataQ challenges for eligible violations, and improving your safety practices can significantly reduce both direct fines and insurance premium impacts. VroomX helps automate this process.',
  },
];

// FAQ Accordion item
const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className={`border-b border-[#E2E8F0] last:border-b-0 transition-all duration-300 ${isOpen ? 'bg-primary-50/30' : ''}`}>
    <button onClick={onClick} className="w-full px-6 py-5 flex items-center justify-between text-left group">
      <span className={`font-semibold transition-colors ${isOpen ? 'text-primary-600' : 'text-[#1E293B] group-hover:text-primary-600'}`}>
        {question}
      </span>
      <FiChevronDown className={`w-5 h-5 text-[#64748B] transition-transform duration-300 flex-shrink-0 ml-4 ${isOpen ? 'rotate-180 text-primary-600' : ''}`} />
    </button>
    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-48 pb-5' : 'max-h-0'}`}>
      <p className="px-6 text-[#64748B] leading-relaxed">{answer}</p>
    </div>
  </div>
);

// Cost bar chart component
const CostBar = ({ name, score, threshold, aboveThreshold, estimatedFine, avgFine, estimatedViolations, insuranceImpact }) => {
  const maxFine = 25000; // for bar scaling
  const barWidth = Math.min((estimatedFine / maxFine) * 100, 100);

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:border-primary-300 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${aboveThreshold ? 'bg-red-500' : 'bg-emerald-500'}`} />
          <h4 className="font-semibold text-[#1E293B] text-sm">{name}</h4>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${aboveThreshold ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {score}% / {threshold}%
          </span>
          <span className="font-bold text-[#1E293B]">${estimatedFine.toLocaleString()}</span>
        </div>
      </div>

      {/* Bar */}
      <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-700 ${aboveThreshold ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-[#64748B]">
        <span>~{estimatedViolations} violation{estimatedViolations !== 1 ? 's' : ''} x ${avgFine.toLocaleString()} avg fine</span>
        {aboveThreshold && insuranceImpact > 0 && (
          <span className="text-amber-600 font-medium">+{Math.round(insuranceImpact * 100)}% insurance impact</span>
        )}
      </div>
    </div>
  );
};

const ViolationCostCalculator = () => {
  useForceLightMode();

  const [dotNumber, setDotNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [carrierData, setCarrierData] = useState(null);
  const [costAnalysis, setCostAnalysis] = useState(null);
  const [challengeData, setChallengeData] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [email, setEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState(null);

  const resultsRef = useRef(null);
  const inputRef = useRef(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!dotNumber.trim()) return;

    setError(null);
    setLoading(true);
    setCarrierData(null);
    setCostAnalysis(null);
    setChallengeData(null);
    setEmailSent(false);
    setEmailError(null);

    try {
      const response = await fetch('/api/csa-checker/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrierNumber: dotNumber.trim() }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Carrier not found');
      }

      setCarrierData(data.data);

      // Calculate costs from BASIC scores
      const costs = calculateCosts(data.data.basics, data.data.inspections);
      setCostAnalysis(costs);

      // Find challengeable violations
      const challenges = findChallengeableViolations(data.data.dataQOpportunities);
      setChallengeData(challenges);

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailReport = async (e) => {
    e.preventDefault();
    if (!email.trim() || !dotNumber.trim()) return;

    setEmailSending(true);
    setEmailError(null);

    try {
      const response = await fetch('/api/csa-checker/full-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrierNumber: dotNumber.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send report');
      }

      setEmailSent(true);
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      {/* Fixed Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#F8FAFC]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/8 blur-[150px] rounded-full animate-blob" />
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-amber-500/6 blur-[120px] rounded-full animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary-300/10 blur-[100px] rounded-full animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      <SEO
        title="Trucking Violation Cost Calculator | Free CSA Fine Estimator"
        description="See what your CSA violations are really costing you. Free DOT# lookup shows estimated fines, insurance premium impact, and DataQ challenge savings."
        path="/violation-calculator"
        image="/images/og-image.png"
        faqItems={faqData}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Violation Cost Calculator', url: '/violation-calculator' },
        ]}
      />

      {/* Navigation */}
      <PublicHeader activePage="violation-calculator" />

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-sm font-semibold text-red-600">Free Tool — See Your True Violation Costs</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-heading font-black tracking-tight mb-6 leading-[1.1]">
            <span className="text-primary-500">What Are Your Violations</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
              Really Costing You?
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto mb-8 leading-relaxed">
            Enter your DOT# to see estimated{' '}
            <span className="text-red-500 font-semibold">fines</span>,{' '}
            <span className="text-amber-500 font-semibold">insurance increases</span>, and{' '}
            <span className="text-emerald-500 font-semibold">potential savings</span>{' '}
            from DataQ challenges.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm">
            {[
              { icon: FiCheckCircle, text: '100% Free', color: 'text-emerald-500' },
              { icon: FiDollarSign, text: 'Real Cost Estimates', color: 'text-amber-500' },
              { icon: FiShield, text: 'No Signup Required', color: 'text-primary-500' },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2">
                <badge.icon className={`w-5 h-5 ${badge.color}`} />
                <span className="font-semibold text-[#1E293B]">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOT# Input Section */}
      <section className="relative z-10 py-12 px-6">
        <div className="max-w-xl mx-auto">
          <div className="relative">
            {/* Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-red-500/10 rounded-3xl blur-2xl opacity-60" />

            <div className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <FiDollarSign className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="font-bold text-[#1E293B]">Calculate Your Violation Costs</h2>
                  <p className="text-xs text-[#64748B]">Enter your MC# or DOT# below</p>
                </div>
              </div>

              <form onSubmit={handleLookup}>
                <div className="relative mb-4">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={dotNumber}
                    onChange={(e) => setDotNumber(e.target.value)}
                    placeholder="MC-123456 or DOT-123456"
                    className="w-full pl-10 pr-4 py-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-primary-500 placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all text-sm font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!dotNumber.trim() || loading}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 py-3 rounded-lg font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing Violations...
                    </>
                  ) : (
                    <>
                      <FiDollarSign className="w-4 h-4" />
                      Calculate My Costs
                    </>
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {carrierData && costAnalysis && (
        <section ref={resultsRef} className="relative z-10 py-12 px-6">
          <div className="max-w-5xl mx-auto">

            {/* Carrier Info Bar */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                    <FiTruck className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#1E293B]">{carrierData.carrier.legalName}</h3>
                    <div className="flex items-center gap-3 text-sm text-[#64748B]">
                      <span>DOT# {carrierData.carrier.dotNumber}</span>
                      {carrierData.carrier.mcNumber && <span>MC# {carrierData.carrier.mcNumber}</span>}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${carrierData.carrier.operatingStatus === 'AUTHORIZED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {carrierData.carrier.operatingStatus}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-[#1E293B]">{carrierData.inspections?.last24Months ?? 'N/A'}</div>
                    <div className="text-xs text-[#64748B]">Inspections (24mo)</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-[#1E293B]">{carrierData.crashes?.last24Months ?? 'N/A'}</div>
                    <div className="text-xs text-[#64748B]">Crashes (24mo)</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold ${costAnalysis.basicsAboveThreshold > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {costAnalysis.basicsAboveThreshold}
                    </div>
                    <div className="text-xs text-[#64748B]">BASICs Above Threshold</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Annual Cost */}
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg shadow-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <FiDollarSign className="w-5 h-5 text-red-200" />
                  <span className="text-sm font-medium text-red-100">Estimated Annual Cost</span>
                </div>
                <div className="text-3xl md:text-4xl font-black font-heading">
                  ${costAnalysis.totalAnnualCost.toLocaleString()}
                </div>
                <p className="text-xs text-red-200 mt-2">Combined fines + insurance impact</p>
              </div>

              {/* Fine Exposure */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <FiAlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium text-[#64748B]">Estimated Fine Exposure</span>
                </div>
                <div className="text-3xl md:text-4xl font-black text-amber-500 font-heading">
                  ${costAnalysis.totalFines.toLocaleString()}
                </div>
                <p className="text-xs text-[#64748B] mt-2">Based on BASIC scores & avg fines</p>
              </div>

              {/* Insurance Impact */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <FiTrendingUp className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium text-[#64748B]">Insurance Premium Impact</span>
                </div>
                <div className="text-3xl md:text-4xl font-black text-primary-500 font-heading">
                  +${costAnalysis.insurancePremiumIncrease.toLocaleString()}
                </div>
                <p className="text-xs text-[#64748B] mt-2">
                  {costAnalysis.totalInsuranceImpactPercent > 0
                    ? `+${costAnalysis.totalInsuranceImpactPercent}% on $${BASE_INSURANCE_PREMIUM.toLocaleString()} base`
                    : 'No BASICs above threshold'}
                </p>
              </div>
            </div>

            {/* Per-BASIC Breakdown */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <FiBarChart2 className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#1E293B]">Cost Breakdown by BASIC</h3>
                  <p className="text-xs text-[#64748B]">Estimated fines per BASIC category based on CSA percentile scores</p>
                </div>
              </div>

              <div className="space-y-3">
                {costAnalysis.breakdowns.map((item, i) => (
                  <CostBar key={i} {...item} />
                ))}
              </div>
            </div>

            {/* DataQ Challenge Savings */}
            {challengeData && challengeData.count > 0 && (
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200 p-8 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <FiFileText className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-emerald-800 mb-2">
                      Potential Savings from DataQ Challenges
                    </h3>
                    <p className="text-sm text-emerald-700 mb-4">
                      We identified <span className="font-bold">{challengeData.count} potential DataQ challenge{challengeData.count !== 1 ? 's' : ''}</span> that
                      could reduce your CSA scores and lower your costs.
                    </p>

                    {challengeData.opportunities.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {challengeData.opportunities.slice(0, 5).map((opp, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-emerald-800">
                              {typeof opp === 'string' ? opp : opp.description || opp.reason || `Challenge opportunity #${i + 1}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {challengeData.potentialSavings > 0 && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full">
                        <FiTrendingUp className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-700">
                          Potential score reduction: up to {challengeData.potentialSavings} percentile points
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Email Capture CTA */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 mb-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FiMail className="w-5 h-5 text-cta-500" />
                    <h3 className="font-bold text-lg text-[#1E293B]">Get Your Detailed Cost Report</h3>
                  </div>
                  <p className="text-sm text-[#64748B]">
                    Receive a comprehensive AI-powered analysis with specific violation details, DataQ challenge recommendations,
                    and a prioritized action plan — delivered to your inbox as a PDF.
                  </p>
                </div>

                {emailSent ? (
                  <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <FiCheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-700">Report sent! Check your inbox.</span>
                  </div>
                ) : (
                  <form onSubmit={handleEmailReport} className="flex flex-col sm:flex-row gap-3 min-w-0 md:min-w-[380px]">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="flex-1 min-w-0 px-4 py-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-cta-500/30 focus:border-cta-500 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={emailSending || !email.trim()}
                      className="px-6 py-3 bg-cta-500 hover:bg-cta-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cta-500/20 whitespace-nowrap"
                    >
                      {emailSending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <FiMail className="w-4 h-4" />
                          Email My Report
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {emailError && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {emailError}
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="text-center text-xs text-[#94A3B8] mb-4 px-4">
              Cost estimates are approximate and based on FMCSA average fine ranges per BASIC category.
              Actual fines, penalties, and insurance impacts vary based on specific violation types, carrier history, and jurisdiction.
              {carrierData.disclaimer && ` ${carrierData.disclaimer}`}
            </div>
          </div>
        </section>
      )}

      {/* How It Helps Section */}
      <section className="relative z-10 py-24 px-6 bg-white/60 backdrop-blur-sm border-y border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-600 font-mono text-xs mb-4 uppercase tracking-wider">
              The Real Cost of Violations
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-500">
              Violations Hit Your <span className="text-red-500">Bottom Line</span> Three Ways
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FiDollarSign,
                title: 'Direct Fines',
                description: 'FMCSA fines range from $1,200 to $16,000+ per violation. Repeat offenders face escalating penalties that can threaten your operating authority.',
                stat: '$16K+',
                statLabel: 'Max fine per violation',
                color: 'red',
              },
              {
                icon: FiTrendingUp,
                title: 'Insurance Premiums',
                description: 'Carriers with BASICs above intervention thresholds pay 15-30% more in annual premiums. Over 3 years, that adds up to tens of thousands.',
                stat: '30%',
                statLabel: 'Premium increase possible',
                color: 'amber',
              },
              {
                icon: FiAlertTriangle,
                title: 'Lost Contracts',
                description: 'Brokers and shippers check CSA scores before awarding loads. High scores mean fewer contracts and lower rates — the hidden cost of poor compliance.',
                stat: '40%',
                statLabel: 'Of shippers check CSA',
                color: 'primary',
              },
            ].map((item, i) => {
              const colorClasses = {
                red: 'bg-red-50 text-red-500 border-red-200',
                amber: 'bg-amber-50 text-amber-500 border-amber-200',
                primary: 'bg-primary-50 text-primary-500 border-primary-200',
              };
              const Icon = item.icon;

              return (
                <div
                  key={i}
                  className="group bg-white rounded-2xl border border-[#E2E8F0] p-8 hover:border-primary-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-xl ${colorClasses[item.color]} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1E293B] mb-3">{item.title}</h3>
                  <p className="text-[#64748B] mb-6 leading-relaxed">{item.description}</p>
                  <div className="pt-4 border-t border-[#E2E8F0]">
                    <div className={`text-2xl font-black font-heading ${colorClasses[item.color].split(' ')[1]}`}>{item.stat}</div>
                    <div className="text-xs text-[#64748B] mt-1">{item.statLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Warning Banner */}
      <section className="relative z-10 py-12 px-6 bg-gradient-to-r from-red-500 to-red-600">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-white">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <FiDollarSign className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Stop Paying for Preventable Violations</h3>
              <p className="text-red-100">Proactive compliance monitoring costs less than a single fine.</p>
            </div>
          </div>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              inputRef.current?.focus();
            }}
            className="px-8 py-4 bg-white text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors flex items-center gap-2 shadow-lg"
          >
            Calculate My Costs
            <FiArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-600 font-mono text-xs mb-4 uppercase tracking-wider">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-500">
              Common <span className="text-[#64748B]">Questions</span>
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            {faqData.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Cross-links */}
      <section className="relative z-10 py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-bold text-primary-500 mb-4 font-heading">Related Tools</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/csa-checker" className="group flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E2E8F0] hover:border-cta-500/30 hover:shadow-md transition-all">
              <FiBarChart2 className="w-5 h-5 text-cta-500 flex-shrink-0" />
              <div>
                <span className="text-sm font-semibold text-primary-500 group-hover:text-cta-500 transition-colors">Free CSA Score Checker</span>
                <p className="text-xs text-[#64748B] mt-0.5">Check all 7 BASIC scores instantly</p>
              </div>
            </Link>
            <Link to="/blog/dataq-challenges-removing-violations" className="group flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E2E8F0] hover:border-cta-500/30 hover:shadow-md transition-all">
              <FiFileText className="w-5 h-5 text-cta-500 flex-shrink-0" />
              <div>
                <span className="text-sm font-semibold text-primary-500 group-hover:text-cta-500 transition-colors">DataQ Challenges Guide</span>
                <p className="text-xs text-[#64748B] mt-0.5">How to challenge unfair violations on your record</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-cta-500/10 to-primary-500/10 rounded-3xl blur-3xl" />

            <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-12 md:p-16 overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-grid-pattern" />
              </div>

              <div className="relative">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-8">
                  <FiShield className="w-4 h-4 text-cta-300" />
                  <span className="text-sm font-semibold text-white/90">7-Day Free Trial — No Card Required</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-6">
                  Stop the Bleeding. Start Saving.
                </h2>
                <p className="text-lg text-primary-100 mb-10 max-w-2xl mx-auto">
                  VroomX monitors your compliance 24/7, identifies DataQ challenge opportunities,
                  and helps you avoid costly violations before they happen.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/register"
                    className="px-8 py-4 bg-cta-500 hover:bg-cta-600 text-white rounded-xl font-bold transition-all duration-200 shadow-lg shadow-cta-500/30 hover:shadow-xl hover:shadow-cta-500/40 flex items-center gap-2"
                  >
                    Protect My Fleet
                    <FiArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/pricing"
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
                  >
                    See Pricing
                  </Link>
                </div>

                <p className="text-sm text-primary-200 mt-8">
                  No credit card required. Cancel anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default ViolationCostCalculator;
