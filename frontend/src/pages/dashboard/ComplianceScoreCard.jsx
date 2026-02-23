import { Link } from 'react-router-dom';

// Get score color based on value
const getScoreColor = (score) => {
  if (score >= 80) return '#22c55e'; // green
  if (score >= 60) return '#eab308'; // yellow
  return '#ef4444'; // red
};

// Get score status label
const getScoreStatus = (score) => {
  if (score >= 80) return { label: 'Good Standing', bgClass: 'bg-green-100 dark:bg-green-500/20', textClass: 'text-green-700 dark:text-green-400', borderClass: 'border-green-200 dark:border-green-500/30' };
  if (score >= 60) return { label: 'Needs Attention', bgClass: 'bg-yellow-100 dark:bg-yellow-500/20', textClass: 'text-yellow-700 dark:text-yellow-400', borderClass: 'border-yellow-200 dark:border-yellow-500/30' };
  return { label: 'At Risk', bgClass: 'bg-red-100 dark:bg-red-500/20', textClass: 'text-red-700 dark:text-red-400', borderClass: 'border-red-200 dark:border-red-500/30' };
};

// Get score factors from API data
const getScoreFactors = (complianceData) => {
  if (complianceData?.components) {
    const { documentStatus, violations, drugAlcohol, dqfCompleteness, vehicleInspection } = complianceData.components;
    return [
      { label: 'DQF Files', value: dqfCompleteness?.score ?? null },
      { label: 'Documents', value: documentStatus?.score ?? null },
      { label: 'Violations', value: violations?.score ?? null },
      { label: 'D&A Testing', value: drugAlcohol?.score ?? null },
      { label: 'Vehicle Insp.', value: vehicleInspection?.score ?? null }
    ];
  }
  return [
    { label: 'DQF Files', value: null },
    { label: 'Documents', value: null },
    { label: 'Violations', value: null },
    { label: 'D&A Testing', value: null },
    { label: 'Vehicle Insp.', value: null }
  ];
};

const ComplianceScoreCard = ({ complianceData }) => {
  const hasComplianceData = complianceData !== null && complianceData?.overallScore != null;
  const complianceScore = hasComplianceData ? complianceData.overallScore : 0;
  const scoreDiff = complianceScore - 80;

  // Calculate gauge stroke dasharray
  const maxArc = 212; // 75% of full circle circumference
  const scoreArc = (complianceScore / 100) * maxArc;

  const scoreStatus = getScoreStatus(complianceScore);
  const scoreFactors = getScoreFactors(complianceData);

  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-5 bg-white dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Compliance Score</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Overall fleet health</p>
          </div>
          <Link to="/app/compliance" className="text-sm text-accent-500 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
            View Details
          </Link>
        </div>

        {/* Score Gauge */}
        <div className="flex flex-col items-center py-2">
          {hasComplianceData ? (
            <>
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    className="stroke-zinc-200 dark:stroke-zinc-800"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="212 71"
                  />
                  {/* Gradient arc (faint) */}
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="212 71"
                    opacity="0.2"
                  />
                  {/* Score indicator */}
                  <circle
                    className="gauge-circle"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={getScoreColor(complianceScore)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${scoreArc} ${283 - scoreArc}`}
                    strokeDashoffset="0"
                  />
                </svg>
                {/* Score number in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-xs font-semibold mb-1 ${scoreDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {scoreDiff > 0 ? '+' : ''}{scoreDiff} from 80
                  </span>
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white">{complianceScore}</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">out of 100</span>
                </div>
              </div>

              {/* Score status label */}
              <div className={`mt-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${scoreStatus.bgClass} ${scoreStatus.textClass} ${scoreStatus.borderClass}`}>
                {scoreStatus.label}
              </div>
            </>
          ) : (
            <>
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    className="stroke-zinc-200 dark:stroke-zinc-800"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="212 71"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-zinc-400 dark:text-zinc-500">--</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">No data yet</span>
                </div>
              </div>
              <div className="mt-2 px-4 py-1.5 rounded-full text-sm font-semibold border bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700">
                Pending Calculation
              </div>
            </>
          )}
        </div>

        {/* Score factors */}
        <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-zinc-100 dark:border-white/5">
          {scoreFactors.map((factor, index) => (
            <div key={index} className={`p-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5${index === scoreFactors.length - 1 && scoreFactors.length % 2 !== 0 ? ' col-span-2' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-600 dark:text-zinc-300">{factor.label}</span>
                <span className={`text-xs font-semibold ${
                  factor.value === null
                    ? 'text-zinc-400 dark:text-zinc-500'
                    : factor.value >= 80 ? 'text-green-600 dark:text-green-400'
                    : factor.value >= 60 ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {factor.value === null ? 'N/A' : `${factor.value}%`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                {factor.value === null ? (
                  <div className="h-full w-full bg-zinc-300 dark:bg-zinc-700 opacity-30 rounded-full" />
                ) : (
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${factor.value >= 80 ? 'bg-green-500' : factor.value >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${factor.value}%` }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComplianceScoreCard;
