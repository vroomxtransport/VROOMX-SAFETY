import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiMail, FiAlertTriangle, FiCheckCircle, FiArrowRight,
  FiShield, FiTruck, FiClock, FiAlertCircle, FiDroplet, FiUser,
  FiZap, FiRefreshCw, FiActivity
} from 'react-icons/fi';

// BASIC category configuration with short names for compact display
const BASIC_CONFIG = [
  { key: 'unsafeDriving', name: 'Unsafe Driving', shortName: 'Unsafe Drv', threshold: 65, icon: FiAlertTriangle },
  { key: 'hosCompliance', name: 'HOS Compliance', shortName: 'HOS', threshold: 65, icon: FiClock },
  { key: 'vehicleMaintenance', name: 'Vehicle Maint', shortName: 'Vehicle', threshold: 80, icon: FiTruck },
  { key: 'crashIndicator', name: 'Crash Indicator', shortName: 'Crash', threshold: 65, icon: FiAlertCircle },
  { key: 'controlledSubstances', name: 'Ctrl Substances', shortName: 'Drug/Alc', threshold: 80, icon: FiDroplet },
  { key: 'hazmatCompliance', name: 'Hazmat', shortName: 'Hazmat', threshold: 80, icon: FiShield },
  { key: 'driverFitness', name: 'Driver Fitness', shortName: 'Fitness', threshold: 80, icon: FiUser }
];

// Get color based on score and threshold
const getScoreStatus = (score, threshold) => {
  if (score === null || score === undefined) return { color: 'gray', label: 'N/A', status: 'none' };
  if (score >= threshold) return { color: 'red', label: '!', status: 'danger' };
  if (score >= threshold - 15) return { color: 'amber', label: '', status: 'warning' };
  return { color: 'green', label: '', status: 'good' };
};

// Compact Score Row Component
const CompactScoreRow = ({ basic, score, delay = 0 }) => {
  const [width, setWidth] = useState(0);
  const status = getScoreStatus(score, basic.threshold);
  const Icon = basic.icon;

  useEffect(() => {
    if (score !== null && score !== undefined) {
      const timer = setTimeout(() => setWidth(score), delay);
      return () => clearTimeout(timer);
    }
  }, [score, delay]);

  const barColors = {
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    gray: 'bg-gray-400'
  };

  const textColors = {
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    gray: 'text-[#94A3B8]'
  };

  return (
    <div className="flex items-center gap-2 py-1 group">
      <Icon className={`w-3 h-3 flex-shrink-0 ${textColors[status.color]} opacity-60 group-hover:opacity-100 transition-opacity`} />
      <span className="w-16 text-[10px] text-[#475569] truncate">{basic.shortName}</span>
      <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColors[status.color]} transition-all duration-700 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className={`w-8 text-right text-[10px] font-mono font-medium ${textColors[status.color]}`}>
        {score !== null && score !== undefined ? `${score}%` : '—'}
      </span>
      {status.status === 'danger' && (
        <span className="w-3 text-[9px] text-red-500 font-black">!</span>
      )}
    </div>
  );
};

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

        <p className="text-[10px] text-[#475569] font-mono">
          {carrierNumber}
        </p>
      </div>
    </div>
  );
};

const CSAChecker = () => {
  const [step, setStep] = useState('input');
  const [carrierNumber, setCarrierNumber] = useState('');
  const [email, setEmail] = useState('');
  const [carrierData, setCarrierData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
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
      setTimeout(() => setStep('full'), 600);
    } catch (err) {
      setError(err.message);
      setStep('preview');
    }
  };

  const handleReset = () => {
    setStep('input');
    setCarrierNumber('');
    setEmail('');
    setCarrierData(null);
    setAiAnalysis(null);
    setError(null);
  };

  const alertCount = carrierData?.alerts?.count || 0;

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
            {step === 'input' && (
              <span className="text-[9px] font-mono text-white/80">
                {stats.checksThisMonth.toLocaleString()} checked
              </span>
            )}
            {(step === 'loading' || step === 'generating') && (
              <span className="text-[9px] font-mono text-cta-300 data-pulse">SCANNING...</span>
            )}
            {step === 'preview' && (
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
                <p className="text-primary-500 font-semibold text-sm mb-1">
                  Are you on FMCSA's radar?
                </p>
                <p className="text-[#475569] text-xs">
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
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#475569]">
                <span>100% Free</span>
                <span className="text-[#94A3B8]">·</span>
                <span>30 seconds</span>
                <span className="text-[#94A3B8]">·</span>
                <span className="text-cta-500 font-medium">{stats.checksThisMonth.toLocaleString()} carriers checked</span>
              </div>
            </form>
          </div>
        )}

        {/* ===== LOADING STATE ===== */}
        {step === 'loading' && (
          <FuturisticLoader carrierNumber={carrierNumber} />
        )}

        {/* ===== PREVIEW STATE ===== */}
        {step === 'preview' && carrierData && (
          <div className="p-4">
            {/* Compact Company Header */}
            <div className="mb-3 pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-bold text-primary-500 truncate mb-1">
                {carrierData.carrier.legalName}
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-[#475569] font-mono">
                <span>MC-{carrierData.carrier.mcNumber}</span>
                <span className="text-[#94A3B8]">|</span>
                <span>DOT-{carrierData.carrier.dotNumber}</span>
                <span className="text-[#94A3B8]">|</span>
                <span className={carrierData.carrier.operatingStatus === 'ACTIVE' ? 'text-emerald-500' : 'text-red-500'}>
                  {carrierData.carrier.operatingStatus}
                </span>
              </div>
            </div>

            {/* Urgent Alert Banner */}
            {alertCount > 0 && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                <FiAlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <span className="text-[11px] text-red-600 font-medium">
                  {alertCount} BASIC{alertCount > 1 ? 's' : ''} flagged — You're at risk of FMCSA intervention
                </span>
              </div>
            )}

            {/* Compact Score Grid */}
            <div className="mb-3">
              <div className="text-[9px] font-mono text-[#475569] uppercase tracking-wider mb-2">BASIC Scores</div>
              <div className="space-y-0.5">
                {BASIC_CONFIG.map((basic, index) => (
                  <CompactScoreRow
                    key={basic.key}
                    basic={basic}
                    score={carrierData.basics[basic.key]}
                    delay={index * 80}
                  />
                ))}
              </div>
            </div>

            {/* Mini Stats Row */}
            <div className="mb-4 py-2 px-3 rounded-lg bg-[#F1F5F9] flex items-center justify-between text-center">
              <div>
                <div className="text-sm font-bold text-primary-500">{carrierData.inspections?.last24Months || 0}</div>
                <div className="text-[9px] text-[#475569]">Inspections</div>
              </div>
              <div className="h-6 w-px bg-[#E2E8F0]" />
              <div>
                <div className="text-sm font-bold text-primary-500">{carrierData.crashes?.last24Months || 0}</div>
                <div className="text-[9px] text-[#475569]">Crashes</div>
              </div>
              <div className="h-6 w-px bg-[#E2E8F0]" />
              <div>
                <div className="text-sm font-bold text-primary-500">{carrierData.carrier.fleetSize?.powerUnits || '-'}</div>
                <div className="text-[9px] text-[#475569]">Units</div>
              </div>
            </div>

            {/* Solution-Oriented Email Capture */}
            <div className="p-3 rounded-lg bg-primary-50 border border-primary-200">
              <div className="flex items-center gap-2 mb-1">
                <FiZap className="w-3.5 h-3.5 text-cta-500" />
                <span className="text-xs font-bold text-primary-500">Want to fix these scores?</span>
              </div>
              <p className="text-[10px] text-[#475569] mb-2">
                Get a free action plan with DataQ challenge opportunities
              </p>
              <form onSubmit={handleFullReport} className="flex gap-2">
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
                  disabled={!email.trim()}
                  className="btn-glow px-4 py-2 rounded-lg font-bold text-white text-xs whitespace-nowrap disabled:opacity-40"
                >
                  Send Free Report
                </button>
              </form>
              {error && (
                <p className="mt-2 text-red-500 text-[10px] flex items-center gap-1">
                  <FiAlertCircle className="w-3 h-3" />
                  {error}
                </p>
              )}
              <p className="text-[9px] text-[#94A3B8] mt-2 text-center">
                No spam. Unsubscribe anytime.
              </p>
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
            <p className="text-[10px] text-[#475569]">Analyzing compliance data...</p>
          </div>
        )}

        {/* ===== FULL REPORT STATE ===== */}
        {step === 'full' && carrierData && (
          <div className="p-4">
            {/* Success Header */}
            <div className="text-center mb-4 pb-3 border-b border-[#E2E8F0]">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 mb-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-primary-500">AI Analysis Complete</h3>
              <p className="text-[10px] text-[#475569]">{carrierData.carrier.legalName}</p>
            </div>

            {/* AI Analysis - Scrollable */}
            <div className="mb-4 p-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] max-h-40 overflow-y-auto">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-ai-500 to-ai-600 flex items-center justify-center text-white text-[8px] font-bold">
                  AI
                </div>
                <span className="text-[10px] font-medium text-[#475569]">VroomX Analysis</span>
              </div>
              <div className="text-xs text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                {aiAnalysis}
              </div>
            </div>

            {/* Loss Aversion CTA */}
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
              <p className="text-sm font-semibold text-primary-500 mb-1">
                Don't wait for an audit letter
              </p>
              <p className="text-[10px] text-[#475569] mb-3">
                Track scores, get alerts, challenge wrong violations
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 btn-glow px-6 py-2.5 rounded-lg font-bold text-white text-sm"
              >
                Protect My Authority
                <FiArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[9px] text-[#94A3B8] mt-2">
                3-day free trial · Cancel anytime · No card required
              </p>
            </div>

            {/* Check Another */}
            <button
              onClick={handleReset}
              className="mt-3 w-full text-[10px] text-[#475569] hover:text-primary-500 transition-colors flex items-center justify-center gap-1"
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
