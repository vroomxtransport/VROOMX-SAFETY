import { useState, useEffect } from 'react';
import { violationsAPI } from '../../utils/api';
import { FiMapPin, FiInbox } from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';

// US State abbreviation to full name mapping
const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
  IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',
  OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',DC:'District of Columbia'
};

const ViolationHeatMap = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredState, setHoveredState] = useState(null);
  const [viewMode, setViewMode] = useState('violations'); // violations | inspections | oos

  useEffect(() => {
    violationsAPI.getByState()
      .then(res => setData(res.data?.byState || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;

  if (data.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center text-center">
        <FiInbox className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mb-3" />
        <p className="text-zinc-500 dark:text-zinc-400">No geographic data available yet</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Violation data will appear once FMCSA inspections are synced</p>
      </div>
    );
  }

  // Sort by selected metric
  const sorted = [...data].sort((a, b) => {
    if (viewMode === 'inspections') return b.inspectionCount - a.inspectionCount;
    if (viewMode === 'oos') return b.oosCount - a.oosCount;
    return b.violationCount - a.violationCount;
  });

  const maxValue = sorted[0]?.[viewMode === 'inspections' ? 'inspectionCount' : viewMode === 'oos' ? 'oosCount' : 'violationCount'] || 1;

  const getBarColor = (value) => {
    const ratio = value / maxValue;
    if (ratio >= 0.75) return 'bg-red-500 dark:bg-red-500';
    if (ratio >= 0.5) return 'bg-orange-500 dark:bg-orange-500';
    if (ratio >= 0.25) return 'bg-yellow-500 dark:bg-yellow-500';
    return 'bg-green-500 dark:bg-green-500';
  };

  const getValue = (item) => {
    if (viewMode === 'inspections') return item.inspectionCount;
    if (viewMode === 'oos') return item.oosCount;
    return item.violationCount;
  };

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold flex items-center gap-2">
          <FiMapPin className="w-4 h-4 text-primary-500" />
          Geographic Distribution
        </h3>
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
          {[
            { key: 'violations', label: 'Violations' },
            { key: 'inspections', label: 'Inspections' },
            { key: 'oos', label: 'OOS' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === tab.key
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="card-body p-0">
        {/* State bar chart - compact horizontal bars */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {sorted.slice(0, 15).map((item) => {
            const value = getValue(item);
            const ratio = (value / maxValue) * 100;
            const isHovered = hoveredState === item.state;
            return (
              <div
                key={item.state}
                className={`px-5 py-2.5 flex items-center gap-3 transition-colors ${
                  isHovered ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''
                }`}
                onMouseEnter={() => setHoveredState(item.state)}
                onMouseLeave={() => setHoveredState(null)}
              >
                <span className="w-8 text-xs font-bold text-zinc-600 dark:text-zinc-300 font-mono">{item.state}</span>
                <div className="flex-1 relative h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${getBarColor(value)}`}
                    style={{ width: `${Math.max(ratio, 3)}%` }}
                  />
                </div>
                <div className="flex items-center gap-3 text-xs font-mono min-w-[140px] justify-end">
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{value}</span>
                  {isHovered && (
                    <span className="text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                      {item.inspectionCount}i / {item.violationCount}v / {item.oosCount}oos
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary footer */}
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {data.length} states | Top: {STATE_NAMES[sorted[0]?.state] || sorted[0]?.state}
          </span>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Low</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Med</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> High</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViolationHeatMap;
