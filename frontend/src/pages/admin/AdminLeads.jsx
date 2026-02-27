import { useState, useEffect } from 'react';
import { adminLeadsAPI } from '../../utils/api';
import {
  FiUsers, FiTrendingUp, FiPercent, FiDollarSign, FiSearch,
  FiChevronDown, FiChevronRight, FiCheck, FiMinus, FiFilter
} from 'react-icons/fi';

const RISK_COLORS = {
  HIGH: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400' },
  MODERATE: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-400' },
  LOW: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400' },
};

const STATUS_COLORS = {
  pending: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400',
  sent_welcome: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  sent_day2: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  sent_day5: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  sent_day9: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  sent_day14: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  unsubscribed: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

const STATUS_LABELS = {
  pending: 'Pending',
  sent_welcome: 'Welcome Sent',
  sent_day2: 'Day 2',
  sent_day5: 'Day 5',
  sent_day9: 'Day 9',
  sent_day14: 'Day 14',
  completed: 'Completed',
  unsubscribed: 'Unsubscribed',
};

const SEQUENCE_STAGES = [
  'pending',
  'sent_welcome',
  'sent_day2',
  'sent_day5',
  'sent_day9',
  'sent_day14',
  'completed',
  'unsubscribed',
];

const AdminLeads = () => {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({
    search: '',
    riskLevel: '',
    sequenceStatus: '',
    converted: '',
  });

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await adminLeadsAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch lead stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchLeads = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (filters.search) params.search = filters.search;
      if (filters.riskLevel) params.riskLevel = filters.riskLevel;
      if (filters.sequenceStatus) params.sequenceStatus = filters.sequenceStatus;
      if (filters.converted) params.converted = filters.converted;

      const data = await adminLeadsAPI.getAll(params);
      setLeads(data.leads || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      setError('Failed to load leads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadDetail = async (id) => {
    setDetailLoading(true);
    try {
      const data = await adminLeadsAPI.getById(id);
      setExpandedDetail(data);
    } catch (err) {
      console.error('Failed to fetch lead detail:', err);
      setExpandedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLeads(1);
  }, [filters.riskLevel, filters.sequenceStatus, filters.converted]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLeads(1);
  };

  const handleRowClick = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedDetail(null);
    } else {
      setExpandedId(id);
      fetchLeadDetail(id);
    }
  };

  const totalLeads = stats?.totalLeads || 0;
  const leadsThisMonth = stats?.leadsThisMonth || 0;
  const trialConversionRate = stats?.trialConversionRate ?? 0;
  const paidConversionRate = stats?.paidConversionRate ?? 0;
  const funnelData = stats?.funnel || {};

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Leads</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            CSA Checker leads and email sequence tracking
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <FiUsers className="w-4 h-4 text-zinc-400" />
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Total Leads</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {statsLoading ? '-' : totalLeads.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <FiTrendingUp className="w-4 h-4 text-blue-500" />
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">This Month</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {statsLoading ? '-' : leadsThisMonth.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <FiPercent className="w-4 h-4 text-orange-500" />
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Trial Conv.</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {statsLoading ? '-' : `${trialConversionRate.toFixed(1)}%`}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <FiDollarSign className="w-4 h-4 text-green-500" />
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Paid Conv.</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {statsLoading ? '-' : `${paidConversionRate.toFixed(1)}%`}
          </p>
        </div>
      </div>

      {/* Funnel Visualization */}
      {!statsLoading && totalLeads > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wide mb-4">
            Email Sequence Funnel
          </h2>
          <div className="space-y-3">
            {SEQUENCE_STAGES.map((stage) => {
              const count = funnelData[stage] || 0;
              const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;

              return (
                <div key={stage} className="flex items-center gap-4">
                  <span className="w-28 text-xs font-medium text-zinc-600 dark:text-zinc-400 text-right shrink-0">
                    {STATUS_LABELS[stage]}
                  </span>
                  <div className="flex-1 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-orange-500 dark:bg-orange-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 0.5)}%` }}
                    />
                  </div>
                  <span className="w-12 text-xs font-semibold text-zinc-700 dark:text-zinc-300 text-right shrink-0">
                    {count}
                  </span>
                  <span className="w-14 text-xs text-zinc-500 dark:text-zinc-400 text-right shrink-0">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-48">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by email or company..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </form>
        <select
          value={filters.riskLevel}
          onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
          className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">All Risk Levels</option>
          <option value="HIGH">HIGH</option>
          <option value="MODERATE">MODERATE</option>
          <option value="LOW">LOW</option>
        </select>
        <select
          value={filters.sequenceStatus}
          onChange={(e) => setFilters(prev => ({ ...prev, sequenceStatus: e.target.value }))}
          className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">All Statuses</option>
          {SEQUENCE_STAGES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={filters.converted}
          onChange={(e) => setFilters(prev => ({ ...prev, converted: e.target.value }))}
          className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">All Conversion</option>
          <option value="yes">Converted</option>
          <option value="no">Not Converted</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FiUsers className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">No leads found</p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              Leads from the CSA Checker will appear here
            </p>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Company</div>
              <div className="col-span-1">Risk</div>
              <div className="col-span-2">Sequence Status</div>
              <div className="col-span-2">Captured</div>
              <div className="col-span-1">Converted</div>
              <div className="col-span-1"></div>
            </div>

            {/* Rows */}
            {leads.map((lead) => {
              const risk = RISK_COLORS[lead.riskLevel] || RISK_COLORS.LOW;
              const statusClass = STATUS_COLORS[lead.sequenceStatus] || STATUS_COLORS.pending;

              return (
                <div key={lead._id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  {/* Main Row */}
                  <div
                    className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-6 py-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                    onClick={() => handleRowClick(lead._id)}
                  >
                    <div className="lg:col-span-3">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                        {lead.email}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 lg:hidden mt-0.5">
                        {lead.companyName || '-'} — {new Date(lead.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="hidden lg:flex lg:col-span-2 items-center">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                        {lead.companyName || '-'}
                      </p>
                    </div>
                    <div className="hidden lg:flex lg:col-span-1 items-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${risk.bg} ${risk.text}`}>
                        {lead.riskLevel || '-'}
                      </span>
                    </div>
                    <div className="hidden lg:flex lg:col-span-2 items-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClass}`}>
                        {STATUS_LABELS[lead.sequenceStatus] || lead.sequenceStatus || '-'}
                      </span>
                    </div>
                    <div className="hidden lg:flex lg:col-span-2 items-center">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '-'}
                      </span>
                    </div>
                    <div className="hidden lg:flex lg:col-span-1 items-center">
                      {lead.converted ? (
                        <FiCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <FiMinus className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                    <div className="hidden lg:flex lg:col-span-1 items-center justify-end">
                      {expandedId === lead._id ? (
                        <FiChevronDown className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <FiChevronRight className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>

                    {/* Mobile badges */}
                    <div className="flex items-center gap-2 lg:hidden">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${risk.bg} ${risk.text}`}>
                        {lead.riskLevel || '-'}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClass}`}>
                        {STATUS_LABELS[lead.sequenceStatus] || '-'}
                      </span>
                      {lead.converted && <FiCheck className="w-4 h-4 text-green-500" />}
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {expandedId === lead._id && (
                    <div className="px-6 pb-4 bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800">
                      {detailLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : expandedDetail ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                          {/* Left: CSA Snapshot */}
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">
                              CSA Snapshot
                            </h4>
                            {expandedDetail.csaSnapshot?.basicScores ? (
                              <div className="space-y-2">
                                {Object.entries(expandedDetail.csaSnapshot.basicScores).map(([basic, score]) => (
                                  <div key={basic} className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-600 dark:text-zinc-400 capitalize">
                                      {basic.replace(/_/g, ' ')}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-24 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            score >= 75 ? 'bg-red-500' :
                                            score >= 50 ? 'bg-orange-500' :
                                            'bg-green-500'
                                          }`}
                                          style={{ width: `${Math.min(score, 100)}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 w-8 text-right">
                                        {score !== null && score !== undefined ? score : '-'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-zinc-400 dark:text-zinc-500">No CSA data available</p>
                            )}

                            {expandedDetail.csaSnapshot?.dotNumber && (
                              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3">
                                DOT# {expandedDetail.csaSnapshot.dotNumber}
                              </p>
                            )}
                          </div>

                          {/* Right: AI Analysis Summary */}
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">
                              AI Analysis Summary
                            </h4>
                            {expandedDetail.aiAnalysis ? (
                              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                {expandedDetail.aiAnalysis}
                              </p>
                            ) : (
                              <p className="text-sm text-zinc-400 dark:text-zinc-500">No AI analysis available</p>
                            )}

                            {/* Sequence Timeline */}
                            {expandedDetail.sequenceHistory && expandedDetail.sequenceHistory.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                                  Sequence History
                                </h4>
                                <div className="space-y-1">
                                  {expandedDetail.sequenceHistory.map((event, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                      <span className="text-zinc-400 dark:text-zinc-500 w-24 shrink-0">
                                        {new Date(event.date).toLocaleDateString()}
                                      </span>
                                      <span className="text-zinc-600 dark:text-zinc-400">
                                        {event.action || event.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-400 dark:text-zinc-500 py-4">
                          Failed to load lead details.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchLeads(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => fetchLeads(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLeads;
