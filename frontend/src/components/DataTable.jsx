import { useState, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight, FiInbox, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';
import ColumnSelector from './common/ColumnSelector';
import TableExport from './common/TableExport';

const DENSITY_CONFIG = {
  compact: { cell: 'px-2 py-1 text-xs', label: 'Compact' },
  default: { cell: 'px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-3.5 text-xs sm:text-sm', label: 'Default' },
  spacious: { cell: 'px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4.5 text-sm', label: 'Spacious' },
};

const DataTable = ({
  columns,
  data,
  loading,
  page = 1,
  totalPages = 1,
  onPageChange,
  onRowClick,
  emptyMessage = 'No data found',
  emptyIcon: EmptyIcon = FiInbox,
  // New enhanced props
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  exportable = false,
  exportFilename = 'export',
  columnToggle = false,
  columnStorageKey,
  sortField,
  sortDirection,
  onSort,
  density: controlledDensity,
  onDensityChange,
  showDensityToggle = false,
  // Toolbar extras
  toolbarLeft,
  toolbarRight,
}) => {
  const [internalDensity, setInternalDensity] = useState('default');
  const density = controlledDensity || internalDensity;
  const setDensity = onDensityChange || setInternalDensity;
  const densityCfg = DENSITY_CONFIG[density] || DENSITY_CONFIG.default;

  // Column visibility
  const allColumnKeys = columns.map((c, i) => c.key || c.accessor || c.header || `col-${i}`);
  const [visibleKeys, setVisibleKeys] = useState(() => {
    if (columnStorageKey) {
      try {
        const saved = localStorage.getItem(columnStorageKey);
        if (saved) return JSON.parse(saved);
      } catch { /* ignore */ }
    }
    return allColumnKeys;
  });

  const columnsWithKeys = columns.map((c, i) => ({
    ...c,
    _key: c.key || c.accessor || c.header || `col-${i}`,
  }));

  const visibleColumns = columnToggle
    ? columnsWithKeys.filter(c => visibleKeys.includes(c._key))
    : columnsWithKeys;

  // Selection
  const allSelected = data.length > 0 && data.every(row => selectedRows.includes(row._id || row.id));
  const someSelected = data.some(row => selectedRows.includes(row._id || row.id)) && !allSelected;

  const toggleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map(row => row._id || row.id));
    }
  }, [data, allSelected, onSelectionChange]);

  const toggleSelectRow = useCallback((rowId, e) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedRows.includes(rowId)
        ? selectedRows.filter(id => id !== rowId)
        : [...selectedRows, rowId]
    );
  }, [selectedRows, onSelectionChange]);

  // Sort handler
  const handleSort = (col) => {
    if (!onSort || !col.sortable) return;
    const field = col.sortKey || col.accessor || col.key;
    if (!field) return;
    const newDir = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(field, newDir);
  };

  // Separate action columns
  const actionColumns = visibleColumns.filter(col =>
    (col.header === '' || col.header === 'Actions' || col.header === 'Action' || col.className?.includes('action'))
  );
  const dataColumns = visibleColumns.filter(col =>
    !(col.header === '' || col.header === 'Actions' || col.header === 'Action' || col.className?.includes('action'))
  );

  const showToolbar = columnToggle || exportable || showDensityToggle || toolbarLeft || toolbarRight || (selectable && selectedRows.length > 0);

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
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-primary-100 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/30">
          <div className="flex items-center gap-2">
            {selectable && selectedRows.length > 0 && (
              <span className="text-xs font-medium text-accent-600 dark:text-accent-400">
                {selectedRows.length} selected
              </span>
            )}
            {toolbarLeft}
          </div>
          <div className="flex items-center gap-2">
            {toolbarRight}
            {showDensityToggle && (
              <div className="flex items-center border border-primary-200 dark:border-primary-600 rounded-lg overflow-hidden">
                {Object.entries(DENSITY_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setDensity(key)}
                    className={`px-2 py-1 text-[10px] font-medium transition-colors ${
                      density === key
                        ? 'bg-primary-600 text-white dark:bg-primary-500'
                        : 'text-primary-500 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-700'
                    }`}
                    title={cfg.label}
                  >
                    {cfg.label[0]}
                  </button>
                ))}
              </div>
            )}
            {columnToggle && (
              <ColumnSelector
                columns={columnsWithKeys.map(c => ({ key: c._key, label: c.header || c._key }))}
                visibleColumns={visibleKeys}
                onChange={setVisibleKeys}
                storageKey={columnStorageKey}
              />
            )}
            {exportable && (
              <TableExport
                columns={dataColumns.map(c => ({
                  header: c.header,
                  accessor: c.accessor,
                  key: c._key,
                }))}
                data={data}
                filename={exportFilename}
              />
            )}
          </div>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden">
        {data.length === 0 ? (
          <div className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-700 flex items-center justify-center mb-4">
                <EmptyIcon className="w-8 h-8 text-primary-400" />
              </div>
              <p className="text-primary-600 dark:text-primary-300 font-medium">{emptyMessage}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Try adjusting your filters or add new data</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-primary-100 dark:divide-primary-700">
            {data.map((row, rowIndex) => {
              const rowId = row._id || row.id || rowIndex;
              return (
                <div
                  key={rowId}
                  className={`p-4 ${onRowClick ? 'cursor-pointer active:bg-accent-50/50 dark:active:bg-accent-500/10' : ''} ${
                    selectable && selectedRows.includes(rowId) ? 'bg-accent-50/40 dark:bg-accent-500/10' : ''
                  }`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {selectable && (
                    <div className="mb-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(rowId)}
                        onChange={(e) => toggleSelectRow(rowId, e)}
                        className="w-4 h-4 rounded border-primary-300 text-accent-600 focus:ring-accent-500"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    {dataColumns.map((col, colIndex) => (
                      <div key={colIndex} className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-primary-500 dark:text-primary-400 uppercase tracking-wider shrink-0">
                          {col.header}
                        </span>
                        <span className="text-primary-700 dark:text-primary-300">
                          {col.render ? col.render(row) : row[col.accessor]}
                        </span>
                      </div>
                    ))}
                  </div>
                  {actionColumns.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-primary-100 dark:border-primary-700 flex items-center justify-end gap-2">
                      {actionColumns.map((col, colIndex) => (
                        <span key={colIndex} onClick={(e) => e.stopPropagation()}>
                          {col.render ? col.render(row) : row[col.accessor]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-primary-200 dark:border-primary-700 bg-gradient-to-b from-primary-50 to-primary-100 dark:from-primary-800 dark:to-primary-900">
              {selectable && (
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-primary-300 text-accent-600 focus:ring-accent-500"
                  />
                </th>
              )}
              {visibleColumns.map((col, index) => {
                const isSortable = col.sortable && onSort;
                const sortKey = col.sortKey || col.accessor || col.key;
                const isActive = sortField === sortKey;
                return (
                  <th
                    key={col._key || index}
                    className={`${densityCfg.cell} text-left text-xs font-semibold text-primary-600 dark:text-primary-300 uppercase tracking-wider ${
                      isSortable ? 'cursor-pointer select-none hover:text-primary-800 dark:hover:text-primary-100' : ''
                    } ${col.className || ''}`}
                    onClick={isSortable ? () => handleSort(col) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {isSortable && isActive && (
                        sortDirection === 'asc'
                          ? <FiChevronUp className="w-3.5 h-3.5" />
                          : <FiChevronDown className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-100 dark:divide-primary-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (selectable ? 1 : 0)} className="py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-700 flex items-center justify-center mb-4">
                      <EmptyIcon className="w-8 h-8 text-primary-400" />
                    </div>
                    <p className="text-primary-600 dark:text-primary-300 font-medium">{emptyMessage}</p>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 mt-1">Try adjusting your filters or add new data</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const rowId = row._id || row.id || rowIndex;
                const isSelected = selectable && selectedRows.includes(rowId);
                return (
                  <tr
                    key={rowId}
                    className={`group transition-colors duration-150 ${
                      isSelected
                        ? 'bg-accent-50/60 dark:bg-accent-500/15'
                        : rowIndex % 2 === 0
                          ? 'bg-white dark:bg-primary-800'
                          : 'bg-primary-50/30 dark:bg-primary-900/30'
                    } hover:bg-accent-50/50 dark:hover:bg-accent-500/10 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {selectable && (
                      <td className="px-3 py-2 w-10" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectRow(rowId, e)}
                          className="w-4 h-4 rounded border-primary-300 text-accent-600 focus:ring-accent-500"
                        />
                      </td>
                    )}
                    {visibleColumns.map((col, colIndex) => (
                      <td
                        key={col._key || colIndex}
                        className={`relative ${densityCfg.cell} text-primary-700 dark:text-primary-300 ${col.cellClassName || ''}`}
                      >
                        {/* Accent bar on first cell */}
                        {colIndex === 0 && !selectable && (
                          <span
                            className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center"
                          />
                        )}
                        {col.render ? col.render(row) : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-primary-200 dark:border-primary-700 bg-gradient-to-b from-primary-50/50 to-white dark:from-primary-900/50 dark:to-primary-800">
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-mono">
            Page <span className="font-semibold text-primary-700 dark:text-primary-200">{page}</span> of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              aria-label="Previous page"
              className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-primary-700 dark:hover:text-primary-200 hover:bg-primary-100 dark:hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>

            {/* Page numbers - hidden on mobile, visible on sm+ */}
            <div className="hidden sm:flex items-center gap-1">
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
            </div>

            <button
              aria-label="Next page"
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
