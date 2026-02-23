import { Link } from 'react-router-dom';
import { FiRefreshCw } from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const ComplianceTrendChart = ({ complianceHistory, complianceScore, syncing, onSyncNow }) => {
  // Use real compliance history data for trend chart
  const complianceTrendData = (() => {
    if (complianceHistory.length > 0) {
      // Use real historical data from API
      return complianceHistory.map((record, index) => ({
        day: index + 1,
        date: new Date(record.date || record.calculatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: record.overallScore || record.totalScore || 0
      }));
    }
    // Fallback: show current score as single point if no history
    return [{ day: 1, date: 'Today', score: complianceScore }];
  })();

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-[#1E3A5F] px-5 py-4 flex items-center justify-between">
        <h3 className="text-white font-semibold">
          COMPLIANCE TREND <span className="font-normal opacity-80">(Last 30 Days)</span>
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={onSyncNow}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync FMCSA'}
          </button>
          <Link to="/app/compliance" className="text-sm text-white/70 hover:text-white font-medium">
            Full Report
          </Link>
        </div>
      </div>
      <div className="p-3 sm:p-5 h-48 sm:h-56 lg:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={complianceTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={{ stroke: '#e5e7eb' }} axisLine={{ stroke: '#e5e7eb' }} />
            <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={{ stroke: '#e5e7eb' }} axisLine={{ stroke: '#e5e7eb' }} tickFormatter={(value) => `${value}%`} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-surface, #fff)', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              formatter={(value) => [`${value}%`, 'Overall Score']}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px' }} />
            <Line type="monotone" dataKey="score" name="Overall Score" stroke="#4A90D9" strokeWidth={2} dot={{ fill: '#4A90D9', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#4A90D9', strokeWidth: 2, fill: '#fff' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ComplianceTrendChart;
