import { useState, useRef, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiChevronDown } from 'react-icons/fi';

const DQFProgress = ({ completed = 0, total = 0, missingDocs = [] }) => {
  const [expanded, setExpanded] = useState(false);
  const dropdownRef = useRef(null);

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // SVG ring calculations
  const radius = 20;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const size = (radius + strokeWidth) * 2;
  const center = radius + strokeWidth;

  // Color based on percentage
  const getColor = () => {
    if (percentage >= 80) return { ring: 'stroke-green-500', text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30' };
    if (percentage >= 50) return { ring: 'stroke-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30' };
    return { ring: 'stroke-red-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' };
  };

  const colors = getColor();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setExpanded(false);
      }
    };
    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expanded]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => missingDocs.length > 0 && setExpanded(!expanded)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 transition-colors ${
          missingDocs.length > 0 ? 'hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer' : 'cursor-default'
        }`}
        title={missingDocs.length > 0 ? 'Click to see missing documents' : 'All documents complete'}
      >
        {/* SVG Progress Ring */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              className="stroke-zinc-200 dark:stroke-zinc-700"
            />
            {/* Progress ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`${colors.ring} transition-all duration-500`}
            />
          </svg>
          {/* Center percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-[10px] font-bold ${colors.text}`}>
              {percentage}%
            </span>
          </div>
        </div>

        {/* Text */}
        <div className="text-left">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">DQF Complete</p>
          <div className="flex items-center gap-1">
            <p className={`text-sm font-semibold ${colors.text}`}>
              {completed}/{total}
            </p>
            {missingDocs.length > 0 && (
              <FiChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            )}
          </div>
        </div>
      </button>

      {/* Expanded missing docs dropdown */}
      {expanded && missingDocs.length > 0 && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-64 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80">
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              Missing Documents ({missingDocs.length})
            </p>
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {missingDocs.map((doc, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
              >
                <FiAlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <span className="truncate">{doc}</span>
              </li>
            ))}
          </ul>
          {completed > 0 && (
            <div className="px-3 py-1.5 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80">
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <FiCheckCircle className="w-3.5 h-3.5" />
                <span>{completed} document{completed !== 1 ? 's' : ''} on file</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DQFProgress;
