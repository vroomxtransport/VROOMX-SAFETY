import {
  FiCheckCircle, FiAlertTriangle, FiMapPin, FiPhone, FiTruck,
  FiUsers, FiShield, FiActivity
} from 'react-icons/fi';

const CarrierProfileHeader = ({ carrier, riskLevel, dataSource }) => {
  if (!carrier) return null;

  const statusColor = carrier.operatingStatus === 'ACTIVE'
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : 'text-red-600 bg-red-50 border-red-200';

  const riskConfig = {
    HIGH: { bg: 'bg-red-500', text: 'High risk of FMCSA intervention' },
    MODERATE: { bg: 'bg-amber-500', text: 'Monitor closely — near intervention thresholds' },
    LOW: { bg: 'bg-emerald-500', text: 'Below intervention thresholds' }
  };

  const risk = riskConfig[riskLevel] || riskConfig.MODERATE;

  const addressStr = [
    carrier.address?.street,
    [carrier.address?.city, carrier.address?.state].filter(Boolean).join(', '),
    carrier.address?.zip
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-3">
      {/* Name + Status Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-primary-500 leading-tight truncate">
            {carrier.legalName}
          </h3>
          {carrier.dbaName && (
            <p className="text-xs text-zinc-500 truncate">DBA: {carrier.dbaName}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusColor}`}>
            {carrier.operatingStatus === 'ACTIVE' ? <FiCheckCircle className="w-3 h-3" /> : <FiAlertTriangle className="w-3 h-3" />}
            {carrier.operatingStatus || '—'}
          </span>
          {dataSource === 'FMCSA_SAFER' ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[8px] font-medium text-emerald-600">
              <FiCheckCircle className="w-2.5 h-2.5" />
              Live FMCSA
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[8px] font-medium text-amber-600">
              Demo Data
            </span>
          )}
        </div>
      </div>

      {/* ID Row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-zinc-600">
        <span>DOT# {carrier.dotNumber}</span>
        {carrier.mcNumber && (
          <>
            <span className="text-zinc-300">|</span>
            <span>MC# {carrier.mcNumber}</span>
          </>
        )}
        {carrier.entityType && (
          <>
            <span className="text-zinc-300">|</span>
            <span>{carrier.entityType}</span>
          </>
        )}
      </div>

      {/* Risk Level Badge */}
      {riskLevel && (
        <div className={`px-3 py-2 rounded-lg text-center ${risk.bg}`}>
          <span className="text-[10px] text-white/80 uppercase tracking-wider">Risk Level</span>
          <p className="text-base font-bold text-white">{riskLevel} RISK</p>
          <p className="text-[10px] text-white/70">{risk.text}</p>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {addressStr && (
          <div className="flex items-start gap-1.5 col-span-2 sm:col-span-3">
            <FiMapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
            <span className="text-zinc-600">{addressStr}</span>
          </div>
        )}
        {carrier.phone && (
          <div className="flex items-center gap-1.5">
            <FiPhone className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span className="text-zinc-600">{carrier.phone}</span>
          </div>
        )}
        {carrier.fleetSize && (
          <div className="flex items-center gap-1.5">
            <FiTruck className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span className="text-zinc-600">{carrier.fleetSize.powerUnits ?? '—'} units</span>
          </div>
        )}
        {carrier.fleetSize && (
          <div className="flex items-center gap-1.5">
            <FiUsers className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span className="text-zinc-600">{carrier.fleetSize.drivers ?? '—'} drivers</span>
          </div>
        )}
        {carrier.safetyRating && carrier.safetyRating !== 'None' && (
          <div className="flex items-center gap-1.5">
            <FiShield className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span className="text-zinc-600">Rating: {carrier.safetyRating}</span>
          </div>
        )}
        {carrier.operationType && (
          <div className="flex items-center gap-1.5">
            <FiActivity className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span className="text-zinc-600 truncate">{carrier.operationType}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarrierProfileHeader;
