import { useState, useEffect, useCallback } from 'react';
import { FiCheckSquare, FiSquare, FiAlertCircle, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { violationsAPI } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';
import EvidenceStrengthMeter from './EvidenceStrengthMeter';

const EvidenceCollectionPanel = ({ violationId, rdrType, evidenceChecklist = [], onUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [workflow, setWorkflow] = useState(null);
  const [autoAvailable, setAutoAvailable] = useState({});
  const [checklist, setChecklist] = useState(evidenceChecklist);
  const [strengthData, setStrengthData] = useState({ score: 0, label: '', missingRequired: [], suggestions: [] });
  const [calculatingStrength, setCalculatingStrength] = useState(false);

  // Fetch workflow and auto-available data on mount
  useEffect(() => {
    if (!violationId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [workflowRes, autoRes] = await Promise.all([
          violationsAPI.getEvidenceWorkflow(violationId, rdrType),
          violationsAPI.getEvidenceAutoAvailable(violationId)
        ]);

        const workflowData = workflowRes.data?.workflow || workflowRes.data;
        setWorkflow(workflowData);

        const autoData = autoRes.data?.autoAvailable || autoRes.data?.evidence || autoRes.data || {};
        setAutoAvailable(autoData);

        // Initialize checklist from workflow steps if not provided via props
        if (evidenceChecklist.length === 0 && workflowData?.steps) {
          const initialChecklist = workflowData.steps.map(step => ({
            stepId: step.id || step.stepId || step.stepNumber?.toString() || null,
            title: step.title || step.item,
            description: step.description,
            required: step.required || false,
            obtained: false,
            sourceModule: step.sourceModule || null
          }));
          setChecklist(initialChecklist);
        }
      } catch (err) {
        toast.error('Failed to load evidence workflow');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [violationId, rdrType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate evidence strength when checklist changes
  const calculateStrength = useCallback(async (currentChecklist) => {
    if (!violationId || currentChecklist.length === 0) return;

    setCalculatingStrength(true);
    try {
      const res = await violationsAPI.calculateEvidenceStrength(violationId, currentChecklist.map(c => ({
        item: c.title || c.item,
        obtained: c.obtained || false,
        required: c.required || false
      })));
      const data = res.data?.strength || res.data || {};
      setStrengthData({
        score: data.score || 0,
        label: data.label || '',
        missingRequired: data.missingRequired || [],
        suggestions: data.suggestions || []
      });
    } catch {
      // Silently fail on strength calculation - non-critical
    } finally {
      setCalculatingStrength(false);
    }
  }, [violationId]);

  // Recalculate strength when checklist changes
  useEffect(() => {
    if (!loading && checklist.length > 0) {
      calculateStrength(checklist);
    }
  }, [checklist, loading, calculateStrength]);

  const handleToggle = (index) => {
    const updated = checklist.map((item, i) =>
      i === index ? { ...item, obtained: !item.obtained } : item
    );
    setChecklist(updated);
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  const isAutoAvailable = (step) => {
    if (!step.sourceModule) return false;
    // Map sourceModule names to auto-available evidence keys
    const moduleMap = {
      maintenance: 'maintenanceRecords',
      drivers: 'driverInfo',
      vehicles: 'vehicleInfo',
      drug_alcohol: 'drugAlcoholTests',
      documents: 'documents',
      eld: 'eldData'
    };
    const key = moduleMap[step.sourceModule] || step.sourceModule;
    const value = autoAvailable[key];
    // Truthy check: arrays must have items, objects must exist, booleans as-is
    if (Array.isArray(value)) return value.length > 0;
    return !!value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!workflow && checklist.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Evidence Strength Meter */}
      <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <EvidenceStrengthMeter
          score={strengthData.score}
          label={strengthData.label}
          missingRequired={strengthData.missingRequired}
          suggestions={strengthData.suggestions}
        />
        {calculatingStrength && (
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            <LoadingSpinner size="sm" />
            <span>Recalculating...</span>
          </div>
        )}
      </div>

      {/* Checklist Steps */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Evidence Checklist
          <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500 font-normal">
            {checklist.filter(c => c.obtained).length}/{checklist.length} collected
          </span>
        </p>

        <div className="space-y-1">
          {checklist.map((step, index) => {
            const auto = isAutoAvailable(step);

            return (
              <button
                key={step.stepId || index}
                onClick={() => handleToggle(index)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                  step.obtained
                    ? 'bg-emerald-50 dark:bg-emerald-500/10'
                    : 'bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'
                }`}
              >
                {/* Checkbox */}
                <div className="flex-shrink-0 mt-0.5">
                  {step.obtained ? (
                    <FiCheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <FiSquare className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${
                      step.obtained
                        ? 'text-emerald-700 dark:text-emerald-400 line-through'
                        : 'text-zinc-900 dark:text-white'
                    }`}>
                      {step.title}
                    </span>

                    {/* Required badge */}
                    {step.required && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                        <FiAlertCircle className="w-3 h-3" />
                        Required
                      </span>
                    )}

                    {/* Auto-available badge */}
                    {auto && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                        <FiZap className="w-3 h-3" />
                        Auto
                      </span>
                    )}
                  </div>

                  {step.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EvidenceCollectionPanel;
