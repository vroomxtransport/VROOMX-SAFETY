import { useState, useEffect } from 'react';
import { drugAlcoholAPI, driversAPI } from '../utils/api';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiPlus, FiDroplet, FiCheck, FiX, FiAlertCircle, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import DocumentUploadSection from '../components/DocumentUploadSection';

const DrugAlcohol = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');

  const initialFormData = {
    driverId: '',
    testType: 'random',
    testDate: new Date().toISOString().split('T')[0],
    overallResult: 'pending',
    drugTest: { performed: true, result: 'pending' },
    alcoholTest: { performed: false },
    status: 'completed'
  };

  const [formData, setFormData] = useState(initialFormData);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTest, setDetailTest] = useState(null);

  useEffect(() => {
    fetchTests();
    fetchStats();
    fetchDrivers();
  }, [page, typeFilter, resultFilter]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        ...(typeFilter && { testType: typeFilter }),
        ...(resultFilter && { result: resultFilter })
      };
      const response = await drugAlcoholAPI.getAll(params);
      setTests(response.data.tests);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to fetch test records');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await drugAlcoholAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await driversAPI.getAll({ status: 'active', limit: 100 });
      setDrivers(response.data.drivers);
    } catch (error) {
    }
  };

  const handleSubmitTest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedTest) {
        await drugAlcoholAPI.update(selectedTest._id, formData);
        toast.success('Test record updated');
      } else {
        await drugAlcoholAPI.create(formData);
        toast.success('Test record added');
      }
      handleCloseModal();
      fetchTests();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save test');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (test) => {
    setSelectedTest(test);
    setFormData({
      driverId: test.driverId?._id || test.driverId || '',
      testType: test.testType || 'random',
      testDate: test.testDate ? test.testDate.split('T')[0] : new Date().toISOString().split('T')[0],
      overallResult: test.overallResult || 'pending',
      drugTest: test.drugTest || { performed: true, result: 'pending' },
      alcoholTest: test.alcoholTest || { performed: false },
      status: test.status || 'completed'
    });
    setShowAddModal(true);
  };

  const handleDelete = async (test) => {
    if (!confirm(`Delete this test record? This cannot be undone.`)) return;
    try {
      await drugAlcoholAPI.delete(test._id);
      toast.success('Test record deleted');
      fetchTests();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete test');
    }
  };

  const openDetailModal = async (test) => {
    try {
      const res = await drugAlcoholAPI.getById(test._id);
      setDetailTest(res.data.test);
      setShowDetailModal(true);
    } catch {
      toast.error('Failed to load test details');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedTest(null);
    setFormData(initialFormData);
  };

  const testTypeLabels = {
    pre_employment: 'Pre-Employment',
    random: 'Random',
    post_accident: 'Post-Accident',
    reasonable_suspicion: 'Reasonable Suspicion',
    return_to_duty: 'Return to Duty',
    follow_up: 'Follow-Up'
  };

  const columns = [
    {
      header: 'Date',
      render: (row) => formatDate(row.testDate)
    },
    {
      header: 'Driver',
      render: (row) => row.driverId ? `${row.driverId.firstName} ${row.driverId.lastName}` : 'N/A'
    },
    {
      header: 'Test Type',
      render: (row) => testTypeLabels[row.testType] || row.testType
    },
    {
      header: 'Drug Test',
      render: (row) => (
        row.drugTest?.performed ? (
          <StatusBadge status={row.drugTest.result} />
        ) : <span className="text-zinc-500 dark:text-zinc-400">N/A</span>
      )
    },
    {
      header: 'Alcohol Test',
      render: (row) => (
        row.alcoholTest?.performed ? (
          <StatusBadge status={row.alcoholTest.result} />
        ) : <span className="text-zinc-500 dark:text-zinc-400">N/A</span>
      )
    },
    {
      header: 'Result',
      render: (row) => <StatusBadge status={row.overallResult} />
    },
    {
      header: 'Clearinghouse',
      render: (row) => (
        row.clearinghouse?.reported ? (
          <span className="badge badge-success">Reported</span>
        ) : row.overallResult === 'positive' || row.overallResult === 'refused' ? (
          <span className="badge badge-warning">Pending</span>
        ) : <span className="text-zinc-500 dark:text-zinc-400">-</span>
      )
    },
    {
      header: '',
      render: (row) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDetailModal(row);
            }}
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-lg transition-colors"
            title="View Details"
          >
            <FiEye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-lg transition-colors"
            title="Edit Test"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete Test"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Drug & Alcohol Program</h1>
          <p className="text-zinc-600 dark:text-zinc-300">DOT testing and Clearinghouse compliance per 49 CFR 382</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center"
        >
          <FiPlus className="w-5 h-5 mr-2" />
          Add Test Record
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="group card p-4 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-600 dark:text-zinc-300 text-sm">Drivers in Pool</p>
              <p className="text-xl sm:text-2xl font-bold">{stats?.activeDriversInPool || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiDroplet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="group card p-4 hover:shadow-lg hover:-translate-y-1 hover:border-green-300 dark:hover:border-green-500/30 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-600 dark:text-zinc-300 text-sm">Random Tests (YTD)</p>
              <p className="text-xl sm:text-2xl font-bold">
                {stats?.testsByType?.find(t => t._id === 'random')?.total || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="group card p-4 hover:shadow-lg hover:-translate-y-1 hover:border-green-300 dark:hover:border-green-500/30 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-600 dark:text-zinc-300 text-sm">Compliance Rate</p>
              <p className="text-xl sm:text-2xl font-bold">
                {stats?.randomTestingCompliance?.complianceRate || 0}%
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
              (stats?.randomTestingCompliance?.complianceRate || 0) >= 100 ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {(stats?.randomTestingCompliance?.complianceRate || 0) >= 100 ? (
                <FiCheck className="w-6 h-6 text-green-600" />
              ) : (
                <FiAlertCircle className="w-6 h-6 text-yellow-600" />
              )}
            </div>
          </div>
        </div>

        <div className="group card p-4 hover:shadow-lg hover:-translate-y-1 hover:border-orange-300 dark:hover:border-orange-500/30 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-600 dark:text-zinc-300 text-sm">Pending Queries</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats?.driversNeedingClearinghouseQuery || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiAlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Info */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Random Testing Requirements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="text-sm">
            <span className="text-zinc-600 dark:text-zinc-300">Drug Tests Required (50%): </span>
            <span className="font-medium">{stats?.randomTestingCompliance?.drugTestsRequired || 0}</span>
          </div>
          <div className="text-sm">
            <span className="text-zinc-600 dark:text-zinc-300">Completed: </span>
            <span className="font-medium">{stats?.randomTestingCompliance?.drugTestsCompleted || 0}</span>
          </div>
          <div className="text-sm">
            <span className="text-zinc-600 dark:text-zinc-300">Status: </span>
            {(stats?.randomTestingCompliance?.complianceRate || 0) >= 100 ? (
              <span className="badge badge-success">On Track</span>
            ) : (
              <span className="badge badge-warning">Behind Schedule</span>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            className="form-select w-full sm:w-48"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Test Types</option>
            {Object.entries(testTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            className="form-select w-full sm:w-48"
            value={resultFilter}
            onChange={(e) => {
              setResultFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Results</option>
            <option value="negative">Negative</option>
            <option value="positive">Positive</option>
            <option value="refused">Refused</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={tests}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="No test records found"
        />
      </div>

      {/* Add/Edit Test Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={selectedTest ? 'Edit Test Record' : 'Add Test Record'}
        size="lg"
      >
        <form onSubmit={handleSubmitTest} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Driver *</label>
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
              <label className="form-label">Test Type *</label>
              <select
                className="form-select"
                required
                value={formData.testType}
                onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
              >
                {Object.entries(testTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Test Date *</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.testDate}
                onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Overall Result *</label>
              <select
                className="form-select"
                required
                value={formData.overallResult}
                onChange={(e) => setFormData({ ...formData, overallResult: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="negative">Negative</option>
                <option value="positive">Positive</option>
                <option value="refused">Refused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="font-medium">Drug Test</label>
                <input
                  type="checkbox"
                  checked={formData.drugTest.performed}
                  onChange={(e) => setFormData({
                    ...formData,
                    drugTest: { ...formData.drugTest, performed: e.target.checked }
                  })}
                />
              </div>
              {formData.drugTest.performed && (
                <select
                  className="form-select"
                  value={formData.drugTest.result}
                  onChange={(e) => setFormData({
                    ...formData,
                    drugTest: { ...formData.drugTest, result: e.target.value }
                  })}
                >
                  <option value="pending">Pending</option>
                  <option value="negative">Negative</option>
                  <option value="positive">Positive</option>
                  <option value="refused">Refused</option>
                </select>
              )}
            </div>

            <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="font-medium">Alcohol Test</label>
                <input
                  type="checkbox"
                  checked={formData.alcoholTest.performed}
                  onChange={(e) => setFormData({
                    ...formData,
                    alcoholTest: { ...formData.alcoholTest, performed: e.target.checked }
                  })}
                />
              </div>
              {formData.alcoholTest.performed && (
                <select
                  className="form-select"
                  value={formData.alcoholTest.result || 'pending'}
                  onChange={(e) => setFormData({
                    ...formData,
                    alcoholTest: { ...formData.alcoholTest, result: e.target.value }
                  })}
                >
                  <option value="pending">Pending</option>
                  <option value="negative">Negative</option>
                  <option value="positive">Positive</option>
                  <option value="refused">Refused</option>
                </select>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : (selectedTest ? 'Update Test' : 'Add Test Record')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Test Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setDetailTest(null); }}
        title="Test Record Details"
        size="lg"
      >
        {detailTest && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Driver</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  {detailTest.driverId?.firstName} {detailTest.driverId?.lastName}
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Test Date</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  {formatDate(detailTest.testDate)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Test Type</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white capitalize">
                  {testTypeLabels[detailTest.testType] || detailTest.testType}
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Overall Result</p>
                <StatusBadge status={detailTest.overallResult} />
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Status</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white capitalize">
                  {detailTest.status}
                </p>
              </div>
            </div>

            {/* Drug & Alcohol Results */}
            <div className="grid grid-cols-2 gap-4">
              {detailTest.drugTest?.performed && (
                <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 mb-1">Drug Test</p>
                  <StatusBadge status={detailTest.drugTest.result} />
                  {detailTest.drugTest.specimenId && (
                    <p className="text-xs text-zinc-400 mt-1">Specimen: {detailTest.drugTest.specimenId}</p>
                  )}
                </div>
              )}
              {detailTest.alcoholTest?.performed && (
                <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 mb-1">Alcohol Test</p>
                  <StatusBadge status={detailTest.alcoholTest.result || 'pending'} />
                </div>
              )}
            </div>

            {/* Clearinghouse Status */}
            {(detailTest.overallResult === 'positive' || detailTest.overallResult === 'refused') && (
              <div className={`border rounded-lg p-3 ${
                detailTest.clearinghouse?.reported
                  ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-500/10'
                  : 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-500/10'
              }`}>
                <p className="text-xs text-zinc-500 mb-1">Clearinghouse Reporting</p>
                {detailTest.clearinghouse?.reported ? (
                  <div>
                    <span className="badge badge-success">Reported</span>
                    {detailTest.clearinghouse.confirmationNumber && (
                      <p className="text-xs text-zinc-500 mt-1">Confirmation: {detailTest.clearinghouse.confirmationNumber}</p>
                    )}
                  </div>
                ) : (
                  <span className="badge badge-warning">Pending Report</span>
                )}
              </div>
            )}

            {/* Documents Section */}
            <DocumentUploadSection
              documents={detailTest.documents || []}
              onUpload={(formData) => drugAlcoholAPI.uploadDocument(detailTest._id, formData)}
              onDelete={(docId) => drugAlcoholAPI.deleteDocument(detailTest._id, docId)}
              onRefresh={async () => {
                const res = await drugAlcoholAPI.getById(detailTest._id);
                setDetailTest(res.data.test);
              }}
              fieldName="document"
              documentTypes={['ccf', 'mro_report', 'bat_report', 'sap_report', 'consent', 'other']}
              title="Test Documents"
              emptyMessage="No documents attached to this test."
            />

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailTest(null);
                  openEditModal(detailTest);
                }}
                className="flex items-center gap-2 px-4 py-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <FiEdit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => { setShowDetailModal(false); setDetailTest(null); }}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DrugAlcohol;
