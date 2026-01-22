import { FiBriefcase } from 'react-icons/fi';
import Modal from '../Modal';
import LoadingSpinner from '../LoadingSpinner';

const AddCompanyModal = ({ isOpen, onClose, newCompanyForm, setNewCompanyForm, handleCreateCompany, loading }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Company"
      icon={FiBriefcase}
    >
      <form onSubmit={handleCreateCompany} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Company Name *</label>
          <input
            type="text"
            className="form-input"
            required
            value={newCompanyForm.name}
            onChange={(e) => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
            placeholder="ABC Trucking LLC"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">DOT Number *</label>
            <input
              type="text"
              className="form-input font-mono"
              required
              value={newCompanyForm.dotNumber}
              onChange={(e) => setNewCompanyForm({ ...newCompanyForm, dotNumber: e.target.value })}
              placeholder="1234567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">MC Number</label>
            <input
              type="text"
              className="form-input font-mono"
              value={newCompanyForm.mcNumber}
              onChange={(e) => setNewCompanyForm({ ...newCompanyForm, mcNumber: e.target.value })}
              placeholder="MC-123456"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Phone</label>
          <input
            type="tel"
            className="form-input"
            value={newCompanyForm.phone}
            onChange={(e) => setNewCompanyForm({ ...newCompanyForm, phone: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Street Address</label>
          <input
            type="text"
            className="form-input"
            value={newCompanyForm.address.street}
            onChange={(e) => setNewCompanyForm({
              ...newCompanyForm,
              address: { ...newCompanyForm.address, street: e.target.value }
            })}
            placeholder="123 Main St"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">City</label>
            <input
              type="text"
              className="form-input"
              value={newCompanyForm.address.city}
              onChange={(e) => setNewCompanyForm({
                ...newCompanyForm,
                address: { ...newCompanyForm.address, city: e.target.value }
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">State</label>
            <input
              type="text"
              className="form-input"
              maxLength={2}
              value={newCompanyForm.address.state}
              onChange={(e) => setNewCompanyForm({
                ...newCompanyForm,
                address: { ...newCompanyForm.address, state: e.target.value.toUpperCase() }
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">ZIP</label>
            <input
              type="text"
              className="form-input"
              value={newCompanyForm.address.zip}
              onChange={(e) => setNewCompanyForm({
                ...newCompanyForm,
                address: { ...newCompanyForm.address, zip: e.target.value }
              })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Create Company'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddCompanyModal;
