import { getDatePresets, getActivePreset } from '../../utils/datePresets';

const DateRangeFilter = ({ startDate, endDate, onChange }) => {
  const presets = getDatePresets();
  const activePreset = getActivePreset(startDate, endDate);

  const handlePresetClick = (preset) => {
    onChange(preset.startDate, preset.endDate);
  };

  return (
    <div className="space-y-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activePreset === preset.key
                ? 'bg-primary-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {/* Date inputs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="form-label">Start Date</label>
          <input
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => onChange(e.target.value, endDate)}
          />
        </div>
        <div className="flex-1">
          <label className="form-label">End Date</label>
          <input
            type="date"
            className="form-input"
            value={endDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => onChange(startDate, e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;
