import { useState, useEffect } from 'react';
import { violationsAPI } from '../utils/api';
import { formatDate, basicCategories } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiClock, FiCheckCircle, FiXCircle, FiAlertTriangle,
  FiChevronDown, FiChevronUp, FiTrendingUp, FiFileText,
  FiExternalLink, FiPercent, FiTarget, FiActivity
} from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';
import DenialResponseWizard from './DenialResponseWizard';

const ActiveChallengesPanel = () => {
  const [challenges, setChallenges] = useState([]);
  const [batchStats, setBatchStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [denialViolation, setDenialViolation] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [challengesRes, batchRes] = await Promise.all([
        violationsAPI.getActiveChallenges(),
        violationsAPI.getBatchDashboard()
      ]);
      // getActiveChallenges returns violation documents directly (not wrapped in .challenges)
      const challengeData = challengesRes.data.challenges || challengesRes.data.data || challengesRes.data || [];
      setChallenges(Array.isArray(challengeData) ? challengeData : []);
      const batchData = batchRes.data.dashboard || batchRes.data.stats || batchRes.data.data || batchRes.data;
      setBatchStats(batchData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load active challenges');
      toast.error('Failed to load active challenges');
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const target = new Date(deadline);
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
      case 'submitted':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      case 'under_review':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
      case 'approved':
      case 'won':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'denied':
      case 'lost':
        return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
      default:
        return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
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

  const statCards = [
    {
      label: 'Active',
      value: batchStats?.active ?? 0,
      icon: FiActivity,
      color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
      iconColor: 'text-blue-500'
    },
    {
      label: 'Pending Response',
      value: batchStats?.pendingResponse ?? 0,
      icon: FiClock,
      color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
      iconColor: 'text-amber-500'
    },
    {
      label: 'Won',
      value: batchStats?.won ?? 0,
      icon: FiCheckCircle,
      color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      iconColor: 'text-emerald-500'
    },
    {
      label: 'Lost',
      value: batchStats?.lost ?? 0,
      icon: FiXCircle,
      color: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400',
      iconColor: 'text-red-500'
    },
    {
      label: 'Success Rate',
      value: batchStats?.successRate != null ? `${batchStats.successRate}%` : 'N/A',
      icon: FiTarget,
      color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400',
      iconColor: 'text-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Batch Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`p-4 rounded-lg ${stat.color}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                <span className="text-xs font-medium uppercase tracking-wide opacity-75">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Challenge List */}
      {challenges.length === 0 ? (
        <div className="text-center py-12 px-6">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <FiFileText className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            No Active Challenges
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Visit the Health Check tab to find challengeable violations and start your first DataQ challenge.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Active Challenges ({challenges.length})
          </h3>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
            {challenges.map((challenge) => {
              // Response is violation documents directly with dataQChallenge nested
              const violation = challenge.violation || challenge;
              const dataq = violation.dataQChallenge || violation.dataq || challenge.dataq || {};
              const isExpanded = expandedId === (violation._id || challenge._id);
              const deadline = dataq.pendingResponseDeadline;
              const daysLeft = getDaysRemaining(deadline);
              const isDenied = dataq.status === 'denied' || dataq.status === 'lost';

              return (
                <div
                  key={violation._id || challenge._id}
                  className="bg-white dark:bg-zinc-900"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-zinc-900 dark:text-white truncate">
                            {violation.violationCode || violation.violationType || 'Unknown'}
                          </span>
                          {violation.violationType && violation.violationCode && (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                              {violation.violationType}
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            getStatusBadge(dataq.status)
                          }`}>
                            {(dataq.status || 'pending').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 flex-wrap">
                          {dataq.submissionDate && (
                            <span className="flex items-center gap-1">
                              <FiClock className="w-3.5 h-3.5" />
                              Submitted {formatDate(dataq.submissionDate)}
                            </span>
                          )}
                          {violation.basic && (
                            <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                              {basicCategories[violation.basic]?.label || violation.basic.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>

                        {/* Deadline countdown */}
                        {daysLeft !== null && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              daysLeft <= 3
                                ? 'text-red-600 dark:text-red-400'
                                : daysLeft <= 7
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-zinc-600 dark:text-zinc-400'
                            }`}>
                              {daysLeft <= 0 ? 'Overdue' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining`}
                            </span>
                            {daysLeft > 0 && daysLeft <= 7 && (
                              <button className="btn btn-primary text-xs px-3 py-1">
                                Respond
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isDenied && (
                          <button
                            onClick={() => setDenialViolation(violation)}
                            className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            What now?
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : (violation._id || challenge._id))}
                          className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          {isExpanded
                            ? <FiChevronUp className="w-4 h-4" />
                            : <FiChevronDown className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">Violation Date:</span>
                          <p className="font-medium text-zinc-700 dark:text-zinc-300">
                            {formatDate(violation.violationDate)}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">Challenge Type:</span>
                          <p className="font-medium text-zinc-700 dark:text-zinc-300">
                            {dataq.challengeType?.replace(/_/g, ' ') || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">RDR Type:</span>
                          <p className="font-medium text-zinc-700 dark:text-zinc-300">
                            {dataq.rdrType || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">Severity:</span>
                          <p className="font-medium text-zinc-700 dark:text-zinc-300">
                            {violation.severityWeight}/10 {violation.outOfService ? '(OOS)' : ''}
                          </p>
                        </div>
                      </div>
                      {dataq.responseNotes && (
                        <div className="mt-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Response Notes</p>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300">{dataq.responseNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Denial Response Wizard */}
      {denialViolation && (
        <DenialResponseWizard
          violation={denialViolation}
          isOpen={!!denialViolation}
          onClose={() => setDenialViolation(null)}
          onAction={() => {
            setDenialViolation(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default ActiveChallengesPanel;
