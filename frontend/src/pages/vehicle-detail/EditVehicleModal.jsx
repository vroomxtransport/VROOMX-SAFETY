import { FiTruck, FiFileText, FiSettings, FiCalendar } from 'react-icons/fi';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

const EditVehicleModal = ({ isOpen, onClose, formData, onChange, onSubmit, submitting }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Vehicle"
      icon={FiTruck}
      size="lg"
    >
      {formData && (
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Vehicle Identity Section */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-primary-100 dark:bg-zinc-800 flex items-center justify-center">
              <FiTruck className="w-3.5 h-3.5 text-primary-600 dark:text-zinc-300" />
            </div>
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Vehicle Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Unit Number *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.unitNumber}
                onChange={(e) => onChange({ ...formData, unitNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nickname</label>
              <input
                type="text"
                className="form-input"
                value={formData.nickname}
                onChange={(e) => onChange({ ...formData, nickname: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">VIN *</label>
              <input
                type="text"
                className="form-input font-mono"
                required
                value={formData.vin}
                onChange={(e) => onChange({ ...formData, vin: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Vehicle Type</label>
              <select
                value={formData.vehicleType}
                onChange={(e) => onChange({ ...formData, vehicleType: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="tractor">Tractor</option>
                <option value="trailer">Trailer</option>
                <option value="straight_truck">Straight Truck</option>
                <option value="bus">Bus</option>
                <option value="van">Van</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => onChange({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">In Maintenance</option>
                <option value="out_of_service">Out of Service</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Year</label>
              <input
                type="number"
                className="form-input"
                min="1900"
                max="2100"
                value={formData.year}
                onChange={(e) => onChange({ ...formData, year: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Make</label>
              <input
                type="text"
                className="form-input"
                value={formData.make}
                onChange={(e) => onChange({ ...formData, make: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Model</label>
              <input
                type="text"
                className="form-input"
                value={formData.model}
                onChange={(e) => onChange({ ...formData, model: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Color</label>
              <input
                type="text"
                className="form-input"
                value={formData.color}
                onChange={(e) => onChange({ ...formData, color: e.target.value })}
              />
            </div>
          </div>

          {/* License Plate Section */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center">
                <FiFileText className="w-3.5 h-3.5 text-accent-600 dark:text-accent-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">License & Registration</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">License Plate</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.licensePlate.number}
                  onChange={(e) => onChange({
                    ...formData,
                    licensePlate: { ...formData.licensePlate, number: e.target.value.toUpperCase() }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Plate State</label>
                <input
                  type="text"
                  className="form-input"
                  maxLength={2}
                  value={formData.licensePlate.state}
                  onChange={(e) => onChange({
                    ...formData,
                    licensePlate: { ...formData.licensePlate, state: e.target.value.toUpperCase() }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Cab Card Expiry</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.cabCardExpiry}
                  onChange={(e) => onChange({ ...formData, cabCardExpiry: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Annual Expiry</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.annualExpiry}
                  onChange={(e) => onChange({ ...formData, annualExpiry: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">IFTA Decal Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.iftaDecalNumber}
                  onChange={(e) => onChange({ ...formData, iftaDecalNumber: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Specs Section */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-success-100 dark:bg-success-500/20 flex items-center justify-center">
                <FiSettings className="w-3.5 h-3.5 text-success-600 dark:text-success-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Specifications</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">GVWR (lbs)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.gvwr}
                  onChange={(e) => onChange({ ...formData, gvwr: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Tire Size</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.tireSize}
                  onChange={(e) => onChange({ ...formData, tireSize: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Ownership</label>
                <select
                  value={formData.ownership}
                  onChange={(e) => onChange({ ...formData, ownership: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="owned">Owned</option>
                  <option value="leased">Leased</option>
                  <option value="rented">Rented</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Market Price</label>
                <input
                  type="number"
                  className="form-input"
                  step="0.01"
                  value={formData.marketPrice}
                  onChange={(e) => onChange({ ...formData, marketPrice: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Dates Section */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-warning-100 dark:bg-warning-500/20 flex items-center justify-center">
                <FiCalendar className="w-3.5 h-3.5 text-warning-600 dark:text-warning-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Fleet Dates</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Date Added to Fleet</label>
                <input
                  type="date"
                  value={formData.dateAddedToFleet}
                  onChange={(e) => onChange({ ...formData, dateAddedToFleet: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              {(formData.status === 'sold' || formData.status === 'inactive') && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Date Removed from Fleet</label>
                  <input
                    type="date"
                    value={formData.dateRemovedFromFleet}
                    onChange={(e) => onChange({ ...formData, dateRemovedFromFleet: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : 'Update Vehicle'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EditVehicleModal;
