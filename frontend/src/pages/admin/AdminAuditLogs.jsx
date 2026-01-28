import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../utils/api';
import {
  FiFilter, FiDownload, FiSearch, FiChevronLeft, FiChevronRight,
  FiClock, FiUser, FiActivity
} from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ACTION_OPTIONS = [
  'create', 'update', 'delete', 'login', 'logout',
  'password_change', 'role_change', 'impersonate',
  'invite', 'export', 'upload'
];

const RESOURCE_OPTIONS = [
  'driver', 'vehicle', 'violation', 'document', 'drug_alcohol_test',
  'accident', 'ticket', 'damage_claim', 'maintenance', 'checklist',
  'task', 'user', 'company', 'alert', 'invitation', 'subscription'
];

const ACTION_COLORS = {
  create: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
  update: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
  delete: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
  login: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  logout: 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400',
  password_change: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  role_change: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400',
  impersonate: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
  invite: 'bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400',
  export: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
  upload: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
};

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit };
      if (action) params.action = action;
      if (resource) params.resource = resource;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search) params.search = search;

      const response = await adminAPI.getAuditLogs(params);
      setLogs(response.data.logs || []);
      setPagination({
        total: response.data.total || 0,
        page: response.data.page || 1,
        pages: response.data.pages || 1
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, action, resource, startDate, endDate, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleExport = async () => {
    try {
      const params = {};
      if (action) params.action = action;
      if (resource) params.resource = resource;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search) params.search = search;

      const response = await adminAPI.exportAuditLogs(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Audit logs exported successfully');
    } catch (err) {
      toast.error('Failed to export audit logs');
    }
  };

  const handleClearFilters = () => {
    setAction('');
    setResource('');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPage(1);
  };

  const truncateDetails = (details, maxLength = 60) => {
    if (!details) return '-';
    const text = typeof details === 'object' ? JSON.stringify(details) : String(details);
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const hasActiveFilters = action || resource || startDate || endDate || search;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <FiActivity className="w-6 h-6 text-red-500" />
            Audit Logs
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            {pagination?.total || 0} total entries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
            }`}
          >
            <FiFilter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <FiDownload className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">User Email</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by email..."
                  className="pl-9 pr-3 py-2 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Action</label>
              <select
                value={action}
                onChange={(e) => { setAction(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Actions</option>
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Resource */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Resource</label>
              <select
                value={resource}
                onChange={(e) => { setResource(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Resources</option>
                {RESOURCE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleClearFilters}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-zinc-600 dark:text-zinc-400">{error}</p>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <FiClock className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">No audit logs found</p>
            <p className="text-zinc-500 dark:text-zinc-500 text-sm">
              {hasActiveFilters ? 'Try adjusting your filters.' : 'Audit logs will appear here as users perform actions.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-300 dark:border-zinc-600">
                <tr>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">
                    <span className="flex items-center gap-1"><FiClock className="w-3.5 h-3.5" /> Timestamp</span>
                  </th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">
                    <span className="flex items-center gap-1"><FiUser className="w-3.5 h-3.5" /> User</span>
                  </th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Action</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Resource</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Resource ID</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Details</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                          {log.userId?.firstName || '-'} {log.userId?.lastName || ''}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500">
                          {log.userId?.email || log.userEmail || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ACTION_COLORS[log.action] || 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {(log.action || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 capitalize">
                      {(log.resource || '-').replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-500 font-mono">
                      {log.resourceId ? log.resourceId.substring(0, 12) + '...' : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-xs">
                      <span title={typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}>
                        {truncateDetails(log.details)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-500 font-mono">
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogs;
