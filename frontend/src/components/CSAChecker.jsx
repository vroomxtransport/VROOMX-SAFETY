import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiMail, FiAlertTriangle, FiCheckCircle, FiArrowRight,
  FiZap, FiRefreshCw, FiActivity, FiAlertCircle
} from 'react-icons/fi';
import CarrierProfileHeader from './csa-checker/CarrierProfileHeader';
import BASICScorePanel from './csa-checker/BASICScorePanel';
import OOSRatesPanel from './csa-checker/OOSRatesPanel';
import CrashHistoryPanel from './csa-checker/CrashHistoryPanel';
import DataQPreviewPanel from './csa-checker/DataQPreviewPanel';

// Futuristic Loading Component
const FuturisticLoader = ({ carrierNumber }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Scan line */}
      <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-cta-500 to-transparent cyber-scan-line" />
      </div>

      <div className="px-4 py-6 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <FiActivity className="w-4 h-4 text-cta-500 data-pulse" />
          <span className="text-xs text-primary-500 font-mono uppercase tracking-wider">Scanning FMCSA</span>
        </div>

        <div className="max-w-xs mx-auto mb-3">
          <div className="h-1 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cta-600 to-cta-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 95)}%` }}
            />
          </div>
        </div>

        <p className="text-[10px] text-zinc-600 dark:text-zinc-300 font-mono">
          {carrierNumber}
        </p>
      </div>
    </div>
  );
};

const CSAChecker = ({ onExpandChange }) => {
  const [step, setStep] = useState('input');
  const [carrierNumber, setCarrierNumber] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [carrierData, setCarrierData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [emailSent, setEmailSent] = useState(true);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ checksThisMonth: 3247 });
  const inputRef = useRef(null);

  useEffect(() => {
    fetch('/api/csa-checker/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (step === 'input' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  // Notify parent of expand/collapse state changes
  useEffect(() => {
    if (onExpandChange) {
      const isExpanded = step === 'preview' || step === 'full';
      onExpandChange(isExpanded);
    }
  }, [step, onExpandChange]);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!carrierNumber.trim()) return;

    setError(null);
    setStep('loading');

    try {
      const response = await fetch('/api/csa-checker/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrierNumber: carrierNumber.trim() })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Carrier not found');
      }

      setCarrierData(data.data);
      setTimeout(() => setStep('preview'), 1200);
    } catch (err) {
      setError(err.message);
      setStep('input');
    }
  };

  const handleFullReport = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setStep('generating');

    try {
      const response = await fetch('/api/csa-checker/full-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrierNumber: carrierNumber.trim(),
          email: email.trim()
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate report');
      }

      setAiAnalysis(data.data.aiAnalysis);
      setCarrierData(data.data);
      setEmailSent(data.data.emailSent !== false);
      setTimeout(() => setStep('full'), 600);
    } catch (err) {
      setError(err.message);
      setStep('preview');
    }
  };

  const handleResendReport = async () => {
    setResending(true);
    try {
      const response = await fetch('/api/csa-checker/full-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrierNumber: carrierNumber.trim(),
          email: email.trim()
        })
      });
      const data = await response.json();
      if (data.success && data.data.emailSent !== false) {
        setEmailSent(true);
      }
    } catch {
      // Keep emailSent as false
    } finally {
      setResending(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setCarrierNumber('');
    setEmail('');
    setConsent(false);
    setCarrierData(null);
    setAiAnalysis(null);
    setEmailSent(true);
    setResending(false);
    setError(null);
  };

  return (
    <div className="csa-card-3d">
      <div className="relative bg-white backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-primary-500/20 border border-[#E2E8F0] shadow-xl shadow-primary-500/10">

        {/* Header */}
        <div className="bg-primary-500 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-dot-pulse" />
            <span className="text-[10px] font-mono text-white uppercase tracking-wider">CSA Score Analyzer</span>
          </div>
          <div className="flex items-center gap-3">
            {(step === 'loading' || step === 'generating') && (
              <span className="text-[9px] font-mono text-cta-300 data-pulse">SCANNING...</span>
            )}
            {(step === 'preview' || step === 'full') && (
              <button
                onClick={handleReset}
                className="text-[9px] font-mono text-white/80 hover:text-white transition-colors flex items-center gap-1"
              >
                <FiRefreshCw className="w-2.5 h-2.5" />
                NEW
              </button>
            )}
          </div>
        </div>

        {/* ===== INPUT STATE ===== */}
        {step === 'input' && (
          <div className="p-5">
            <form onSubmit={handleLookup}>
              <div className="text-center mb-4">
                <p className="text-cta-500 font-bold text-base mb-1">
                  Are you on FMCSA's radar?
                </p>
                <p className="text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
                  High BASICs = audits, fines & lost contracts
                </p>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="w-4 h-4 text-[#94A3B8]" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={carrierNumber}
                    onChange={(e) => setCarrierNumber(e.target.value)}
                    placeholder="MC-123456 or DOT-123456"
                    className="w-full pl-10 pr-4 py-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-primary-500 placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-cta-500/30 focus:border-cta-500 transition-all text-sm font-mono"
                  />
                </div>
                {error && (
                  <p className="mt-2 text-red-500 text-xs flex items-center gap-1">
                    <FiAlertCircle className="w-3 h-3" />
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!carrierNumber.trim()}
                className="w-full btn-glow py-3 rounded-lg font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                See My Risk Level
                <FiArrowRight className="w-4 h-4" />
              </button>

              {/* Trust Badges with Social Proof */}
              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-zinc-700 dark:text-zinc-300 font-semibold">
                <span>100% Free</span>
                <span className="text-zinc-400 font-normal">·</span>
                <span>30 seconds</span>
                <span className="text-zinc-400 font-normal">·</span>
                <span className="text-cta-500 font-bold">{stats.checksThisMonth.toLocaleString()} carriers checked</span>
              </div>
            </form>
          </div>
        )}

        {/* ===== LOADING STATE ===== */}
        {step === 'loading' && (
          <FuturisticLoader carrierNumber={carrierNumber} />
        )}

        {/* ===== PREVIEW STATE (Detailed Profile) ===== */}
        {step === 'preview' && carrierData && (
          <div className="p-4 space-y-4">
            {/* Carrier Profile Header */}
            <CarrierProfileHeader
              carrier={carrierData.carrier}
              riskLevel={carrierData.riskLevel}
              dataSource={carrierData.dataSource}
            />

            <div className="border-t border-[#E2E8F0]" />

            {/* BASIC Scores Panel */}
            <BASICScorePanel
              basics={carrierData.basics}
              alerts={carrierData.alerts}
            />

            {/* OOS Rates + Crash History Grid */}
            {(carrierData.oosRates || carrierData.crashDetail || carrierData.crashes) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <OOSRatesPanel oosRates={carrierData.oosRates} />
                <CrashHistoryPanel
                  crashes={carrierData.crashes}
                  crashDetail={carrierData.crashDetail}
                />
              </div>
            )}

            {/* DataQ Preview */}
            <DataQPreviewPanel dataQOpportunities={carrierData.dataQOpportunities} />

            {/* Mini Stats Row */}
            <div className="py-2 px-3 rounded-lg bg-[#F1F5F9] flex items-center justify-between text-center">
              <div>
                <div className="text-sm font-bold text-primary-500">{carrierData.inspections?.last24Months || 0}</div>
                <div className="text-[9px] text-zinc-600 dark:text-zinc-300">Inspections (24mo)</div>
              </div>
              <div className="h-6 w-px bg-[#E2E8F0]" />
              <div>
                <div className="text-sm font-bold text-primary-500">{carrierData.crashes?.last24Months || 0}</div>
                <div className="text-[9px] text-zinc-600 dark:text-zinc-300">Crashes (24mo)</div>
              </div>
              <div className="h-6 w-px bg-[#E2E8F0]" />
              <div>
                <div className="text-sm font-bold text-primary-500">{carrierData.carrier.fleetSize?.powerUnits || '—'}</div>
                <div className="text-[9px] text-zinc-600 dark:text-zinc-300">Power Units</div>
              </div>
              <div className="h-6 w-px bg-[#E2E8F0]" />
              <div>
                <div className="text-sm font-bold text-primary-500">{carrierData.carrier.fleetSize?.drivers || '—'}</div>
                <div className="text-[9px] text-zinc-600 dark:text-zinc-300">Drivers</div>
              </div>
            </div>

            {/* Email Capture CTA */}
            <div className="p-3 rounded-lg bg-primary-50 border border-primary-200">
              <div className="flex items-center gap-2 mb-1">
                <FiZap className="w-3.5 h-3.5 text-cta-500" />
                <span className="text-xs font-bold text-primary-500">Want to fix these scores?</span>
              </div>
              <p className="text-[10px] text-zinc-600 dark:text-zinc-300 mb-2">
                Get a free AI-powered action plan with specific DataQ challenge recommendations
              </p>
              <form onSubmit={handleFullReport}>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <FiMail className="w-3.5 h-3.5 text-[#94A3B8]" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full pl-8 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-primary-500 placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-cta-500/30 focus:border-cta-500 transition-all text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!email.trim() || !consent}
                    className="btn-glow px-4 py-2 rounded-lg font-bold text-white text-xs whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Send Free Report
                  </button>
                </div>
                {/* Email Consent Checkbox */}
                <label className="flex items-start gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 rounded border-zinc-300 text-cta-500 focus:ring-cta-500/30"
                  />
                  <span className="text-[9px] text-zinc-500 leading-tight group-hover:text-zinc-600">
                    I consent to receive emails from VroomX Safety including this report and promotional content.
                  </span>
                </label>
              </form>
              {error && (
                <p className="mt-2 text-red-500 text-[10px] flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" />
                  {error}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ===== GENERATING STATE ===== */}
        {step === 'generating' && (
          <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-cta-100 mb-3">
              <FiZap className="w-5 h-5 text-cta-500 data-pulse" />
            </div>
            <p className="text-sm font-medium text-primary-500 mb-1">Generating AI Analysis</p>
            <p className="text-[10px] text-zinc-600 dark:text-zinc-300">Analyzing compliance data...</p>
          </div>
        )}

        {/* ===== SUCCESS STATE ===== */}
        {step === 'full' && carrierData && (
          <div className="p-5 text-center">
            {/* Success/Warning Icon */}
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${emailSent ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              {emailSent ? (
                <FiCheckCircle className="w-6 h-6 text-emerald-500" />
              ) : (
                <FiAlertTriangle className="w-6 h-6 text-amber-500" />
              )}
            </div>

            <h3 className="text-lg font-bold text-primary-500 mb-1">
              {emailSent ? 'Report Sent!' : 'Analysis Complete'}
            </h3>
            <p className="text-xs text-zinc-600 mb-4">{carrierData.carrier.legalName}</p>

            {/* Email notification box - success or failure */}
            {emailSent ? (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FiMail className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Check your inbox</span>
                </div>
                <p className="text-[11px] text-emerald-600">
                  Your full CSA analysis with PDF report has been sent to your email.
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FiAlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">Email delivery failed</span>
                </div>
                <p className="text-[11px] text-amber-600 mb-2">
                  Your analysis is ready but we couldn't send the email. Please try again.
                </p>
                <button
                  onClick={handleResendReport}
                  disabled={resending}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <FiRefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                  {resending ? 'Sending...' : 'Resend Report'}
                </button>
              </div>
            )}

            {/* CTA */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
              <p className="text-sm font-semibold text-primary-500 mb-1">
                Ready to take action?
              </p>
              <p className="text-[10px] text-zinc-600 mb-3">
                Track scores, get alerts, challenge violations
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 btn-glow px-6 py-2.5 rounded-lg font-bold text-white text-sm"
              >
                Protect My Authority
                <FiArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[9px] text-zinc-400 mt-2">
                7-day free trial · No card required
              </p>
            </div>

            {/* Check Another */}
            <button
              onClick={handleReset}
              className="mt-4 text-xs text-zinc-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <FiRefreshCw className="w-3 h-3" />
              Check Another Carrier
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSAChecker;
