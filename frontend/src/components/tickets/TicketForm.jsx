import { FiFileText } from 'react-icons/fi';
import Modal from '../Modal';
import LoadingSpinner from '../LoadingSpinner';
import { ticketTypes, statusOptions, courtDecisionOptions, dataQOptions } from '../../data/ticketOptions';

const TicketForm = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSubmit,
  submitting,
  editMode,
  drivers,
  initialFormData
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setFormData(initialFormData);
      }}
      title={editMode ? 'Edit Ticket' : 'New Ticket'}
      icon={FiFileText}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Driver & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Driver *</label>
            <select
              className="form-select"
              required
              value={formData.driverId}
              onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
            >
              <option value="">Select Driver</option>
              {drivers.map((driver) => (
                <option key={driver._id} value={driver._id}>
                  {driver.firstName} {driver.lastName}
                </option>
              ))}
            </select>
          </div>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Ticket Date *</label>
            <input
              type="date"
              className="form-input"
              required
              value={formData.ticketDate}
              onChange={(e) => setFormData({ ...formData, ticketDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Court Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.courtDate}
              onChange={(e) => setFormData({ ...formData, courtDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Ticket Type</label>
            <select
              className="form-select"
              value={formData.ticketType}
              onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
            >
              {ticketTypes.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1.5">Ticket Description *</label>
          <textarea
            className="form-input"
            rows={2}
            required
            placeholder="e.g., Speeding 15mph over limit, Logbook violation..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Attorney Info */}
        <div className="border-t border-primary-100 pt-4">
          <label className="block text-sm font-medium text-primary-700 mb-1.5">Attorney Info</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              className="form-input"
              placeholder="Attorney name"
              value={formData.attorney.name}
              onChange={(e) => setFormData({ ...formData, attorney: { ...formData.attorney, name: e.target.value } })}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Phone"
              value={formData.attorney.phone}
              onChange={(e) => setFormData({ ...formData, attorney: { ...formData.attorney, phone: e.target.value } })}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Firm"
              value={formData.attorney.firm}
              onChange={(e) => setFormData({ ...formData, attorney: { ...formData.attorney, firm: e.target.value } })}
            />
          </div>
        </div>

        {/* Decisions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Court Decision</label>
            <select
              className="form-select"
              value={formData.courtDecision}
              onChange={(e) => setFormData({ ...formData, courtDecision: e.target.value })}
            >
              {courtDecisionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">DataQ Decision</label>
            <select
              className="form-select"
              value={formData.dataQDecision}
              onChange={(e) => setFormData({ ...formData, dataQDecision: e.target.value })}
            >
              {dataQOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fine & Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Fine Amount ($)</label>
            <input
              type="number"
              className="form-input font-mono"
              min="0"
              step="0.01"
              value={formData.fineAmount}
              onChange={(e) => setFormData({ ...formData, fineAmount: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Points</label>
            <input
              type="number"
              className="form-input font-mono"
              min="0"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1.5">Notes</label>
          <textarea
            className="form-input"
            rows={2}
            placeholder="Additional notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

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
            {submitting ? <LoadingSpinner size="sm" /> : (editMode ? 'Save Changes' : 'Create Ticket')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TicketForm;
