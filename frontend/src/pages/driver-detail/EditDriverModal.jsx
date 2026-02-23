import { FiUsers, FiCreditCard, FiCalendar } from 'react-icons/fi';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

const EditDriverModal = ({ isOpen, onClose, formData, onChange, onNestedChange, onSubmit, submitting }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Driver"
      icon={FiUsers}
      size="lg"
    >
      {formData && (
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Personal Info Section */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-primary-100 dark:bg-zinc-800 flex items-center justify-center">
              <FiUsers className="w-3.5 h-3.5 text-primary-600 dark:text-zinc-300" />
            </div>
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Personal Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">First Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.firstName}
                onChange={(e) => onChange({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Last Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.lastName}
                onChange={(e) => onChange({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Date of Birth *</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.dateOfBirth}
                onChange={(e) => onChange({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => onChange({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Phone</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => onChange({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Driver Type</label>
              <select
                value={formData.driverType}
                onChange={(e) => onChange({ ...formData, driverType: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-cta focus:border-cta"
              >
                <option value="company_driver">Company Driver</option>
                <option value="owner_operator">Owner-Operator</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Hire Date *</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.hireDate}
                onChange={(e) => onChange({ ...formData, hireDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => onChange({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-cta focus:border-cta"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            {/* Address Section */}
            <div className="col-span-1 md:col-span-2 border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-2">
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-3">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Street</label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address?.street || ''}
                    onChange={onNestedChange}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address?.city || ''}
                    onChange={onNestedChange}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">State</label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address?.state || ''}
                      onChange={onNestedChange}
                      maxLength={2}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">ZIP</label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address?.zipCode || ''}
                      onChange={onNestedChange}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CDL Section */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center">
                <FiCreditCard className="w-3.5 h-3.5 text-accent-600 dark:text-accent-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">CDL Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">CDL Number *</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  required
                  value={formData.cdl.number}
                  onChange={(e) => onChange({
                    ...formData,
                    cdl: { ...formData.cdl, number: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">State *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  maxLength={2}
                  placeholder="TX"
                  value={formData.cdl.state}
                  onChange={(e) => onChange({
                    ...formData,
                    cdl: { ...formData.cdl, state: e.target.value.toUpperCase() }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Class *</label>
                <select
                  className="form-select"
                  required
                  value={formData.cdl.class}
                  onChange={(e) => onChange({
                    ...formData,
                    cdl: { ...formData.cdl, class: e.target.value }
                  })}
                >
                  <option value="A">Class A</option>
                  <option value="B">Class B</option>
                  <option value="C">Class C</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">CDL Expiry Date *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={formData.cdl.expiryDate}
                  onChange={(e) => onChange({
                    ...formData,
                    cdl: { ...formData.cdl, expiryDate: e.target.value }
                  })}
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">CDL Endorsements</label>
                <div className="flex flex-wrap gap-2">
                  {['H', 'N', 'P', 'S', 'T', 'X'].map(end => (
                    <label key={end} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.cdl?.endorsements?.includes(end) || false}
                        onChange={(e) => {
                          const current = formData.cdl?.endorsements || [];
                          const updated = e.target.checked ? [...current, end] : current.filter(x => x !== end);
                          onChange({ ...formData, cdl: { ...formData.cdl, endorsements: updated } });
                        }}
                        className="rounded text-cta focus:ring-cta"
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-200">{end}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">CDL Restrictions</label>
                <input
                  type="text"
                  value={formData.cdl?.restrictions?.join(', ') || ''}
                  onChange={(e) => onChange({
                    ...formData,
                    cdl: { ...formData.cdl, restrictions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                  })}
                  placeholder="e.g. L, Z (comma-separated)"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Medical Card Section */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-success-100 dark:bg-success-500/20 flex items-center justify-center">
                <FiCalendar className="w-3.5 h-3.5 text-success-600 dark:text-success-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Medical Card</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Medical Card Expiry Date *</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.medicalCard.expiryDate}
                onChange={(e) => onChange({
                  ...formData,
                  medicalCard: { ...formData.medicalCard, expiryDate: e.target.value }
                })}
              />
            </div>
          </div>

          {/* Compliance Dates Section */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-warning-100 dark:bg-warning-500/20 flex items-center justify-center">
                <FiCalendar className="w-3.5 h-3.5 text-warning-600 dark:text-warning-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Compliance Dates</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">MVR Expiry Date</label>
                <input
                  type="date"
                  value={formData.mvrExpiryDate || ''}
                  onChange={(e) => onChange({ ...formData, mvrExpiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Clearinghouse Exp.</label>
                <input
                  type="date"
                  value={formData.clearinghouseExpiry || ''}
                  onChange={(e) => onChange({ ...formData, clearinghouseExpiry: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              {formData.status === 'terminated' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Termination Date</label>
                  <input
                    type="date"
                    value={formData.terminationDate || ''}
                    onChange={(e) => onChange({ ...formData, terminationDate: e.target.value })}
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
              {submitting ? <LoadingSpinner size="sm" /> : 'Update Driver'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EditDriverModal;
