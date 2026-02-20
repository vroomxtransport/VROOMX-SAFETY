import { useState, useMemo } from 'react';
import { violationsAPI } from '../utils/api';
import { formatDate, basicCategories } from '../utils/helpers';
import { RDR_TYPES, RDR_CATEGORIES, getRdrTypesByCategory, toLegacyChallengeType, REVIEWER_LABELS } from '../data/rdrTypes';
import toast from 'react-hot-toast';
import {
  FiFileText, FiZap, FiChevronLeft, FiChevronRight, FiCheck,
  FiAlertTriangle, FiCheckCircle, FiX,
  FiList, FiSend, FiChevronDown, FiChevronUp, FiInfo, FiShield
} from 'react-icons/fi';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import EvidenceCollectionPanel from './EvidenceCollectionPanel';
import ScoreImpactCard from './ScoreImpactCard';

const STEPS = [
  { id: 'analysis', label: 'AI Analysis', icon: FiZap },
  { id: 'type', label: 'RDR Type', icon: FiList },
  { id: 'evidence', label: 'Evidence Checklist', icon: FiCheckCircle },
  { id: 'submit', label: 'Submit', icon: FiSend }
];

const DataQLetterModal = ({ isOpen, onClose, violation, analysis, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [rdrType, setRdrType] = useState(analysis?.recommendedRdrType?.code || null);
  const [challengeType, setChallengeType] = useState(
    rdrType ? toLegacyChallengeType(rdrType) : (analysis?.recommendedChallengeType || 'data_error')
  );
  const [rdrWarnings, setRdrWarnings] = useState(analysis?.rdrWarnings || []);
  const [reason, setReason] = useState('');
  const [evidenceChecklist, setEvidenceChecklist] = useState(
    analysis?.evidenceChecklist || []
  );
  const [loading, setLoading] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState(null);
  const [overrideLowScore, setOverrideLowScore] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({ inspection: true });

  const groupedRdrTypes = useMemo(() => getRdrTypesByCategory(), []);
  const sortedCategories = useMemo(() =>
    Object.entries(RDR_CATEGORIES).sort(([, a], [, b]) => a.order - b.order),
    []
  );

  const isCrashViolation = violation?.basic === 'crash_indicator' || violation?.crashRelated;

  const handleRdrTypeSelect = (code) => {
    setRdrType(code);
    setChallengeType(toLegacyChallengeType(code));

    // Update evidence checklist from RDR type
    const rdr = RDR_TYPES[code];
    if (rdr?.evidenceRequired) {
      setEvidenceChecklist(rdr.evidenceRequired.map(e => ({ ...e, obtained: false })));
    }

    // Generate warnings
    const warnings = [];
    if (rdr) {
      if (isCrashViolation && rdr.category === 'inspection') {
        warnings.push('You selected an Inspection type for a crash-related violation.');
      }
      if (!isCrashViolation && rdr.category === 'crash') {
        warnings.push('You selected a Crash type for an inspection violation.');
      }
      if (analysis?.recommendedRdrType?.code && code !== analysis.recommendedRdrType.code) {
        warnings.push(`Auto-suggestion was "${RDR_TYPES[analysis.recommendedRdrType.code]?.name}". You chose a different type.`);
      }
      if (rdr.reviewer === 'fmcsa_hq') {
        warnings.push('This type is reviewed by FMCSA Headquarters (may have longer processing times).');
      }
    }
    setRdrWarnings(warnings);
  };

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleNext = async () => {
    if (currentStep === 1 && !reason.trim()) {
      toast.error('Please provide a reason for the challenge');
      return;
    }
    if (currentStep === 1 && !rdrType) {
      toast.error('Please select an RDR type');
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const fetchDeepAnalysis = async () => {
    setLoading(true);
    try {
      const response = await violationsAPI.analyzeViolation(violation._id);
      setDeepAnalysis(response.data.data);
      if (response.data.data.basicAnalysis?.evidenceChecklist) {
        setEvidenceChecklist(response.data.data.basicAnalysis.evidenceChecklist);
      }
      // Update RDR recommendation from deep analysis
      if (response.data.data.basicAnalysis?.recommendedRdrType && !rdrType) {
        const rec = response.data.data.basicAnalysis.recommendedRdrType;
        setRdrType(rec.code);
        setChallengeType(toLegacyChallengeType(rec.code));
      }
    } catch (error) {
      toast.error('Failed to get detailed analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleEvidenceToggle = (index) => {
    const updated = [...evidenceChecklist];
    updated[index].obtained = !updated[index].obtained;
    setEvidenceChecklist(updated);
  };

  const handleSaveAndClose = async () => {
    setLoading(true);
    try {
      await violationsAPI.saveDataQLetter(violation._id, {
        challengeType,
        rdrType,
        reason
      });
      await violationsAPI.updateEvidenceChecklist(violation._id, evidenceChecklist);
      onSuccess();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Analysis
        return (
          <div className="space-y-4">
            {/* Violation Summary */}
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
              <h4 className="font-medium text-zinc-900 dark:text-white mb-2">Violation Being Challenged</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">Type:</span>
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">{violation.violationType}</p>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">Date:</span>
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">{formatDate(violation.violationDate)}</p>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">BASIC:</span>
                  <p className="font-medium text-zinc-700 dark:text-zinc-300 capitalize">
                    {basicCategories[violation.basic]?.label || violation.basic?.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">Severity:</span>
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">
                    {violation.severityWeight}/10 {violation.outOfService && '(OOS)'}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Score */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-accent-50 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-500/20">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                  <span className={`text-2xl font-bold ${
                    analysis?.score >= 75 ? 'text-success-600' :
                    analysis?.score >= 50 ? 'text-warning-600' :
                    'text-zinc-600'
                  }`}>
                    {analysis?.score || 0}
                  </span>
                </div>
              </div>
              <div>
                <p className="font-semibold text-accent-800 dark:text-accent-300">
                  {analysis?.category?.label || 'Challenge Potential Score'}
                </p>
                <p className="text-sm text-accent-600 dark:text-accent-400">
                  {analysis?.score >= 75 ? 'This violation is a strong candidate for challenge' :
                   analysis?.score >= 50 ? 'This violation may be worth challenging' :
                   'This violation has limited challenge potential'}
                </p>
              </div>
            </div>

            {/* Low Score Warning Gate */}
            {analysis?.score < 20 && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <div className="flex gap-3">
                  <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800 dark:text-red-300">Not Recommended</p>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                      This violation scores {analysis.score}/100, indicating very low challenge success probability.
                    </p>
                    {analysis.recommendation?.reason && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {analysis.recommendation.reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Factors */}
            {analysis?.factors && analysis.factors.length > 0 && (
              <div>
                <h4 className="font-medium text-zinc-700 dark:text-zinc-300 mb-2">Supporting Factors</h4>
                <ul className="space-y-2">
                  {analysis.factors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <FiCheck className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-600 dark:text-zinc-400">{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Score Impact Card */}
            {violation?._id && (
              <ScoreImpactCard violationId={violation._id} />
            )}

            {/* Fetch Deep Analysis Button */}
            {!deepAnalysis && (
              <button
                onClick={fetchDeepAnalysis}
                className="w-full btn btn-secondary"
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : <FiZap className="w-4 h-4" />}
                Get Detailed AI Analysis
              </button>
            )}

            {/* Deep Analysis Results */}
            {deepAnalysis?.aiAnalysis && (
              <div className="p-4 rounded-lg bg-info-50 dark:bg-info-500/10 border border-info-200 dark:border-info-500/20">
                <h4 className="font-medium text-info-800 dark:text-info-300 mb-2">
                  AI Deep Analysis
                </h4>
                {deepAnalysis.aiAnalysis.summary && (
                  <p className="text-sm text-info-700 dark:text-info-400 mb-3">
                    {deepAnalysis.aiAnalysis.summary}
                  </p>
                )}
                {deepAnalysis.aiAnalysis.successLikelihood && (
                  <div className="text-sm">
                    <span className="text-info-600 dark:text-info-400">Success likelihood: </span>
                    <span className="font-semibold text-info-800 dark:text-info-300">
                      {deepAnalysis.aiAnalysis.successLikelihood.percentage}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 1: // RDR Type Selector
        return (
          <div className="space-y-4">
            {/* Auto-suggested RDR type */}
            {analysis?.recommendedRdrType && (
              <div className={`p-4 rounded-lg border-2 transition-all ${
                rdrType === analysis.recommendedRdrType.code
                  ? 'border-accent-500 bg-accent-50 dark:bg-accent-500/10'
                  : 'border-accent-200 dark:border-accent-500/30 bg-accent-50/50 dark:bg-accent-500/5'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="radio"
                      name="rdrType"
                      value={analysis.recommendedRdrType.code}
                      checked={rdrType === analysis.recommendedRdrType.code}
                      onChange={() => handleRdrTypeSelect(analysis.recommendedRdrType.code)}
                      className="w-4 h-4 text-accent-600 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-accent-800 dark:text-accent-300">
                          {analysis.recommendedRdrType.name}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          analysis.recommendedRdrType.confidence === 'high'
                            ? 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300'
                            : analysis.recommendedRdrType.confidence === 'medium'
                            ? 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-300'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                        }`}>
                          <FiShield className="w-3 h-3" />
                          {analysis.recommendedRdrType.confidence} confidence
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 dark:bg-accent-500/20 dark:text-accent-300 font-medium">
                          Recommended
                        </span>
                      </div>
                      <p className="text-sm text-accent-600 dark:text-accent-400 mt-1">
                        {RDR_TYPES[analysis.recommendedRdrType.code]?.description}
                      </p>
                      {analysis.recommendedRdrType.reason && (
                        <p className="text-xs text-accent-500 dark:text-accent-400 mt-1 flex items-center gap-1">
                          <FiInfo className="w-3 h-3" />
                          {analysis.recommendedRdrType.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Alternative suggestions */}
            {analysis?.alternativeRdrTypes?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Also Consider
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.alternativeRdrTypes.map((alt) => (
                    <button
                      key={alt.code}
                      onClick={() => handleRdrTypeSelect(alt.code)}
                      className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                        rdrType === alt.code
                          ? 'border-accent-500 bg-accent-50 dark:bg-accent-500/10 text-accent-700 dark:text-accent-300'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {alt.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              <span className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">All RDR Types</span>
              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
            </div>

            {/* Category-grouped list */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {sortedCategories.map(([catKey, catMeta]) => {
                const types = groupedRdrTypes[catKey] || [];
                const isExpanded = expandedCategories[catKey];
                const hasSelected = types.some(t => t.code === rdrType);

                return (
                  <div key={catKey} className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(catKey)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
                          {catMeta.label}
                        </span>
                        <span className="text-xs text-zinc-400">({types.length})</span>
                        {hasSelected && <FiCheck className="w-3.5 h-3.5 text-accent-500" />}
                      </div>
                      {isExpanded
                        ? <FiChevronUp className="w-4 h-4 text-zinc-400" />
                        : <FiChevronDown className="w-4 h-4 text-zinc-400" />
                      }
                    </button>
                    {isExpanded && (
                      <div className="border-t border-zinc-100 dark:border-zinc-700/50">
                        {types.map((type) => (
                          <label
                            key={type.code}
                            className={`flex items-start gap-3 p-3 cursor-pointer transition-all border-b last:border-b-0 border-zinc-100 dark:border-zinc-700/50 ${
                              rdrType === type.code
                                ? 'bg-accent-50 dark:bg-accent-500/10'
                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                            }`}
                          >
                            <input
                              type="radio"
                              name="rdrType"
                              value={type.code}
                              checked={rdrType === type.code}
                              onChange={() => handleRdrTypeSelect(type.code)}
                              className="w-4 h-4 text-accent-600 mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`text-sm font-medium ${
                                  rdrType === type.code
                                    ? 'text-accent-700 dark:text-accent-300'
                                    : 'text-zinc-700 dark:text-zinc-300'
                                }`}>{type.name}</p>
                                <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
                                  {REVIEWER_LABELS[type.reviewer] || type.reviewer}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{type.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Warning banners */}
            {rdrWarnings.length > 0 && (
              <div className="space-y-2">
                {rdrWarnings.map((warning, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20">
                    <FiAlertTriangle className="w-4 h-4 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-warning-700 dark:text-warning-400">{warning}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reason textarea */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Reason for Challenge *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="form-input"
                placeholder="Describe why you believe this violation should be challenged. Be specific about the error or circumstance..."
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Be factual and specific about the error or circumstance.
              </p>
            </div>
          </div>
        );

      case 2: // Evidence Checklist
        return (
          <div className="space-y-4">
            <EvidenceCollectionPanel
              violationId={violation?._id}
              rdrType={rdrType}
              evidenceChecklist={evidenceChecklist}
              onUpdate={(updated) => {
                setEvidenceChecklist(updated);
              }}
            />
          </div>
        );

      case 3: // Submit
        return (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-success-100 dark:bg-success-500/20 flex items-center justify-center mx-auto">
              <FiCheckCircle className="w-8 h-8 text-success-600 dark:text-success-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Ready to Save
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Your DataQ challenge has been prepared. Save it to your violation record for tracking.
            </p>
            {rdrType && RDR_TYPES[rdrType] && (
              <div className="p-3 rounded-lg bg-accent-50 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-500/20 text-left">
                <p className="text-sm font-medium text-accent-800 dark:text-accent-300">
                  RDR Type: {RDR_TYPES[rdrType].name}
                </p>
                <p className="text-xs text-accent-600 dark:text-accent-400 mt-0.5">
                  Reviewed by: {REVIEWER_LABELS[RDR_TYPES[rdrType].reviewer]}
                </p>
              </div>
            )}
            <div className="p-4 rounded-lg bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 text-left">
              <div className="flex gap-2">
                <FiAlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning-800 dark:text-warning-300 text-sm">Next Steps:</p>
                  <ol className="text-sm text-warning-700 dark:text-warning-400 list-decimal list-inside mt-1 space-y-1">
                    <li>Draft your challenge letter using the analysis and evidence above</li>
                    <li>Gather the required supporting evidence</li>
                    <li>Submit through the official FMCSA DataQs system</li>
                    <li>Update the challenge status here when you receive a response</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="DataQ Challenge Builder"
      icon={FiFileText}
      size="lg"
    >
      {/* Step Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-600 text-white'
                    : isCompleted
                    ? 'bg-success-500 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                }`}>
                  {isCompleted ? <FiCheck className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-12 lg:w-20 h-0.5 mx-1 ${
                    isCompleted ? 'bg-success-500' : 'bg-zinc-200 dark:bg-zinc-700'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          {STEPS.map((step, idx) => (
            <span
              key={step.id}
              className={`text-xs ${
                idx === currentStep
                  ? 'text-accent-600 dark:text-accent-400 font-medium'
                  : 'text-zinc-400'
              }`}
              style={{ width: idx < STEPS.length - 1 ? 'auto' : 'auto' }}
            >
              {step.label}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700 mt-4">
        <button
          onClick={currentStep === 0 ? onClose : handleBack}
          className="btn btn-secondary"
          disabled={loading}
        >
          {currentStep === 0 ? (
            <>
              <FiX className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <FiChevronLeft className="w-4 h-4" />
              Back
            </>
          )}
        </button>

        {currentStep < STEPS.length - 1 ? (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleNext}
              className="btn btn-primary"
              disabled={loading || (currentStep === 0 && analysis?.score < 20 && !overrideLowScore)}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  Next
                  <FiChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
            {currentStep === 0 && analysis?.score < 20 && !overrideLowScore && (
              <button
                onClick={() => setOverrideLowScore(true)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline"
              >
                Proceed anyway (not recommended)
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleSaveAndClose}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" /> : (
              <>
                <FiCheck className="w-4 h-4" />
                Save & Close
              </>
            )}
          </button>
        )}
      </div>
    </Modal>
  );
};

export default DataQLetterModal;
