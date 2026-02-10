import { useState, useEffect } from 'react';
import {
  FiBookOpen, FiAlertTriangle, FiCheckSquare, FiSquare,
  FiTag, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { violationCodesAPI } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

const defaultOfficerChecklist = [
  { id: 'correct_code', label: 'Was the correct violation code used?' },
  { id: 'oos_threshold', label: 'Does the condition meet the OOS threshold?' },
  { id: 'inspection_level', label: 'Was the inspection level appropriate?' },
  { id: 'testing_procedures', label: 'Were proper testing procedures followed?' }
];

const RegulationPanel = ({ violationCode }) => {
  const [loading, setLoading] = useState(true);
  const [codeData, setCodeData] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    if (!violationCode) return;

    const fetchCodeData = async () => {
      setLoading(true);
      try {
        const res = await violationCodesAPI.getByCode(violationCode);
        const data = res.data?.code || res.data;
        setCodeData(data);
        // Reset checklist when code changes
        setCheckedItems({});
      } catch (err) {
        if (err.response?.status !== 404) {
          toast.error('Failed to load regulation data');
        }
        setCodeData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCodeData();
  }, [violationCode]);

  const toggleCheck = (id) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!codeData) return null;

  const {
    code,
    description,
    fmcsrSection,
    fmcsrText,
    cvsaOosCriteria,
    severityWeight,
    oosWeight,
    challengeAngles = [],
    commonOfficerErrors = []
  } = codeData;

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
          <FiBookOpen className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="min-w-0 flex-grow">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-zinc-900 dark:text-white text-sm">{code}</span>
            {severityWeight != null && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                Severity: {severityWeight}/10
              </span>
            )}
            {oosWeight != null && oosWeight > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 font-medium">
                OOS Weight: {oosWeight}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {/* FMCSR Section */}
      {(fmcsrSection || fmcsrText) && (
        <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
          {fmcsrSection && (
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              FMCSR {fmcsrSection}
            </p>
          )}
          {fmcsrText && (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{fmcsrText}</p>
          )}
        </div>
      )}

      {/* CVSA OOS Criteria */}
      {cvsaOosCriteria && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
            CVSA Out-of-Service Criteria
          </p>
          <p className="text-sm text-red-800 dark:text-red-300">{cvsaOosCriteria}</p>
        </div>
      )}

      {/* Officer Accuracy Checklist */}
      <div>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Officer Accuracy Checklist
        </p>
        <div className="space-y-1">
          {defaultOfficerChecklist.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-colors ${
                checkedItems[item.id]
                  ? 'bg-emerald-50 dark:bg-emerald-500/10'
                  : 'bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'
              }`}
            >
              {checkedItems[item.id] ? (
                <FiCheckSquare className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <FiSquare className="w-4 h-4 flex-shrink-0 text-zinc-400 dark:text-zinc-500" />
              )}
              <span className={`text-sm ${
                checkedItems[item.id]
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-zinc-700 dark:text-zinc-300'
              }`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Challenge Angles */}
      {challengeAngles.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FiTag className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Challenge Angles</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {challengeAngles.map((angle, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors"
              >
                {angle}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Common Officer Errors */}
      {commonOfficerErrors.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FiAlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Common Officer Errors</p>
          </div>
          <div className="space-y-1.5">
            {commonOfficerErrors.map((error, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10"
              >
                <FiAlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-amber-800 dark:text-amber-300">{error}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RegulationPanel;
