import { useMemo } from 'react';
import { FiCheck, FiSquare, FiCheckSquare } from 'react-icons/fi';

/**
 * FieldSelector - Checkbox-based field selection for report builder
 *
 * Props:
 * - reportType: string - The report type key (e.g., 'dqf', 'vehicle')
 * - fieldDefinitions: object - REPORT_FIELD_DEFINITIONS from reportFieldConfig
 * - selectedFields: string[] - Currently selected field keys
 * - onFieldsChange: function - Callback when fields change
 */
const FieldSelector = ({
  reportType,
  fieldDefinitions,
  selectedFields = [],
  onFieldsChange
}) => {
  // Get fields for current report type
  const fields = useMemo(() => {
    const def = fieldDefinitions[reportType];
    return def?.fields || [];
  }, [fieldDefinitions, reportType]);

  // Get default field keys for current report type
  const defaultFields = useMemo(() => {
    return fields.filter(f => f.default).map(f => f.key);
  }, [fields]);

  // All field keys
  const allFieldKeys = useMemo(() => {
    return fields.map(f => f.key);
  }, [fields]);

  // Toggle a single field
  const handleToggle = (key) => {
    if (selectedFields.includes(key)) {
      onFieldsChange(selectedFields.filter(k => k !== key));
    } else {
      onFieldsChange([...selectedFields, key]);
    }
  };

  // Select all fields
  const handleSelectAll = () => {
    onFieldsChange(allFieldKeys);
  };

  // Select only default fields
  const handleSelectDefaults = () => {
    onFieldsChange(defaultFields);
  };

  // Clear all fields
  const handleClear = () => {
    onFieldsChange([]);
  };

  // Calculate counts
  const selectedCount = selectedFields.length;
  const totalCount = fields.length;

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">
            Fields to Include ({selectedCount}/{totalCount})
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Select which columns appear in the report
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="btn btn-secondary btn-sm"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleSelectDefaults}
            className="btn btn-secondary btn-sm"
          >
            Defaults
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="btn btn-secondary btn-sm"
            disabled={selectedCount === 0}
          >
            Clear
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {fields.map((field) => {
            const isSelected = selectedFields.includes(field.key);
            const isDefault = field.default;

            return (
              <label
                key={field.key}
                className={`
                  flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                  ${isSelected
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500'
                    : 'bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent hover:border-zinc-300 dark:hover:border-zinc-600'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(field.key)}
                  className="sr-only"
                />
                <div className={`
                  flex-shrink-0 w-5 h-5 rounded flex items-center justify-center
                  ${isSelected
                    ? 'bg-primary-500 text-white'
                    : 'border-2 border-zinc-300 dark:border-zinc-600'
                  }
                `}>
                  {isSelected && <FiCheck className="w-3 h-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`
                    text-sm font-medium block truncate
                    ${isSelected
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-zinc-700 dark:text-zinc-200'
                    }
                  `}>
                    {field.label}
                  </span>
                  {isDefault && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      (default)
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FieldSelector;
