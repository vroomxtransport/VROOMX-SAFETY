import { useState, useEffect } from 'react';
import { complianceReportAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  FiShield, FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiInfo,
  FiRefreshCw, FiClock, FiTarget, FiTruck, FiUsers, FiFileText,
  FiActivity, FiChevronRight
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const RISK_CONFIG = {
  critical: { color: 'red', bg: 'bg-red-500', label: 'Critical', icon: FiAlertCircle },
  at_risk: { color: 'orange', bg: 'bg-orange-500', label: 'At Risk', icon: FiAlertTriangle },
  needs_attention: { color: 'yellow', bg: 'bg-yellow-500', label: 'Needs Attention', icon: FiInfo },
  good: { color: 'emerald', bg: 'bg-emerald-500', label: 'Good', icon: FiCheckCircle },
  excellent: { color: 'green', bg: 'bg-green-500', label: 'Excellent', icon: FiShield }
};

const CATEGORY_ICONS = {
  csa_basics: FiActivity,
  driver_qualification: FiUsers,
  vehicle_maintenance: FiTruck,
  drug_alcohol: FiShield,
  documentation: FiFileText
};

const CATEGORY_LABELS = {
  csa_basics: 'CSA/BASICs',
  driver_qualification: 'Driver Qualification',
  vehicle_maintenance: 'Vehicle Maintenance',
  drug_alcohol: 'Drug & Alcohol',
  documentation: 'Documentation'
};

const ComplianceReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchLatest();
  }, []);

  const fetchLatest = async () => {
    try {
      const res = await complianceReportAPI.getLatest();
      setReport(res.data.report);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await complianceReportAPI.generate();
      setReport(res.data.report);
      toast.success('Compliance report generated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const timeSince = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const hours = Math.floor((now - d) / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) return <LoadingSpinner />;

  // No report yet
  if (!report) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center mx-auto mb-6">
            <FiShield className="w-10 h-10 text-primary-500" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-3">AI Compliance Analysis</h2>
          <p className="text-zinc-600 dark:text-zinc-300 mb-8 max-w-md mx-auto">
            Generate a comprehensive AI-powered analysis of your FMCSA compliance data with actionable recommendations.
          </p>
          <button onClick={handleGenerate} disabled={generating} className="btn btn-primary btn-lg">
            {generating ? (
              <><FiRefreshCw className="w-5 h-5 animate-spin mr-2" /> Analyzing your data...</>
            ) : (
              <><FiShield className="w-5 h-5 mr-2" /> Generate Compliance Report</>
            )}
          </button>
          {generating && (
            <p className="text-sm text-zinc-500 mt-4">This may take 15-30 seconds as we analyze all your compliance data...</p>
          )}
        </div>
      </div>
    );
  }

  const risk = RISK_CONFIG[report.overallRisk] || RISK_CONFIG.needs_attention;
  const RiskIcon = risk.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">AI Compliance Analysis</h1>
          <p className="text-sm text-zinc-500 mt-1">Generated {timeSince(report.generatedAt)}</p>
        </div>
        <button onClick={handleGenerate} disabled={generating} className="btn btn-primary btn-sm">
          {generating ? <FiRefreshCw className="w-4 h-4 animate-spin mr-1" /> : <FiRefreshCw className="w-4 h-4 mr-1" />}
          {generating ? 'Generating...' : 'Regenerate Report'}
        </button>
      </div>

      {/* Risk Level + Score */}
      <div className="card overflow-hidden">
        <div className={`${risk.bg} px-6 py-5 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <RiskIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Overall Risk Level</p>
              <p className="text-white text-2xl font-bold">{risk.label}</p>
            </div>
          </div>
          {report.overallScore != null && (
            <div className="text-right">
              <p className="text-white/80 text-sm">Compliance Score</p>
              <p className="text-white text-3xl font-bold">{report.overallScore}</p>
            </div>
          )}
        </div>

        {/* Executive Summary */}
        <div className="p-6">
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3">Executive Summary</h3>
          <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
            {report.executiveSummary}
          </div>
        </div>
      </div>

      {/* Category Scores */}
      {report.categoryScores && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(report.categoryScores).map(([key, cat]) => {
            const Icon = CATEGORY_ICONS[key] || FiShield;
            const statusColor = cat.status === 'critical' ? 'text-red-600 dark:text-red-400'
              : cat.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-emerald-600 dark:text-emerald-400';
            const bgColor = cat.status === 'critical' ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
              : cat.status === 'warning' ? 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30'
              : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30';

            return (
              <div key={key} className={`card p-4 border-2 ${bgColor}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${statusColor}`} />
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{CATEGORY_LABELS[key]}</span>
                </div>
                <p className={`text-2xl font-bold ${statusColor}`}>{cat.score ?? '--'}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{cat.summary}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Findings */}
      {report.findings?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <FiAlertTriangle className="w-5 h-5" /> Findings ({report.findings.length})
            </h3>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {report.findings.map((f, i) => {
              const sevColor = f.severity === 'critical' ? 'border-l-red-500 bg-red-50/50 dark:bg-red-500/5'
                : f.severity === 'warning' ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-500/5'
                : 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-500/5';
              const sevBadge = f.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : f.severity === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';

              return (
                <div key={i} className={`px-5 py-4 border-l-4 ${sevColor}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${sevBadge}`}>
                          {f.severity}
                        </span>
                        <span className="text-xs text-zinc-500">{CATEGORY_LABELS[f.category]}</span>
                        {f.regulation && <span className="text-xs font-mono text-zinc-400">{f.regulation}</span>}
                      </div>
                      <h4 className="font-medium text-zinc-800 dark:text-zinc-100">{f.title}</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">{f.description}</p>
                    </div>
                    {(f.currentValue || f.threshold) && (
                      <div className="text-right flex-shrink-0">
                        {f.currentValue && <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{f.currentValue}</p>}
                        {f.threshold && <p className="text-xs text-zinc-500">Threshold: {f.threshold}</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Items */}
      {report.actionItems?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <FiTarget className="w-5 h-5" /> Action Items ({report.actionItems.length})
            </h3>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {report.actionItems.map((a, i) => (
              <div key={i} className="px-5 py-4 flex items-start gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                  a.priority <= 2 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : a.priority <= 4 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}>
                  {a.priority}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-zinc-800 dark:text-zinc-100">{a.title}</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-0.5">{a.description}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-zinc-500">{CATEGORY_LABELS[a.category]}</span>
                    <span className={`px-1.5 py-0.5 text-xs rounded ${
                      a.impact === 'high' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      Impact: {a.impact}
                    </span>
                    <span className={`px-1.5 py-0.5 text-xs rounded ${
                      a.effort === 'low' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : a.effort === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      Effort: {a.effort}
                    </span>
                    {a.deadline && (
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <FiClock className="w-3 h-3" /> {a.deadline}
                      </span>
                    )}
                  </div>
                </div>
                <FiChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceReport;
