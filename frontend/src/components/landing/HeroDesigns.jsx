import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiArrowRight,
  FiPlay,
  FiLoader,
  FiCheck,
  FiLock,
  FiAlertTriangle,
  FiClock,
  FiTruck,
  FiAlertCircle,
  FiDroplet,
  FiShield,
  FiUser,
  FiRefreshCw,
  FiActivity,
  FiCheckCircle,
  FiMail,
  FiSend,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import CarrierProfileHeader from '../csa-checker/CarrierProfileHeader';
import BASICScorePanel from '../csa-checker/BASICScorePanel';
import OOSRatesPanel from '../csa-checker/OOSRatesPanel';
import CrashHistoryPanel from '../csa-checker/CrashHistoryPanel';
import DataQPreviewPanel from '../csa-checker/DataQPreviewPanel';

/**
 * Design 5: Video Background with Floating Action Panel
 * Full-width video background, condensed action panel floating center-right with form/CTA
 */
// BASIC category configuration for inline display
const BASIC_CONFIG = [
  { key: 'unsafeDriving', name: 'Unsafe Driving', shortName: 'Unsafe Drv', threshold: 65, icon: FiAlertTriangle },
  { key: 'hosCompliance', name: 'HOS Compliance', shortName: 'HOS', threshold: 65, icon: FiClock },
  { key: 'vehicleMaintenance', name: 'Vehicle Maint', shortName: 'Vehicle', threshold: 80, icon: FiTruck },
  { key: 'crashIndicator', name: 'Crash Indicator', shortName: 'Crash', threshold: 65, icon: FiAlertCircle },
  { key: 'controlledSubstances', name: 'Ctrl Substances', shortName: 'Drug/Alc', threshold: 80, icon: FiDroplet },
  { key: 'hazmatCompliance', name: 'Hazmat', shortName: 'Hazmat', threshold: 80, icon: FiShield },
  { key: 'driverFitness', name: 'Driver Fitness', shortName: 'Fitness', threshold: 80, icon: FiUser }
];

const getScoreStatus = (score, threshold) => {
  if (score === null || score === undefined) return { color: 'gray', status: 'none' };
  if (score >= threshold) return { color: 'red', status: 'danger' };
  if (score >= threshold - 15) return { color: 'amber', status: 'warning' };
  return { color: 'green', status: 'good' };
};

export const HeroDesign5 = ({ heroTextIndex, heroTexts }) => {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const [dotNumber, setDotNumber] = useState('');
  const [csaStep, setCsaStep] = useState('input'); // 'input' | 'loading' | 'preview'
  const [carrierData, setCarrierData] = useState(null);
  const [csaError, setCsaError] = useState(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [reportStep, setReportStep] = useState('idle'); // 'idle' | 'sending' | 'sent'

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (error) {
      console.error('Demo login failed:', error);
      alert('Demo is temporarily unavailable. Please try again later.');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleCheckScore = async () => {
    if (!dotNumber.trim()) return;

    setCsaError(null);
    setCsaStep('loading');

    try {
      const response = await fetch('/api/csa-checker/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrierNumber: dotNumber.trim() })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Carrier not found');
      }

      setCarrierData(data.data);
      setCsaStep('preview');
    } catch (err) {
      setCsaError(err.message);
      setCsaStep('input');
    }
  };

  const handleReset = () => {
    setCsaStep('input');
    setDotNumber('');
    setCarrierData(null);
    setCsaError(null);
    setEmail('');
    setEmailError(null);
    setReportStep('idle');
  };

  const handleGetReport = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email');
      return;
    }

    setEmailError(null);
    setReportStep('sending');

    try {
      const response = await fetch('/api/csa-checker/full-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrierNumber: dotNumber.trim(), email: trimmed })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate report');
      }

      setReportStep('sent');
    } catch (err) {
      setEmailError(err.message);
      setReportStep('idle');
    }
  };

  return (
    <section className="relative min-h-[85vh] overflow-hidden">
      {/* === HERO BACKGROUND — Cinematic truck photo === */}
      <div className="absolute inset-0">
        {/* Background image */}
        <img
          src="/images/hero-bg-truck.jpg"
          alt="Semi truck on open highway representing FMCSA-regulated commercial fleet"
          width="1920"
          height="1080"
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[center_40%]"
        />
        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to right, rgba(5,10,18,0.75) 0%, rgba(5,10,18,0.5) 40%, rgba(5,10,18,0.35) 100%)',
        }} />
        {/* Bottom vignette */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, rgba(5,10,18,0.8) 0%, transparent 30%)',
        }} />
        {/* Top vignette */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(5,10,18,0.5) 0%, transparent 25%)',
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-12 min-h-[85vh] flex items-center">
        <div className="grid lg:grid-cols-2 gap-10 items-center w-full">

          {/* Left: Content */}
          <div className="text-white">

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-7xl font-black font-barlow-condensed leading-[1.05] mb-2 text-white">
              The DOT Auditor Just Called.<br />
              <span className="text-cta-400">Are You Ready?</span>
            </h1>
            <h2 className="text-lg sm:text-xl font-semibold text-white/60 mb-4 tracking-wide">
              FMCSA Compliance Software for Owner-Operators &amp; Small Fleets
            </h2>

            <p className="text-lg text-white/50 mb-2 font-medium">
              You didn't start a trucking company to{' '}
              <span key={heroTextIndex} className="typewriter-text text-white/80 font-bold">
                {heroTexts[heroTextIndex]}
              </span>
            </p>

            <p className="text-xl text-white/70 max-w-lg mb-8 leading-relaxed">
              Every driver document tracked. Every expiration caught. Every audit answered — before they even ask. Set it up in 5 minutes.
            </p>

            {/* Feature bullets */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              {[
                'CSA Score Monitoring',
                'Document Expiration Alerts',
                'DQF File Management',
                'DataQ Challenges',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <FiCheck className="w-5 h-5 text-success-400 flex-shrink-0" />
                  <span className="text-base text-white/80">{feature}</span>
                </div>
              ))}
            </div>

            {/* Trust signals */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success-500/20 flex items-center justify-center">
                  <FiShield className="w-5 h-5 text-success-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">FMCSA Data Direct</div>
                  <div className="text-xs text-white/50">Official SMS source</div>
                </div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cta-500/20 flex items-center justify-center">
                  <FiLock className="w-5 h-5 text-cta-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">AES-256 Encryption</div>
                  <div className="text-xs text-white/50">256-bit SSL secured</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Floating Action Panel */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-6 bg-cta-500/20 blur-3xl rounded-3xl" />

            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 overflow-hidden">
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 bg-grid-lines opacity-[0.03] pointer-events-none" />

              <div className="relative">
                {/* ===== INPUT STATE ===== */}
                {csaStep === 'input' && (
                  <>
                    {/* Header */}
                    <div className="text-center mb-5">
                      <h2 className="text-2xl font-bold text-primary-500 mb-1">Check Your CSA Score</h2>
                      <p className="text-zinc-500 text-base">Free instant lookup — no signup required</p>
                    </div>

                    {/* Live activity indicator */}
                    <div className="flex items-center justify-center gap-2 mb-4 text-xs text-zinc-500">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                      <span>247 checks in the last hour</span>
                    </div>

                    {/* Form */}
                    <div className="space-y-3 mb-5">
                      <div>
                        <label className="block text-sm font-semibold text-zinc-700 mb-1.5">DOT Number</label>
                        <input
                          type="text"
                          value={dotNumber}
                          onChange={(e) => setDotNumber(e.target.value)}
                          placeholder="Enter your DOT#"
                          className="w-full px-4 py-3 rounded-xl border-2 border-[#E2E8F0] bg-white/80
                                     focus:border-cta-500 focus:shadow-[0_0_0_4px_rgba(249,115,22,0.15)]
                                     transition-all duration-200 placeholder:text-zinc-400"
                          onKeyDown={(e) => e.key === 'Enter' && handleCheckScore()}
                        />
                        {csaError && (
                          <p className="mt-2 text-red-500 text-sm flex items-center gap-1">
                            <FiAlertCircle className="w-4 h-4" />
                            {csaError}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={handleCheckScore}
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-cta-500 to-cta-600
                                   hover:shadow-lg hover:shadow-cta-500/40 hover:-translate-y-0.5
                                   active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        Check My Score
                        <FiArrowRight className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#E2E8F0]" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-4 bg-white text-sm text-zinc-400">or</span>
                      </div>
                    </div>

                    {/* Alt Actions */}
                    <div className="flex gap-3">
                      <Link
                        to="/pricing"
                        className="flex-1 py-3 rounded-xl font-semibold text-center text-primary-500 bg-primary-50 hover:bg-primary-100 transition-colors"
                      >
                        View Pricing
                      </Link>
                      <button
                        onClick={handleTryDemo}
                        disabled={demoLoading}
                        className="flex-1 py-3 rounded-xl font-semibold text-center text-white bg-primary-500 hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                      >
                        {demoLoading ? (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <FiPlay className="w-4 h-4" />
                            Try Demo
                          </>
                        )}
                      </button>
                    </div>

                    {/* Enhanced trust badges */}
                    <div className="mt-5 pt-5 border-t border-[#E2E8F0] grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <FiLock className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-medium text-zinc-600">SSL Secure</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <FiCheck className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-medium text-zinc-600">No Card Needed</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <FiClock className="w-4 h-4 text-cta-500" />
                        <span className="text-xs font-medium text-zinc-600">5 Min Setup</span>
                      </div>
                    </div>
                  </>
                )}

                {/* ===== LOADING STATE ===== */}
                {csaStep === 'loading' && (
                  <div className="py-8 text-center">
                    <div className="inline-flex items-center gap-2 mb-4">
                      <FiActivity className="w-5 h-5 text-cta-500 animate-pulse" />
                      <span className="text-sm text-primary-500 font-mono uppercase tracking-wider">Scanning FMCSA</span>
                    </div>
                    <div className="max-w-xs mx-auto mb-4">
                      <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cta-600 to-cta-400 rounded-full animate-pulse w-3/4" />
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono">{dotNumber}</p>
                  </div>
                )}

                {/* ===== PREVIEW STATE ===== */}
                {csaStep === 'preview' && carrierData && (
                  <div className="space-y-4">
                    {/* Reset button */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleReset}
                        className="text-xs text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
                      >
                        <FiRefreshCw className="w-3 h-3" />
                        New
                      </button>
                    </div>

                    {/* Carrier Profile Header */}
                    <CarrierProfileHeader
                      carrier={carrierData.carrier}
                      riskLevel={carrierData.riskLevel}
                      dataSource={carrierData.dataSource}
                    />

                    <div className="border-t border-[#E2E8F0]" />

                    {/* BASIC Scores */}
                    <BASICScorePanel
                      basics={carrierData.basics}
                      alerts={carrierData.alerts}
                    />

                    {/* OOS Rates + Crash History */}
                    {(carrierData.oosRates || carrierData.crashDetail || carrierData.crashes) && (
                      <div className="grid grid-cols-1 gap-4">
                        <OOSRatesPanel oosRates={carrierData.oosRates} />
                        <CrashHistoryPanel
                          crashes={carrierData.crashes}
                          crashDetail={carrierData.crashDetail}
                        />
                      </div>
                    )}

                    {/* DataQ Opportunities */}
                    <DataQPreviewPanel dataQOpportunities={carrierData.dataQOpportunities} />

                    {/* Email Capture & Actions */}
                    <div className="pt-2 space-y-2">
                      {reportStep === 'sent' ? (
                        <>
                          <div className="px-3 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                            <FiCheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                            <p className="text-sm font-semibold text-emerald-700">Report sent to {email}!</p>
                            <p className="text-xs text-emerald-600 mt-0.5">Check your inbox for the full AI analysis with PDF.</p>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              to="/pricing"
                              className="flex-1 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-cta-500 to-cta-600
                                         hover:shadow-lg hover:shadow-cta-500/40 transition-all text-sm text-center"
                            >
                              Protect My Fleet
                            </Link>
                            <button
                              onClick={handleReset}
                              className="px-4 py-2.5 rounded-xl font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors text-sm"
                            >
                              Check Another
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                  type="email"
                                  value={email}
                                  onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                                  placeholder="Enter your email for full AI report"
                                  disabled={reportStep === 'sending'}
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-[#E2E8F0] bg-white/80
                                             focus:border-cta-500 focus:shadow-[0_0_0_4px_rgba(249,115,22,0.15)]
                                             transition-all duration-200 placeholder:text-zinc-400 text-sm
                                             disabled:opacity-60 disabled:cursor-not-allowed"
                                  onKeyDown={(e) => e.key === 'Enter' && handleGetReport()}
                                />
                              </div>
                            </div>
                            {emailError && (
                              <p className="mt-1 text-red-500 text-xs flex items-center gap-1">
                                <FiAlertCircle className="w-3 h-3" />
                                {emailError}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={handleGetReport}
                            disabled={reportStep === 'sending'}
                            className="w-full py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-cta-500 to-cta-600
                                       hover:shadow-lg hover:shadow-cta-500/40 hover:-translate-y-0.5
                                       active:translate-y-0 transition-all duration-200 text-sm flex items-center justify-center gap-2
                                       disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                          >
                            {reportStep === 'sending' ? (
                              <>
                                <FiLoader className="w-4 h-4 animate-spin" />
                                Generating Report...
                              </>
                            ) : (
                              <>
                                Send My Free Report
                                <FiSend className="w-4 h-4" />
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleReset}
                            disabled={reportStep === 'sending'}
                            className="w-full py-2 rounded-xl font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors text-sm
                                       disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Check Another
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Trust badges for preview state */}
                {csaStep !== 'input' && csaStep !== 'loading' && (
                  <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex items-center justify-center gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      <FiCheckCircle className="w-3 h-3 text-emerald-500" />
                      <span>Live FMCSA Data</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiLock className="w-3 h-3 text-blue-500" />
                      <span>Secure</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default { HeroDesign5 };
