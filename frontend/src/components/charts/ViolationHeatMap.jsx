import { useState, useEffect, useMemo } from 'react';
import { violationsAPI } from '../../utils/api';
import { FiMapPin, FiInbox, FiTruck } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import USStateMap from './USStateMap';
import LoadingSpinner from '../LoadingSpinner';

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
  const [stateData, setStateData] = useState([]);
  const [topVehicles, setTopVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      violationsAPI.getByState().then(r => r.data?.byState || []).catch(() => []),
      violationsAPI.getTopVehicles().then(r => r.data?.topVehicles || []).catch(() => [])
    ]).then(([states, vehicles]) => {
      setStateData(states);
      setTopVehicles(vehicles);
    }).finally(() => setLoading(false));
  }, []);

  // Build lookup: { TX: { inspectionCount, violationCount, oosCount, ... } }
  const dataByState = useMemo(() => {
    const map = {};
    stateData.forEach(s => { map[s.state] = s; });
    return map;
  }, [stateData]);

  // OOS by state data (top 10 for bar chart)
  const oosBarData = useMemo(() => {
    return [...stateData]
      .sort((a, b) => b.oosCount - a.oosCount)
      .slice(0, 10)
      .map(s => ({
        state: s.state,
        name: STATE_NAMES[s.state] || s.state,
        oos: s.oosCount,
        nonOos: (s.nonOosCount !== undefined ? s.nonOosCount : s.violationCount - s.oosCount)
      }));
  }, [stateData]);

  // Violations with/without OOS (aggregated)
  const oosBreakdown = useMemo(() => {
    const totalOos = stateData.reduce((sum, s) => sum + s.oosCount, 0);
    const totalNonOos = stateData.reduce((sum, s) => sum + (s.nonOosCount !== undefined ? s.nonOosCount : s.violationCount - s.oosCount), 0);
    return [
      { name: 'With OOS', value: totalOos, fill: '#ef4444' },
      { name: 'Without OOS', value: totalNonOos, fill: '#3b82f6' }
    ];
  }, [stateData]);

  if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;

  if (stateData.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center text-center">
        <FiInbox className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mb-3" />
        <p className="text-zinc-500 dark:text-zinc-400">No geographic data available yet</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Violation data will appear once FMCSA inspections are synced</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-semibold flex items-center gap-2">
          <FiMapPin className="w-4 h-4 text-primary-500" />
          Geographic Violation Report
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {stateData.length} state{stateData.length !== 1 ? 's' : ''} with activity (last 24 months)
        </p>
      </div>

      <div className="card-body space-y-6">
        {/* Row 1: Maps + Top Vehicles */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Inspections Map (blue) */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
            <USStateMap
              data={dataByState}
              metric="inspectionCount"
              colorScheme="blue"
              title="Inspections"
            />
          </div>

          {/* Violations Map (red) */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
            <USStateMap
              data={dataByState}
              metric="violationCount"
              colorScheme="red"
              title="Violations"
            />
          </div>

          {/* Top 10 Vehicles Table */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2 text-center uppercase tracking-wider">
              Top Vehicles by Violations
            </h4>
            {topVehicles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left py-1.5 font-medium">Unit</th>
                      <th className="text-right py-1.5 font-medium">Violations</th>
                      <th className="text-right py-1.5 font-medium">OOS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
                    {topVehicles.map((v, i) => (
                      <tr key={v.vehicleId || i} className="hover:bg-zinc-100 dark:hover:bg-zinc-700/30">
                        <td className="py-1.5">
                          <div className="flex items-center gap-1.5">
                            <FiTruck className="w-3 h-3 text-zinc-400" />
                            <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                              {v.unitNumber}
                            </span>
                          </div>
                        </td>
                        <td className="text-right font-mono text-zinc-700 dark:text-zinc-300 py-1.5">{v.count}</td>
                        <td className="text-right py-1.5">
                          {v.oosCount > 0 ? (
                            <span className="font-mono text-red-600 dark:text-red-400 font-medium">{v.oosCount}</span>
                          ) : (
                            <span className="font-mono text-zinc-400">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-zinc-400 dark:text-zinc-500 text-xs py-4">
                No vehicle data
              </p>
            )}
          </div>
        </div>

        {/* Row 2: OOS Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* OOS by State - Horizontal stacked bar */}
          {oosBarData.length > 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2 text-center uppercase tracking-wider">
                OOS Breakdown by State
              </h4>
              <ResponsiveContainer width="100%" height={Math.max(oosBarData.length * 28, 120)}>
                <BarChart data={oosBarData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="state" tick={{ fontSize: 10, fontFamily: 'monospace' }} width={28} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(24,24,27,0.95)',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#fff'
                    }}
                    formatter={(value, name) => [value, name === 'oos' ? 'OOS' : 'Non-OOS']}
                    labelFormatter={(label) => STATE_NAMES[label] || label}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '10px' }}
                    formatter={(value) => value === 'oos' ? 'OOS' : 'Non-OOS'}
                  />
                  <Bar dataKey="oos" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="nonOos" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Violations With/Without OOS */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2 text-center uppercase tracking-wider">
              Violations: OOS vs Non-OOS
            </h4>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={oosBreakdown} margin={{ left: 8, right: 8, top: 8, bottom: 4 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(24,24,27,0.95)',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {oosBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-1">
              {oosBreakdown.map(b => (
                <div key={b.name} className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.fill }} />
                  {b.name}: <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{b.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViolationHeatMap;
