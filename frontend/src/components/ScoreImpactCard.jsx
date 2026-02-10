import { useState, useEffect } from 'react';
import { FiTrendingDown, FiArrowRight, FiShield, FiDollarSign, FiClock } from 'react-icons/fi';
import { violationsAPI } from '../utils/api';
import { basicCategories } from '../utils/helpers';
import LoadingSpinner from './LoadingSpinner';

const basicBadgeColors = {
  unsafe_driving: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  hours_of_service: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  vehicle_maintenance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  controlled_substances: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  driver_fitness: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  crash_indicator: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  hazmat: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400'
};

const decayMilestones = [
  { months: 6, label: '6mo' },
  { months: 12, label: '12mo' },
  { months: 18, label: '18mo' },
  { months: 24, label: '24mo' }
];

const ScoreImpactCard = ({ violationId }) => {
  const [loading, setLoading] = useState(true);
  const [impact, setImpact] = useState(null);

  useEffect(() => {
    if (!violationId) return;

    const fetchImpact = async () => {
      setLoading(true);
      try {
        const res = await violationsAPI.getViolationImpact(violationId);
        const data = res.data?.impact || res.data;
        setImpact(data);
      } catch {
        // Gracefully handle - show nothing if no data
        setImpact(null);
      } finally {
        setLoading(false);
      }
    };

    fetchImpact();
  }, [violationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!impact) return null;

  const {
    currentPercentile,
    projectedPercentile,
    basic,
    severityPoints,
    crossesThreshold,
    thresholdName,
    insuranceSavings,
    timeDecayProjection
  } = impact;

  const hasCrossing = crossesThreshold === true;
  const basicLabel = basicCategories[basic]?.label || basic?.replace(/_/g, ' ') || 'Unknown';
  const badgeColor = basicBadgeColors[basic] || 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';

  return (
    <div className={`rounded-lg border p-4 space-y-4 ${
      hasCrossing
        ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20'
        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <FiTrendingDown className={`w-4.5 h-4.5 ${
          hasCrossing ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'
        }`} />
        <span className="text-sm font-semibold text-zinc-900 dark:text-white">CSA Score Impact</span>
      </div>

      {/* Percentile Change */}
      {currentPercentile != null && projectedPercentile != null && (
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{currentPercentile}%</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Current</p>
          </div>
          <FiArrowRight className="w-5 h-5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              projectedPercentile < currentPercentile
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-zinc-900 dark:text-white'
            }`}>
              {projectedPercentile}%
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Projected</p>
          </div>
          {currentPercentile - projectedPercentile > 0 && (
            <span className="ml-auto text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              -{currentPercentile - projectedPercentile}%
            </span>
          )}
        </div>
      )}

      {/* BASIC + Severity */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeColor}`}>
          {basicLabel}
        </span>
        {severityPoints > 0 && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">-{severityPoints}</span> severity points removed
          </span>
        )}
      </div>

      {/* Threshold Crossing Warning */}
      {hasCrossing && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
          <FiShield className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-700 dark:text-emerald-300" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Removing this violation drops your {basicLabel} BASIC below the {thresholdName || 'alert'} threshold
          </p>
        </div>
      )}

      {/* Insurance Savings Estimate */}
      {insuranceSavings && (insuranceSavings.low > 0 || insuranceSavings.mid > 0 || insuranceSavings.high > 0) && (
        <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <FiDollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Est. Annual Insurance Savings</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                ${(insuranceSavings.low || 0).toLocaleString()}
              </p>
              <p className="text-xs text-zinc-400">Low</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                ${(insuranceSavings.mid || 0).toLocaleString()}
              </p>
              <p className="text-xs text-zinc-400">Mid</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                ${(insuranceSavings.high || 0).toLocaleString()}
              </p>
              <p className="text-xs text-zinc-400">High</p>
            </div>
          </div>
        </div>
      )}

      {/* Time Decay Projection */}
      {timeDecayProjection && timeDecayProjection.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FiClock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Time Decay Projection</span>
          </div>
          <div className="flex items-end gap-1">
            {decayMilestones.map((milestone) => {
              const projection = timeDecayProjection.find(p => p.months === milestone.months);
              if (!projection) return null;

              const height = Math.max(8, (projection.percentile / 100) * 48);
              const isBelowThreshold = projection.belowThreshold === true;

              return (
                <div key={milestone.months} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    {projection.percentile}%
                  </span>
                  <div
                    className={`w-full rounded-t transition-all ${
                      isBelowThreshold
                        ? 'bg-emerald-400 dark:bg-emerald-500'
                        : 'bg-zinc-300 dark:bg-zinc-600'
                    }`}
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{milestone.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreImpactCard;
