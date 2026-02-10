import { useState } from 'react';
import { formatDate, basicCategories } from '../utils/helpers';
import {
  FiTarget, FiZap, FiAlertTriangle, FiTruck, FiUser,
  FiChevronRight, FiFileText, FiClock, FiTrendingDown
} from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';

const DataQOpportunities = ({ opportunities, onAnalyze, loading }) => {
  const [expandedId, setExpandedId] = useState(null);
  const safeOpportunities = Array.isArray(opportunities) ? opportunities : [];

  const getScoreBadge = (score, category) => {
    if (score >= 75) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-success-400 border border-success-200 dark:border-success-500/30">
          <FiTarget className="w-3 h-3 mr-1" />
          High ({score})
        </span>
      );
    }
    if (score >= 50) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-warning-100 dark:bg-warning-500/20 text-warning-700 dark:text-warning-400 border border-warning-200 dark:border-warning-500/30">
          <FiTarget className="w-3 h-3 mr-1" />
          Medium ({score})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
        <FiTarget className="w-3 h-3 mr-1" />
        Low ({score})
      </span>
    );
  };

  const getScoreBarColor = (score) => {
    if (score >= 75) return 'bg-success-500';
    if (score >= 50) return 'bg-warning-500';
    return 'bg-zinc-400';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">Analyzing violations...</p>
      </div>
    );
  }

  if (safeOpportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <FiTarget className="w-8 h-8 text-zinc-400" />
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 font-medium">No challenge opportunities found</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
          Try lowering the minimum score filter or check back after new violations are recorded
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {safeOpportunities.map((item) => {
        const { violation, analysis } = item;
        const isExpanded = expandedId === violation._id;

        return (
          <div
            key={violation._id}
            className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            {/* Main Row */}
            <div className="p-4 flex items-center gap-4">
              {/* Score Indicator */}
              <div className="flex-shrink-0 w-14">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <span className={`text-lg font-bold ${
                      analysis.score >= 75 ? 'text-success-600 dark:text-success-400' :
                      analysis.score >= 50 ? 'text-warning-600 dark:text-warning-400' :
                      'text-zinc-600 dark:text-zinc-400'
                    }`}>
                      {analysis.score}
                    </span>
                  </div>
                  <svg className="absolute inset-0 w-12 h-12 -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-zinc-200 dark:text-zinc-700"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray={`${(analysis.score / 100) * 126} 126`}
                      className={
                        analysis.score >= 75 ? 'text-success-500' :
                        analysis.score >= 50 ? 'text-warning-500' :
                        'text-zinc-400'
                      }
                    />
                  </svg>
                </div>
              </div>

              {/* Violation Info */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-zinc-900 dark:text-white truncate">
                    {violation.violationType}
                  </span>
                  {violation.outOfService && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-danger-100 dark:bg-danger-500/20 text-danger-700 dark:text-danger-400">
                      OOS
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <FiClock className="w-3.5 h-3.5" />
                    {formatDate(violation.violationDate)}
                  </span>
                  <span className="capitalize">
                    {basicCategories[violation.basic]?.label || violation.basic?.replace('_', ' ')}
                  </span>
                  {violation.driver && (
                    <span className="flex items-center gap-1">
                      <FiUser className="w-3.5 h-3.5" />
                      {violation.driver.firstName} {violation.driver.lastName}
                    </span>
                  )}
                </div>
              </div>

              {/* Score Badge & Actions */}
              <div className="flex items-center gap-3">
                {getScoreBadge(analysis.score, analysis.category)}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : violation._id)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <FiChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-0">
                <div className="ml-14 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700">
                  {/* Analysis Factors */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Why this is a good candidate:</p>
                    <ul className="space-y-1">
                      {analysis.factors?.map((factor, idx) => (
                        <li key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                          <span className="text-success-500 mt-0.5">+</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Deductions if any */}
                  {analysis.deductions && analysis.deductions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Considerations:</p>
                      <ul className="space-y-1">
                        {analysis.deductions.map((deduction, idx) => (
                          <li key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                            <span className="text-warning-500 mt-0.5">-</span>
                            {deduction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CSA Impact */}
                  {analysis.estimatedCSAImpact && (
                    <div className="p-3 rounded-lg bg-accent-50 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-500/20 mb-4">
                      <div className="flex items-center gap-2">
                        <FiTrendingDown className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                        <span className="text-sm font-medium text-accent-700 dark:text-accent-400">
                          Estimated Impact if Accepted
                        </span>
                      </div>
                      <p className="text-sm text-accent-600 dark:text-accent-400 mt-1">
                        ~{analysis.estimatedCSAImpact.pointReduction} point reduction in {basicCategories[analysis.estimatedCSAImpact.basic]?.label || analysis.estimatedCSAImpact.basic}
                      </p>
                    </div>
                  )}

                  {/* Recommended Challenge Type */}
                  <div className="flex items-center gap-2 mb-4">
                    <FiFileText className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Recommended approach: <span className="font-medium text-zinc-700 dark:text-zinc-300">{analysis.recommendedChallengeType?.replace('_', ' ')}</span>
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => onAnalyze(item)}
                      className="btn btn-primary"
                    >
                      <FiZap className="w-4 h-4" />
                      Generate Challenge Letter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DataQOpportunities;
