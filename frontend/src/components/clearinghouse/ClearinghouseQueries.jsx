import { useState, useEffect, useRef } from 'react';
import { clearinghouseAPI } from '../../utils/api';
import { formatDate, getFileViewUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiPlus, FiClock, FiSearch, FiCheckCircle, FiAlertTriangle, FiList,
  FiUpload, FiFile, FiDownload
} from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';

const STATUS_BADGES = {
  current: { label: 'Current', className: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' },
  due: { label: 'Due Soon', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
  missing: { label: 'No Query', className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300' }
};

const INITIAL_FORM = {
  driverId: '',
  queryType: 'limited',
  queryDate: new Date().toISOString().split('T')[0],
  queryPurpose: 'annual',
  result: 'clear',
  consent: { obtained: true, consentDate: new Date().toISOString().split('T')[0], consentMethod: 'electronic' },
  confirmationNumber: '',
  notes: ''
};

const ClearinghouseQueries = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Record Query modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Query History modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyDriver, setHistoryDriver] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [uploadingQueryId, setUploadingQueryId] = useState(null);
  const queryFileInputRef = useRef(null);

  useEffect(() => {
    fetchDrivers();
  }, [page, statusFilter, search]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await clearinghouseAPI.getDrivers(params);
      setDrivers(res.data.drivers);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const openRecordModal = (driver = null) => {
    setFormData({
      ...INITIAL_FORM,
      driverId: driver?._id || '',
      queryDate: new Date().toISOString().split('T')[0],
      consent: { ...INITIAL_FORM.consent, consentDate: new Date().toISOString().split('T')[0] }
    });
    setShowRecordModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await clearinghouseAPI.recordQuery({
        ...formData,
        consent: formData.consent.obtained ? formData.consent : { obtained: false }
      });
      toast.success('Clearinghouse query recorded');
      setShowRecordModal(false);
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed to record query');
    } finally {
      setSubmitting(false);
    }
  };

  const openHistory = async (driver) => {
    setHistoryDriver(driver);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await clearinghouseAPI.getQueries({ driverId: driver._id, limit: 50 });
      setQueryHistory(res.data.queries);
    } catch (err) {
      toast.error('Failed to load query history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleQueryDocUpload = async (queryId, file) => {
    setUploadingQueryId(queryId);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', 'result');
      await clearinghouseAPI.uploadQueryDocument(queryId, formData);
      toast.success('Document uploaded');
      // Refresh history
      if (historyDriver) {
        const res = await clearinghouseAPI.getQueries({ driverId: historyDriver._id, limit: 50 });
        setQueryHistory(res.data.queries);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingQueryId(null);
      if (queryFileInputRef.current) queryFileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input for query doc upload */}
      <input
        ref={queryFileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingQueryId) {
            handleQueryDocUpload(uploadingQueryId, file);
          }
        }}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by driver name..."
              className="form-input pl-10 w-full"
            />
          </div>
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="form-select"
        >
          <option value="">All Statuses</option>
          <option value="current">Current</option>
          <option value="due">Due Soon</option>
          <option value="overdue">Overdue</option>
          <option value="missing">No Query</option>
        </select>
        <button onClick={() => openRecordModal()} className="btn btn-primary">
          <FiPlus className="w-4 h-4 mr-1" /> Record Query
        </button>
      </div>

      {/* Driver Table */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : drivers.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-8 text-center">
          <FiSearch className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400">No drivers found matching your filters.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Driver</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Employee ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Last Query</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Days Until Due</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {drivers.map(d => {
                  const status = d.complianceStatus?.clearinghouseStatus || 'missing';
                  const badge = STATUS_BADGES[status] || STATUS_BADGES.missing;
                  return (
                    <tr key={d._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">
                          {d.firstName} {d.lastName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {d.employeeId || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {d.clearinghouse?.lastQueryDate ? formatDate(d.clearinghouse.lastQueryDate) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {d.clearinghouse?.queryType ? (d.clearinghouse.queryType === 'full' ? 'Full' : 'Limited') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {d.daysUntilDue !== null ? (
                          <span className={`text-sm font-mono ${
                            d.daysUntilDue <= 0 ? 'text-red-600 dark:text-red-400 font-semibold' :
                            d.daysUntilDue <= 30 ? 'text-amber-600 dark:text-amber-400' :
                            'text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {d.daysUntilDue <= 0 ? `${Math.abs(d.daysUntilDue)}d overdue` : `${d.daysUntilDue}d`}
                          </span>
                        ) : (
                          <span className="text-sm text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openRecordModal(d)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium text-white bg-accent-500 hover:bg-accent-600 transition-colors"
                          >
                            Record Query
                          </button>
                          <button
                            onClick={() => openHistory(d)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            title="View History"
                          >
                            <FiList className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-500">
                Showing page {page} of {pages} ({total} drivers)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn btn-secondary text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                  className="btn btn-secondary text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Record Query Modal */}
      <Modal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        title="Record Clearinghouse Query"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Driver Selection */}
          <div>
            <label className="form-label">Driver *</label>
            <select
              value={formData.driverId}
              onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
              className="form-select w-full"
              required
            >
              <option value="">Select a driver...</option>
              {drivers.map(d => (
                <option key={d._id} value={d._id}>{d.firstName} {d.lastName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Query Type *</label>
              <select
                value={formData.queryType}
                onChange={(e) => setFormData({ ...formData, queryType: e.target.value })}
                className="form-select w-full"
              >
                <option value="full">Full Query</option>
                <option value="limited">Limited Query</option>
              </select>
            </div>
            <div>
              <label className="form-label">Purpose *</label>
              <select
                value={formData.queryPurpose}
                onChange={(e) => setFormData({ ...formData, queryPurpose: e.target.value })}
                className="form-select w-full"
              >
                <option value="annual">Annual Query</option>
                <option value="pre_employment">Pre-Employment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Query Date *</label>
              <input
                type="date"
                value={formData.queryDate}
                onChange={(e) => setFormData({ ...formData, queryDate: e.target.value })}
                className="form-input w-full"
                required
              />
            </div>
            <div>
              <label className="form-label">Result *</label>
              <select
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                className="form-select w-full"
              >
                <option value="clear">Clear</option>
                <option value="violation_found">Violation Found</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Consent Section */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="consent-obtained"
                checked={formData.consent.obtained}
                onChange={(e) => setFormData({
                  ...formData,
                  consent: { ...formData.consent, obtained: e.target.checked }
                })}
                className="form-checkbox"
              />
              <label htmlFor="consent-obtained" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Driver Consent Obtained
              </label>
            </div>
            {formData.consent.obtained && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs">Consent Date</label>
                  <input
                    type="date"
                    value={formData.consent.consentDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      consent: { ...formData.consent, consentDate: e.target.value }
                    })}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="form-label text-xs">Method</label>
                  <select
                    value={formData.consent.consentMethod}
                    onChange={(e) => setFormData({
                      ...formData,
                      consent: { ...formData.consent, consentMethod: e.target.value }
                    })}
                    className="form-select w-full"
                  >
                    <option value="electronic">Electronic</option>
                    <option value="paper">Paper</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="form-label">Confirmation Number</label>
            <input
              type="text"
              value={formData.confirmationNumber}
              onChange={(e) => setFormData({ ...formData, confirmationNumber: e.target.value })}
              placeholder="FMCSA confirmation number"
              className="form-input w-full"
            />
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes..."
              rows={2}
              className="form-input w-full"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button type="button" onClick={() => setShowRecordModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : 'Record Query'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Query History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => { setShowHistoryModal(false); setHistoryDriver(null); }}
        title={`Query History — ${historyDriver?.firstName || ''} ${historyDriver?.lastName || ''}`}
        size="lg"
      >
        {historyLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : queryHistory.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
            <FiClock className="w-10 h-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
            <p>No query records found for this driver.</p>
            {historyDriver?.clearinghouse?.lastQueryDate && (
              <p className="text-xs mt-2">
                Legacy record: last query on {formatDate(historyDriver.clearinghouse.lastQueryDate)}
              </p>
            )}
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500">Date</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500">Type</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500">Purpose</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500">Result</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500">Confirmation #</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-zinc-500">Docs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {queryHistory.map(q => (
                  <tr key={q._id}>
                    <td className="px-4 py-2.5 text-sm text-zinc-900 dark:text-white">{formatDate(q.queryDate)}</td>
                    <td className="px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400">{q.queryType === 'full' ? 'Full' : 'Limited'}</td>
                    <td className="px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 capitalize">{q.queryPurpose?.replace('_', ' ')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        q.result === 'clear'
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                          : q.result === 'violation_found'
                            ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                      }`}>
                        {q.result === 'clear' ? 'Clear' : q.result === 'violation_found' ? 'Violation' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-zinc-500 font-mono">{q.confirmationNumber || '—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {q.resultDocumentUrl && (
                          <a
                            href={getFileViewUrl(q.resultDocumentUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 hover:text-accent-600"
                            title="View document"
                          >
                            <FiDownload className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setUploadingQueryId(q._id);
                            queryFileInputRef.current?.click();
                          }}
                          disabled={uploadingQueryId === q._id}
                          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 hover:text-accent-600 disabled:opacity-50"
                          title="Upload document"
                        >
                          {uploadingQueryId === q._id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <FiUpload className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClearinghouseQueries;
