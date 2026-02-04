import { useState, useMemo } from 'react';
import { FiX, FiDownload, FiSearch, FiChevronDown, FiChevronRight, FiFileText } from 'react-icons/fi';

/**
 * ReportDataModal - Displays JSON report data in a formatted modal
 *
 * Props:
 * - isOpen: boolean - Whether the modal is visible
 * - onClose: function - Callback to close modal
 * - data: object - The JSON response from the report API
 * - reportType: string - The report type key (e.g., 'dqf', 'vehicle')
 * - reportTitle: string - Display title for the report
 */
const ReportDataModal = ({
  isOpen,
  onClose,
  data,
  reportType,
  reportTitle
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRawJson, setShowRawJson] = useState(false);

  // Extract the main data array from the response
  const { records, columns, summary } = useMemo(() => {
    if (!data?.report) return { records: [], columns: [], summary: null };

    const report = data.report;
    let recordArray = [];
    let summaryData = null;

    // Different report types have different data structures
    if (report.drivers) {
      recordArray = report.drivers;
    } else if (report.vehicles) {
      recordArray = report.vehicles;
    } else if (report.violations) {
      recordArray = report.violations;
    } else if (report.tests) {
      recordArray = report.tests;
    } else if (report.accidents) {
      recordArray = report.accidents;
    } else if (report.documents) {
      // Document expiration has grouped documents
      if (report.documents.expired) {
        recordArray = [
          ...report.documents.expired,
          ...report.documents.within30Days,
          ...report.documents.within60Days,
          ...report.documents.within90Days
        ];
      } else {
        recordArray = report.documents;
      }
    } else if (report.records) {
      recordArray = report.records;
    } else if (report.challenges) {
      recordArray = report.challenges;
    }

    // Extract summary if present
    if (report.summary) {
      summaryData = report.summary;
    }

    // Build columns from first record
    const cols = recordArray.length > 0
      ? Object.keys(recordArray[0]).filter(key => {
          // Skip nested objects/arrays for simple display
          const val = recordArray[0][key];
          return val === null || val === undefined || typeof val !== 'object' || val instanceof Date;
        })
      : [];

    return { records: recordArray, columns: cols, summary: summaryData };
  }, [data]);

  // Filter records based on search term
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;

    const term = searchTerm.toLowerCase();
    return records.filter(record =>
      Object.values(record).some(value => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(term);
      })
    );
  }, [records, searchTerm]);

  // Format cell value for display
  const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') {
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      // For nested objects, show a summary
      return JSON.stringify(value).substring(0, 50) + '...';
    }
    // Check if it's a date string
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      } catch {
        // Not a valid date, return as is
      }
    }
    return String(value);
  };

  // Download JSON file
  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
            <div>
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
                {reportTitle || 'Report Data'}
              </h2>
              {data?.report?.company && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {data.report.company.name}
                  {data.report.company.dotNumber && ` (DOT# ${data.report.company.dotNumber})`}
                  {data.report.generatedAt && (
                    <span className="ml-2">
                      Generated: {new Date(data.report.generatedAt).toLocaleString()}
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadJson}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <FiDownload className="w-4 h-4" />
                Download JSON
              </button>
              <button
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Summary Section (if available) */}
          {summary && (
            <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex flex-wrap gap-4">
                {Object.entries(summary).map(([key, value]) => (
                  <div key={key} className="px-3 py-1 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="ml-2 font-medium text-zinc-800 dark:text-zinc-100">
                      {typeof value === 'number' ? value.toLocaleString() : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search and Info Bar */}
          <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {searchTerm ? (
                <span>{filteredRecords.length} of {records.length} records</span>
              ) : (
                <span>{records.length} records</span>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-auto">
            {filteredRecords.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800 sticky top-0">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300 whitespace-nowrap border-b border-zinc-200 dark:border-zinc-700"
                      >
                        {col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredRecords.map((record, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    >
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="px-4 py-3 text-zinc-700 dark:text-zinc-200 whitespace-nowrap max-w-xs truncate"
                          title={formatValue(record[col])}
                        >
                          {formatValue(record[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-500 dark:text-zinc-400">
                <FiFileText className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg">
                  {searchTerm ? 'No records match your search' : 'No data available'}
                </p>
              </div>
            )}
          </div>

          {/* Raw JSON Toggle */}
          <div className="border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="w-full px-6 py-3 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {showRawJson ? (
                <FiChevronDown className="w-4 h-4" />
              ) : (
                <FiChevronRight className="w-4 h-4" />
              )}
              View Raw JSON
            </button>
            {showRawJson && (
              <div className="px-6 pb-4 max-h-64 overflow-auto">
                <pre className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDataModal;
