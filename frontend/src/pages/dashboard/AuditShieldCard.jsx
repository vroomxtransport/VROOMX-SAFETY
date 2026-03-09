import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiAlertTriangle, FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import { dashboardAPI } from '../../utils/api';

const getScoreColor = (score) => {
  if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-600 dark:text-green-400', ring: 'ring-green-500/30', label: 'Audit Ready' };
  if (score >= 60) return { bg: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', ring: 'ring-yellow-500/30', label: 'Needs Work' };
  return { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-500/30', label: 'At Risk' };
};

const AuditShieldCard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getAuditShield();
      setData(res.data.auditShield);
      setError(null);
    } catch (err) {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <FiShield className="w-5 h-5 text-zinc-400" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">Audit Shield</h3>
        </div>
        <div className="p-8 flex items-center justify-center">
          <FiRefreshCw className="w-5 h-5 text-zinc-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <FiShield className="w-5 h-5 text-zinc-400" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">Audit Shield</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{error || 'No data available'}</p>
          <button onClick={fetchData} className="mt-2 text-xs text-accent-500 hover:text-accent-600">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const score = data.overallScore;
  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            score >= 80 ? 'bg-green-100 dark:bg-green-500/10' :
            score >= 60 ? 'bg-yellow-100 dark:bg-yellow-500/10' :
            'bg-red-100 dark:bg-red-500/10'
          }`}>
            <FiShield className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Audit Shield</h3>
            <p className={`text-xs font-medium ${colors.text}`}>{colors.label}</p>
          </div>
        </div>
        <Link to="/app/reports" className="text-sm text-accent-500 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
          Run Audit
        </Link>
      </div>

      <div className="p-5">
        {/* Score Circle */}
        <div className="flex justify-center mb-4">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-zinc-200 dark:text-zinc-800"
              />
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={colors.bg}
                style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${colors.text}`}>{score}</span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">/ 100</span>
            </div>
          </div>
        </div>

        {/* Top Risks */}
        {data.topRisks && data.topRisks.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Top Risks</p>
            {data.topRisks.map((risk, i) => (
              <div
                key={risk.key}
                className="group flex items-start gap-2.5 p-2.5 rounded-xl border border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  risk.score < 40 ? 'bg-red-100 dark:bg-red-500/20' :
                  risk.score < 70 ? 'bg-yellow-100 dark:bg-yellow-500/20' :
                  'bg-green-100 dark:bg-green-500/20'
                }`}>
                  <FiAlertTriangle className={`w-3 h-3 ${
                    risk.score < 40 ? 'text-red-600 dark:text-red-400' :
                    'text-yellow-600 dark:text-yellow-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{risk.name}</p>
                    <span className={`text-xs font-bold ml-2 ${
                      risk.score < 40 ? 'text-red-600 dark:text-red-400' :
                      risk.score < 70 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>{risk.score}%</span>
                  </div>
                  {risk.recommendations && risk.recommendations[0] && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{risk.recommendations[0]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">All factors above 70%</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">No critical audit risks detected</p>
          </div>
        )}

        {/* Factor Summary Bar */}
        <div className="mt-4 flex gap-0.5 h-2 rounded-full overflow-hidden">
          {data.factors?.map((factor) => (
            <div
              key={factor.key}
              className={`h-full ${
                factor.score >= 80 ? 'bg-green-500' :
                factor.score >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${100 / (data.factors.length || 1)}%` }}
              title={`${factor.name}: ${factor.score}%`}
            />
          ))}
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center mt-1">
          {data.factors?.length || 0} audit factors assessed (49 CFR 385)
        </p>
      </div>

      <div className="px-5 pb-4">
        <Link
          to="/app/reports"
          className="w-full py-2.5 text-sm font-medium text-accent-500 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-xl transition-colors flex items-center justify-center gap-1"
        >
          Run Full Audit
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default AuditShieldCard;
