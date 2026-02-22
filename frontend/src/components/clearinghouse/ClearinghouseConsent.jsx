import { useState, useEffect, useRef } from 'react';
import { clearinghouseAPI } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiFileText, FiCheckCircle, FiAlertCircle, FiSearch, FiUpload, FiX
} from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';

const ClearinghouseConsent = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'missing'
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Consent upload modal
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [consentForm, setConsentForm] = useState({
    consentDate: new Date().toISOString().split('T')[0],
    consentMethod: 'electronic'
  });
  const [consentFile, setConsentFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDrivers();
  }, [search]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search) params.search = search;
      const res = await clearinghouseAPI.getDrivers(params);
      setDrivers(res.data.drivers);
    } catch (err) {
      toast.error('Failed to load driver data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const openConsentModal = (driver) => {
    setSelectedDriver(driver);
    setConsentForm({
      consentDate: new Date().toISOString().split('T')[0],
      consentMethod: 'electronic'
    });
    setConsentFile(null);
    setShowConsentModal(true);
  };

  const handleConsentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDriver) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('driverId', selectedDriver._id);
      formData.append('consentDate', consentForm.consentDate);
      formData.append('consentMethod', consentForm.consentMethod);
      if (consentFile) formData.append('document', consentFile);

      await clearinghouseAPI.uploadConsent(formData);
      toast.success('Consent recorded successfully');
      setShowConsentModal(false);
      setSelectedDriver(null);
      setConsentFile(null);
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record consent');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDrivers = filter === 'missing'
    ? drivers.filter(d => !d.clearinghouse?.consentDate)
    : drivers;

  const consentCount = drivers.filter(d => d.clearinghouse?.consentDate).length;
  const missingCount = drivers.length - consentCount;

  if (loading) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
              <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 font-mono">{consentCount}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Consent On File</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              missingCount > 0
                ? 'bg-amber-100 dark:bg-amber-500/20'
                : 'bg-green-100 dark:bg-green-500/20'
            }`}>
              <FiAlertCircle className={`w-5 h-5 ${
                missingCount > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-green-600 dark:text-green-400'
              }`} />
            </div>
            <div>
              <p className={`text-xl font-bold font-mono ${
                missingCount > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>{missingCount}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Missing Consent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search drivers..."
              className="form-input pl-10 w-full"
            />
          </div>
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            All ({drivers.length})
          </button>
          <button
            onClick={() => setFilter('missing')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === 'missing'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Missing ({missingCount})
          </button>
        </div>
      </div>

      {/* Driver Consent Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
        {filteredDrivers.length === 0 ? (
          <div className="p-8 text-center">
            <FiFileText className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400">No drivers match your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Driver</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Employee ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Consent Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Consent Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Last Query</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Query Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredDrivers.map(d => {
                  const hasConsent = !!d.clearinghouse?.consentDate;
                  return (
                    <tr key={d._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white">
                        {d.firstName} {d.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {d.employeeId || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {hasConsent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                            <FiCheckCircle className="w-3 h-3" /> On File
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                            <FiAlertCircle className="w-3 h-3" /> Missing
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {d.clearinghouse?.consentDate ? formatDate(d.clearinghouse.consentDate) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {d.clearinghouse?.lastQueryDate ? formatDate(d.clearinghouse.lastQueryDate) : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          d.complianceStatus?.clearinghouseStatus === 'current'
                            ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                            : d.complianceStatus?.clearinghouseStatus === 'due'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                              : d.complianceStatus?.clearinghouseStatus === 'overdue'
                                ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                        }`}>
                          {d.complianceStatus?.clearinghouseStatus || 'missing'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openConsentModal(d)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium text-white bg-accent-500 hover:bg-accent-600 transition-colors inline-flex items-center gap-1"
                        >
                          <FiUpload className="w-3 h-3" />
                          {hasConsent ? 'Update' : 'Upload Consent'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
        <FiFileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Driver consent is required before running Clearinghouse queries. Full queries (pre-employment) require specific written consent.
          Limited queries (annual) require general consent that can be obtained at the time of hire.
          Consent records are automatically tracked when recording queries with consent information.
        </p>
      </div>

      {/* Upload Consent Modal */}
      <Modal
        isOpen={showConsentModal}
        onClose={() => { setShowConsentModal(false); setSelectedDriver(null); setConsentFile(null); }}
        title="Record Driver Consent"
      >
        {selectedDriver && (
          <form onSubmit={handleConsentSubmit} className="space-y-4">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                {selectedDriver.firstName} {selectedDriver.lastName}
              </p>
              {selectedDriver.employeeId && (
                <p className="text-xs text-zinc-500 mt-0.5">Employee ID: {selectedDriver.employeeId}</p>
              )}
            </div>

            <div>
              <label className="form-label">Consent Date *</label>
              <input
                type="date"
                required
                value={consentForm.consentDate}
                onChange={(e) => setConsentForm({ ...consentForm, consentDate: e.target.value })}
                className="form-input w-full"
              />
            </div>

            <div>
              <label className="form-label">Consent Method *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="consentMethod"
                    value="electronic"
                    checked={consentForm.consentMethod === 'electronic'}
                    onChange={(e) => setConsentForm({ ...consentForm, consentMethod: e.target.value })}
                    className="text-accent-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Electronic</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="consentMethod"
                    value="paper"
                    checked={consentForm.consentMethod === 'paper'}
                    onChange={(e) => setConsentForm({ ...consentForm, consentMethod: e.target.value })}
                    className="text-accent-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Paper</span>
                </label>
              </div>
            </div>

            <div>
              <label className="form-label">Consent Document (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setConsentFile(e.target.files[0] || null)}
                className="hidden"
              />
              {consentFile ? (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                  <FiFileText className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate flex-1">{consentFile.name}</span>
                  <button type="button" onClick={() => { setConsentFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                    <FiX className="w-4 h-4 text-zinc-400 hover:text-red-500" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg text-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <FiUpload className="w-5 h-5 text-zinc-400 mx-auto mb-1" />
                  <p className="text-sm text-zinc-500">Click to select file</p>
                  <p className="text-xs text-zinc-400 mt-0.5">PDF, JPG, PNG, DOC up to 10MB</p>
                </button>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <button type="button" onClick={() => { setShowConsentModal(false); setSelectedDriver(null); }} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <LoadingSpinner size="sm" /> : 'Record Consent'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ClearinghouseConsent;
