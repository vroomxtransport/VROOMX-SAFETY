import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAlertTriangle, FiUserPlus, FiRefreshCw, FiCheckCircle,
  FiArrowLeft, FiCalendar, FiTruck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { violationsAPI, driversAPI } from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const UnlinkedViolations = () => {
  const [violations, setViolations] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  // Link modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [pagination.page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [violationsRes, driversRes] = await Promise.all([
        violationsAPI.getUnassigned({
          page: pagination.page,
          limit: pagination.limit
        }),
        driversAPI.getAll({ status: 'active', limit: 500 })
      ]);

      setViolations(violationsRes.data.violations || []);
      setPagination(prev => ({
        ...prev,
        total: violationsRes.data.pagination?.total || 0
      }));
      setDrivers(driversRes.data.drivers || []);
    } catch (err) {
      toast.error('Failed to load unlinked violations');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openLinkModal = (violation) => {
    setSelectedViolation(violation);
    setSelectedDriverId('');
    setShowLinkModal(true);
  };

  const handleLinkDriver = async (e) => {
    e.preventDefault();
    if (!selectedDriverId || !selectedViolation) {
      toast.error('Please select a driver');
      return;
    }

    setSubmitting(true);
    try {
      await violationsAPI.linkDriver(selectedViolation._id, selectedDriverId);
      toast.success('Driver linked to violation');
      setShowLinkModal(false);
      setSelectedViolation(null);
      setSelectedDriverId('');
      // Refresh the list
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to link driver');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Date',
      accessor: 'violationDate',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FiCalendar className="w-4 h-4 text-zinc-400" />
          <span className="font-mono text-sm">{formatDate(row.violationDate)}</span>
        </div>
      )
    },
    {
      header: 'Violation',
      accessor: 'violationType',
      render: (row) => (
        <div>
          <p className="font-medium text-zinc-900 dark:text-white">{row.violationType}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{row.violationCode}</p>
        </div>
      )
    },
    {
      header: 'BASIC',
      accessor: 'basic',
      render: (row) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
          {row.basic?.replace(/_/g, ' ') || 'Unknown'}
        </span>
      )
    },
    {
      header: 'State',
      accessor: 'state',
      render: (row) => (
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{row.state || '-'}</span>
      )
    },
    {
      header: 'Severity',
      accessor: 'severityWeight',
      render: (row) => {
        const severity = row.severityWeight || 0;
        const color = severity >= 8 ? 'red' : severity >= 5 ? 'yellow' : 'green';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${color}-100 dark:bg-${color}-500/20 text-${color}-700 dark:text-${color}-400`}>
            {severity} pts
          </span>
        );
      }
    },
    {
      header: '',
      accessor: 'actions',
      render: (row) => (
        <button
          onClick={() => openLinkModal(row)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400 hover:bg-accent-100 dark:hover:bg-accent-500/20 transition-colors"
        >
          <FiUserPlus className="w-4 h-4" />
          Link Driver
        </button>
      )
    }
  ];

  if (loading && violations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LoadingSpinner size="lg" variant="truck" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">Loading unlinked violations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/app/violations"
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </Link>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Unlinked Violations</h1>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            {pagination.total} violation{pagination.total !== 1 ? 's' : ''} need manual driver assignment
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Empty State */}
      {violations.length === 0 && !loading && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            All Violations Linked
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            All violations have been linked to drivers. Great job!
          </p>
          <Link
            to="/app/violations"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-white transition-colors"
          >
            View All Violations
          </Link>
        </div>
      )}

      {/* Data Table */}
      {violations.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <DataTable
            columns={columns}
            data={violations}
            loading={loading}
            pagination={{
              currentPage: pagination.page,
              totalPages: Math.ceil(pagination.total / pagination.limit),
              totalItems: pagination.total,
              itemsPerPage: pagination.limit,
              onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
            }}
            emptyMessage="No unlinked violations found"
          />
        </div>
      )}

      {/* Link Driver Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          setSelectedViolation(null);
          setSelectedDriverId('');
        }}
        title="Link Driver to Violation"
        icon={FiUserPlus}
      >
        <form onSubmit={handleLinkDriver} className="space-y-5">
          {/* Violation Context */}
          <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-500/30">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="w-5 h-5 text-accent-600 dark:text-accent-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-accent-800 dark:text-accent-300">Violation:</p>
                <p className="text-sm text-accent-700 dark:text-accent-400">{selectedViolation?.violationType}</p>
                <p className="text-xs text-accent-600 dark:text-accent-500 mt-1">
                  {selectedViolation?.violationDate && formatDate(selectedViolation.violationDate)} | {selectedViolation?.basic?.replace(/_/g, ' ')}
                </p>
                {selectedViolation?.state && (
                  <p className="text-xs text-accent-600 dark:text-accent-500">
                    State: {selectedViolation.state}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Driver Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Select Driver
            </label>
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              required
            >
              <option value="">Select a driver...</option>
              {drivers.map(driver => (
                <option key={driver._id} value={driver._id}>
                  {driver.firstName} {driver.lastName}
                  {driver.cdlNumber && ` (CDL: ${driver.cdlNumber})`}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowLinkModal(false);
                setSelectedViolation(null);
                setSelectedDriverId('');
              }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedDriverId}
              className="flex-1 px-4 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <FiUserPlus className="w-4 h-4" />
                  Link Driver
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UnlinkedViolations;
