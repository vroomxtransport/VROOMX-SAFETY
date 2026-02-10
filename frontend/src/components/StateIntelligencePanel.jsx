import { useState, useEffect } from 'react';
import { FiMapPin, FiClock, FiBarChart2, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { violationsAPI } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

const getDifficultyBadge = (approvalRate) => {
  if (approvalRate >= 60) {
    return {
      label: 'Easy',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
    };
  }
  if (approvalRate >= 35) {
    return {
      label: 'Moderate',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
    };
  }
  return {
    label: 'Hard',
    className: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
  };
};

const StateIntelligencePanel = ({ stateCode, challengeType }) => {
  const [loading, setLoading] = useState(true);
  const [stateProfile, setStateProfile] = useState(null);

  useEffect(() => {
    if (!stateCode) return;

    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const res = await violationsAPI.getStateProfiles();
        const data = res.data?.profiles || res.data || [];
        const match = data.find(
          p => p.stateCode?.toUpperCase() === stateCode.toUpperCase()
        );
        setStateProfile(match || null);
      } catch (err) {
        toast.error('Failed to load state intelligence data');
        setStateProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [stateCode, challengeType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!stateProfile) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <FiInfo className="w-4 h-4" />
          <p className="text-sm">No historical data available for this state</p>
        </div>
      </div>
    );
  }

  const {
    name,
    totalChallenges = 0,
    acceptedChallenges = 0,
    avgResponseDays = 0,
    approvalRate = 0
  } = stateProfile;

  const difficulty = getDifficultyBadge(approvalRate);
  const rateColor = approvalRate >= 60
    ? 'text-emerald-600 dark:text-emerald-400'
    : approvalRate >= 35
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiMapPin className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">
            {name || stateCode} DataQ Intelligence
          </span>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${difficulty.className}`}>
          {difficulty.label}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Approval Rate */}
        <div className="text-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
          <div className="flex items-center justify-center gap-1 mb-1">
            <FiBarChart2 className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className={`text-xl font-bold ${rateColor}`}>
            {approvalRate.toFixed(0)}%
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Approval Rate</p>
        </div>

        {/* Avg Response Days */}
        <div className="text-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
          <div className="flex items-center justify-center gap-1 mb-1">
            <FiClock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-white">
            {Math.round(avgResponseDays)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Avg Days</p>
        </div>

        {/* Total Challenges */}
        <div className="text-center p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
          <div className="flex items-center justify-center gap-1 mb-1">
            <FiMapPin className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-white">
            {totalChallenges}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Challenges</p>
        </div>
      </div>

      {/* Contextual Message */}
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Based on <span className="font-semibold text-zinc-900 dark:text-white">{totalChallenges}</span> challenges,{' '}
        <span className="font-semibold text-zinc-900 dark:text-white">{name || stateCode}</span> has a{' '}
        <span className={`font-semibold ${rateColor}`}>{approvalRate.toFixed(1)}%</span> approval rate
        {acceptedChallenges > 0 && (
          <span> ({acceptedChallenges} accepted)</span>
        )}
        {avgResponseDays > 0 && (
          <span> with an average response time of <span className="font-semibold text-zinc-900 dark:text-white">{Math.round(avgResponseDays)} days</span></span>
        )}.
      </p>
    </div>
  );
};

export default StateIntelligencePanel;
