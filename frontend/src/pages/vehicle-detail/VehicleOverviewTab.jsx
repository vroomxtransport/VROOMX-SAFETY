import {
  FiTruck, FiCalendar, FiUser, FiMapPin, FiRefreshCw,
  FiDroplet, FiActivity
} from 'react-icons/fi';
import { formatDate, formatCurrency, daysUntilExpiry } from '../../utils/helpers';

const VehicleOverviewTab = ({ vehicle, refreshingTelematics, onRefreshTelematics }) => {
  const cabCardDays = daysUntilExpiry(vehicle.cabCardExpiry);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Vehicle Information Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold flex items-center gap-2">
            <FiTruck className="w-4 h-4 text-primary-500" />
            Vehicle Information
          </h3>
        </div>
        <div className="card-body space-y-4">
          {/* Identity Section */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Unit ID</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {vehicle.unitNumber}{vehicle.nickname ? ` (${vehicle.nickname})` : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">VIN</span>
              <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">{vehicle.vin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Year / Make / Model</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {vehicle.year || '\u2014'} {vehicle.make || ''} {vehicle.model || ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">License Plate</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {vehicle.licensePlate?.number
                  ? `${vehicle.licensePlate.number} (${vehicle.licensePlate.state || ''})`
                  : '\u2014'}
              </span>
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800" />

          {/* Specs Section */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Color</span>
              <span className="text-zinc-900 dark:text-zinc-100">{vehicle.color || '\u2014'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">GVWR</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {vehicle.gvwr ? `${Number(vehicle.gvwr).toLocaleString()} lbs` : '\u2014'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Tire Size</span>
              <span className="text-zinc-900 dark:text-zinc-100">{vehicle.tireSize || '\u2014'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Ownership</span>
              <span className="capitalize text-zinc-900 dark:text-zinc-100">{vehicle.ownership || '\u2014'}</span>
            </div>
            {vehicle.marketPrice && (
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Market Price</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(vehicle.marketPrice)}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800" />

          {/* Assignment Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-600 dark:text-zinc-400">Assigned Driver</span>
              {vehicle.assignedDriver ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-accent-100 dark:bg-accent-500/20 rounded-full flex items-center justify-center">
                    <FiUser className="w-3 h-3 text-accent-600 dark:text-accent-400" />
                  </div>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {typeof vehicle.assignedDriver === 'object'
                      ? `${vehicle.assignedDriver.firstName} ${vehicle.assignedDriver.lastName}`
                      : 'Assigned'}
                  </span>
                </div>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500">Unassigned</span>
              )}
            </div>
            {vehicle.currentOdometer?.reading && (
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Current Odometer</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {vehicle.currentOdometer.reading.toLocaleString()} mi
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compliance & Dates Card */}
      <div className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-primary-500" />
              Compliance & Dates
            </h3>
          </div>
          <div className="card-body space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Added to Fleet</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {vehicle.dateAddedToFleet ? formatDate(vehicle.dateAddedToFleet) : '\u2014'}
              </span>
            </div>
            {vehicle.dateRemovedFromFleet && (
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Removed from Fleet</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {formatDate(vehicle.dateRemovedFromFleet)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Cab Card Expiry</span>
              <span className={`font-medium ${cabCardDays !== null && cabCardDays < 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                {vehicle.cabCardExpiry ? formatDate(vehicle.cabCardExpiry) : '\u2014'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Annual Expiry</span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {vehicle.annualExpiry ? formatDate(vehicle.annualExpiry) : '\u2014'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">IFTA Decal #</span>
              <span className="text-zinc-900 dark:text-zinc-100">{vehicle.iftaDecalNumber || '\u2014'}</span>
            </div>
          </div>
        </div>

        {/* Samsara Telematics Card */}
        {vehicle.samsaraId && (
          <div className="card border-l-4 border-l-orange-500">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/images/integrations/samsara.svg" alt="Samsara" className="w-5 h-5" />
                <h3 className="font-semibold">Live Telematics</h3>
              </div>
              <button
                onClick={onRefreshTelematics}
                disabled={refreshingTelematics}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                title="Refresh telematics"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshingTelematics ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="card-body">
              {vehicle.samsaraTelematics ? (
                <div className="space-y-4">
                  {vehicle.samsaraTelematics.currentMileage && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <FiActivity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-zinc-600 dark:text-zinc-400">Mileage</span>
                      </div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {vehicle.samsaraTelematics.currentMileage.toLocaleString()} mi
                      </span>
                    </div>
                  )}

                  {vehicle.samsaraTelematics.location && (
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                          <FiMapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-zinc-600 dark:text-zinc-400">Location</span>
                      </div>
                      <div className="text-right max-w-[180px]">
                        {vehicle.samsaraTelematics.location.address ? (
                          <a
                            href={`https://www.google.com/maps?q=${vehicle.samsaraTelematics.location.latitude},${vehicle.samsaraTelematics.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-accent-600 hover:underline"
                          >
                            {vehicle.samsaraTelematics.location.address}
                          </a>
                        ) : (
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {vehicle.samsaraTelematics.location.latitude?.toFixed(4)}, {vehicle.samsaraTelematics.location.longitude?.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {vehicle.samsaraTelematics.fuelPercent !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center">
                            <FiDroplet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <span className="text-zinc-600 dark:text-zinc-400">Fuel</span>
                        </div>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {vehicle.samsaraTelematics.fuelPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            vehicle.samsaraTelematics.fuelPercent > 50 ? 'bg-green-500' :
                            vehicle.samsaraTelematics.fuelPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${vehicle.samsaraTelematics.fuelPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {vehicle.samsaraTelematics.lastUpdated && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      Updated: {new Date(vehicle.samsaraTelematics.lastUpdated).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No telematics data yet</p>
                  <button
                    onClick={onRefreshTelematics}
                    disabled={refreshingTelematics}
                    className="mt-2 text-accent-600 hover:underline text-sm"
                  >
                    {refreshingTelematics ? 'Loading...' : 'Fetch from Samsara'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleOverviewTab;
