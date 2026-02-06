import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import { FiFlag, FiChevronDown, FiChevronUp, FiSearch } from 'react-icons/fi';

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  closed: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
};

const PRIORITY_COLORS = {
  low: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
};

const CATEGORY_LABELS = {
  bug: 'Bug',
  feature_request: 'Feature Request',
  ui_issue: 'UI Issue',
  other: 'Other'
};

const AdminBugReports = () => {
  const [bugReports, setBugReports] = useState([]);
  const [stats, setStats] = useState({ open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [editingNotes, setEditingNotes] = useState({});

  const fetchBugReports = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;

      const res = await adminAPI.getBugReports(params);
      if (res.data.success) {
        setBugReports(res.data.bugReports);
        setStats(res.data.stats);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch bug reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugReports();
  }, [filters.status, filters.priority]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBugReports(1);
  };

  const handleUpdate = async (id, data) => {
    try {
      await adminAPI.updateBugReport(id, data);
      fetchBugReports(pagination.page);
    } catch (error) {
      console.error('Failed to update bug report:', error);
    }
  };

  const handleSaveNotes = async (id) => {
    if (editingNotes[id] === undefined) return;
    await handleUpdate(id, { adminNotes: editingNotes[id] });
    setEditingNotes(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const totalReports = stats.open + stats.in_progress + stats.resolved + stats.closed;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Bug Reports</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">User-submitted issues and feature requests</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Total</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{totalReports}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">Open</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stats.open}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase">In Progress</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stats.in_progress}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">Resolved</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stats.resolved}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Closed</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stats.closed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-48">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </form>
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
          className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Bug Reports Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bugReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FiFlag className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">No bug reports found</p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Reports submitted by users will appear here</p>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <div className="col-span-4">Subject</div>
              <div className="col-span-2">Reporter</div>
              <div className="col-span-1">Category</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Priority</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1"></div>
            </div>

            {/* Rows */}
            {bugReports.map((report) => (
              <div key={report._id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                {/* Main Row */}
                <div
                  className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-6 py-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                  onClick={() => setExpandedId(expandedId === report._id ? null : report._id)}
                >
                  <div className="lg:col-span-4">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{report.subject}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 lg:hidden mt-0.5">
                      {report.reporter?.name || report.reporter?.email || 'Unknown'} — {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="hidden lg:block lg:col-span-2">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{report.reporter?.name || 'Unknown'}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{report.reporter?.email}</p>
                  </div>
                  <div className="hidden lg:flex lg:col-span-1 items-center">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{CATEGORY_LABELS[report.category] || report.category}</span>
                  </div>
                  <div className="hidden lg:flex lg:col-span-1 items-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[report.status]}`}>
                      {report.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="hidden lg:flex lg:col-span-1 items-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[report.priority]}`}>
                      {report.priority}
                    </span>
                  </div>
                  <div className="hidden lg:flex lg:col-span-2 items-center">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(report.createdAt).toLocaleDateString()} {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="hidden lg:flex lg:col-span-1 items-center justify-end">
                    {expandedId === report._id ? (
                      <FiChevronUp className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <FiChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>

                  {/* Mobile badges */}
                  <div className="flex items-center gap-2 lg:hidden">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[report.status]}`}>
                      {report.status?.replace('_', ' ')}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[report.priority]}`}>
                      {report.priority}
                    </span>
                    <span className="text-xs text-zinc-500">{CATEGORY_LABELS[report.category]}</span>
                  </div>
                </div>

                {/* Expanded Detail */}
                {expandedId === report._id && (
                  <div className="px-6 pb-4 bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      {/* Left: Description */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">Description</h4>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{report.description}</p>
                        {report.page && (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3">Page: {report.page}</p>
                        )}
                        {report.company && (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Company: {report.company.name} {report.company.dotNumber ? `(DOT# ${report.company.dotNumber})` : ''}</p>
                        )}
                      </div>

                      {/* Right: Admin Controls */}
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">Status</label>
                            <select
                              value={report.status}
                              onChange={(e) => handleUpdate(report._id, { status: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white"
                            >
                              <option value="open">Open</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">Priority</label>
                            <select
                              value={report.priority}
                              onChange={(e) => handleUpdate(report._id, { priority: e.target.value })}
                              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">Admin Notes</label>
                          <textarea
                            value={editingNotes[report._id] !== undefined ? editingNotes[report._id] : (report.adminNotes || '')}
                            onChange={(e) => setEditingNotes(prev => ({ ...prev, [report._id]: e.target.value }))}
                            placeholder="Add internal notes..."
                            rows={3}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 resize-none"
                          />
                          {editingNotes[report._id] !== undefined && editingNotes[report._id] !== (report.adminNotes || '') && (
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => setEditingNotes(prev => {
                                  const next = { ...prev };
                                  delete next[report._id];
                                  return next;
                                })}
                                className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveNotes(report._id)}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
                              >
                                Save Notes
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
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
                onClick={() => fetchBugReports(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => fetchBugReports(pagination.page + 1)}
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

export default AdminBugReports;
