const StatusFilter = ({ options, value, onChange }) => {
  return (
    <div className="min-w-[150px]">
      <label className="form-label">Status</label>
      <select
        className="form-select w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default StatusFilter;
