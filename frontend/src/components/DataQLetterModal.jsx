import { useState } from 'react';
import { violationsAPI } from '../utils/api';
import { formatDate, basicCategories } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiFileText, FiZap, FiChevronLeft, FiChevronRight, FiCheck,
  FiAlertTriangle, FiDownload, FiCopy, FiCheckCircle, FiX,
  FiList, FiEdit3, FiSend
} from 'react-icons/fi';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

const STEPS = [
  { id: 'analysis', label: 'AI Analysis', icon: FiZap },
  { id: 'type', label: 'Challenge Type', icon: FiList },
  { id: 'preview', label: 'Letter Preview', icon: FiFileText },
  { id: 'evidence', label: 'Evidence Checklist', icon: FiCheckCircle },
  { id: 'submit', label: 'Submit', icon: FiSend }
];

const CHALLENGE_TYPES = [
  {
    value: 'data_error',
    label: 'Data Error',
    description: 'Factual information in the inspection report is incorrect (wrong vehicle, driver, date, etc.)'
  },
  {
    value: 'policy_violation',
    label: 'Policy Violation',
    description: 'The inspector did not follow proper FMCSA inspection procedures or policies'
  },
  {
    value: 'procedural_error',
    label: 'Procedural Error',
    description: 'The inspection was not conducted according to established guidelines'
  },
  {
    value: 'not_responsible',
    label: 'Not Responsible',
    description: 'The carrier/driver should not be held responsible (leased equipment, etc.)'
  }
];

const DataQLetterModal = ({ isOpen, onClose, violation, analysis, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [challengeType, setChallengeType] = useState(analysis?.recommendedChallengeType || 'data_error');
  const [reason, setReason] = useState('');
  const [generatedLetter, setGeneratedLetter] = useState(null);
  const [evidenceChecklist, setEvidenceChecklist] = useState(
    analysis?.evidenceChecklist || []
  );
  const [loading, setLoading] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState(null);

  const handleNext = async () => {
    // Validate current step before proceeding
    if (currentStep === 1 && !reason.trim()) {
      toast.error('Please provide a reason for the challenge');
      return;
    }

    if (currentStep === 1) {
      // Generate the letter
      await generateLetter();
    } else if (currentStep < STEPS.length - 1) {
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
    } catch (error) {
      toast.error('Failed to get detailed analysis');
    } finally {
      setLoading(false);
    }
  };

  const generateLetter = async () => {
    setLoading(true);
    try {
      const evidenceList = evidenceChecklist
        .filter(e => e.obtained)
        .map(e => e.item);

      const response = await violationsAPI.generateLetter(violation._id, {
        challengeType,
        reason,
        evidenceList
      });

      setGeneratedLetter(response.data.data.letter);
      setCurrentStep(2); // Move to preview step
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate letter');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(generatedLetter);
    toast.success('Letter copied to clipboard');
  };

  const handleDownloadLetter = () => {
    const blob = new Blob([generatedLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DataQ_Challenge_${violation.inspectionNumber}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Letter downloaded');
  };

  const handleEvidenceToggle = (index) => {
    const updated = [...evidenceChecklist];
    updated[index].obtained = !updated[index].obtained;
    setEvidenceChecklist(updated);
  };

  const handleSaveAndClose = async () => {
    setLoading(true);
    try {
      // Save the letter to the violation
      await violationsAPI.saveDataQLetter(violation._id, {
        content: generatedLetter,
        challengeType
      });

      // Save evidence checklist
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

      case 1: // Challenge Type
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Select Challenge Type
              </label>
              <div className="space-y-2">
                {CHALLENGE_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={`block p-4 rounded-lg border cursor-pointer transition-all ${
                      challengeType === type.value
                        ? 'border-accent-500 bg-accent-50 dark:bg-accent-500/10'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="challengeType"
                        value={type.value}
                        checked={challengeType === type.value}
                        onChange={(e) => setChallengeType(e.target.value)}
                        className="w-4 h-4 text-accent-600"
                      />
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">{type.label}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{type.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

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
                This will be included in the generated letter. Be factual and specific.
              </p>
            </div>
          </div>
        );

      case 2: // Letter Preview
        return (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button onClick={handleCopyLetter} className="btn btn-secondary text-sm">
                <FiCopy className="w-4 h-4" />
                Copy
              </button>
              <button onClick={handleDownloadLetter} className="btn btn-secondary text-sm">
                <FiDownload className="w-4 h-4" />
                Download
              </button>
            </div>
            <div className="p-4 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300 font-mono">
                {generatedLetter}
              </pre>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Review the letter above. You can edit it after downloading or copy it to make changes.
            </p>
          </div>
        );

      case 3: // Evidence Checklist
        return (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Check off the evidence you have gathered to support your challenge. Required items are marked.
            </p>
            <div className="space-y-2">
              {evidenceChecklist.map((item, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    item.obtained
                      ? 'border-success-500 bg-success-50 dark:bg-success-500/10'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.obtained}
                    onChange={() => handleEvidenceToggle(idx)}
                    className="w-4 h-4 text-success-600 rounded"
                  />
                  <div className="flex-grow">
                    <span className="text-zinc-700 dark:text-zinc-300">{item.item}</span>
                    {item.required && (
                      <span className="ml-2 text-xs text-danger-500">(Required)</span>
                    )}
                  </div>
                  {item.obtained && <FiCheck className="w-5 h-5 text-success-500" />}
                </label>
              ))}
            </div>
            {evidenceChecklist.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-4">
                No evidence checklist available. You can proceed without it.
              </p>
            )}
          </div>
        );

      case 4: // Submit
        return (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-success-100 dark:bg-success-500/20 flex items-center justify-center mx-auto">
              <FiCheckCircle className="w-8 h-8 text-success-600 dark:text-success-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Ready to Save
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Your DataQ challenge letter has been generated. Save it to your violation record for tracking.
            </p>
            <div className="p-4 rounded-lg bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 text-left">
              <div className="flex gap-2">
                <FiAlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning-800 dark:text-warning-300 text-sm">Next Steps:</p>
                  <ol className="text-sm text-warning-700 dark:text-warning-400 list-decimal list-inside mt-1 space-y-1">
                    <li>Download or copy the generated letter</li>
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
      title="Generate DataQ Challenge Letter"
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
          <button
            onClick={handleNext}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                {currentStep === 1 ? 'Generate Letter' : 'Next'}
                <FiChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
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
