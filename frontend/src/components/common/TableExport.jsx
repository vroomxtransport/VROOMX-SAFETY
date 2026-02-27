import { FiDownload } from 'react-icons/fi';

const escapeCsvField = (value) => {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const TableExport = ({ columns, data, filename = 'export' }) => {
  const handleExport = () => {
    const headers = columns.map(c => escapeCsvField(c.header || c.label || c.key));
    const rows = data.map(row =>
      columns.map(col => {
        const value = col.accessor ? row[col.accessor] : row[col.key];
        if (value instanceof Date) return value.toISOString().split('T')[0];
        if (typeof value === 'object' && value !== null) return JSON.stringify(value);
        return escapeCsvField(value);
      }).join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-primary-700/50 border border-primary-200 dark:border-primary-600 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 transition-colors"
      title="Export to CSV"
    >
      <FiDownload className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Export</span>
    </button>
  );
};

export default TableExport;
