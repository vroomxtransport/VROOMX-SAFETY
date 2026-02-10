import { useState } from 'react';
import { violationsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { FiCheckCircle } from 'react-icons/fi';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

const COURT_OUTCOMES = [
  { value: 'dismissed', label: 'Dismissed', description: 'Case was dismissed by the court' },
  { value: 'reduced', label: 'Reduced', description: 'Charges were reduced to a lesser violation' },
  { value: 'guilty', label: 'Guilty', description: 'Found guilty as charged' },
  { value: 'pending', label: 'Pending', description: 'Court date scheduled, awaiting outcome' },
  { value: 'not_applicable', label: 'Not Applicable', description: 'No court action taken or required' }
];

const CourtOutcomeModal = ({ isOpen, onClose, violation, onSuccess }) => {
  const [courtOutcome, setCourtOutcome] = useState('');
  const [courtDate, setCourtDate] = useState('');
  const [courtNotes, setCourtNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!courtOutcome) {
      toast.error('Please select a court outcome');
      return;
    }

    setSaving(true);
    try {
      await violationsAPI.updateCourtOutcome(violation._id, {
        courtOutcome,
        courtDate: courtDate || undefined,
        courtNotes: courtNotes || undefined
      });
      toast.success('Court outcome recorded');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save court outcome');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Court Outcome"
      icon={FiCheckCircle}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
            Violation: <span className="font-medium text-zinc-900 dark:text-white">{violation.violationType || violation.violationCode}</span>
          </p>
        </div>

        {/* Outcome Selection */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Court Outcome *
          </label>
          <div className="space-y-2">
            {COURT_OUTCOMES.map((option) => (
              <label
                key={option.value}
                className={`block p-3 rounded-lg border cursor-pointer transition-all ${
                  courtOutcome === option.value
                    ? 'border-accent-500 bg-accent-50 dark:bg-accent-500/10'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="courtOutcome"
                    value={option.value}
                    checked={courtOutcome === option.value}
                    onChange={(e) => setCourtOutcome(e.target.value)}
                    className="w-4 h-4 text-accent-600"
                  />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white text-sm">{option.label}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{option.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Court Date */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Court Date
          </label>
          <input
            type="date"
            value={courtDate}
            onChange={(e) => setCourtDate(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={courtNotes}
            onChange={(e) => setCourtNotes(e.target.value)}
            rows={3}
            className="form-input"
            placeholder="Any additional details about the court outcome..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving || !courtOutcome}
          >
            {saving ? <LoadingSpinner size="sm" /> : <FiCheckCircle className="w-4 h-4" />}
            Save Outcome
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CourtOutcomeModal;
