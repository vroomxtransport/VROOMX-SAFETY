import { useState, useEffect } from 'react';
import { violationsAPI } from '../utils/api';
import { formatDate, basicCategories } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiShield, FiZap, FiCheck, FiAlertTriangle, FiX,
  FiTarget, FiList, FiArrowRight, FiPercent
} from 'react-icons/fi';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';


const DataQLetterModal = ({ isOpen, onClose, violation, analysis }) => {
  const [loading, setLoading] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState(null);
  const [error, setError] = useState(null);

  // Auto-fetch deep analysis on mount
  useEffect(() => {
    if (isOpen && violation?._id && !deepAnalysis) {
      fetchDeepAnalysis();
    }
  }, [isOpen, violation?._id]);

  const fetchDeepAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await violationsAPI.analyzeViolation(violation._id);
      setDeepAnalysis(response.data.data);
    } catch (err) {
      setError('Failed to get analysis. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const ai = deepAnalysis?.aiAnalysis;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Violation Analysis"
      icon={FiShield}
      size="lg"
    >
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Violation Summary */}
        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Code</span>
              <p className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{violation.violationCode}</p>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Date</span>
              <p className="font-medium text-zinc-700 dark:text-zinc-300">{formatDate(violation.violationDate)}</p>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">BASIC</span>
              <p className="font-medium text-zinc-700 dark:text-zinc-300 capitalize">
                {basicCategories[violation.basic]?.label || violation.basic?.replace('_', ' ')}
              </p>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Severity</span>
              <p className="font-medium text-zinc-700 dark:text-zinc-300">
                {violation.severityWeight}/10 {violation.outOfService && <span className="text-red-500">(OOS)</span>}
              </p>
            </div>
          </div>
          {violation.violationType && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{violation.violationType}</p>
          )}
        </div>

        {/* Challenge Potential Score */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-accent-50 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-500/20">
          <div className="w-14 h-14 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm flex-shrink-0">
            <span className={`text-xl font-bold ${
              analysis?.score >= 75 ? 'text-green-600' :
              analysis?.score >= 50 ? 'text-amber-600' :
              'text-zinc-500'
            }`}>
              {analysis?.score || 0}
            </span>
          </div>
          <div>
            <p className="font-semibold text-accent-800 dark:text-accent-300">
              {analysis?.score >= 75 ? 'Strong challenge candidate' :
               analysis?.score >= 50 ? 'May be worth challenging' :
               'Limited challenge potential'}
            </p>
            <p className="text-sm text-accent-600 dark:text-accent-400">Challenge potential score</p>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
          <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
            <FiZap className="w-3 h-3" /> Safety Manager Analysis
          </span>
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-8 text-center">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3">Analyzing violation...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="py-6 text-center">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button onClick={fetchDeepAnalysis} className="btn btn-secondary text-sm">
              <FiZap className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}

        {/* AI Analysis Results */}
        {ai && !loading && (
          <div className="space-y-4">
            {/* Summary */}
            {ai.summary && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                <p className="text-sm text-blue-800 dark:text-blue-300">{ai.summary}</p>
                {ai.successLikelihood && (
                  <div className="mt-2 flex items-center gap-2">
                    <FiPercent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      Success likelihood: <span className="font-bold">{ai.successLikelihood.percentage}%</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Tips & Tricks / Common Defenses */}
            {ai.commonDefenses?.length > 0 && (
              <div>
                <h4 className="font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                  <FiTarget className="w-4 h-4 text-purple-500" /> Tips & Defenses That Work
                </h4>
                <ul className="space-y-1.5">
                  {ai.commonDefenses.map((defense, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <FiArrowRight className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-600 dark:text-zinc-400">{defense}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Draft Argument */}
            {ai.argumentDraft && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-2 text-sm">Draft Argument You Can Use</h4>
                <p className="text-sm text-green-700 dark:text-green-400 italic">"{ai.argumentDraft}"</p>
              </div>
            )}

            {/* Next Steps */}
            {ai.nextSteps?.length > 0 && (
              <div>
                <h4 className="font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                  <FiList className="w-4 h-4 text-amber-500" /> What To Do Next
                </h4>
                <ol className="space-y-1.5 list-decimal list-inside">
                  {ai.nextSteps.map((step, idx) => (
                    <li key={idx} className="text-sm text-zinc-600 dark:text-zinc-400">{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Strengths & Weaknesses */}
            {(ai.analysis?.strengths?.length > 0 || ai.analysis?.weaknesses?.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ai.analysis?.strengths?.length > 0 && (
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-500/5 border border-green-100 dark:border-green-500/10">
                    <h5 className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">Strengths</h5>
                    <ul className="space-y-1">
                      {ai.analysis.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-green-700 dark:text-green-400 flex items-start gap-1.5">
                          <FiCheck className="w-3 h-3 mt-0.5 flex-shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {ai.analysis?.weaknesses?.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10">
                    <h5 className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-2">Weaknesses</h5>
                    <ul className="space-y-1">
                      {ai.analysis.weaknesses.map((w, i) => (
                        <li key={i} className="text-xs text-red-700 dark:text-red-400 flex items-start gap-1.5">
                          <FiAlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* CFR Citations */}
            {ai.challengeStrategy?.cfrCitations?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Relevant CFR Citations</h4>
                <div className="flex flex-wrap gap-2">
                  {ai.challengeStrategy.cfrCitations.map((cfr, idx) => (
                    <span key={idx} className="text-xs font-mono px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                      {cfr}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-700 mt-4">
        <button onClick={onClose} className="btn btn-secondary">
          <FiX className="w-4 h-4" /> Close
        </button>
      </div>
    </Modal>
  );
};

export default DataQLetterModal;
