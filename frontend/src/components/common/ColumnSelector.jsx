import { useState, useRef, useEffect } from 'react';
import { FiColumns, FiCheck, FiRotateCcw } from 'react-icons/fi';

const ColumnSelector = ({ columns, visibleColumns, onChange, storageKey }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (key) => {
    const next = visibleColumns.includes(key)
      ? visibleColumns.filter(k => k !== key)
      : [...visibleColumns, key];
    onChange(next);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const resetDefaults = () => {
    const allKeys = columns.map(c => c.key);
    onChange(allKeys);
    if (storageKey) localStorage.removeItem(storageKey);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-primary-700/50 border border-primary-200 dark:border-primary-600 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 transition-colors"
        title="Toggle columns"
      >
        <FiColumns className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Columns</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white dark:bg-primary-800 border border-primary-200 dark:border-primary-700 rounded-lg shadow-lg py-1 max-h-72 overflow-y-auto">
          <div className="px-3 py-2 border-b border-primary-100 dark:border-primary-700 flex items-center justify-between">
            <span className="text-xs font-semibold text-primary-500 dark:text-primary-400 uppercase tracking-wider">Columns</span>
            <button
              onClick={resetDefaults}
              className="flex items-center gap-1 text-xs text-accent-600 dark:text-accent-400 hover:text-accent-700"
              title="Reset to defaults"
            >
              <FiRotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
          {columns.map((col) => {
            const isVisible = visibleColumns.includes(col.key);
            return (
              <button
                key={col.key}
                onClick={() => toggleColumn(col.key)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-700/50 transition-colors"
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  isVisible
                    ? 'bg-accent-500 border-accent-500 text-white'
                    : 'border-primary-300 dark:border-primary-600'
                }`}>
                  {isVisible && <FiCheck className="w-3 h-3" />}
                </span>
                {col.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ColumnSelector;
