import { useState, useEffect } from 'react';
import { cleanInspectionsAPI } from '../utils/api';
import { formatDate, basicCategories } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiCheckCircle, FiAlertTriangle, FiChevronDown, FiChevronUp,
  FiPlus, FiTarget, FiTrendingUp, FiBarChart2, FiFileText,
  FiMapPin, FiCalendar, FiStar, FiInfo
} from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';

const INSPECTION_LEVELS = [
  { value: '1', label: 'Level 1 - Full Inspection' },
  { value: '2', label: 'Level 2 - Walk-Around' },
  { value: '3', label: 'Level 3 - Driver Only' },
  { value: '4', label: 'Level 4 - Special' },
  { value: '5', label: 'Level 5 - Vehicle Only' },
  { value: '6', label: 'Level 6 - Enhanced NAS' }
];

const CleanInspectionPanel = () => {
  const [ratio, setRatio] = useState(null);
  const [cleanList, setCleanList] = useState([]);
  const [missing, setMissing] = useState([]);
  const [strategy, setStrategy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Report form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    inspectionDate: '',
    location: '',
    inspectionLevel: '1',
    result: 'clean',
    notes: ''
  });
  const [submittingForm, setSubmittingForm] = useState(false);

  // Target calculator state
  const [targetBasic, setTargetBasic] = useState('unsafe_driving');
  const [targetPercentile, setTargetPercentile] = useState(75);
  const [targetResult, setTargetResult] = useState(null);
  const [calculatingTarget, setCalculatingTarget] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ratioRes, listRes, missingRes, strategyRes] = await Promise.all([
        cleanInspectionsAPI.getRatio(),
        cleanInspectionsAPI.getList(20),
        cleanInspectionsAPI.getMissing(),
        cleanInspectionsAPI.getStrategy()
      ]);
      setRatio(ratioRes.data.data || ratioRes.data);
      setCleanList(listRes.data.inspections || []);
      setMissing(missingRes.data.data || missingRes.data.inspections || []);
      setStrategy(strategyRes.data.data || strategyRes.data.recommendations || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load clean inspection data');
      toast.error('Failed to load clean inspection data');
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!formData.inspectionDate || !formData.location) {
      toast.error('Please fill in required fields');
      return;
    }
    setSubmittingForm(true);
    try {
      await cleanInspectionsAPI.reportKnown(formData);
      toast.success('Inspection reported successfully');
      setFormData({ inspectionDate: '', location: '', inspectionLevel: '1', result: 'clean', notes: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to report inspection');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleCalculateTarget = async () => {
    setCalculatingTarget(true);
    try {
      const res = await cleanInspectionsAPI.getTarget(targetBasic, targetPercentile);
      setTargetResult(res.data.data || res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to calculate target');
    } finally {
      setCalculatingTarget(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <FiAlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-zinc-600 dark:text-zinc-400">{error}</p>
        <button onClick={fetchData} className="btn btn-secondary mt-4">
          Try Again
        </button>
      </div>
    );
  }

  const cleanCount = ratio?.clean ?? 0;
  const totalCount = ratio?.total ?? 0;
  const cleanPercent = totalCount > 0 ? Math.round((cleanCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Section 1: Clean Ratio Display */}
      <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2 mb-4">
          <FiBarChart2 className="w-5 h-5 text-emerald-500" />
          <h3 className="font-semibold text-zinc-900 dark:text-white">Clean Inspection Ratio</h3>
        </div>

        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{cleanCount}</span>
          <span className="text-zinc-500 dark:text-zinc-400">clean /</span>
          <span className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">{totalCount}</span>
          <span className="text-zinc-500 dark:text-zinc-400">total inspections</span>
          <span className="ml-auto text-lg font-semibold text-zinc-600 dark:text-zinc-400">
            {cleanPercent}%
          </span>
        </div>

        {/* Overall bar */}
        <div className="w-full h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${cleanPercent}%` }}
          />
        </div>

        {/* Per-BASIC breakdown */}
        {ratio?.byBasic && Object.keys(ratio.byBasic).length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Per-BASIC Breakdown
            </p>
            {Object.entries(ratio.byBasic).map(([basic, data]) => {
              const bClean = data.clean || 0;
              const bTotal = data.total || 0;
              const bPct = bTotal > 0 ? Math.round((bClean / bTotal) * 100) : 0;
              return (
                <div key={basic} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 w-28 truncate">
                    {basicCategories[basic]?.label || basic.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-grow h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400 dark:bg-emerald-500 transition-all duration-500"
                      style={{ width: `${bPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 w-16 text-right">
                    {bClean}/{bTotal} ({bPct}%)
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Clean Inspection Records */}
      <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2 mb-4">
          <FiCheckCircle className="w-5 h-5 text-emerald-500" />
          <h3 className="font-semibold text-zinc-900 dark:text-white">Your Clean Inspections</h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-auto">{cleanList.length} records</span>
        </div>

        {cleanList.length > 0 ? (
          <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">State</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">Location</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">Level</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">Report #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {cleanList.map((insp) => (
                  <tr key={insp._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <FiCalendar className="w-3.5 h-3.5 text-zinc-400" />
                        {new Date(insp.inspectionDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-100">{insp.state || '-'}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{insp.location || '-'}</td>
                    <td className="px-4 py-3">
                      {insp.inspectionLevel ? (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                          Level {insp.inspectionLevel}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{insp.reportNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-zinc-500 dark:text-zinc-400">
            <FiCheckCircle className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm">No clean inspections found in FMCSA records yet.</p>
            <p className="text-xs mt-1">Clean inspections (zero violations) will appear here after your next FMCSA sync.</p>
          </div>
        )}
      </div>

      {/* Section 3: Missing Inspections */}
      <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiAlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">Missing from MCMIS</h3>
            {missing.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                {missing.length}
              </span>
            )}
          </div>
        </div>

        {missing.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">
            No known inspections missing from MCMIS. Great!
          </p>
        ) : (
          <div className="space-y-2">
            {missing.map((insp, idx) => (
              <div
                key={insp._id || idx}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      insp.result === 'clean'
                        ? 'bg-emerald-100 dark:bg-emerald-500/20'
                        : 'bg-red-100 dark:bg-red-500/20'
                    }`}>
                      {insp.result === 'clean'
                        ? <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        : <FiAlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      }
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {formatDate(insp.inspectionDate)}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {insp.location || 'Unknown location'}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${
                      insp.result === 'clean'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {insp.result === 'clean' ? 'Clean' : 'Violation found'}
                    </span>
                  </div>
                </div>
                <button className="btn btn-primary text-xs px-3 py-1.5">
                  <FiFileText className="w-3.5 h-3.5" />
                  File DataQ
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Report Known Inspection */}
      <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <FiPlus className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">Report Known Inspection</h3>
          </div>
          {showForm
            ? <FiChevronUp className="w-5 h-5 text-zinc-400" />
            : <FiChevronDown className="w-5 h-5 text-zinc-400" />
          }
        </button>

        {showForm && (
          <form onSubmit={handleReportSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Inspection Date *
                </label>
                <input
                  type="date"
                  value={formData.inspectionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, inspectionDate: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="form-input"
                  placeholder="City, State"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Inspection Level
                </label>
                <select
                  value={formData.inspectionLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, inspectionLevel: e.target.value }))}
                  className="form-input"
                >
                  {INSPECTION_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Result
                </label>
                <select
                  value={formData.result}
                  onChange={(e) => setFormData(prev => ({ ...prev, result: e.target.value }))}
                  className="form-input"
                >
                  <option value="clean">Clean (No Violations)</option>
                  <option value="violation">Violation Found</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="form-input"
                rows={3}
                placeholder="Any additional details about this inspection..."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingForm}
              >
                {submittingForm ? <LoadingSpinner size="sm" /> : (
                  <>
                    <FiPlus className="w-4 h-4" />
                    Report Inspection
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Section 4: Target Calculator */}
      <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2 mb-4">
          <FiTarget className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-zinc-900 dark:text-white">Target Calculator</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              BASIC Category
            </label>
            <select
              value={targetBasic}
              onChange={(e) => { setTargetBasic(e.target.value); setTargetResult(null); }}
              className="form-input"
            >
              {Object.entries(basicCategories).map(([key, cat]) => (
                <option key={key} value={key}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Target Percentile: {targetPercentile}th
            </label>
            <input
              type="range"
              min={50}
              max={90}
              step={5}
              value={targetPercentile}
              onChange={(e) => { setTargetPercentile(Number(e.target.value)); setTargetResult(null); }}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-zinc-400 mt-1">
              <span>50th</span>
              <span>70th</span>
              <span>90th</span>
            </div>
          </div>
          <div>
            <button
              onClick={handleCalculateTarget}
              className="btn btn-primary w-full"
              disabled={calculatingTarget}
            >
              {calculatingTarget ? <LoadingSpinner size="sm" /> : (
                <>
                  <FiTrendingUp className="w-4 h-4" />
                  Calculate
                </>
              )}
            </button>
          </div>
        </div>

        {targetResult && (
          <div className="mt-4 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
            <div className="flex items-start gap-2">
              <FiInfo className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-indigo-700 dark:text-indigo-400">
                <span className="font-bold text-indigo-800 dark:text-indigo-300">
                  {targetResult.inspectionsNeeded ?? targetResult.needed ?? 0}
                </span>{' '}
                more clean inspections needed to reach the{' '}
                <span className="font-semibold">{targetPercentile}th</span> percentile in{' '}
                <span className="font-semibold">
                  {basicCategories[targetBasic]?.label || targetBasic.replace(/_/g, ' ')}
                </span>
              </p>
            </div>
            {targetResult.currentPercentile != null && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 ml-6">
                Current percentile: {targetResult.currentPercentile}th
              </p>
            )}
          </div>
        )}
      </div>

      {/* Section 5: Strategy Recommendations */}
      {strategy.length > 0 && (
        <div className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2 mb-4">
            <FiStar className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">Strategy Recommendations</h3>
          </div>

          <div className="space-y-3">
            {strategy.map((rec, idx) => {
              const priorityColors = {
                high: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
                medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                low: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
              };

              return (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-zinc-900 dark:text-white">
                          {rec.title}
                        </span>
                        {rec.priority && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            priorityColors[rec.priority] || priorityColors.medium
                          }`}>
                            {rec.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CleanInspectionPanel;
