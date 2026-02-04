import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiX } from 'react-icons/fi';

const MultiSelectDropdown = ({
  label,
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  // Determine display text
  const getDisplayText = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      const option = options.find((o) => o.value === selected[0]);
      return option ? option.label : placeholder;
    }
    return `${selected.length} selected`;
  };

  return (
    <div className="min-w-[180px]" ref={dropdownRef}>
      <label className="form-label">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="form-select w-full flex items-center justify-between text-left"
        >
          <span className={selected.length === 0 ? 'text-zinc-400 dark:text-zinc-500' : ''}>
            {getDisplayText()}
          </span>
          <div className="flex items-center gap-1">
            {selected.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded"
                aria-label="Clear selection"
              >
                <FiX className="w-4 h-4 text-zinc-500" />
              </button>
            )}
            <FiChevronDown
              className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500">No options available</div>
            ) : (
              options.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => handleToggle(option.value)}
                    className="w-4 h-4 text-primary-600 rounded border-zinc-300 dark:border-zinc-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-200">{option.label}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelectDropdown;
