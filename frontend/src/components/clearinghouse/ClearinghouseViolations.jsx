import { useState, useEffect } from 'react';
import { clearinghouseAPI, drugAlcoholAPI } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle, FiCheckCircle, FiClock, FiSend
} from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';

const ClearinghouseViolations = () => {
  const [pending, setPending] = useState([]);
  const [reported, setReported] = useState([]);
  const [loading, setLoading] = useState(true);

  // Report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [reportForm, setReportForm] = useState({
    reportType: 'positive',
    confirmationNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchViolations();
  }, []);

  const fetchViolations = async () => {
    setLoading(true);
    try {
      const res = await clearinghouseAPI.getViolationsPending();
      setPending(res.data.pending);
      setReported(res.data.reported);
    } catch (err) {
      toast.error('Failed to load violation data');
    } finally {
      setLoading(false);
    }
  };

  const openReportModal = (test) => {
    setSelectedTest(test);
    setReportForm({
      reportType: test.overallResult === 'refused' ? 'refusal' : 'positive',
      confirmationNumber: ''
    });
    setShowReportModal(true);
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!selectedTest) return;
    setSubmitting(true);
    try {
      await drugAlcoholAPI.reportToClearinghouse(selectedTest._id, reportForm);
      toast.success('Violation reported to Clearinghouse');
      setShowReportModal(false);
      setSelectedTest(null);
      fetchViolations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report violation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Reports - Urgent */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center gap-2 p-5 border-b border-zinc-200 dark:border-zinc-800">
          <FiAlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            Pending Reports
            {pending.length > 0 && (
              <span className="ml-2 text-sm font-normal text-red-500">({pending.length} requiring action)</span>
            )}
          </h3>
        </div>

        {pending.length === 0 ? (
          <div className="p-8 text-center">
            <FiCheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400">All violations have been reported to the Clearinghouse.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Test Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Driver</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Test Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Result</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Report Deadline</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {pending.map(t => (
                  <tr key={t._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-zinc-900 dark:text-white">
                      {formatDate(t.testDate)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white">
                      {t.driverId?.firstName} {t.driverId?.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 capitalize">
                      {t.testType?.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        t.overallResult === 'positive'
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
                      }`}>
                        {t.overallResult === 'positive' ? 'Positive' : 'Refused'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {formatDate(t.reportDeadline)}
                    </td>
                    <td className="px-4 py-3">
                      {t.isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                          <FiClock className="w-3 h-3" />
                          {t.daysOverdue}d overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                          Due
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openReportModal(t)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium text-white bg-accent-500 hover:bg-accent-600 transition-colors flex items-center gap-1 ml-auto"
                      >
                        <FiSend className="w-3 h-3" /> Mark Reported
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reported History */}
      {reported.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
          <div className="flex items-center gap-2 p-5 border-b border-zinc-200 dark:border-zinc-800">
            <FiCheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              Reported ({reported.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Test Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Driver</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Result</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Report Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Confirmation #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Report Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {reported.map(t => (
                  <tr key={t._id}>
                    <td className="px-4 py-3 text-sm text-zinc-900 dark:text-white">{formatDate(t.testDate)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white">
                      {t.driverId?.firstName} {t.driverId?.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-zinc-600 dark:text-zinc-400">{t.overallResult}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {t.clearinghouse?.reportDate ? formatDate(t.clearinghouse.reportDate) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-zinc-500">{t.clearinghouse?.confirmationNumber || '—'}</td>
                    <td className="px-4 py-3 text-sm capitalize text-zinc-600 dark:text-zinc-400">
                      {t.clearinghouse?.reportType?.replace('_', ' ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => { setShowReportModal(false); setSelectedTest(null); }}
        title="Report to Clearinghouse"
      >
        {selectedTest && (
          <form onSubmit={handleReport} className="space-y-4">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                <strong>{selectedTest.driverId?.firstName} {selectedTest.driverId?.lastName}</strong>
                {' — '}{selectedTest.overallResult === 'positive' ? 'Positive test' : 'Test refusal'}
                {' on '}{formatDate(selectedTest.testDate)}
              </p>
            </div>

            <div>
              <label className="form-label">Report Type *</label>
              <select
                value={reportForm.reportType}
                onChange={(e) => setReportForm({ ...reportForm, reportType: e.target.value })}
                className="form-select w-full"
              >
                <option value="positive">Positive Test</option>
                <option value="refusal">Test Refusal</option>
                <option value="rtu_negative">Return-to-Duty Negative</option>
              </select>
            </div>

            <div>
              <label className="form-label">Confirmation Number</label>
              <input
                type="text"
                value={reportForm.confirmationNumber}
                onChange={(e) => setReportForm({ ...reportForm, confirmationNumber: e.target.value })}
                placeholder="FMCSA confirmation number"
                className="form-input w-full"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <button type="button" onClick={() => setShowReportModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <LoadingSpinner size="sm" /> : 'Confirm Report'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ClearinghouseViolations;
