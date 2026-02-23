import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

const AddMaintenanceModal = ({ isOpen, onClose, formData, onChange, onSubmit, submitting }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Maintenance Record"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Date *</label>
            <input
              type="date"
              className="form-input"
              required
              value={formData.date}
              onChange={(e) => onChange({ ...formData, date: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Type *</label>
            <select
              className="form-select"
              required
              value={formData.maintenanceType}
              onChange={(e) => onChange({ ...formData, maintenanceType: e.target.value })}
            >
              <option value="preventive">Preventive</option>
              <option value="repair">Repair</option>
              <option value="inspection">Inspection</option>
              <option value="recall">Recall</option>
              <option value="breakdown">Breakdown</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={formData.category}
              onChange={(e) => onChange({ ...formData, category: e.target.value })}
            >
              <option value="brakes">Brakes</option>
              <option value="tires">Tires</option>
              <option value="engine">Engine</option>
              <option value="transmission">Transmission</option>
              <option value="electrical">Electrical</option>
              <option value="lights">Lights</option>
              <option value="suspension">Suspension</option>
              <option value="steering">Steering</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="form-label">Severity</label>
            <select
              className="form-select"
              value={formData.severity}
              onChange={(e) => onChange({ ...formData, severity: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Description *</label>
          <textarea
            className="form-input"
            rows={3}
            required
            placeholder="Describe the maintenance performed..."
            value={formData.description}
            onChange={(e) => onChange({ ...formData, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Odometer</label>
            <input
              type="number"
              className="form-input"
              placeholder="Current mileage"
              value={formData.odometer}
              onChange={(e) => onChange({ ...formData, odometer: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Total Cost</label>
            <input
              type="number"
              className="form-input"
              placeholder="0.00"
              step="0.01"
              value={formData.totalCost}
              onChange={(e) => onChange({ ...formData, totalCost: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <LoadingSpinner size="sm" /> : 'Add Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMaintenanceModal;
