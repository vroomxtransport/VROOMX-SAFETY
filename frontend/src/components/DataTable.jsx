import { FiChevronLeft, FiChevronRight, FiInbox } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';

const DataTable = ({
  columns,
  data,
  loading,
  page = 1,
  totalPages = 1,
  onPageChange,
  onRowClick,
  emptyMessage = 'No data found',
  emptyIcon: EmptyIcon = FiInbox
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-primary-800 rounded-xl border border-primary-200/60 dark:border-primary-700">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-primary-800 rounded-xl border border-primary-200/60 dark:border-primary-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-primary-200 dark:border-primary-700 bg-gradient-to-b from-primary-50 to-primary-100 dark:from-primary-800 dark:to-primary-900">
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`px-4 py-3.5 text-left text-xs font-semibold text-primary-600 dark:text-primary-300 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-100 dark:divide-primary-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-700 flex items-center justify-center mb-4">
                      <EmptyIcon className="w-8 h-8 text-primary-400" />
                    </div>
                    <p className="text-primary-600 dark:text-primary-300 font-medium">{emptyMessage}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Try adjusting your filters or add new data</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row._id || row.id || rowIndex}
                  className={`group transition-colors duration-150 ${
                    rowIndex % 2 === 0 ? 'bg-white dark:bg-primary-800' : 'bg-primary-50/30 dark:bg-primary-900/30'
                  } hover:bg-accent-50/50 dark:hover:bg-accent-500/10 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`relative px-4 py-3.5 text-sm text-primary-700 dark:text-primary-300 ${col.cellClassName || ''}`}
                    >
                      {/* Accent bar on first cell */}
                      {colIndex === 0 && (
                        <span
                          className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center"
                        />
                      )}
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-primary-200 dark:border-primary-700 bg-gradient-to-b from-primary-50/50 to-white dark:from-primary-900/50 dark:to-primary-800">
          <p className="text-sm text-zinc-600 dark:text-zinc-300 font-mono">
            Page <span className="font-semibold text-primary-700 dark:text-primary-200">{page}</span> of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-primary-700 dark:hover:text-primary-200 hover:bg-primary-100 dark:hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-150 ${
                    pageNum === page
                      ? 'text-white shadow-md bg-primary-600 dark:bg-primary-500'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-primary-100 dark:hover:bg-primary-700'
                  }`}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-primary-700 dark:hover:text-primary-200 hover:bg-primary-100 dark:hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
