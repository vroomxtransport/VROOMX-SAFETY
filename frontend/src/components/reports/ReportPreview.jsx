import { useState, useEffect, useCallback } from 'react';
import { reportsAPI } from '../../utils/api';
import { REPORT_FIELD_DEFINITIONS } from '../../utils/reportFieldConfig';
import LoadingSpinner from '../LoadingSpinner';
import { FiX, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

/**
 * ReportPreview - Shows first 10 rows of report data before downloading
 *
 * Props:
 * - reportType: string - The report type key (e.g., 'dqf', 'vehicle')
 * - selectedFields: string[] - Currently selected field keys
 * - filters: object - Active filters to apply
 * - onClose: function - Optional callback to close preview
 */
const ReportPreview = ({
  reportType,
  selectedFields = [],
  filters = {},
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  // Debounced fetch
  const fetchPreview = useCallback(async () => {
    if (!reportType || selectedFields.length === 0) {
      setPreviewData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        ...filters,
        fields: selectedFields.join(',')
      };

      // Handle array filters
      if (filters.driverIds?.length) {
        params.driverIds = filters.driverIds.join(',');
      }
      if (filters.vehicleIds?.length) {
        params.vehicleIds = filters.vehicleIds.join(',');
      }

      const response = await reportsAPI.getPreview(reportType, params);
      setPreviewData(response.data);
    } catch (err) {
      console.error('Preview fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  }, [reportType, selectedFields, filters]);

  // Debounce effect - 300ms delay
  useEffect(() => {
    const timeoutId = setTimeout(fetchPreview, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchPreview]);

  // Format cell value based on type
  const formatCellValue = (value, fieldKey) => {
    if (value === null || value === undefined) {
      return '-';
    }

    // Get field definition
    const definition = REPORT_FIELD_DEFINITIONS[reportType];
    const field = definition?.fields?.find(f => f.key === fieldKey);
    const fieldType = field?.type || 'string';

    switch (fieldType) {
      case 'date':
        try {
          const date = new Date(value);
          return isNaN(date.getTime()) ? value : date.toLocaleDateString();
        } catch {
          return value;
        }
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      default:
        return String(value);
    }
  };

  // Get column label
  const getColumnLabel = (key) => {
    const definition = REPORT_FIELD_DEFINITIONS[reportType];
    const field = definition?.fields?.find(f => f.key === key);
    return field?.label || key;
  };

  // No fields selected
  if (selectedFields.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-center py-8 text-zinc-500 dark:text-zinc-400">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            Select at least one field to preview
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">
            Report Preview
          </h3>
          {previewData && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Showing {previewData.previewCount} of {previewData.totalCount} rows
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPreview}
            className="btn btn-secondary btn-sm"
            disabled={loading}
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="card-body p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-500">
            <FiAlertCircle className="w-8 h-8 mb-2" />
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchPreview}
              className="btn btn-secondary btn-sm mt-4"
            >
              Retry
            </button>
          </div>
        ) : previewData ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <tr>
                  {previewData.columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300 whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {previewData.rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    {previewData.columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-3 text-zinc-700 dark:text-zinc-200 whitespace-nowrap"
                      >
                        {formatCellValue(row[col.key], col.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.hasMore && (
              <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 text-center text-sm text-zinc-500 dark:text-zinc-400">
                + {previewData.totalCount - previewData.previewCount} more rows in full report
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
            No data to preview
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPreview;
