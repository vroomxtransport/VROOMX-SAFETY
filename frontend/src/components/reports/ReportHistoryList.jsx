import { useState, useEffect, useCallback } from 'react';
import { reportHistoryAPI } from '../../utils/api';
import { downloadBlob } from '../../utils/helpers';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiDownload, FiFile, FiClock, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';

// Report type display labels
const REPORT_TYPE_LABELS = {
  'dqf': 'Driver Qualification',
  'vehicle': 'Vehicle Maintenance',
  'violations': 'Violations Summary',
  'audit': 'Comprehensive Audit',
  'document-expiration': 'Document Expiration',
  'drug-alcohol': 'Drug & Alcohol',
  'dataq-history': 'DataQ History',
  'accident-summary': 'Accident Summary',
  'maintenance-costs': 'Maintenance Costs'
};

// Format filter object to human-readable string
const formatFilters = (filters) => {
  if (!filters || Object.keys(filters).length === 0) return 'No filters';

  const parts = [];

  if (filters.startDate || filters.endDate) {
    const start = filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'Start';
    const end = filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'End';
    parts.push(`${start} to ${end}`);
  }

  if (filters.driverIds?.length) {
    parts.push(`${filters.driverIds.length} driver${filters.driverIds.length > 1 ? 's' : ''}`);
  }

  if (filters.vehicleIds?.length) {
    parts.push(`${filters.vehicleIds.length} vehicle${filters.vehicleIds.length > 1 ? 's' : ''}`);
  }

  if (filters.complianceStatus) {
    parts.push(`Status: ${filters.complianceStatus}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'All records';
};

const ReportHistoryList = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [filterReportType, setFilterReportType] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      if (filterReportType) {
        params.reportType = filterReportType;
      }

      const response = await reportHistoryAPI.getAll(params);
      setHistory(response.data.history || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Failed to fetch report history:', error);
      toast.error('Failed to load report history');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filterReportType]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDownload = async (item) => {
    setDownloading(item._id);
    try {
      const response = await reportHistoryAPI.download(item._id);
      downloadBlob(response.data, item.fileName);
      toast.success('Report downloaded successfully');
    } catch (error) {
      if (error.response?.status === 410) {
        toast.error('Report has expired and is no longer available');
        // Refresh list to remove expired item
        fetchHistory();
      } else {
        toast.error('Failed to download report');
      }
    } finally {
      setDownloading(null);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleFilterChange = (e) => {
    setFilterReportType(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiresAt) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">Report History</h3>

        {/* Filter dropdown */}
        <div className="flex items-center space-x-2">
          <FiFilter className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <select
            value={filterReportType}
            onChange={handleFilterChange}
            className="input input-sm w-48"
          >
            <option value="">All Report Types</option>
            {Object.entries(REPORT_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-body">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            <FiFile className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No report history found</p>
            <p className="text-sm mt-1">Generate a report to see it here</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">Report Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">Format</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">Generated</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">Generated By</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">Filters Used</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">Expires</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => {
                    const daysUntilExpiry = getDaysUntilExpiry(item.expiresAt);
                    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7;

                    return (
                      <tr
                        key={item._id}
                        className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-medium text-zinc-800 dark:text-zinc-100">
                              {REPORT_TYPE_LABELS[item.reportType] || item.reportType}
                            </span>
                            {item.rowCount && (
                              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                                {item.rowCount} row{item.rowCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            item.format === 'xlsx'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {item.format?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-zinc-700 dark:text-zinc-200">
                            {item.generatedAt
                              ? format(new Date(item.generatedAt), 'MMM d, yyyy h:mm a')
                              : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-zinc-700 dark:text-zinc-200">
                            {item.generatedByEmail || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="text-sm text-zinc-600 dark:text-zinc-300 truncate block max-w-[200px]"
                            title={formatFilters(item.filters)}
                          >
                            {formatFilters(item.filters)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {daysUntilExpiry !== null ? (
                            <span className={`inline-flex items-center text-sm ${
                              isExpiringSoon
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-zinc-600 dark:text-zinc-300'
                            }`}>
                              <FiClock className="w-3 h-3 mr-1" />
                              {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-sm text-zinc-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDownload(item)}
                            disabled={downloading === item._id}
                            className="btn btn-sm btn-secondary inline-flex items-center"
                          >
                            {downloading === item._id ? (
                              <LoadingSpinner size="sm" className="w-4 h-4" />
                            ) : (
                              <FiDownload className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} reports
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="btn btn-sm btn-secondary disabled:opacity-50"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="btn btn-sm btn-secondary disabled:opacity-50"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportHistoryList;
