import { useState, useEffect } from 'react';
import {
  FiAlertTriangle, FiCheckCircle, FiClock, FiTruck,
  FiAlertCircle, FiDroplet, FiShield, FiUser
} from 'react-icons/fi';

const BASIC_CONFIG = [
  { key: 'unsafeDriving', name: 'Unsafe Driving', threshold: 65, icon: FiAlertTriangle },
  { key: 'hosCompliance', name: 'HOS Compliance', threshold: 65, icon: FiClock },
  { key: 'vehicleMaintenance', name: 'Vehicle Maintenance', threshold: 80, icon: FiTruck },
  { key: 'crashIndicator', name: 'Crash Indicator', threshold: 65, icon: FiAlertCircle },
  { key: 'controlledSubstances', name: 'Controlled Substances', threshold: 80, icon: FiDroplet },
  { key: 'hazmatCompliance', name: 'Hazmat Compliance', threshold: 80, icon: FiShield },
  { key: 'driverFitness', name: 'Driver Fitness', threshold: 80, icon: FiUser }
];

const ScoreBar = ({ basic, score, delay = 0 }) => {
  const [width, setWidth] = useState(0);
  const Icon = basic.icon;

  const isNull = score === null || score === undefined;
  const isAbove = !isNull && score >= basic.threshold;
  const isNear = !isNull && !isAbove && score >= basic.threshold - 15;

  useEffect(() => {
    if (!isNull) {
      const timer = setTimeout(() => setWidth(score), delay);
      return () => clearTimeout(timer);
    }
  }, [score, delay, isNull]);

  const barColor = isAbove ? 'bg-red-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500';
  const textColor = isAbove ? 'text-red-600' : isNear ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${isNull ? 'text-zinc-400' : textColor}`} />
          <span className="text-xs font-medium text-zinc-700">{basic.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold ${isNull ? 'text-zinc-400' : textColor}`}>
            {isNull ? 'N/A' : `${score}%`}
          </span>
          <span className="text-[10px] text-zinc-400">/ {basic.threshold}%</span>
          {!isNull && (
            isAbove
              ? <FiAlertTriangle className="w-3.5 h-3.5 text-red-500" />
              : <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          )}
        </div>
      </div>
      <div className="relative h-2 bg-zinc-100 rounded-full overflow-visible">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${isNull ? 'bg-zinc-300' : barColor}`}
          style={{ width: isNull ? '0%' : `${Math.min(width, 100)}%` }}
        />
        {/* Threshold marker */}
        <div
          className="absolute top-[-2px] h-[12px]"
          style={{ left: `${basic.threshold}%` }}
        >
          <div className="w-[2px] h-full border-l-2 border-dashed border-red-400" />
        </div>
      </div>
    </div>
  );
};

const BASICScorePanel = ({ basics, alerts }) => {
  if (!basics) return null;

  const flagged = alerts?.details?.filter(a => a.status === 'intervention').length || 0;
  const scores = BASIC_CONFIG.map(b => ({ ...b, score: basics[b.key] }));
  const validScores = scores.filter(s => s.score !== null && s.score !== undefined);
  const watchCount = validScores.filter(s => s.score >= s.threshold - 15 && s.score < s.threshold).length;
  const goodCount = validScores.filter(s => s.score < s.threshold - 15).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">BASIC Scores</h4>
        <div className="flex items-center gap-3 text-[10px]">
          {flagged > 0 && (
            <span className="flex items-center gap-1 text-red-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {flagged} Flagged
            </span>
          )}
          {watchCount > 0 && (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {watchCount} Watch
            </span>
          )}
          {goodCount > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {goodCount} Good
            </span>
          )}
        </div>
      </div>

      {/* Alert banner */}
      {flagged > 0 && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
          <FiAlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <span className="text-[11px] text-red-600 font-medium">
            {flagged} BASIC{flagged > 1 ? 's' : ''} above intervention threshold — FMCSA may prioritize for review
          </span>
        </div>
      )}

      <div className="space-y-3">
        {BASIC_CONFIG.map((basic, index) => (
          <ScoreBar
            key={basic.key}
            basic={basic}
            score={basics[basic.key]}
            delay={index * 100}
          />
        ))}
      </div>

      <p className="text-[9px] text-zinc-400 mt-3">
        Lower is better. Dashed line = FMCSA intervention threshold.
      </p>
    </div>
  );
};

export default BASICScorePanel;
