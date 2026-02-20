import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { violationsAPI, driversAPI, vehiclesAPI } from '../utils/api';
import { formatDate, basicCategories, getSeverityColor } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiPlus, FiSearch, FiAlertTriangle, FiMessageSquare, FiCheck,
  FiCheckCircle, FiClock, FiX, FiFileText, FiUpload, FiList, FiEdit2, FiTrash2,
  FiUserPlus, FiLink, FiTarget, FiZap
} from 'react-icons/fi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import TabNav from '../components/TabNav';
import InspectionUploadContent from '../components/InspectionUploadContent';
import DataQOpportunities from '../components/DataQOpportunities';
import DataQLetterModal from '../components/DataQLetterModal';

const Violations = ({ embedded = false }) => {
  const [activeTab, setActiveTab] = useState('list');
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [basicFilter, setBasicFilter] = useState('');
  const [stats, setStats] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDataQModal, setShowDataQModal] = useState(false);
  const [showLinkDriverModal, setShowLinkDriverModal] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [opportunities, setOpportunities] = useState([]);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [dismissedAttorneyBanner, setDismissedAttorneyBanner] = useState(false);

  const tabs = [
    { key: 'list', label: 'Violations List', icon: FiList },
    { key: 'dataq', label: 'DataQ Opportunities', icon: FiTarget, badge: 'AI' },
    { key: 'upload', label: 'Upload Inspection', icon: FiUpload, badge: 'AI' }
  ];

  const initialFormData = {
    inspectionNumber: '',
    violationDate: new Date().toISOString().split('T')[0],
    basic: 'vehicle_maintenance',
    violationType: '',
    violationCode: '',
    description: '',
    severityWeight: 5,
    outOfService: false,
    driverId: '',
    vehicleId: '',
    location: { city: '', state: '' }
  };

  const [formData, setFormData] = useState(initialFormData);
  const [editingViolation, setEditingViolation] = useState(null);

  useEffect(() => {
    fetchViolations();
    fetchStats();
    fetchDriversAndVehicles();
  }, [page, statusFilter, basicFilter, driverFilter, typeFilter]);

  useEffect(() => {
    if (activeTab === 'dataq') {
      fetchOpportunities();
    }
  }, [activeTab]);

  const fetchOpportunities = async () => {
    setOpportunitiesLoading(true);
    try {
      const response = await violationsAPI.getDataQOpportunities({ minScore: 40, limit: 15 });
      setOpportunities(response.data.violations || []);
    } catch (error) {
      toast.error('Failed to fetch DataQ opportunities');
    } finally {
      setOpportunitiesLoading(false);
    }
  };

  const handleAnalyzeOpportunity = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowLetterModal(true);
  };

  const handleLetterGenerated = () => {
    fetchOpportunities();
    fetchViolations();
    setShowLetterModal(false);
    setSelectedOpportunity(null);
    toast.success('DataQ letter generated successfully');
  };

  const fetchViolations = async () => {
    setLoading(true);
    try {
      // Handle special "unassigned" filter
      if (driverFilter === 'unassigned') {
        const response = await violationsAPI.getUnassigned({
          page,
          limit: 15,
          ...(statusFilter && { status: statusFilter }),
          ...(basicFilter && { basic: basicFilter })
        });
        setViolations(response.data.violations);
        setTotalPages(response.data.pagination?.pages || 1);
      } else {
        const params = {
          page,
          limit: 15,
          ...(statusFilter && { status: statusFilter }),
          ...(basicFilter && { basic: basicFilter }),
          ...(driverFilter && driverFilter !== 'unassigned' && { driverId: driverFilter }),
          ...(typeFilter === 'moving' && { isMoving: 'true' }),
          ...(typeFilter === 'non-moving' && { isMoving: 'false' })
        };
        const response = await violationsAPI.getAll(params);
        setViolations(response.data.violations);
        setTotalPages(response.data.pages);
      }
    } catch (error) {
      toast.error('Failed to fetch violations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await violationsAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
    }
  };

  const fetchDriversAndVehicles = async () => {
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        driversAPI.getAll({ limit: 100 }),
        vehiclesAPI.getAll({ limit: 100 })
      ]);
      setDrivers(driversRes.data.drivers);
      setVehicles(vehiclesRes.data.vehicles);
    } catch (error) {
    }
  };

  const handleSubmitViolation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingViolation) {
        await violationsAPI.update(editingViolation._id, formData);
        toast.success('Violation updated');
      } else {
        await violationsAPI.create(formData);
        toast.success('Violation recorded');
      }
      handleCloseAddModal();
      fetchViolations();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save violation');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (violation) => {
    setEditingViolation(violation);
    setFormData({
      inspectionNumber: violation.inspectionNumber || '',
      violationDate: violation.violationDate ? violation.violationDate.split('T')[0] : new Date().toISOString().split('T')[0],
      basic: violation.basic || 'vehicle_maintenance',
      violationType: violation.violationType || '',
      violationCode: violation.violationCode || '',
      description: violation.description || '',
      severityWeight: violation.severityWeight || 5,
      outOfService: violation.outOfService || false,
      driverId: violation.driverId?._id || violation.driverId || '',
      vehicleId: violation.vehicleId?._id || violation.vehicleId || '',
      location: violation.location || { city: '', state: '' }
    });
    setShowAddModal(true);
  };

  const handleDelete = async (violation) => {
    if (!confirm(`Delete this violation? This cannot be undone.`)) return;
    try {
      await violationsAPI.delete(violation._id);
      toast.success('Violation deleted');
      fetchViolations();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete violation');
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingViolation(null);
    setFormData(initialFormData);
  };

  const handleDataQSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setSubmitting(true);
    try {
      await violationsAPI.submitDataQ(selectedViolation._id, formData);
      toast.success('DataQ challenge submitted');
      setShowDataQModal(false);
      setSelectedViolation(null);
      fetchViolations();
    } catch (error) {
      toast.error('Failed to submit DataQ challenge');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (violation) => {
    try {
      await violationsAPI.resolve(violation._id, { action: 'Marked as resolved' });
      toast.success('Violation marked as resolved');
      fetchViolations();
    } catch (error) {
      toast.error('Failed to resolve violation');
    }
  };

  const handleLinkDriver = async (e) => {
    e.preventDefault();
    if (!selectedDriverId) {
      toast.error('Please select a driver');
      return;
    }
    setSubmitting(true);
    try {
      await violationsAPI.linkDriver(selectedViolation._id, selectedDriverId);
      toast.success('Driver linked to violation');
      setShowLinkDriverModal(false);
      setSelectedViolation(null);
      setSelectedDriverId('');
      fetchViolations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to link driver');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlinkDriver = async (violation) => {
    if (!confirm('Unlink driver from this violation?')) return;
    try {
      await violationsAPI.unlinkDriver(violation._id);
      toast.success('Driver unlinked from violation');
      fetchViolations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unlink driver');
    }
  };

  const openLinkDriverModal = (violation) => {
    setSelectedViolation(violation);
    setSelectedDriverId(violation.driverId?._id || '');
    setShowLinkDriverModal(true);
  };

  const columns = [
    {
      header: 'Date',
      render: (row) => (
        <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">{formatDate(row.violationDate)}</span>
      )
    },
    {
      header: 'Violation',
      render: (row) => (
        <div>
          <p className="font-medium text-zinc-900 dark:text-white">{row.violationType}</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 font-mono">{row.violationCode}</p>
        </div>
      )
    },
    {
      header: 'BASIC',
      render: (row) => (
        <span className="text-sm text-zinc-700 dark:text-zinc-300 capitalize">
          {basicCategories[row.basic]?.label || row.basic?.replace('_', ' ')}
        </span>
      )
    },
    {
      header: 'Severity',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getSeverityColor(row.severityWeight)}`}></div>
          <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">{row.severityWeight}</span>
          {row.outOfService && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-danger-100 dark:bg-danger-500/20 text-danger-700 dark:text-danger-400 border border-danger-200 dark:border-danger-500/30">
              OOS
            </span>
          )}
          {row.isMoving && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
              MOVING
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Driver',
      render: (row) => (
        row.driverId ? (
          <Link
            to={`/app/drivers/${row.driverId._id}`}
            className="text-sm text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.driverId.firstName} {row.driverId.lastName}
          </Link>
        ) : (
          <span className="text-sm text-zinc-400 dark:text-zinc-500 italic">Unassigned</span>
        )
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={row.status} size="sm" />
          {row.dataQChallenge?.aiAnalysis?.score >= 75 && row.status === 'open' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-accent-100 dark:bg-accent-500/20 text-accent-700 dark:text-accent-400" title="High DataQ potential">
              <FiZap className="w-3 h-3" />
            </span>
          )}
        </div>
      )
    },
    {
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          {/* Link/Unlink Driver Button */}
          {!row.driverId ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openLinkDriverModal(row);
              }}
              className="p-2 text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-500/20 rounded-lg transition-colors"
              title="Link Driver"
            >
              <FiUserPlus className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUnlinkDriver(row);
              }}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-warning-600 dark:hover:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-500/20 rounded-lg transition-colors"
              title="Unlink Driver"
            >
              <FiLink className="w-4 h-4" />
            </button>
          )}
          {row.status === 'open' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedViolation(row);
                  setShowDataQModal(true);
                }}
                className="p-2 text-info-600 dark:text-info-400 hover:text-info-700 dark:hover:text-info-300 hover:bg-info-50 dark:hover:bg-info-500/20 rounded-lg transition-colors"
                title="Submit DataQ"
              >
                <FiMessageSquare className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResolve(row);
                }}
                className="p-2 text-success-600 dark:text-success-400 hover:text-success-700 dark:hover:text-success-300 hover:bg-success-50 dark:hover:bg-success-500/20 rounded-lg transition-colors"
                title="Mark Resolved"
              >
                <FiCheck className="w-4 h-4" />
              </button>
            </>
          )}
          {row.status === 'dispute_in_progress' && (
            <span className="text-xs font-medium text-info-600 dark:text-info-400 bg-info-50 dark:bg-info-500/20 px-2 py-1 rounded-lg">
              DataQ Pending
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-lg transition-colors"
            title="Edit Violation"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete Violation"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const handleUploadSuccess = () => {
    setActiveTab('list');
    fetchViolations();
    fetchStats();
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Page Header */}
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Violation Tracker</h1>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm mt-1">Track and manage violations with DataQ support</p>
          </div>
          {activeTab === 'list' && (
            <div className="flex items-center gap-3">
              <Link
                to="/app/unlinked-violations"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 transition-colors border border-yellow-200 dark:border-yellow-500/30"
              >
                <FiUserPlus className="w-4 h-4" />
                Review Unlinked
              </Link>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
              >
                <FiPlus className="w-4 h-4" />
                Add Violation
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'dataq' ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center">
                  <FiTarget className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">AI-Identified Challenge Opportunities</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Violations with high potential for successful DataQ challenge</p>
                </div>
              </div>
              <Link to="/app/dataq-dashboard" className="btn btn-secondary text-sm">
                <FiTarget className="w-4 h-4" />
                Full Dashboard
              </Link>
            </div>
          </div>
          <DataQOpportunities
            opportunities={opportunities}
            onAnalyze={handleAnalyzeOpportunity}
            loading={opportunitiesLoading}
          />
        </div>
      ) : activeTab === 'list' ? (
        <>
        {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiAlertTriangle className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white font-mono">
                {stats?.byBasic?.reduce((a, b) => a + b.count, 0) || 0}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Total Violations</p>
            </div>
          </div>
        </div>
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 hover:border-warning-300 dark:hover:border-warning-500/30 transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiClock className="w-5 h-5 text-warning-600 dark:text-warning-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-warning-600 dark:text-warning-400 font-mono">
                {stats?.byStatus?.find(s => s._id === 'open')?.count || 0}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Open</p>
            </div>
          </div>
        </div>
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 hover:border-info-300 dark:hover:border-info-500/30 transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info-100 dark:bg-info-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiMessageSquare className="w-5 h-5 text-info-600 dark:text-info-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-info-600 dark:text-info-400 font-mono">{stats?.openDataQChallenges || 0}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">DataQ In Progress</p>
            </div>
          </div>
        </div>
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 hover:border-success-300 dark:hover:border-success-500/30 transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiCheckCircle className="w-5 h-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-success-600 dark:text-success-400 font-mono">
                {stats?.byStatus?.find(s => s._id === 'resolved')?.count || 0}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Resolved</p>
            </div>
          </div>
        </div>
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-500/30 transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiAlertTriangle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                {stats?.movingViolationCount || 0}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Moving Violations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attorney Recommendation Banner */}
      {stats?.movingViolationCount > 0 && !dismissedAttorneyBanner && (
        <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-xl p-4 flex items-start gap-3">
          <FiAlertTriangle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">
              You have {stats.movingViolationCount} open moving violation{stats.movingViolationCount !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
              Moving violations can often be reclassified to non-moving or removed entirely
              with proper legal representation. An experienced trucking attorney may be able
              to reduce your CSA impact significantly.
            </p>
          </div>
          <button onClick={() => setDismissedAttorneyBanner(true)} className="flex-shrink-0">
            <FiX className="w-4 h-4 text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="dispute_in_progress">Dispute In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="upheld">Upheld</option>
          </select>
          <select
            className="form-select"
            value={basicFilter}
            onChange={(e) => {
              setBasicFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All BASICs</option>
            {Object.entries(basicCategories).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
          <select
            className="form-select"
            value={driverFilter}
            onChange={(e) => {
              setDriverFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Drivers</option>
            <option value="unassigned">Unassigned Only</option>
            {drivers.map((driver) => (
              <option key={driver._id} value={driver._id}>
                {driver.firstName} {driver.lastName}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Types</option>
            <option value="moving">Moving Only</option>
            <option value="non-moving">Non-Moving Only</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={violations}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No violations found"
        emptyIcon={FiAlertTriangle}
      />
      </>
      ) : (
        <InspectionUploadContent onSuccess={handleUploadSuccess} />
      )}

      {/* Add/Edit Violation Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        title={editingViolation ? 'Edit Violation' : 'Add Violation Record'}
        icon={FiAlertTriangle}
        size="lg"
      >
        <form onSubmit={handleSubmitViolation} className="space-y-5">
          {/* Inspection Details */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-danger-100 dark:bg-danger-500/20 flex items-center justify-center">
              <FiFileText className="w-3.5 h-3.5 text-danger-600 dark:text-danger-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Inspection Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Inspection Number *</label>
              <input
                type="text"
                className="form-input font-mono"
                required
                value={formData.inspectionNumber}
                onChange={(e) => setFormData({ ...formData, inspectionNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Violation Date *</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.violationDate}
                onChange={(e) => setFormData({ ...formData, violationDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">BASIC Category *</label>
              <select
                className="form-select"
                required
                value={formData.basic}
                onChange={(e) => setFormData({ ...formData, basic: e.target.value })}
              >
                {Object.entries(basicCategories).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Severity Weight (1-10) *</label>
              <input
                type="number"
                className="form-input"
                required
                min={1}
                max={10}
                value={formData.severityWeight}
                onChange={(e) => setFormData({ ...formData, severityWeight: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Violation Type *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g., Speeding 15+ MPH"
              value={formData.violationType}
              onChange={(e) => setFormData({ ...formData, violationType: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Description *</label>
            <textarea
              className="form-input"
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Associated Records */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <FiAlertTriangle className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Associated Records</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Driver</label>
                <select
                  className="form-select"
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
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Vehicle</label>
                <select
                  className="form-select"
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.unitNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="outOfService"
                className="w-4 h-4 text-accent-600 border-zinc-300 dark:border-zinc-600 rounded focus:ring-accent-500"
                checked={formData.outOfService}
                onChange={(e) => setFormData({ ...formData, outOfService: e.target.checked })}
              />
              <label htmlFor="outOfService" className="ml-2 text-sm text-zinc-700 dark:text-zinc-300">
                Out of Service Violation
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button type="button" onClick={handleCloseAddModal} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : (editingViolation ? 'Update Violation' : 'Add Violation')}
            </button>
          </div>
        </form>
      </Modal>

      {/* DataQ Challenge Modal */}
      <Modal
        isOpen={showDataQModal}
        onClose={() => {
          setShowDataQModal(false);
          setSelectedViolation(null);
        }}
        title="Submit DataQ Challenge"
        icon={FiMessageSquare}
      >
        <form onSubmit={handleDataQSubmit} className="space-y-5">
          <div className="p-4 rounded-xl bg-info-50 dark:bg-info-500/10 border border-info-200 dark:border-info-500/30">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="w-5 h-5 text-info-600 dark:text-info-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-info-800 dark:text-info-300">Challenging Violation:</p>
                <p className="text-sm text-info-700 dark:text-info-400">{selectedViolation?.violationType}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Challenge Type *</label>
            <select name="challengeType" className="form-select" required>
              <option value="">Select Type</option>
              <option value="data_error">Data Error</option>
              <option value="policy_violation">Policy Violation</option>
              <option value="procedural_error">Procedural Error</option>
              <option value="not_responsible">Not Responsible</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Reason for Challenge *</label>
            <textarea
              name="reason"
              className="form-input"
              rows={4}
              required
              placeholder="Explain why you are challenging this violation..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Supporting Documents</label>
            <input
              type="file"
              name="documents"
              className="form-input"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">Upload any supporting evidence (max 5 files)</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setShowDataQModal(false);
                setSelectedViolation(null);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : 'Submit Challenge'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Link Driver Modal */}
      <Modal
        isOpen={showLinkDriverModal}
        onClose={() => {
          setShowLinkDriverModal(false);
          setSelectedViolation(null);
          setSelectedDriverId('');
        }}
        title="Link Driver to Violation"
        icon={FiUserPlus}
      >
        <form onSubmit={handleLinkDriver} className="space-y-5">
          <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-500/30">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="w-5 h-5 text-accent-600 dark:text-accent-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-accent-800 dark:text-accent-300">Violation:</p>
                <p className="text-sm text-accent-700 dark:text-accent-400">{selectedViolation?.violationType}</p>
                <p className="text-xs text-accent-600 dark:text-accent-500 mt-1">
                  {selectedViolation?.violationDate && formatDate(selectedViolation.violationDate)} | {selectedViolation?.basic?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Select Driver *</label>
            <select
              className="form-select"
              required
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
            >
              <option value="">Select a driver...</option>
              {drivers.map((driver) => (
                <option key={driver._id} value={driver._id}>
                  {driver.firstName} {driver.lastName} {driver.employeeId && `(${driver.employeeId})`}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              The selected driver will be associated with this violation for CSA impact tracking.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setShowLinkDriverModal(false);
                setSelectedViolation(null);
                setSelectedDriverId('');
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !selectedDriverId}>
              {submitting ? <LoadingSpinner size="sm" /> : 'Link Driver'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DataQ Letter Modal */}
      {showLetterModal && selectedOpportunity && (
        <DataQLetterModal
          isOpen={showLetterModal}
          onClose={() => {
            setShowLetterModal(false);
            setSelectedOpportunity(null);
          }}
          violation={selectedOpportunity.violation}
          analysis={selectedOpportunity.analysis}
          onSuccess={handleLetterGenerated}
        />
      )}
    </div>
  );
};

export default Violations;
