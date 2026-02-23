import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

const RecordInspectionModal = ({ isOpen, onClose, onSubmit, submitting }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Annual Inspection"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Inspection Date *</label>
            <input
              type="date"
              name="inspectionDate"
              className="form-input"
              required
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="form-label">Result *</label>
            <select name="result" className="form-select" required>
              <option value="pass">Pass</option>
              <option value="pass_with_defects">Pass with Defects</option>
              <option value="fail">Fail</option>
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Inspector Name *</label>
          <input type="text" name="inspectorName" className="form-input" required />
        </div>
        <div>
          <label className="form-label">Inspector Number</label>
          <input type="text" name="inspectorNumber" className="form-input" />
        </div>
        <div>
          <label className="form-label">Location</label>
          <input type="text" name="location" className="form-input" placeholder="Shop name or address" />
        </div>
        <div>
          <label className="form-label">Inspection Report (PDF)</label>
          <input type="file" name="document" className="form-input" accept=".pdf,.jpg,.jpeg,.png" />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <LoadingSpinner size="sm" /> : 'Save Inspection'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordInspectionModal;
