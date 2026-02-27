import { useState, useMemo } from 'react';
import { MAP_VIEWBOX, US_STATE_PATHS } from './usStatesGeo';

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

const COLOR_SCHEMES = {
  blue: {
    empty: '#e4e4e7',       // zinc-200
    emptyDark: '#3f3f46',   // zinc-700
    low: '#93c5fd',         // blue-300
    high: '#1d4ed8',        // blue-700
    lowDark: '#1e40af',     // blue-800
    highDark: '#60a5fa',    // blue-400
  },
  red: {
    empty: '#e4e4e7',
    emptyDark: '#3f3f46',
    low: '#fca5a5',         // red-300
    high: '#b91c1c',        // red-700
    lowDark: '#991b1b',     // red-800
    highDark: '#f87171',    // red-400
  }
};

const USStateMap = ({ data = {}, metric = 'violationCount', colorScheme = 'red', title = '' }) => {
  const [hovered, setHovered] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const scheme = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.red;

  const maxValue = useMemo(() => {
    const values = Object.values(data).map(d => d[metric] || 0);
    return Math.max(...values, 1);
  }, [data, metric]);

  const getColor = (stateCode, isDark) => {
    const stateData = data[stateCode];
    if (!stateData || !stateData[metric]) {
      return isDark ? scheme.emptyDark : scheme.empty;
    }
    const value = stateData[metric];
    const ratio = value / maxValue;
    // Interpolate between low and high
    if (isDark) {
      return ratio >= 0.5 ? scheme.highDark : scheme.lowDark;
    }
    return ratio >= 0.5 ? scheme.high : scheme.low;
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className="relative">
      {title && (
        <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 text-center uppercase tracking-wider">
          {title}
        </h4>
      )}
      <svg
        viewBox={MAP_VIEWBOX}
        className="w-full h-auto"
        aria-label={`US map showing ${title || metric}`}
      >
        {Object.entries(US_STATE_PATHS).map(([code, d]) => (
          <path
            key={code}
            d={d}
            className="transition-opacity duration-150"
            fill={getColor(code, document.documentElement.classList.contains('dark'))}
            stroke={document.documentElement.classList.contains('dark') ? '#27272a' : '#fff'}
            strokeWidth={0.75}
            opacity={hovered && hovered !== code ? 0.6 : 1}
            onMouseEnter={() => setHovered(code)}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: data[code] ? 'pointer' : 'default' }}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hovered && data[hovered] && (
        <div
          className="absolute z-50 pointer-events-none bg-zinc-900 dark:bg-zinc-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg border border-zinc-700"
          style={{
            left: Math.min(tooltipPos.x + 12, 240),
            top: tooltipPos.y - 60,
          }}
        >
          <div className="font-bold mb-1">{STATE_NAMES[hovered] || hovered}</div>
          <div className="space-y-0.5 font-mono text-[11px]">
            <div>Inspections: {data[hovered].inspectionCount || 0}</div>
            <div>Violations: {data[hovered].violationCount || 0}</div>
            <div>OOS: {data[hovered].oosCount || 0}</div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: scheme.empty }} /> 0
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: scheme.low }} /> 1
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: scheme.high }} /> 2+
        </span>
      </div>
    </div>
  );
};

export default USStateMap;
