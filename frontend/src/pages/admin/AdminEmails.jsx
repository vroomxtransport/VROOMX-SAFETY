import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../utils/api';
import {
  FiFilter, FiSearch, FiChevronLeft, FiChevronRight,
  FiMail, FiX, FiClock
} from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['sent', 'failed', 'bounced'];
const CATEGORY_OPTIONS = ['auth', 'billing', 'invitation', 'notification', 'system'];

const STATUS_STYLES = {
  sent: { dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
  failed: { dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
  bounced: { dot: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' },
};

const CATEGORY_STYLES = {
  auth: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  billing: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
  invitation: 'bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400',
  notification: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
  system: 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400',
};

const AdminEmails = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit };
      if (search) params.search = search;
      if (status) params.status = status;
      if (category) params.category = category;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await adminAPI.getEmails(params);
      setEmails(response.data.emails || []);
      setPagination({
        total: response.data.total || 0,
        page: response.data.page || 1,
        pages: response.data.pages || 1
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load email logs');
      toast.error('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, category, startDate, endDate]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setCategory('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleRowClick = async (email) => {
    try {
      const response = await adminAPI.getEmail(email._id);
      setSelectedEmail(response.data.email || response.data);
    } catch (err) {
      toast.error('Failed to load email details');
    }
  };

  const hasActiveFilters = search || status || category || startDate || endDate;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <FiMail className="w-6 h-6 text-red-500" />
            Email Logs
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
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Recipient</label>
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

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
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
              onClick={fetchEmails}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <FiMail className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">No email logs found</p>
            <p className="text-zinc-500 dark:text-zinc-500 text-sm">
              {hasActiveFilters ? 'Try adjusting your filters.' : 'Email logs will appear here as emails are sent.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-300 dark:border-zinc-600">
                <tr>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Recipient</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Subject</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Template</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">
                    <span className="flex items-center gap-1"><FiClock className="w-3.5 h-3.5" /> Sent At</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {emails.map((email) => {
                  const statusStyle = STATUS_STYLES[email.status] || STATUS_STYLES.sent;
                  const categoryStyle = CATEGORY_STYLES[email.category] || CATEGORY_STYLES.system;
                  return (
                    <tr
                      key={email._id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                      onClick={() => handleRowClick(email)}
                    >
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-white">
                        {email.to}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 max-w-xs truncate">
                        {email.subject || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-500 font-mono">
                        {email.template || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${categoryStyle}`}>
                          {email.category || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${statusStyle.text}`}>
                          <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                          {email.status || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {email.sentAt || email.createdAt ? new Date(email.sentAt || email.createdAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  );
                })}
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

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedEmail(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Email Details</h3>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-4 sm:px-6 py-5 overflow-y-auto max-h-[70vh] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">To</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedEmail.to}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">From</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedEmail.from || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Subject</p>
                  <p className="text-sm text-zinc-900 dark:text-white">{selectedEmail.subject || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Template</p>
                  <p className="text-sm text-zinc-900 dark:text-white font-mono">{selectedEmail.template || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Category</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    CATEGORY_STYLES[selectedEmail.category] || CATEGORY_STYLES.system
                  }`}>
                    {selectedEmail.category || '-'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                    (STATUS_STYLES[selectedEmail.status] || STATUS_STYLES.sent).text
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${(STATUS_STYLES[selectedEmail.status] || STATUS_STYLES.sent).dot}`} />
                    {selectedEmail.status || '-'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Resend ID</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-500 font-mono">{selectedEmail.resendId || '-'}</p>
                </div>
              </div>

              {selectedEmail.error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Error</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{typeof selectedEmail.error === 'object' ? JSON.stringify(selectedEmail.error) : selectedEmail.error}</p>
                </div>
              )}

              {selectedEmail.metadata && Object.keys(selectedEmail.metadata).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Metadata</p>
                  <pre className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 overflow-x-auto">
                    {JSON.stringify(selectedEmail.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Created At</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {selectedEmail.createdAt ? new Date(selectedEmail.createdAt).toLocaleString() : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Sent At</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {selectedEmail.sentAt ? new Date(selectedEmail.sentAt).toLocaleString() : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmails;
