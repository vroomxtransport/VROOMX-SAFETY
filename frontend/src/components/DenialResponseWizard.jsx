import { useState, useEffect } from 'react';
import { violationsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle, FiCheck, FiChevronRight, FiShield,
  FiRefreshCw, FiFileText, FiScissors, FiBookOpen, FiCheckCircle
} from 'react-icons/fi';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

const OPTION_META = {
  A: { icon: FiShield, label: 'Request FMCSA Review', color: 'blue' },
  B: { icon: FiRefreshCw, label: 'Reopen with Additional Evidence', color: 'amber' },
  C: { icon: FiScissors, label: 'Refile Under Different RDR Type', color: 'purple' },
  D: { icon: FiBookOpen, label: 'Go to Court', color: 'orange' },
  E: { icon: FiCheckCircle, label: 'Accept and Focus on Clean Inspections', color: 'zinc' }
};

const colorMap = {
  blue: {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    border: 'border-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10'
  },
  amber: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    border: 'border-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-500/10'
  },
  purple: {
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    border: 'border-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-500/10'
  },
  orange: {
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    border: 'border-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-500/10'
  },
  zinc: {
    badge: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    border: 'border-zinc-500',
    bg: 'bg-zinc-50 dark:bg-zinc-800'
  }
};

const DenialResponseWizard = ({ violation, isOpen, onClose, onAction }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && violation?._id) {
      fetchOptions();
    }
    return () => {
      setSelectedOption(null);
      setConfirming(false);
      setError(null);
    };
  }, [isOpen, violation?._id]);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await violationsAPI.getDenialOptions(violation._id);
      setOptions(res.data.options || res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load denial response options');
      toast.error('Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedOption) return;

    setSubmitting(true);
    try {
      await violationsAPI.recordDenialAction(violation._id, {
        option: {
          id: selectedOption.id || selectedOption.letter || getOptionLetter(selectedOption, 0),
          label: selectedOption.label || OPTION_META[getOptionLetter(selectedOption, 0)]?.label || ''
        }
      });

      if (selectedOption.letter === 'B' || selectedOption.id === 'B' ||
          selectedOption.letter === 'C' || selectedOption.id === 'C') {
        await violationsAPI.initiateNewRound(violation._id, { roundType: 'reconsideration' });
      }

      if (selectedOption.letter === 'A' || selectedOption.id === 'A') {
        await violationsAPI.initiateNewRound(violation._id, { roundType: 'fmcsa_escalation' });
      }

      toast.success('Denial response recorded successfully');
      onAction?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record denial action');
    } finally {
      setSubmitting(false);
    }
  };

  const getOptionLetter = (opt, idx) => opt.letter || opt.id || String.fromCharCode(65 + idx);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Challenge Denied - What Next?"
      icon={FiAlertTriangle}
      size="lg"
    >
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <FiAlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-zinc-600 dark:text-zinc-400">{error}</p>
          <button onClick={fetchOptions} className="btn btn-secondary mt-4">
            Try Again
          </button>
        </div>
      ) : confirming ? (
        /* Confirmation Step */
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Confirm Your Choice
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Are you sure you want to{' '}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {selectedOption.label || OPTION_META[getOptionLetter(selectedOption, 0)]?.label || selectedOption.description}
              </span>
              ?
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setConfirming(false)}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? <LoadingSpinner size="sm" /> : (
                <>
                  <FiCheck className="w-4 h-4" />
                  Confirm
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Option Selection */
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Your DataQ challenge was denied. Choose one of the following options to respond.
          </p>

          <div className="space-y-3">
            {options.map((opt, idx) => {
              const letter = getOptionLetter(opt, idx);
              const meta = OPTION_META[letter] || OPTION_META.E;
              const Icon = meta.icon;
              const colors = colorMap[meta.color] || colorMap.zinc;
              const isAvailable = opt.available !== false;
              const isSelected = selectedOption === opt;

              return (
                <button
                  key={letter}
                  onClick={() => isAvailable && setSelectedOption(opt)}
                  disabled={!isAvailable}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? `${colors.border} ${colors.bg}`
                      : isAvailable
                      ? 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      : 'border-zinc-100 dark:border-zinc-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Letter Badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                      isSelected ? colors.badge : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {letter}
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${
                          isSelected ? '' : 'text-zinc-400 dark:text-zinc-500'
                        }`} />
                        <span className={`font-semibold text-sm ${
                          isSelected
                            ? 'text-zinc-900 dark:text-white'
                            : isAvailable
                            ? 'text-zinc-700 dark:text-zinc-300'
                            : 'text-zinc-400 dark:text-zinc-500'
                        }`}>
                          {opt.label || meta.label}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        isAvailable
                          ? 'text-zinc-500 dark:text-zinc-400'
                          : 'text-zinc-400 dark:text-zinc-600'
                      }`}>
                        {opt.description}
                      </p>

                      {/* Availability indicator */}
                      <div className="mt-2">
                        {isAvailable ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <FiCheckCircle className="w-3 h-3" />
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                            Not Available
                            {opt.reason && <span className="font-normal"> - {opt.reason}</span>}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <FiCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Confirm Button */}
          <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setConfirming(true)}
              disabled={!selectedOption}
              className="btn btn-primary"
            >
              Continue
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DenialResponseWizard;
