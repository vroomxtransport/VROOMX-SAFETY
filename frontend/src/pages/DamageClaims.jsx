import { useState, useEffect } from 'react';
import { damageClaimsAPI, driversAPI, vehiclesAPI } from '../utils/api';
import { formatDate, formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiPlus, FiCalendar, FiDollarSign, FiUser, FiTruck,
  FiCheck, FiAlertTriangle, FiFileText, FiEdit2, FiTrash2,
  FiChevronRight, FiInfo, FiUpload, FiPaperclip
} from 'react-icons/fi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const DamageClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [stats, setStats] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const initialFormData = {
    incidentDate: new Date().toISOString().split('T')[0],
    claimNumber: '',
    vehicleId: '',
    driverId: '',
    tripId: '',
    damageType: 'cargo_damage',
    faultParty: 'unknown',
    status: 'open',
    description: '',
    claimAmount: 0,
    settlementAmount: 0,
    insuranceClaimNumber: '',
    location: '',
    resolutionNotes: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const damageTypes = [
    { value: 'cargo_damage', label: 'Cargo Damage' },
    { value: 'vehicle_damage', label: 'Vehicle Damage' },
    { value: 'property_damage', label: 'Property Damage' },
    { value: 'third_party', label: 'Third Party Damage' },
    { value: 'other', label: 'Other' }
  ];

  const faultParties = [
    { value: 'unknown', label: 'UNKNOWN' },
    { value: 'driver', label: 'DRIVER' },
    { value: 'company', label: 'COMPANY' },
    { value: 'third_party', label: 'THIRD PARTY' },
    { value: 'weather', label: 'WEATHER/ACT OF GOD' },
    { value: 'mechanical', label: 'MECHANICAL FAILURE' }
  ];

  const statusOptions = [
    { value: 'open', label: 'OPEN' },
    { value: 'under_investigation', label: 'UNDER INVESTIGATION' },
    { value: 'pending_settlement', label: 'PENDING SETTLEMENT' },
    { value: 'settled', label: 'SETTLED' },
    { value: 'closed', label: 'CLOSED' },
    { value: 'denied', label: 'DENIED' }
  ];

  useEffect(() => {
    fetchClaims();
    fetchStats();
    fetchDrivers();
    fetchVehicles();
  }, [page, statusFilter, driverFilter]);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        ...(statusFilter && { status: statusFilter }),
        ...(driverFilter && { driverId: driverFilter })
      };
      const response = await damageClaimsAPI.getAll(params);
      setClaims(response.data.claims);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to fetch claims');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await damageClaimsAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await driversAPI.getAll({ status: 'active', limit: 100 });
      setDrivers(response.data.drivers);
    } catch (error) {
      console.error('Failed to fetch drivers');
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await vehiclesAPI.getAll({ status: 'active', limit: 100 });
      setVehicles(response.data.vehicles);
    } catch (error) {
      console.error('Failed to fetch vehicles');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        claimAmount: parseFloat(formData.claimAmount) || 0,
        settlementAmount: parseFloat(formData.settlementAmount) || 0
      };

      // Remove empty optional fields
      if (!submitData.vehicleId) delete submitData.vehicleId;
      if (!submitData.driverId) delete submitData.driverId;
      if (!submitData.claimNumber) delete submitData.claimNumber;

      if (editMode && selectedClaim) {
        await damageClaimsAPI.update(selectedClaim._id, submitData);
        toast.success('Claim updated successfully');
      } else {
        await damageClaimsAPI.create(submitData);
        toast.success('Claim created successfully');
      }
      setShowAddModal(false);
      setFormData(initialFormData);
      setEditMode(false);
      setSelectedClaim(null);
      fetchClaims();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save claim');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (claim) => {
    setFormData({
      incidentDate: claim.incidentDate?.split('T')[0] || '',
      claimNumber: claim.claimNumber || '',
      vehicleId: claim.vehicleId?._id || '',
      driverId: claim.driverId?._id || '',
      tripId: claim.tripId || '',
      damageType: claim.damageType || 'cargo_damage',
      faultParty: claim.faultParty || 'unknown',
      status: claim.status || 'open',
      description: claim.description || '',
      claimAmount: claim.claimAmount || 0,
      settlementAmount: claim.settlementAmount || 0,
      insuranceClaimNumber: claim.insuranceClaimNumber || '',
      location: claim.location || '',
      resolutionNotes: claim.resolutionNotes || ''
    });
    setSelectedClaim(claim);
    setEditMode(true);
    setShowDetailModal(false);
    setShowAddModal(true);
  };

  const handleDelete = async () => {
    if (!selectedClaim) return;
    setSubmitting(true);
    try {
      await damageClaimsAPI.delete(selectedClaim._id);
      toast.success('Claim deleted successfully');
      setShowDeleteModal(false);
      setSelectedClaim(null);
      fetchClaims();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete claim');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeType = (status) => {
    switch (status) {
      case 'open': return 'warning';
      case 'under_investigation': return 'info';
      case 'pending_settlement': return 'info';
      case 'settled': return 'success';
      case 'closed': return 'success';
      case 'denied': return 'danger';
      default: return 'default';
    }
  };

  const getDamageTypeLabel = (type) => {
    return damageTypes.find(t => t.value === type)?.label || type;
  };

  const getFaultLabel = (fault) => {
    return faultParties.find(f => f.value === fault)?.label || fault;
  };

  const columns = [
    {
      header: 'Claim #',
      render: (row) => (
        <div>
          <span className="font-mono text-sm font-semibold text-primary-800">{row.claimNumber}</span>
          <p className="text-xs text-primary-400">{formatDate(row.incidentDate)}</p>
        </div>
      )
    },
    {
      header: 'Driver',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.driverId ? (
            <>
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-600">
                {row.driverId?.firstName?.[0]}{row.driverId?.lastName?.[0]}
              </div>
              <span className="text-sm text-primary-800 font-medium">
                {row.driverId.firstName} {row.driverId.lastName}
              </span>
            </>
          ) : (
            <span className="text-sm text-primary-400">Not assigned</span>
          )}
        </div>
      )
    },
    {
      header: 'Type',
      render: (row) => (
        <span className="text-sm text-primary-700 capitalize">
          {getDamageTypeLabel(row.damageType)}
        </span>
      )
    },
    {
      header: 'Description',
      render: (row) => (
        <p className="text-sm text-primary-700 truncate max-w-xs">{row.description}</p>
      )
    },
    {
      header: 'Fault',
      render: (row) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded ${
          row.faultParty === 'driver' ? 'bg-danger-100 text-danger-700' :
          row.faultParty === 'third_party' ? 'bg-info-100 text-info-700' :
          row.faultParty === 'unknown' ? 'bg-primary-100 text-primary-600' :
          'bg-warning-100 text-warning-700'
        }`}>
          {getFaultLabel(row.faultParty)}
        </span>
      )
    },
    {
      header: 'Amount',
      render: (row) => (
        <div className="text-right">
          <p className="font-mono text-sm font-semibold text-primary-800">
            {formatCurrency(row.claimAmount)}
          </p>
          {row.settlementAmount > 0 && (
            <p className="text-xs text-success-600">Settled: {formatCurrency(row.settlementAmount)}</p>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <StatusBadge
          status={statusOptions.find(s => s.value === row.status)?.label || row.status}
          type={getStatusBadgeType(row.status)}
          size="sm"
        />
      )
    },
    {
      header: 'Files',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.documents?.length > 0 ? (
            <span className="text-xs text-primary-500 flex items-center gap-1">
              <FiPaperclip className="w-3 h-3" />
              {row.documents.length}
            </span>
          ) : (
            <span className="text-xs text-primary-400">-</span>
          )}
        </div>
      )
    },
    {
      header: '',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedClaim(row);
            setShowDetailModal(true);
          }}
          className="p-2 text-primary-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          title="View Details"
        >
          <FiChevronRight className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
            <FiAlertTriangle className="w-7 h-7 text-danger-500" />
            Damage Claims
          </h1>
          <p className="text-primary-500 text-sm mt-1">Track and manage cargo, vehicle, and property damage claims</p>
        </div>
        <button
          onClick={() => {
            setFormData(initialFormData);
            setEditMode(false);
            setSelectedClaim(null);
            setShowAddModal(true);
          }}
          className="btn btn-primary"
        >
          <FiPlus className="w-4 h-4" />
          New Claim
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-primary-200/60 p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900 font-mono">
                {formatCurrency(stats?.totalClaimAmount || 0)}
              </p>
              <p className="text-xs text-primary-500">Total Claimed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-primary-200/60 p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center">
              <FiUser className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-danger-600 font-mono">
                {formatCurrency(stats?.driverFaultSettled || 0)}
              </p>
              <p className="text-xs text-primary-500">Driver Fault (Paid)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-primary-200/60 p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
              <FiCheck className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success-600 font-mono">
                {formatCurrency(stats?.recovered || 0)}
              </p>
              <p className="text-xs text-primary-500">Recovered</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-primary-200/60 p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
              <FiFileText className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warning-600 font-mono">
                {stats?.openClaims || 0}
              </p>
              <p className="text-xs text-primary-500">Open Claims</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="bg-white rounded-xl border border-primary-200/60 p-4"
        style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
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
            {drivers.map((driver) => (
              <option key={driver._id} value={driver._id}>
                {driver.firstName} {driver.lastName}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-primary-400 mt-3">
          {stats?.totalClaims || 0} of {stats?.totalClaims || 0} claims
        </p>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={claims}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No claims found"
        emptyIcon={FiAlertTriangle}
        onRowClick={(row) => {
          setSelectedClaim(row);
          setShowDetailModal(true);
        }}
      />

      {/* Add/Edit Claim Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditMode(false);
          setSelectedClaim(null);
          setFormData(initialFormData);
        }}
        title={editMode ? 'Edit Damage Claim' : 'New Damage Claim'}
        icon={FiAlertTriangle}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Incident Date & Claim Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Incident Date *</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.incidentDate}
                onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Claim Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="Auto-generated if empty"
                value={formData.claimNumber}
                onChange={(e) => setFormData({ ...formData, claimNumber: e.target.value })}
              />
            </div>
          </div>

          {/* Truck & Driver Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Assign to Truck</label>
              <select
                className="form-select"
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              >
                <option value="">-- Select Truck --</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle._id} value={vehicle._id}>
                    Unit #{vehicle.unitNumber} - {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Assign to Driver</label>
              <select
                className="form-select"
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
              >
                <option value="">-- Select Driver --</option>
                {drivers.map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.firstName} {driver.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Related Trip */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Related Trip (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Trip ID or reference"
              value={formData.tripId}
              onChange={(e) => setFormData({ ...formData, tripId: e.target.value })}
            />
          </div>

          {/* Damage Type & Fault Party */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Damage Type *</label>
              <select
                className="form-select"
                required
                value={formData.damageType}
                onChange={(e) => setFormData({ ...formData, damageType: e.target.value })}
              >
                {damageTypes.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Fault Party *</label>
              <select
                className="form-select"
                required
                value={formData.faultParty}
                onChange={(e) => setFormData({ ...formData, faultParty: e.target.value })}
              >
                {faultParties.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Status *</label>
            <select
              className="form-select"
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Description *</label>
            <textarea
              className="form-input"
              rows={3}
              required
              placeholder="Describe the damage incident..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Claim Amount ($) *</label>
              <input
                type="number"
                className="form-input font-mono"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.claimAmount}
                onChange={(e) => setFormData({ ...formData, claimAmount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Settlement Amount ($)</label>
              <input
                type="number"
                className="form-input font-mono"
                min="0"
                step="0.01"
                placeholder="If settled"
                value={formData.settlementAmount}
                onChange={(e) => setFormData({ ...formData, settlementAmount: e.target.value })}
              />
            </div>
          </div>

          {/* Insurance & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Insurance Claim Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="Insurance reference #"
                value={formData.insuranceClaimNumber}
                onChange={(e) => setFormData({ ...formData, insuranceClaimNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Location of Incident</label>
              <input
                type="text"
                className="form-input"
                placeholder="Address or location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          {/* Resolution Notes */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Resolution Notes</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Notes about claim resolution..."
              value={formData.resolutionNotes}
              onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-primary-100">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setEditMode(false);
                setSelectedClaim(null);
                setFormData(initialFormData);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : (editMode ? 'Save Changes' : 'Save Claim')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Claim Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedClaim(null);
        }}
        title="Claim Details"
        icon={FiAlertTriangle}
        size="lg"
      >
        {selectedClaim && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-lg font-bold text-primary-900">{selectedClaim.claimNumber}</p>
                <p className="text-sm text-primary-500">{formatDate(selectedClaim.incidentDate)}</p>
              </div>
              <StatusBadge
                status={statusOptions.find(s => s.value === selectedClaim.status)?.label || selectedClaim.status}
                type={getStatusBadgeType(selectedClaim.status)}
              />
            </div>

            {/* Driver & Vehicle */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-primary-50 border border-primary-200">
                <p className="text-xs text-primary-500 mb-1">Driver</p>
                {selectedClaim.driverId ? (
                  <p className="text-sm font-medium text-primary-900">
                    {selectedClaim.driverId.firstName} {selectedClaim.driverId.lastName}
                  </p>
                ) : (
                  <p className="text-sm text-primary-400">Not assigned</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-primary-50 border border-primary-200">
                <p className="text-xs text-primary-500 mb-1">Vehicle</p>
                {selectedClaim.vehicleId ? (
                  <p className="text-sm font-medium text-primary-900">
                    Unit #{selectedClaim.vehicleId.unitNumber}
                  </p>
                ) : (
                  <p className="text-sm text-primary-400">Not assigned</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl bg-warning-50 border border-warning-200">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  selectedClaim.faultParty === 'driver' ? 'bg-danger-100 text-danger-700' :
                  'bg-primary-100 text-primary-600'
                }`}>
                  {getFaultLabel(selectedClaim.faultParty)}
                </span>
                <span className="text-xs text-primary-500">
                  {getDamageTypeLabel(selectedClaim.damageType)}
                </span>
              </div>
              <p className="text-sm text-primary-800">{selectedClaim.description}</p>
              {selectedClaim.location && (
                <p className="text-xs text-primary-500 mt-2">Location: {selectedClaim.location}</p>
              )}
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-white border border-primary-200">
                <p className="text-xs text-primary-500 mb-1">Claim Amount</p>
                <p className="text-xl font-bold font-mono text-primary-900">
                  {formatCurrency(selectedClaim.claimAmount)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white border border-primary-200">
                <p className="text-xs text-primary-500 mb-1">Settlement Amount</p>
                <p className="text-xl font-bold font-mono text-success-600">
                  {formatCurrency(selectedClaim.settlementAmount)}
                </p>
              </div>
            </div>

            {/* Insurance Info */}
            {selectedClaim.insuranceClaimNumber && (
              <div className="p-3 rounded-lg bg-info-50 border border-info-200">
                <p className="text-xs text-info-600 mb-1">Insurance Claim #</p>
                <p className="text-sm font-mono text-info-800">{selectedClaim.insuranceClaimNumber}</p>
              </div>
            )}

            {/* Resolution Notes */}
            {selectedClaim.resolutionNotes && (
              <div className="p-3 rounded-lg bg-success-50 border border-success-200">
                <p className="text-xs text-success-600 mb-1">Resolution Notes</p>
                <p className="text-sm text-success-800">{selectedClaim.resolutionNotes}</p>
              </div>
            )}

            {/* Documents */}
            {selectedClaim.documents?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-primary-700 mb-2">Attached Files</p>
                <div className="space-y-2">
                  {selectedClaim.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded bg-primary-50 border border-primary-200">
                      <FiPaperclip className="w-4 h-4 text-primary-500" />
                      <span className="text-sm text-primary-700">{doc.originalName || doc.filename}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-primary-100">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setShowDeleteModal(true);
                }}
                className="btn btn-secondary text-danger-600 hover:text-danger-700 hover:bg-danger-50"
              >
                <FiTrash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={() => handleEdit(selectedClaim)}
                className="btn btn-primary"
              >
                <FiEdit2 className="w-4 h-4" />
                Edit Claim
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedClaim(null);
        }}
        title="Delete Claim"
        icon={FiTrash2}
      >
        <div className="space-y-4">
          <p className="text-primary-700">
            Are you sure you want to delete this damage claim? This action cannot be undone.
          </p>
          <div className="p-4 rounded-xl bg-danger-50 border border-danger-200">
            <p className="font-mono font-semibold text-danger-900">{selectedClaim?.claimNumber}</p>
            <p className="text-sm text-danger-700 mt-1">{selectedClaim?.description}</p>
            <p className="text-sm text-danger-600 mt-1 font-mono">
              {formatCurrency(selectedClaim?.claimAmount)}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-primary-100">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedClaim(null);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-primary bg-danger-600 hover:bg-danger-700"
              disabled={submitting}
            >
              {submitting ? <LoadingSpinner size="sm" /> : 'Delete Claim'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DamageClaims;
