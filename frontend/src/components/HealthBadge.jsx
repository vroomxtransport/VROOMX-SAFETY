import { FiCheck, FiAlertCircle, FiClock } from 'react-icons/fi';

const HealthBadge = ({ label, days, status, type = 'days' }) => {
  let bgColor, textColor, icon;

  if (status === 'clear' || status === 'compliant') {
    bgColor = 'bg-green-100 dark:bg-green-500/20';
    textColor = 'text-green-600 dark:text-green-400';
    icon = <FiCheck className="w-4 h-4" />;
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bgColor}`}>
        <span className={textColor}>{icon}</span>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className={`text-sm font-semibold ${textColor}`}>Clear</p>
        </div>
      </div>
    );
  }

  if (days === null || days === undefined) {
    bgColor = 'bg-zinc-100 dark:bg-zinc-800';
    textColor = 'text-zinc-500 dark:text-zinc-400';
    icon = <FiClock className="w-4 h-4" />;
  } else if (days < 0) {
    bgColor = 'bg-red-100 dark:bg-red-500/20';
    textColor = 'text-red-600 dark:text-red-400';
    icon = <FiAlertCircle className="w-4 h-4" />;
  } else if (days <= 30) {
    bgColor = 'bg-yellow-100 dark:bg-yellow-500/20';
    textColor = 'text-yellow-600 dark:text-yellow-400';
    icon = <FiAlertCircle className="w-4 h-4" />;
  } else {
    bgColor = 'bg-green-100 dark:bg-green-500/20';
    textColor = 'text-green-600 dark:text-green-400';
    icon = <FiCheck className="w-4 h-4" />;
  }

  const displayValue = days === null || days === undefined
    ? 'Not set'
    : days < 0
      ? `${Math.abs(days)}d overdue`
      : `${days}d`;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bgColor}`}>
      <span className={textColor}>{icon}</span>
      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className={`text-sm font-semibold ${textColor}`}>{displayValue}</p>
      </div>
    </div>
  );
};

export default HealthBadge;
