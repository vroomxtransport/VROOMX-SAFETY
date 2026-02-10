import { FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';

const EvidenceStrengthMeter = ({ score = 0, label = '', missingRequired = [], suggestions = [] }) => {
  const getColor = () => {
    if (score >= 6) return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' };
    if (score >= 3) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' };
    return { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' };
  };

  const colors = getColor();
  const percentage = Math.min(100, (score / 10) * 100);

  return (
    <div className="space-y-3">
      {/* Score bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Evidence Strength</span>
          <span className={`text-sm font-bold ${colors.text}`}>{score}/10 — {label}</span>
        </div>
        <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Missing required items */}
      {missingRequired.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {missingRequired.map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
              <FiAlertCircle className="w-3 h-3" />
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-1">
          {suggestions.map((tip, idx) => (
            <p key={idx} className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <FiInfo className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {tip}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default EvidenceStrengthMeter;
