import { useState } from 'react';
import {
  FiChevronDown, FiChevronUp, FiAlertTriangle,
  FiClock, FiFolder, FiShield, FiTrendingDown,
  FiBell, FiFile
} from 'react-icons/fi';

const generateSuggestions = (context, data) => {
  const suggestions = [];

  if (context === 'driver') {
    if (data.cdlDays !== null && data.cdlDays <= 0) {
      suggestions.push({ type: 'critical', icon: 'alert', title: 'CDL Expired!', message: 'This driver cannot legally operate. Immediate action required.', action: 'Upload renewed CDL', priority: 0 });
    } else if (data.cdlDays !== null && data.cdlDays <= 30 && data.cdlDays > 0) {
      suggestions.push({ type: 'warning', icon: 'clock', title: 'CDL Expiring Soon', message: `CDL expires in ${data.cdlDays} days. Schedule renewal now to avoid out-of-service.`, action: 'Upload new CDL', priority: 1 });
    }
    if (data.medicalDays !== null && data.medicalDays <= 0) {
      suggestions.push({ type: 'critical', icon: 'alert', title: 'Medical Card Expired!', message: 'Driver cannot operate without valid medical certificate per 49 CFR 391.41.', priority: 0 });
    } else if (data.medicalDays !== null && data.medicalDays <= 30 && data.medicalDays > 0) {
      suggestions.push({ type: 'warning', icon: 'clock', title: 'Medical Card Expiring', message: `Medical card expires in ${data.medicalDays} days. Book exam with NRCME-listed provider.`, priority: 2 });
    }
    if (data.completedDocs < data.totalDocs) {
      const missing = data.totalDocs - data.completedDocs;
      suggestions.push({ type: 'info', icon: 'folder', title: 'Incomplete DQF', message: `${missing} document(s) missing from qualification file. Complete before next audit.`, priority: 3 });
    }
    if (data.clearinghouseStatus && data.clearinghouseStatus !== 'clear') {
      suggestions.push({ type: 'critical', icon: 'shield', title: 'Clearinghouse Alert', message: 'Driver has non-clear clearinghouse status. Review required per 49 CFR 382.', priority: 0 });
    }
  }

  if (context === 'dashboard') {
    if (data.complianceScore !== null && data.complianceScore !== undefined && data.complianceScore < 70) {
      suggestions.push({ type: 'warning', icon: 'trending-down', title: 'Low Compliance Score', message: `Score is ${data.complianceScore}/100. Focus on the lowest-scoring component to improve.`, priority: 1 });
    }
    if (data.alertCount > 5) {
      suggestions.push({ type: 'info', icon: 'bell', title: `${data.alertCount} Active Alerts`, message: 'Multiple compliance alerts need attention. Prioritize critical items first.', priority: 2 });
    }
    if (data.expiredDocs > 0) {
      suggestions.push({ type: 'critical', icon: 'file', title: 'Expired Documents', message: `${data.expiredDocs} document(s) have expired. Renew immediately to avoid audit findings.`, priority: 0 });
    }
  }

  return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 3);
};

const iconMap = {
  alert: FiAlertTriangle,
  clock: FiClock,
  folder: FiFolder,
  shield: FiShield,
  'trending-down': FiTrendingDown,
  bell: FiBell,
  file: FiFile,
};

const typeStyles = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-500/10',
    border: 'border-red-200 dark:border-red-500/20',
    icon: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-500/20',
    title: 'text-red-700 dark:text-red-400',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-500/10',
    border: 'border-yellow-200 dark:border-yellow-500/20',
    icon: 'text-yellow-600 dark:text-yellow-400',
    iconBg: 'bg-yellow-100 dark:bg-yellow-500/20',
    title: 'text-yellow-700 dark:text-yellow-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-500/20',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-500/20',
    title: 'text-blue-700 dark:text-blue-400',
  },
};

const ComplianceCopilot = ({ context, data }) => {
  const [expanded, setExpanded] = useState(false);
  const suggestions = generateSuggestions(context, data || {});

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-500/5 dark:via-yellow-500/5 dark:to-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl overflow-hidden transition-all duration-300">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100/50 dark:hover:bg-amber-500/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-sm">
            <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Compliance Copilot
          </span>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-200 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
            {suggestions.length}
          </span>
        </div>
        {expanded ? (
          <FiChevronUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        ) : (
          <FiChevronDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        )}
      </button>

      {/* Suggestions List */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 space-y-2.5">
          {suggestions.map((suggestion, index) => {
            const styles = typeStyles[suggestion.type] || typeStyles.info;
            const IconComponent = iconMap[suggestion.icon] || FiAlertTriangle;

            return (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-xl border ${styles.bg} ${styles.border} transition-all duration-200`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}>
                  <IconComponent className={`w-4 h-4 ${styles.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${styles.title}`}>
                    {suggestion.title}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 leading-relaxed">
                    {suggestion.message}
                  </p>
                  {suggestion.action && (
                    <span className="inline-block mt-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 rounded-md">
                      {suggestion.action}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ComplianceCopilot;
