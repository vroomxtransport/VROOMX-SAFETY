import { FiAlertTriangle } from 'react-icons/fi';
import Modal from '../Modal';
import LoadingSpinner from '../LoadingSpinner';
import { damageTypes, faultParties, statusOptions } from '../../data/claimOptions';

const ClaimForm = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSubmit,
  submitting,
  editMode,
  drivers,
  vehicles,
  initialFormData
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setFormData(initialFormData);
      }}
      title={editMode ? 'Edit Damage Claim' : 'New Damage Claim'}
      icon={FiAlertTriangle}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Incident Date & Claim Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Incident Date *</label>
            <input
              type="date"
              className="form-input"
              required
              value={formData.incidentDate}
              onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Claim Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="Auto-generated if empty"
              value={formData.claimNumber}
              onChange={(e) => setFormData({ ...formData, claimNumber: e.target.value })}
            />
          </div>
        </div>

        {/* Truck & Driver Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Assign to Truck</label>
            <select
              className="form-select"
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
            >
              <option value="">-- Select Truck --</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle._id} value={vehicle._id}>
                  Unit #{vehicle.unitNumber} - {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Assign to Driver</label>
            <select
              className="form-select"
              value={formData.driverId}
              onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
            >
              <option value="">-- Select Driver --</option>
              {drivers.map((driver) => (
                <option key={driver._id} value={driver._id}>
                  {driver.firstName} {driver.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Related Trip */}
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1.5">Related Trip (Optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Trip ID or reference"
            value={formData.tripId}
            onChange={(e) => setFormData({ ...formData, tripId: e.target.value })}
          />
        </div>

        {/* Damage Type & Fault Party */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Damage Type *</label>
            <select
              className="form-select"
              required
              value={formData.damageType}
              onChange={(e) => setFormData({ ...formData, damageType: e.target.value })}
            >
              {damageTypes.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Fault Party *</label>
            <select
              className="form-select"
              required
              value={formData.faultParty}
              onChange={(e) => setFormData({ ...formData, faultParty: e.target.value })}
            >
              {faultParties.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1.5">Status *</label>
          <select
            className="form-select"
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1.5">Description *</label>
          <textarea
            className="form-input"
            rows={3}
            required
            placeholder="Describe the damage incident..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Claim Amount ($) *</label>
            <input
              type="number"
              className="form-input font-mono"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.claimAmount}
              onChange={(e) => setFormData({ ...formData, claimAmount: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Settlement Amount ($)</label>
            <input
              type="number"
              className="form-input font-mono"
              min="0"
              step="0.01"
              placeholder="If settled"
              value={formData.settlementAmount}
              onChange={(e) => setFormData({ ...formData, settlementAmount: e.target.value })}
            />
          </div>
        </div>

        {/* Insurance & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Insurance Claim Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="Insurance reference #"
              value={formData.insuranceClaimNumber}
              onChange={(e) => setFormData({ ...formData, insuranceClaimNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Location of Incident</label>
            <input
              type="text"
              className="form-input"
              placeholder="Address or location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        </div>

        {/* Resolution Notes */}
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1.5">Resolution Notes</label>
          <textarea
            className="form-input"
            rows={2}
            placeholder="Notes about claim resolution..."
            value={formData.resolutionNotes}
            onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-primary-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              setFormData(initialFormData);
            }}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <LoadingSpinner size="sm" /> : (editMode ? 'Save Changes' : 'Save Claim')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ClaimForm;
