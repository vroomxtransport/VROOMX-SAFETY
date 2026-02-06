import { useState, useEffect, useCallback } from 'react';
import { FiBriefcase, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import Modal from '../Modal';
import LoadingSpinner from '../LoadingSpinner';
import { fmcsaAPI } from '../../utils/api';

const AddCompanyModal = ({ isOpen, onClose, newCompanyForm, setNewCompanyForm, handleCreateCompany, loading }) => {
  const [dotLookupStatus, setDotLookupStatus] = useState('idle'); // idle, loading, verified, not_found, error

  // Debounced DOT lookup
  const lookupDOT = useCallback(async (dotNumber) => {
    const cleaned = dotNumber.replace(/[^0-9]/g, '');

    if (!cleaned || cleaned.length < 5) {
      setDotLookupStatus('idle');
      return;
    }

    setDotLookupStatus('loading');

    try {
      const response = await fmcsaAPI.lookup(cleaned);

      if (response.data.success && response.data.carrier) {
        const carrier = response.data.carrier;
        setDotLookupStatus('verified');

        // Auto-populate form fields from FMCSA data
        setNewCompanyForm(prev => ({
          ...prev,
          name: carrier.legalName || prev.name,
          mcNumber: carrier.mcNumber || prev.mcNumber,
          phone: carrier.phone || prev.phone,
          address: {
            street: carrier.address?.street || prev.address.street,
            city: carrier.address?.city || prev.address.city,
            state: carrier.address?.state || prev.address.state,
            zip: carrier.address?.zip || prev.address.zip
          }
        }));
      } else {
        setDotLookupStatus('not_found');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setDotLookupStatus('not_found');
      } else {
        setDotLookupStatus('error');
      }
    }
  }, [setNewCompanyForm]);

  // Debounce DOT lookup (500ms after typing stops)
  useEffect(() => {
    const cleaned = newCompanyForm.dotNumber.replace(/[^0-9]/g, '');

    if (cleaned.length >= 5 && cleaned.length <= 8) {
      const timer = setTimeout(() => {
        lookupDOT(newCompanyForm.dotNumber);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDotLookupStatus('idle');
    }
  }, [newCompanyForm.dotNumber, lookupDOT]);

  // Reset lookup status when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDotLookupStatus('idle');
    }
  }, [isOpen]);

  // DOT field status indicator
  const getDotStatusIndicator = () => {
    switch (dotLookupStatus) {
      case 'loading':
        return (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <FiLoader className="w-4 h-4 text-accent-500 animate-spin" />
            <span className="text-xs text-zinc-400">Verifying...</span>
          </div>
        );
      case 'verified':
        return (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <FiCheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600 font-medium">Verified</span>
          </div>
        );
      case 'not_found':
        return (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <FiAlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-amber-600">Not found</span>
          </div>
        );
      case 'error':
        return (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <FiAlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-600">Error</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Company"
      icon={FiBriefcase}
    >
      <form onSubmit={handleCreateCompany} className="space-y-4">
        {/* DOT Number first - triggers auto-populate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              DOT Number *
              {dotLookupStatus === 'verified' && (
                <span className="ml-2 text-xs text-green-600 font-normal">Auto-fills company info</span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                className={`form-input font-mono pr-28 ${
                  dotLookupStatus === 'verified'
                    ? 'border-green-400 focus:border-green-500 focus:ring-green-500/20'
                    : dotLookupStatus === 'not_found'
                    ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-500/20'
                    : ''
                }`}
                required
                value={newCompanyForm.dotNumber}
                onChange={(e) => setNewCompanyForm({ ...newCompanyForm, dotNumber: e.target.value })}
                placeholder="1234567"
              />
              {getDotStatusIndicator()}
            </div>
            {dotLookupStatus === 'not_found' && (
              <p className="mt-1 text-xs text-amber-600">
                Carrier not found in FMCSA. You can still enter info manually.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">MC Number</label>
            <input
              type="text"
              className={`form-input font-mono ${
                dotLookupStatus === 'verified' && newCompanyForm.mcNumber ? 'bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20' : ''
              }`}
              value={newCompanyForm.mcNumber}
              onChange={(e) => setNewCompanyForm({ ...newCompanyForm, mcNumber: e.target.value })}
              placeholder="MC-123456"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Company Name *
            {dotLookupStatus === 'verified' && newCompanyForm.name && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600 font-normal">
                <FiCheckCircle className="w-3 h-3" />
                From FMCSA
              </span>
            )}
          </label>
          <input
            type="text"
            className={`form-input ${
              dotLookupStatus === 'verified' && newCompanyForm.name ? 'bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20' : ''
            }`}
            required
            value={newCompanyForm.name}
            onChange={(e) => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
            placeholder="ABC Trucking LLC"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Phone</label>
          <input
            type="tel"
            className={`form-input ${
              dotLookupStatus === 'verified' && newCompanyForm.phone ? 'bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20' : ''
            }`}
            value={newCompanyForm.phone}
            onChange={(e) => setNewCompanyForm({ ...newCompanyForm, phone: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Street Address</label>
          <input
            type="text"
            className={`form-input ${
              dotLookupStatus === 'verified' && newCompanyForm.address.street ? 'bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20' : ''
            }`}
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
              className={`form-input ${
                dotLookupStatus === 'verified' && newCompanyForm.address.city ? 'bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20' : ''
              }`}
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
              className={`form-input ${
                dotLookupStatus === 'verified' && newCompanyForm.address.state ? 'bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20' : ''
              }`}
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
