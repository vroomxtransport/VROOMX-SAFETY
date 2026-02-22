import { FiFileText, FiAlertTriangle, FiEye } from 'react-icons/fi';

const DataQPreviewPanel = ({ dataQOpportunities }) => {
  if (!dataQOpportunities || !dataQOpportunities.hasOpportunities) return null;

  const { estimatedCount, categories } = dataQOpportunities;
  const flagged = categories.filter(c => c.status === 'flagged');
  const nearThreshold = categories.filter(c => c.status === 'near_threshold');

  return (
    <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
      <div className="flex items-center gap-2 mb-2">
        <FiFileText className="w-4 h-4 text-indigo-600" />
        <h4 className="text-xs font-semibold text-indigo-800">DataQ Challenge Opportunities</h4>
      </div>

      <p className="text-[11px] text-indigo-700 mb-3">
        We estimate <span className="font-bold">{estimatedCount}</span> potential violations
        that may be eligible for DataQ challenge.
      </p>

      {flagged.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-1 mb-1">
            <FiAlertTriangle className="w-3 h-3 text-red-500" />
            <span className="text-[10px] font-semibold text-red-700">Flagged BASICs — High Priority</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {flagged.map(cat => (
              <span
                key={cat.basic}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-[10px] font-medium text-red-700"
              >
                {cat.name}: {cat.score}%
              </span>
            ))}
          </div>
        </div>
      )}

      {nearThreshold.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-1 mb-1">
            <FiEye className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-semibold text-amber-700">Near Threshold — Monitor</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {nearThreshold.map(cat => (
              <span
                key={cat.basic}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-[10px] font-medium text-amber-700"
              >
                {cat.name}: {cat.score}%
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-[9px] text-indigo-500 mt-2">
        DataQ challenges let you dispute incorrect violations on your FMCSA record. Get the full AI report for specific recommendations.
      </p>
    </div>
  );
};

export default DataQPreviewPanel;
