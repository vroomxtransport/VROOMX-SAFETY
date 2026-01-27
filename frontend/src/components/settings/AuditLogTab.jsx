import { useState, useEffect, useCallback } from 'react';
import { auditAPI } from '../../utils/api';
import {
  FiFilter, FiDownload, FiSearch, FiChevronLeft, FiChevronRight,
  FiClock, FiUser, FiActivity
} from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

const ACTION_OPTIONS = [
  'create', 'update', 'delete', 'login', 'logout',
  'password_change', 'role_change', 'invite', 'upload'
];

const RESOURCE_OPTIONS = [
  'driver', 'vehicle', 'violation', 'document', 'drug_alcohol_test',
  'accident', 'ticket', 'damage_claim', 'maintenance', 'checklist',
  'task', 'user', 'company', 'invitation', 'subscription'
];

const ACTION_COLORS = {
  create: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
  update: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
  delete: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
  login: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  logout: 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400',
  password_change: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  role_change: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400',
  invite: 'bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400',
  upload: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
};

const AuditLogTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [showFilters, setShowFilters] = useState(false);

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

      const response = await auditAPI.getLogs(params);
      setLogs(response.data.logs || []);
      setTotal(response.data.total || 0);
      setPages(response.data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, action, resource, startDate, endDate, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = async () => {
    try {
      const params = {};
      if (action) params.action = action;
      if (resource) params.resource = resource;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search) params.search = search;

      const response = await auditAPI.exportLogs(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Audit logs exported');
    } catch {
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

  const truncateDetails = (details) => {
    if (!details) return '-';
    const text = typeof details === 'object' ? (details.summary || JSON.stringify(details)) : String(details);
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
  };

  const hasActiveFilters = action || resource || startDate || endDate || search;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
            <FiActivity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Audit Log</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{total} entries</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <FiFilter className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <FiDownload className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Email</label>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search..."
                  className="pl-8 pr-2 py-1.5 w-full rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Action</label>
              <select
                value={action}
                onChange={(e) => { setAction(e.target.value); setPage(1); }}
                className="w-full px-2 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
              >
                <option value="">All</option>
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Resource</label>
              <select
                value={resource}
                onChange={(e) => { setResource(e.target.value); setPage(1); }}
                className="w-full px-2 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
              >
                <option value="">All</option>
                {RESOURCE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full px-2 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full px-2 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-2 text-right">
              <button onClick={handleClearFilters} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">{error}</p>
          <button onClick={fetchLogs} className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
            Retry
          </button>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2">
          <FiClock className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            {hasActiveFilters ? 'No logs match your filters.' : 'No audit logs yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-y border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">Time</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">User</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">Action</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">Resource</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-sm text-zinc-900 dark:text-white">
                        {log.userId?.firstName || '-'} {log.userId?.lastName || ''}
                      </p>
                      <p className="text-xs text-zinc-400">{log.userId?.email || log.userEmail || ''}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        ACTION_COLORS[log.action] || 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {(log.action || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 capitalize">
                      {(log.resource || '-').replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400 max-w-[200px]">
                      <span title={typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}>
                        {truncateDetails(log.details)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 px-2">
                  {page} / {pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="p-1.5 rounded border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLogTab;
