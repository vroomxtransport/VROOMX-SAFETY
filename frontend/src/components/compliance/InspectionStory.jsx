import { useState, useEffect, useCallback } from 'react';
import {
  FiFileText, FiAlertTriangle, FiTrendingDown, FiShield, FiCheckCircle,
  FiMapPin, FiCalendar, FiUser, FiClock, FiChevronDown, FiChevronUp,
  FiPlus, FiEdit2, FiTrash2, FiTarget, FiZap, FiInfo, FiClipboard
} from 'react-icons/fi';
import { formatDate, basicCategories } from '../../utils/helpers';
import { correctiveActionsAPI, violationsAPI } from '../../utils/api';

// --- Inspection level labels ---
const INSPECTION_LEVEL_LABELS = {
  1: 'Level 1 - Full Inspection',
  2: 'Level 2 - Walk-Around',
  3: 'Level 3 - Driver Only',
  4: 'Level 4 - Special',
  5: 'Level 5 - Vehicle Only',
  6: 'Level 6 - Enhanced NAS'
};

const INSPECTION_TYPE_LABELS = {
  roadside: 'Roadside',
  terminal: 'Terminal',
  post_crash: 'Post-Crash',
  complaint: 'Complaint',
  other: 'Other'
};

const ACTION_TYPE_LABELS = {
  repair: 'Repair',
  training: 'Training',
  policy_change: 'Policy Change',
  document_update: 'Document Update',
  other: 'Other'
};

const STATUS_COLORS = {
  planned: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
};

// --- Severity color helper ---
const getSeverityColor = (weight) => {
  if (weight >= 7) return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' };
  if (weight >= 4) return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' };
  return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' };
};

// --- DataQ challenge score estimator ---
const estimateChallengeScore = (violation) => {
  let score = 5;
  if (violation.oos) score -= 2;
  if (violation.severityWeight >= 8) score -= 1;
  if (violation.severityWeight <= 3) score += 2;
  if (violation.unit === 'vehicle') score += 1;
  return Math.max(1, Math.min(10, score));
};

// --- Collapsible section ---
const StorySection = ({ icon: Icon, title, defaultOpen = true, children, badge }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-l-2 border-zinc-200 dark:border-zinc-700 pl-6 ml-3 relative">
      {/* Timeline dot */}
      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-zinc-300 dark:bg-zinc-600 border-2 border-white dark:border-zinc-900" />
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left mb-3 group"
      >
        <Icon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        {badge && (
          <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {badge}
          </span>
        )}
        <span className="ml-auto text-zinc-400">
          {isOpen ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
        </span>
      </button>
      {isOpen && <div className="pb-6">{children}</div>}
    </div>
  );
};

// --- Corrective action form ---
const CorrectiveActionForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [form, setForm] = useState({
    description: initialData?.description || '',
    actionType: initialData?.actionType || 'other',
    completedBy: initialData?.completedBy || '',
    completedDate: initialData?.completedDate ? new Date(initialData.completedDate).toISOString().split('T')[0] : '',
    status: initialData?.status || 'planned',
    notes: initialData?.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description.trim()) return;
    onSubmit({
      ...form,
      completedDate: form.completedDate || undefined
    });
  };

  const inputClass = 'w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none';

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3 border border-zinc-200 dark:border-zinc-700">
      <div>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Description *</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
          className={inputClass}
          rows={2}
          placeholder="Describe the corrective action taken..."
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Action Type</label>
          <select
            value={form.actionType}
            onChange={(e) => setForm(f => ({ ...f, actionType: e.target.value }))}
            className={inputClass}
          >
            {Object.entries(ACTION_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
            className={inputClass}
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Completed By</label>
          <input
            type="text"
            value={form.completedBy}
            onChange={(e) => setForm(f => ({ ...f, completedBy: e.target.value }))}
            className={inputClass}
            placeholder="Name of responsible person"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Completed Date</label>
          <input
            type="date"
            value={form.completedDate}
            onChange={(e) => setForm(f => ({ ...f, completedDate: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
          className={inputClass}
          rows={2}
          placeholder="Additional notes..."
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200">
          Cancel
        </button>
        <button type="submit" className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          {initialData ? 'Update' : 'Add Action'}
        </button>
      </div>
    </form>
  );
};

// --- Main Component ---
const InspectionStory = ({ inspection }) => {
  const [correctiveActions, setCorrectiveActions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [loadingActions, setLoadingActions] = useState(false);
  const [generatingLetter, setGeneratingLetter] = useState(null);

  // Get violations from inspection (supports both embedded and ref'd)
  const violations = inspection?.violations || [];
  const violationRefs = inspection?.violationRefs || [];
  const allViolations = violationRefs.length > 0 ? violationRefs : violations;

  // Gather unique BASIC categories
  const basicBreakdown = {};
  allViolations.forEach(v => {
    const basic = v.basic;
    if (basic) {
      if (!basicBreakdown[basic]) basicBreakdown[basic] = [];
      basicBreakdown[basic].push(v);
    }
  });

  // Load corrective actions from backend
  const loadActions = useCallback(async () => {
    if (!inspection?._id) return;
    setLoadingActions(true);
    try {
      const res = await correctiveActionsAPI.getAll({ inspectionId: inspection._id });
      setCorrectiveActions(res.data?.actions || []);
    } catch {
      // Silently fail - actions are optional
    } finally {
      setLoadingActions(false);
    }
  }, [inspection?._id]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  // --- CRUD handlers ---
  const handleAddAction = async (data) => {
    try {
      await correctiveActionsAPI.create({
        ...data,
        inspectionId: inspection._id
      });
      setShowAddForm(false);
      loadActions();
    } catch (err) {
      console.error('Failed to create corrective action:', err);
    }
  };

  const handleUpdateAction = async (data) => {
    try {
      await correctiveActionsAPI.update(editingAction._id, data);
      setEditingAction(null);
      loadActions();
    } catch (err) {
      console.error('Failed to update corrective action:', err);
    }
  };

  const handleDeleteAction = async (id) => {
    if (!window.confirm('Delete this corrective action?')) return;
    try {
      await correctiveActionsAPI.delete(id);
      loadActions();
    } catch (err) {
      console.error('Failed to delete corrective action:', err);
    }
  };

  const handleGenerateLetter = async (violationId) => {
    setGeneratingLetter(violationId);
    try {
      const res = await violationsAPI.generateLetter(violationId);
      // Open the letter in a new modal/view - for now just alert success
      if (res.data?.letter) {
        // Create a blob and download
        const blob = new Blob([res.data.letter.content || res.data.letter], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dataq-petition-${violationId}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to generate DataQ letter:', err);
    } finally {
      setGeneratingLetter(null);
    }
  };

  if (!inspection) return null;

  // Build result status
  const hasOOS = inspection.vehicleOOS || inspection.driverOOS || inspection.hazmatOOS;
  const hasViolations = allViolations.length > 0;
  const resultLabel = hasOOS ? 'Out of Service' : hasViolations ? 'Violations Found' : 'Clean';
  const resultColor = hasOOS
    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    : hasViolations
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';

  // Calculate time-based info
  const inspectionDate = new Date(inspection.inspectionDate);
  const monthsOld = Math.floor((Date.now() - inspectionDate) / (1000 * 60 * 60 * 24 * 30));
  const timeWeight = monthsOld <= 12 ? 3 : monthsOld <= 24 ? 2 : 1;
  const timeWeightLabel = monthsOld <= 12 ? '3x (current)' : monthsOld <= 24 ? '2x (aging)' : '1x (oldest)';

  // Build narrative
  const locationStr = [inspection.location, inspection.state].filter(Boolean).join(', ');
  const inspTypeLabel = INSPECTION_TYPE_LABELS[inspection.inspectionType] || inspection.inspectionType || 'Standard';
  const uniqueBasics = Object.keys(basicBreakdown);

  return (
    <div className="space-y-1">
      {/* ─── Section 1: Inspection Summary ─── */}
      <StorySection icon={FiFileText} title="Inspection Summary" defaultOpen={true}>
        <div className="bg-white dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${resultColor}`}>
              {resultLabel}
            </span>
            {inspection.inspectionLevel && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                {INSPECTION_LEVEL_LABELS[inspection.inspectionLevel] || `Level ${inspection.inspectionLevel}`}
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
              {inspTypeLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <FiCalendar className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
              <div>
                <span className="block text-xs text-zinc-500">Date</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-100">{formatDate(inspection.inspectionDate, 'MMM dd, yyyy')}</span>
              </div>
            </div>
            {locationStr && (
              <div className="flex items-start gap-2">
                <FiMapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                <div>
                  <span className="block text-xs text-zinc-500">Location</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">{locationStr}</span>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <FiFileText className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
              <div>
                <span className="block text-xs text-zinc-500">Report #</span>
                <span className="font-mono font-medium text-zinc-800 dark:text-zinc-100">{inspection.reportNumber}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FiClock className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
              <div>
                <span className="block text-xs text-zinc-500">Time Weight</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-100">{timeWeightLabel}</span>
              </div>
            </div>
          </div>

          {/* OOS badges */}
          {hasOOS && (
            <div className="flex flex-wrap gap-2 mt-4">
              {inspection.vehicleOOS && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400">
                  <FiAlertTriangle className="w-3.5 h-3.5" /> Vehicle OOS
                </span>
              )}
              {inspection.driverOOS && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400">
                  <FiAlertTriangle className="w-3.5 h-3.5" /> Driver OOS
                </span>
              )}
              {inspection.hazmatOOS && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400">
                  <FiAlertTriangle className="w-3.5 h-3.5" /> Hazmat OOS
                </span>
              )}
            </div>
          )}
        </div>
      </StorySection>

      {/* ─── Section 2: What Happened ─── */}
      <StorySection
        icon={FiClipboard}
        title="What Happened"
        defaultOpen={true}
        badge={allViolations.length > 0 ? `${allViolations.length} violation${allViolations.length !== 1 ? 's' : ''}` : 'Clean'}
      >
        {/* Narrative paragraph */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-100 dark:border-blue-800/40">
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            On <strong>{formatDate(inspection.inspectionDate, 'MMMM dd, yyyy')}</strong>
            {locationStr ? <>, an inspection took place at <strong>{locationStr}</strong></> : <>, an inspection was conducted</>}.
            The <strong>{inspTypeLabel.toLowerCase()}</strong> inspection
            {allViolations.length > 0
              ? <> found <strong className="text-red-600 dark:text-red-400">{allViolations.length} violation{allViolations.length !== 1 ? 's' : ''}</strong> across <strong>{uniqueBasics.length} BASIC categor{uniqueBasics.length !== 1 ? 'ies' : 'y'}</strong>.</>
              : <> resulted in a <strong className="text-green-600 dark:text-green-400">clean inspection</strong> with no violations found.</>
            }
            {hasOOS && <> <span className="text-red-600 dark:text-red-400 font-semibold">Out-of-service conditions were identified.</span></>}
          </p>
        </div>

        {/* Violation list */}
        {allViolations.length > 0 && (
          <div className="space-y-2">
            {allViolations.map((v, idx) => {
              const severity = getSeverityColor(v.severityWeight || 1);
              const basicLabel = basicCategories[v.basic]?.label || v.basic?.replace(/_/g, ' ') || 'Unknown';
              return (
                <div key={v._id || idx} className={`flex items-start gap-3 p-3 rounded-lg ${severity.bg} border border-zinc-200/50 dark:border-zinc-700/50`}>
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${severity.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {v.code || v.violationCode ? (
                        <span className="font-mono text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-white/60 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded">
                          {v.code || v.violationCode}
                        </span>
                      ) : null}
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${severity.text}`}>
                        Severity {v.severityWeight || '?'}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {basicLabel}
                      </span>
                      {v.oos && (
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">OOS</span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">{v.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </StorySection>

      {/* ─── Section 3: CSA Impact Analysis ─── */}
      {allViolations.length > 0 && (
        <StorySection
          icon={FiTrendingDown}
          title="CSA Impact Analysis"
          defaultOpen={false}
          badge={`${uniqueBasics.length} BASIC${uniqueBasics.length !== 1 ? 's' : ''} affected`}
        >
          <div className="space-y-4">
            {/* Per-BASIC breakdown */}
            {Object.entries(basicBreakdown).map(([basic, bViolations]) => {
              const basicInfo = basicCategories[basic] || { label: basic?.replace(/_/g, ' '), threshold: 65 };
              const totalSeverity = bViolations.reduce((sum, v) => sum + (v.severityWeight || 0) * timeWeight, 0);
              return (
                <div key={basic} className="bg-white dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-100">{basicInfo.label}</h4>
                    <span className="text-xs text-zinc-500">Intervention threshold: {basicInfo.threshold}%</span>
                  </div>
                  <div className="space-y-2">
                    {bViolations.map((v, idx) => (
                      <div key={v._id || idx} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-700 dark:text-zinc-300 truncate mr-4">
                          {v.code || v.violationCode || ''} {v.description}
                        </span>
                        <span className="shrink-0 font-mono text-zinc-600 dark:text-zinc-400">
                          +{(v.severityWeight || 0) * timeWeight} pts
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Total weighted severity
                    </span>
                    <span className="font-bold font-mono text-zinc-800 dark:text-zinc-100">{totalSeverity} pts</span>
                  </div>
                </div>
              );
            })}

            {/* Time decay info */}
            <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <FiInfo className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                <p className="mb-1">
                  <strong>Time Decay:</strong> This inspection is <strong>{monthsOld} month{monthsOld !== 1 ? 's' : ''}</strong> old with a <strong>{timeWeightLabel}</strong> multiplier.
                </p>
                <p>
                  {monthsOld <= 12
                    ? `Points will reduce to 2x weight in ${12 - monthsOld} month${12 - monthsOld !== 1 ? 's' : ''}.`
                    : monthsOld <= 24
                      ? `Points will reduce to 1x weight in ${24 - monthsOld} month${24 - monthsOld !== 1 ? 's' : ''}.`
                      : 'This inspection is in its final decay period and will age out of the BASIC calculation after 24 months.'
                  }
                </p>
              </div>
            </div>
          </div>
        </StorySection>
      )}

      {/* ─── Section 4: DataQ Eligibility ─── */}
      {allViolations.length > 0 && (
        <StorySection
          icon={FiTarget}
          title="DataQ Eligibility"
          defaultOpen={false}
          badge={`${allViolations.length} to review`}
        >
          <div className="space-y-3">
            {allViolations.map((v, idx) => {
              const challengeScore = estimateChallengeScore(v);
              const basicLabel = basicCategories[v.basic]?.label || v.basic?.replace(/_/g, ' ') || 'Unknown';
              const isGoodCandidate = challengeScore >= 6;
              const violationId = v._id;

              return (
                <div key={v._id || idx} className="bg-white dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {v.code || v.violationCode ? (
                          <span className="font-mono text-xs font-bold text-zinc-600 dark:text-zinc-400">{v.code || v.violationCode}</span>
                        ) : null}
                        <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{v.description}</span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Challenge via DataQ could reduce your <strong>{basicLabel}</strong> percentile
                      </p>
                    </div>
                    <div className="text-center shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 ${
                        isGoodCandidate
                          ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                          : 'border-zinc-300 dark:border-zinc-600 text-zinc-500 bg-zinc-50 dark:bg-zinc-800'
                      }`}>
                        {challengeScore}
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 block">Challenge</span>
                    </div>
                  </div>
                  {isGoodCandidate && violationId && (
                    <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                      <button
                        onClick={() => handleGenerateLetter(violationId)}
                        disabled={generatingLetter === violationId}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FiZap className="w-3.5 h-3.5" />
                        {generatingLetter === violationId ? 'Generating...' : 'Generate DataQ Petition'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </StorySection>
      )}

      {/* ─── Section 5: Corrective Actions ─── */}
      <StorySection
        icon={FiShield}
        title="Corrective Actions"
        defaultOpen={true}
        badge={correctiveActions.length > 0 ? `${correctiveActions.length} logged` : null}
      >
        <div className="space-y-3">
          {/* Existing actions */}
          {loadingActions ? (
            <div className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">Loading corrective actions...</div>
          ) : correctiveActions.length > 0 ? (
            correctiveActions.map((action) => (
              editingAction?._id === action._id ? (
                <CorrectiveActionForm
                  key={action._id}
                  initialData={action}
                  onSubmit={handleUpdateAction}
                  onCancel={() => setEditingAction(null)}
                />
              ) : (
                <div key={action._id} className="bg-white dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[action.status] || STATUS_COLORS.planned}`}>
                          {action.status?.replace('_', ' ') || 'Planned'}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {ACTION_TYPE_LABELS[action.actionType] || 'Other'}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-800 dark:text-zinc-100">{action.description}</p>
                      {(action.completedBy || action.completedDate) && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {action.completedBy && (
                            <span className="flex items-center gap-1">
                              <FiUser className="w-3 h-3" /> {action.completedBy}
                            </span>
                          )}
                          {action.completedDate && (
                            <span className="flex items-center gap-1">
                              <FiCalendar className="w-3 h-3" /> {formatDate(action.completedDate, 'MMM dd, yyyy')}
                            </span>
                          )}
                        </div>
                      )}
                      {action.notes && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 italic">{action.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingAction(action)}
                        className="p-1.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAction(action._id)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            ))
          ) : !showAddForm ? (
            <div className="text-center py-6 text-zinc-500 dark:text-zinc-400">
              <FiCheckCircle className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm">No corrective actions logged yet.</p>
              <p className="text-xs mt-1">Document actions taken in response to this inspection for audit readiness.</p>
            </div>
          ) : null}

          {/* Add form or button */}
          {showAddForm ? (
            <CorrectiveActionForm
              onSubmit={handleAddAction}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Add Corrective Action
            </button>
          )}
        </div>
      </StorySection>
    </div>
  );
};

export default InspectionStory;
