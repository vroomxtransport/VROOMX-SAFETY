import { FiAlertCircle } from 'react-icons/fi';

const StatCard = ({ value, label, colorClass }) => (
  <div className={`p-3 rounded-lg text-center ${colorClass}`}>
    <p className="text-xl font-bold">{value ?? 0}</p>
    <p className="text-[10px] text-zinc-500 font-medium">{label}</p>
  </div>
);

const CrashHistoryPanel = ({ crashes, crashDetail }) => {
  const totalFromDetail = crashDetail?.total;
  const totalFromCrashes = crashes?.last24Months;
  const total = totalFromDetail ?? totalFromCrashes ?? 0;

  // If we have no crash data at all, don't render
  if (total === 0 && !crashDetail && (!crashes || crashes.last24Months === 0)) return null;

  const hasBreakdown = crashDetail && (
    crashDetail.fatal !== undefined ||
    crashDetail.injury !== undefined ||
    crashDetail.tow !== undefined
  );

  return (
    <div>
      <h4 className="text-xs font-semibold text-zinc-800 uppercase tracking-wider mb-3">
        Crash History
        <span className="text-[10px] text-zinc-400 font-normal ml-1.5">24 months</span>
      </h4>

      {hasBreakdown ? (
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            value={crashDetail.total ?? total}
            label="Total"
            colorClass="bg-zinc-50"
          />
          <StatCard
            value={crashDetail.fatal}
            label="Fatal"
            colorClass={crashDetail.fatal > 0 ? 'bg-red-50 text-red-600' : 'bg-zinc-50'}
          />
          <StatCard
            value={crashDetail.injury}
            label="Injury"
            colorClass={crashDetail.injury > 0 ? 'bg-orange-50 text-orange-600' : 'bg-zinc-50'}
          />
          <StatCard
            value={crashDetail.tow}
            label="Tow-Away"
            colorClass={crashDetail.tow > 0 ? 'bg-amber-50 text-amber-600' : 'bg-zinc-50'}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50">
          <FiAlertCircle className="w-5 h-5 text-zinc-400" />
          <div>
            <p className="text-lg font-bold text-zinc-800">{total}</p>
            <p className="text-[10px] text-zinc-500">Reportable crashes (24 months)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrashHistoryPanel;
