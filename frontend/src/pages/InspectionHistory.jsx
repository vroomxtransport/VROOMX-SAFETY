import { useState, useEffect } from 'react';
import { fmcsaInspectionsAPI, fmcsaAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  FiSearch, FiFilter, FiRefreshCw, FiDownload, FiChevronDown, FiChevronUp,
  FiAlertTriangle, FiCheckCircle, FiXCircle, FiMapPin, FiCalendar, FiHash,
  FiShield, FiTruck, FiClock, FiAlertCircle, FiDroplet, FiUser, FiActivity,
  FiX, FiEye, FiBarChart2
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

// BASIC configuration with thresholds (reused from CSAChecker pattern)
const BASIC_CONFIG = [
  { key: 'unsafeDriving', name: 'Unsafe Driving', threshold: 65, icon: FiAlertTriangle, color: 'red' },
  { key: 'hoursOfService', name: 'HOS Compliance', threshold: 65, icon: FiClock, color: 'amber' },
  { key: 'vehicleMaintenance', name: 'Vehicle Maintenance', threshold: 80, icon: FiTruck, color: 'blue' },
  { key: 'controlledSubstances', name: 'Controlled Substances', threshold: 80, icon: FiDroplet, color: 'purple' },
  { key: 'driverFitness', name: 'Driver Fitness', threshold: 80, icon: FiUser, color: 'indigo' },
  { key: 'crashIndicator', name: 'Crash Indicator', threshold: 65, icon: FiAlertCircle, color: 'orange' }
];

const getScoreColor = (score, threshold) => {
  if (score === null || score === undefined) return 'zinc';
  if (score >= threshold) return 'red';
  if (score >= threshold - 15) return 'amber';
  return 'emerald';
};

const getSeverityColor = (weight) => {
  if (weight >= 8) return 'red';
  if (weight >= 5) return 'amber';
  return 'emerald';
};

// Extract CFR reference from violation code
const getCFRReference = (code) => {
  if (!code) return null;
  const match = code.match(/^(\d{3})/);
  return match ? `49 CFR ${match[1]}` : null;
};

const basicCategories = [
  { value: 'unsafe_driving', label: 'Unsafe Driving' },
  { value: 'hours_of_service', label: 'Hours of Service' },
  { value: 'vehicle_maintenance', label: 'Vehicle Maintenance' },
  { value: 'controlled_substances', label: 'Controlled Substances' },
  { value: 'driver_fitness', label: 'Driver Fitness' },
  { value: 'crash_indicator', label: 'Crash Indicator' },
  { value: 'hazmat', label: 'Hazmat' }
];

const inspectionLevels = [
  { value: 1, label: 'Level I - Full Inspection' },
  { value: 2, label: 'Level II - Walk-Around' },
  { value: 3, label: 'Level III - Driver Only' },
  { value: 4, label: 'Level IV - Special' },
  { value: 5, label: 'Level V - Vehicle Only' },
  { value: 6, label: 'Level VI - Radioactive' }
];

const getLevelLabel = (level) => {
  const found = inspectionLevels.find(l => l.value === Number(level));
  return found ? found.label.replace(/^Level \w+ - /, '') : `Level ${level}`;
};

// ─── BASIC Score Bar Component ───────────────────────────────────────────────
const BasicScoreBar = ({ config, score }) => {
  const percentile = score?.percentile;
  const rawMeasure = score?.rawMeasure;
  const hasPercentile = percentile !== null && percentile !== undefined;
  const hasRawMeasure = rawMeasure !== null && rawMeasure !== undefined;
  const color = getScoreColor(percentile, config.threshold);
  const Icon = config.icon;
  const aboveThreshold = hasPercentile && percentile >= config.threshold;

  const colorMap = {
    emerald: { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    amber: { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
    red: { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' },
    zinc: { bar: 'bg-zinc-300', text: 'text-zinc-400', bg: 'bg-zinc-50' }
  };
  const c = hasPercentile ? colorMap[color] : (hasRawMeasure ? colorMap.amber : colorMap.zinc);

  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${c.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{config.name}</span>
          <div className="flex items-center gap-2">
            {hasPercentile ? (
              <span className={`text-sm font-bold ${c.text}`}>{percentile}%</span>
            ) : hasRawMeasure ? (
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400" title="Raw FMCSA measure (percentile not yet available)">
                {rawMeasure.toFixed(2)}
                <span className="text-[10px] font-normal text-zinc-400 ml-1">measure</span>
              </span>
            ) : (
              <span className="text-sm font-bold text-zinc-400">N/A</span>
            )}
            {aboveThreshold && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
                ALERT
              </span>
            )}
          </div>
        </div>
        {hasPercentile ? (
          <div className="relative h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 ${c.bar} rounded-full transition-all duration-700`}
              style={{ width: `${Math.min(percentile, 100)}%` }}
            />
            {/* Threshold marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-zinc-900/40 dark:bg-white/40"
              style={{ left: `${config.threshold}%` }}
              title={`Intervention threshold: ${config.threshold}%`}
            />
          </div>
        ) : hasRawMeasure ? (
          <div className="h-2 bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400/50 rounded-full" style={{ width: '100%' }} />
          </div>
        ) : (
          <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
        )}
      </div>
    </div>
  );
};

// ─── OOS Rate Comparison Component ───────────────────────────────────────────
const OOSRateCard = ({ label, rate, nationalAvg, icon: Icon, count, total }) => {
  const r = parseFloat(rate) || 0;
  const avg = parseFloat(nationalAvg) || 0;
  const aboveAvg = r > avg;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-zinc-500" />
        <h4 className="font-semibold text-zinc-800 dark:text-zinc-100">{label}</h4>
      </div>

      {/* Your Rate */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-zinc-500">Your Rate</span>
          <span className={`font-bold ${aboveAvg ? 'text-red-600' : 'text-emerald-600'}`}>{r.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${aboveAvg ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(r, 100)}%` }}
          />
        </div>
      </div>

      {/* National Average */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-zinc-500">National Avg</span>
          <span className="font-medium text-zinc-600 dark:text-zinc-300">{avg.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div className="h-full bg-zinc-400 rounded-full" style={{ width: `${Math.min(avg, 100)}%` }} />
        </div>
      </div>

      <div className={`text-xs font-semibold flex items-center gap-1 ${aboveAvg ? 'text-red-600' : 'text-emerald-600'}`}>
        {aboveAvg ? <FiAlertTriangle className="w-3 h-3" /> : <FiCheckCircle className="w-3 h-3" />}
        {aboveAvg ? 'Above National Average' : 'Below National Average'}
      </div>

      {count !== undefined && total !== undefined && (
        <p className="text-xs text-zinc-500 mt-2">{count} OOS out of {total} inspections</p>
      )}
    </div>
  );
};

// ─── Inspection Card Component ───────────────────────────────────────────────
const InspectionCard = ({ inspection, onViewDetails }) => {
  const [expanded, setExpanded] = useState(false);
  const totalViolations = inspection.totalViolations || 0;
  const isClean = totalViolations === 0;
  const hasOOS = inspection.vehicleOOS || inspection.driverOOS || inspection.hazmatOOS;

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'numeric', day: 'numeric'
  });

  return (
    <div className="card overflow-hidden">
      {/* Card Header - clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">
              {formatDate(inspection.inspectionDate)}
            </span>
            <span className="text-sm text-zinc-500">
              {inspection.state} - Level {inspection.inspectionLevel} - {getLevelLabel(inspection.inspectionLevel)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {isClean ? (
            <span className="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
              Clean
            </span>
          ) : (
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              hasOOS ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {totalViolations} Violation{totalViolations !== 1 ? 's' : ''}
            </span>
          )}
          {expanded ? <FiChevronUp className="w-4 h-4 text-zinc-400" /> : <FiChevronDown className="w-4 h-4 text-zinc-400" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-sm">
            <div>
              <span className="text-zinc-500 block text-xs">Report #</span>
              <span className="font-mono font-medium text-zinc-800 dark:text-zinc-100">{inspection.reportNumber}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-xs">Location</span>
              <span className="text-zinc-800 dark:text-zinc-100">{inspection.location || inspection.state || '-'}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-xs">OOS Violations</span>
              <span className="text-zinc-800 dark:text-zinc-100">{(inspection.vehicleOOS ? 1 : 0) + (inspection.driverOOS ? 1 : 0) + (inspection.hazmatOOS ? 1 : 0)}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-xs">Driver Violations</span>
              <span className="text-zinc-800 dark:text-zinc-100">{inspection.violations?.filter(v => v.type === 'driver' || v.basic === 'driver_fitness' || v.basic === 'hours_of_service' || v.basic === 'controlled_substances').length || 0}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-xs">Vehicle Violations</span>
              <span className="text-zinc-800 dark:text-zinc-100">{inspection.violations?.filter(v => v.type === 'vehicle' || v.basic === 'vehicle_maintenance').length || 0}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-xs">Hazmat Violations</span>
              <span className="text-zinc-800 dark:text-zinc-100">{inspection.violations?.filter(v => v.basic === 'hazmat').length || 0}</span>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetails(inspection); }}
              className="btn btn-secondary btn-sm flex items-center gap-2"
            >
              <FiEye className="w-4 h-4" />
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Inspection Detail Modal ─────────────────────────────────────────────────
const InspectionDetailModal = ({ inspection, onClose }) => {
  if (!inspection) return null;

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'numeric', day: 'numeric'
  });

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr.length < 4) return null;
    const h = parseInt(timeStr.substring(0, 2), 10);
    const m = timeStr.substring(2, 4);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m} ${ampm}`;
  };

  const details = inspection.inspectionDetails || {};
  const equipment = inspection.equipment || [];
  const localTime = details.startTime && details.endTime
    ? `${formatTime(details.startTime)} - ${formatTime(details.endTime)}`
    : details.startTime ? formatTime(details.startTime) : null;

  const violations = inspection.violations || [];
  const oosCount = violations.filter(v => v.oos).length;
  const driverViolations = violations.filter(v => v.type === 'driver' || v.basic === 'driver_fitness' || v.basic === 'hours_of_service' || v.basic === 'controlled_substances');
  const vehicleViolations = violations.filter(v => v.type === 'vehicle' || v.basic === 'vehicle_maintenance');

  const getBasicLabel = (basic) => {
    const found = basicCategories.find(b => b.value === basic);
    return found ? found.label : basic?.replace(/_/g, ' ') || 'Unknown';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Inspection Details</h2>
            <p className="text-sm text-zinc-500">Inspection ID: {inspection.reportNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`p-3 rounded-xl border ${violations.length > 0 ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'}`}>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Violations</p>
              <p className={`text-2xl font-bold ${violations.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{violations.length}</p>
            </div>
            <div className="p-3 rounded-xl border bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">OOS Violations</p>
              <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{oosCount}</p>
            </div>
            <div className="p-3 rounded-xl border bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Driver Violations</p>
              <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{driverViolations.length}</p>
            </div>
            <div className="p-3 rounded-xl border bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Vehicle Violations</p>
              <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{vehicleViolations.length}</p>
            </div>
          </div>

          {/* Inspection Information */}
          <div>
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
              <FiHash className="w-4 h-4" /> Inspection Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-zinc-500 block text-xs mb-0.5">Date</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-100">{formatDate(inspection.inspectionDate)}</span>
              </div>
              {localTime && (
                <div>
                  <span className="text-zinc-500 block text-xs mb-0.5">Local Time</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">{localTime}</span>
                </div>
              )}
              <div>
                <span className="text-zinc-500 block text-xs mb-0.5">Report Number</span>
                <span className="font-mono font-medium text-zinc-800 dark:text-zinc-100">{inspection.reportNumber}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-xs mb-0.5">Inspection Level</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {inspection.inspectionLevel ? `Level ${inspection.inspectionLevel} - ${getLevelLabel(inspection.inspectionLevel)}` : '-'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-xs mb-0.5">State</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-100">{inspection.state || '-'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-xs mb-0.5">Location</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-100">{inspection.location || '-'}</span>
              </div>
              {details.countyState && (
                <div>
                  <span className="text-zinc-500 block text-xs mb-0.5">County/State</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">{details.countyState}</span>
                </div>
              )}
              <div>
                <span className="text-zinc-500 block text-xs mb-0.5">Carrier Name</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-100">{details.carrierName || '-'}</span>
              </div>
              {details.shipperName && (
                <div>
                  <span className="text-zinc-500 block text-xs mb-0.5">Shipper Name</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">{details.shipperName}</span>
                </div>
              )}
              <div>
                <span className="text-zinc-500 block text-xs mb-0.5">Accident Related</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-100">{details.accidentRelated ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Violations Table */}
          {violations.length > 0 && (
            <div>
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
                <FiAlertTriangle className="w-4 h-4" /> Violations
              </h3>
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">Code</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">Description</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">Type</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {violations.map((v, idx) => {
                      const cfrRef = getCFRReference(v.code);
                      const sevColor = getSeverityColor(v.severityWeight);

                      return (
                        <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="px-4 py-3">
                            <div>
                              <span className="font-mono font-medium text-zinc-800 dark:text-zinc-100">{v.code}</span>
                              {cfrRef && <span className="block text-[10px] text-zinc-400 mt-0.5">{cfrRef}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <p className="text-zinc-700 dark:text-zinc-300 line-clamp-2">{v.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                                sevColor === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                sevColor === 'amber' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              }`}>
                                Severity: {v.severityWeight || '-'}
                              </span>
                              <span className="px-1.5 py-0.5 text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded">
                                {getBasicLabel(v.basic)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              v.type === 'driver' || v.basic === 'driver_fitness' || v.basic === 'hours_of_service' || v.basic === 'controlled_substances'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            }`}>
                              {v.type === 'driver' || v.basic === 'driver_fitness' || v.basic === 'hours_of_service' || v.basic === 'controlled_substances' ? 'Driver' : 'Vehicle'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {v.oos ? (
                              <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">OOS</span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">Violation</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Equipment Inspected */}
          <div>
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-2">
              <FiTruck className="w-4 h-4" /> Equipment Inspected
            </h3>
            {equipment.length > 0 ? (
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">Unit Type</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">VIN</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">License</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase">Make</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {equipment.map((eq, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-100">{eq.unitType}</td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">{eq.vin || '-'}</td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{eq.licensePlate}{eq.licenseState ? ` (${eq.licenseState})` : ''}</td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{eq.make || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl p-4 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Equipment data will be available after next FMCSA sync</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const InspectionHistory = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1, limit: 20, total: 0, pages: 0
  });
  const [filters, setFilters] = useState({
    basic: '', oosOnly: false, startDate: '', endDate: '', level: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchInspections();
    fetchStats();
  }, [pagination.page, filters]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...filters };
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === false) delete params[key];
      });
      const response = await fmcsaInspectionsAPI.getAll(params);
      setInspections(response.data.inspections || []);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      toast.error('Failed to load inspections');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fmcsaInspectionsAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await fmcsaAPI.getInspectionSummary();
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to load inspection summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fmcsaInspectionsAPI.syncAll();
      if (response.data.success) {
        const { inspections: imp, violations } = response.data;
        let message = '';
        if (imp?.imported > 0) message += `Imported ${imp.imported} inspections. `;
        if (violations?.matched > 0) message += `Matched ${violations.matched} with violation details.`;
        if (!message) message = 'Sync complete. No new data found.';
        toast.success(message);
        fetchInspections();
        fetchStats();
        fetchSummary();
      } else {
        toast.error(response.data.message || 'Sync failed');
      }
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ basic: '', oosOnly: false, startDate: '', endDate: '', level: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const exportToCSV = () => {
    if (inspections.length === 0) { toast.error('No data to export'); return; }
    const headers = ['Report Number', 'Date', 'State', 'Level', 'Total Violations', 'Vehicle OOS', 'Driver OOS'];
    const rows = inspections.map(insp => [
      insp.reportNumber,
      new Date(insp.inspectionDate).toLocaleDateString(),
      insp.state, insp.inspectionLevel, insp.totalViolations || 0,
      insp.vehicleOOS ? 'Yes' : 'No', insp.driverOOS ? 'Yes' : 'No'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspections-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export complete');
  };

  const inspData = summary?.inspections || {};
  const crashes = summary?.crashes || {};

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">FMCSA Inspection History</h1>
          <p className="text-zinc-600 dark:text-zinc-300">Safety scores, inspection records, and violation details</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleSync} disabled={syncing} className="btn btn-secondary flex items-center">
            {syncing ? <LoadingSpinner size="sm" className="mr-2" /> : <FiRefreshCw className="w-4 h-4 mr-2" />}
            Sync
          </button>
          <button onClick={exportToCSV} className="btn btn-secondary flex items-center">
            <FiDownload className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ─── Safety Information Panel ─────────────────────────────────────── */}
      {!summaryLoading && summary && (
        <>
          {/* SMS BASIC Percentile Bars */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiBarChart2 className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">SMS BASIC Scores</h3>
              </div>
              {summary.lastSync && (
                <span className="text-xs text-zinc-500">
                  Last synced: {new Date(summary.lastSync).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {BASIC_CONFIG.map((config) => (
                  <BasicScoreBar key={config.key} config={config} score={summary.smsBasics?.[config.key]} />
                ))}
              </div>
              {BASIC_CONFIG.some(c => {
                const p = summary.smsBasics?.[c.key]?.percentile;
                return p !== null && p !== undefined && p >= c.threshold;
              }) && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
                  <FiAlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">Above Intervention Threshold</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                      One or more BASICs exceed FMCSA intervention thresholds. This may trigger a compliance review or warning letter.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* OOS Rates + Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <OOSRateCard
              label="Driver OOS Rate"
              rate={inspData.driverOOSPercent}
              nationalAvg={inspData.driverNationalAvg}
              icon={FiUser}
              count={inspData.driverOOS}
              total={inspData.driverInspections}
            />
            <OOSRateCard
              label="Vehicle OOS Rate"
              rate={inspData.vehicleOOSPercent}
              nationalAvg={inspData.vehicleNationalAvg}
              icon={FiTruck}
              count={inspData.vehicleOOS}
              total={inspData.vehicleInspections}
            />
          </div>

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{inspData.totalInspections || stats?.totalInspections || 0}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">Total Inspections</p>
              <p className="text-xs text-zinc-400 mt-1">Last 24 months</p>
            </div>
            <div className="card p-4">
              <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{stats?.totalViolations || 0}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">Total Violations</p>
            </div>
            {(crashes.total > 0) && (
              <>
                <div className="card p-4 border-l-4 border-l-red-500">
                  <p className="text-2xl font-bold text-red-600">{crashes.total}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">Total Crashes</p>
                  <div className="flex gap-3 mt-1 text-xs text-zinc-500">
                    {crashes.fatal > 0 && <span className="text-red-600">Fatal: {crashes.fatal}</span>}
                    {crashes.injury > 0 && <span className="text-amber-600">Injury: {crashes.injury}</span>}
                    {crashes.tow > 0 && <span className="text-blue-600">Tow: {crashes.tow}</span>}
                  </div>
                </div>
              </>
            )}
            {(!crashes.total || crashes.total === 0) && (
              <div className="card p-4">
                <p className="text-2xl font-bold text-emerald-600">0</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">Crashes</p>
                <p className="text-xs text-emerald-500 mt-1">Clean record</p>
              </div>
            )}
            <div className="card p-4">
              <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{inspData.hazmatInspections || 0}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">Hazmat Inspections</p>
            </div>
          </div>
        </>
      )}

      {summaryLoading && (
        <div className="card p-8 flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-zinc-500">Loading safety data...</span>
        </div>
      )}

      {/* ─── Filters ──────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header flex items-center justify-between cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
          <div className="flex items-center">
            <FiFilter className="w-4 h-4 mr-2" />
            <span className="font-medium">Filters</span>
          </div>
          {showFilters ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {showFilters && (
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="form-label">BASIC Category</label>
                <select className="form-input" value={filters.basic} onChange={(e) => handleFilterChange('basic', e.target.value)}>
                  <option value="">All Categories</option>
                  {basicCategories.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Inspection Level</label>
                <select className="form-input" value={filters.level} onChange={(e) => handleFilterChange('level', e.target.value)}>
                  <option value="">All Levels</option>
                  {inspectionLevels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
              </div>
              <div>
                <label className="form-label">End Date</label>
                <input type="date" className="form-input" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={filters.oosOnly} onChange={(e) => handleFilterChange('oosOnly', e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-200">OOS Only</span>
                </label>
              </div>
            </div>
            <div className="mt-4">
              <button onClick={clearFilters} className="btn btn-secondary btn-sm">Clear Filters</button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Inspection Cards ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : inspections.length === 0 ? (
        <div className="card p-8 text-center">
          <FiSearch className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
          <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-200 mb-2">No Inspections Found</h3>
          <p className="text-zinc-500 dark:text-zinc-400">
            No inspection records match your filters. Try adjusting your filters or sync new data.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map((insp) => (
            <InspectionCard
              key={insp._id}
              inspection={insp}
              onViewDetails={setSelectedInspection}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="card p-4 flex items-center justify-between">
          <div className="text-sm text-zinc-600 dark:text-zinc-300">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1} className="btn btn-secondary btn-sm">Previous</button>
            <span className="text-sm text-zinc-600 dark:text-zinc-300">Page {pagination.page} of {pagination.pages}</span>
            <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.pages} className="btn btn-secondary btn-sm">Next</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedInspection && (
        <InspectionDetailModal
          inspection={selectedInspection}
          onClose={() => setSelectedInspection(null)}
        />
      )}
    </div>
  );
};

export default InspectionHistory;
