import { FiTruck, FiUser } from 'react-icons/fi';

const OOSBar = ({ label, icon: Icon, rate, nationalAvg }) => {
  const hasData = rate !== null && rate !== undefined;
  const hasAvg = nationalAvg !== null && nationalAvg !== undefined;
  const isAboveAvg = hasData && hasAvg && rate > nationalAvg;

  const barColor = isAboveAvg ? 'bg-red-500' : 'bg-emerald-500';
  const textColor = isAboveAvg ? 'text-red-600' : 'text-emerald-600';

  // Scale: OOS rates are typically 0-50%, so use 50% as visual max
  const maxScale = 50;
  const barWidth = hasData ? Math.min((rate / maxScale) * 100, 100) : 0;
  const avgPosition = hasAvg ? Math.min((nationalAvg / maxScale) * 100, 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-700">{label}</span>
        </div>
        <span className={`text-sm font-bold ${hasData ? textColor : 'text-zinc-400'}`}>
          {hasData ? `${rate.toFixed(1)}%` : '—'}
        </span>
      </div>
      <div className="relative h-2.5 bg-zinc-100 rounded-full overflow-visible">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${barWidth}%` }}
        />
        {/* National average marker */}
        {hasAvg && (
          <div
            className="absolute top-[-3px] h-[16px]"
            style={{ left: `${avgPosition}%` }}
          >
            <div className="w-[2px] h-full bg-zinc-800" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <span>{isAboveAvg ? 'Above national average' : hasData ? 'Below national average' : ''}</span>
        {hasAvg && <span>Natl avg: {nationalAvg.toFixed(1)}%</span>}
      </div>
    </div>
  );
};

const OOSRatesPanel = ({ oosRates }) => {
  if (!oosRates) return null;

  const hasVehicle = oosRates.vehicle?.rate !== null && oosRates.vehicle?.rate !== undefined;
  const hasDriver = oosRates.driver?.rate !== null && oosRates.driver?.rate !== undefined;

  if (!hasVehicle && !hasDriver) return null;

  return (
    <div>
      <h4 className="text-xs font-semibold text-zinc-800 uppercase tracking-wider mb-3">
        Out-of-Service Rates
      </h4>
      <div className="space-y-4">
        {hasVehicle && (
          <OOSBar
            label="Vehicle OOS Rate"
            icon={FiTruck}
            rate={oosRates.vehicle.rate}
            nationalAvg={oosRates.vehicle.nationalAvg}
          />
        )}
        {hasDriver && (
          <OOSBar
            label="Driver OOS Rate"
            icon={FiUser}
            rate={oosRates.driver.rate}
            nationalAvg={oosRates.driver.nationalAvg}
          />
        )}
      </div>
      <p className="text-[9px] text-zinc-400 mt-2">
        Black line = national average. Lower is better.
      </p>
    </div>
  );
};

export default OOSRatesPanel;
