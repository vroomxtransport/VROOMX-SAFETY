import { useState, useEffect } from 'react';
import { damageClaimsAPI, driversAPI, vehiclesAPI } from '../utils/api';
import { formatDate, formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiPlus, FiDollarSign, FiUser,
  FiCheck, FiAlertTriangle, FiFileText, FiChevronRight, FiPaperclip
} from 'react-icons/fi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { ClaimForm, ClaimDetailModal, ClaimDeleteModal } from '../components/claims';
import {
  damageTypes, faultParties, statusOptions, initialFormData,
  getStatusBadgeType, getDamageTypeLabel, getFaultLabel
} from '../data/claimOptions';

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
  const [formData, setFormData] = useState(initialFormData);

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
              <p className="text-2xl font-bold text-primary-900 font-mono">{formatCurrency(stats?.totalClaimAmount || 0)}</p>
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
              <p className="text-2xl font-bold text-danger-600 font-mono">{formatCurrency(stats?.driverFaultSettled || 0)}</p>
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
              <p className="text-2xl font-bold text-success-600 font-mono">{formatCurrency(stats?.recovered || 0)}</p>
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
              <p className="text-2xl font-bold text-warning-600 font-mono">{stats?.openClaims || 0}</p>
              <p className="text-xs text-primary-500">Open Claims</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-primary-200/60 p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
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
      <ClaimForm
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditMode(false);
          setSelectedClaim(null);
        }}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        submitting={submitting}
        editMode={editMode}
        drivers={drivers}
        vehicles={vehicles}
        initialFormData={initialFormData}
      />

      {/* Claim Detail Modal */}
      <ClaimDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedClaim(null);
        }}
        claim={selectedClaim}
        onEdit={handleEdit}
        onDelete={() => {
          setShowDetailModal(false);
          setShowDeleteModal(true);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ClaimDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedClaim(null);
        }}
        claim={selectedClaim}
        onDelete={handleDelete}
        submitting={submitting}
      />
    </div>
  );
};

export default DamageClaims;
