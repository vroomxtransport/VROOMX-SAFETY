import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehiclesAPI } from '../utils/api';
import { formatDate, daysUntilExpiry } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiTruck, FiEye, FiCheckCircle, FiAlertTriangle, FiTool } from 'react-icons/fi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    unitNumber: '',
    vin: '',
    vehicleType: 'tractor',
    make: '',
    model: '',
    year: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVehicles();
  }, [page, typeFilter, statusFilter]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        ...(typeFilter && { vehicleType: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search })
      };
      const response = await vehiclesAPI.getAll(params);
      setVehicles(response.data.vehicles);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchVehicles();
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await vehiclesAPI.create(formData);
      toast.success('Vehicle added successfully');
      setShowAddModal(false);
      setFormData({
        unitNumber: '',
        vin: '',
        vehicleType: 'tractor',
        make: '',
        model: '',
        year: '',
      });
      fetchVehicles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Unit',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent-100 dark:bg-accent-500/20 rounded-lg flex items-center justify-center">
            <FiTruck className="w-5 h-5 text-accent-600 dark:text-accent-400" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900 dark:text-white">{row.unitNumber}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{row.vehicleType?.replace('_', ' ')}</p>
          </div>
        </div>
      )
    },
    {
      header: 'VIN',
      render: (row) => (
        <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">{row.vin}</span>
      )
    },
    {
      header: 'Make/Model',
      render: (row) => (
        <div>
          <p className="text-sm text-zinc-800 dark:text-zinc-200">{row.make || 'N/A'} {row.model || ''}</p>
          {row.year && <p className="text-xs text-zinc-500 dark:text-zinc-400">{row.year}</p>}
        </div>
      )
    },
    {
      header: 'Annual Inspection',
      render: (row) => {
        const days = daysUntilExpiry(row.annualInspection?.nextDueDate);
        return (
          <div>
            <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300">{formatDate(row.annualInspection?.nextDueDate)}</p>
            {days !== null && (
              <p className={`text-xs font-medium ${days < 0 ? 'text-danger-600 dark:text-danger-400' : days <= 30 ? 'text-warning-600 dark:text-warning-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                {days < 0 ? `Overdue ${Math.abs(days)}d` : `${days}d left`}
              </p>
            )}
          </div>
        );
      }
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.complianceStatus?.overall || row.status} size="sm" />
    },
    {
      header: '',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/vehicles/${row._id}`);
          }}
          className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-primary-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <FiEye className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Vehicle Files</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Manage vehicle maintenance and inspections per 49 CFR 396</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <FiPlus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center">
              <FiTruck className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">{vehicles.length || 0}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Vehicles</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-500/20 flex items-center justify-center">
              <FiCheckCircle className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success-600 font-mono">
                {vehicles.filter(v => v.status === 'active').length}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-500/20 flex items-center justify-center">
              <FiTool className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warning-600 font-mono">
                {vehicles.filter(v => v.status === 'maintenance').length}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Maintenance</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger-100 dark:bg-danger-500/20 flex items-center justify-center">
              <FiAlertTriangle className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-danger-600 font-mono">
                {vehicles.filter(v => v.status === 'out_of_service').length}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Out of Service</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by unit number, VIN, make..."
                className="form-input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </form>
          <div className="flex gap-3">
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Types</option>
              <option value="tractor">Tractor</option>
              <option value="trailer">Trailer</option>
              <option value="straight_truck">Straight Truck</option>
            </select>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="out_of_service">Out of Service</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={vehicles}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/vehicles/${row._id}`)}
        emptyMessage="No vehicles found"
        emptyIcon={FiTruck}
      />

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Vehicle"
        icon={FiTruck}
      >
        <form onSubmit={handleAddVehicle} className="space-y-5">
          {/* Basic Info Section */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center">
              <FiTruck className="w-3.5 h-3.5 text-accent-600 dark:text-accent-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Vehicle Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Unit Number *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Truck #18"
                value={formData.unitNumber}
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Vehicle Type *</label>
              <select
                className="form-select"
                required
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
              >
                <option value="tractor">Tractor</option>
                <option value="trailer">Trailer</option>
                <option value="straight_truck">Straight Truck</option>
                <option value="bus">Bus</option>
                <option value="van">Van</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">VIN (17 characters) *</label>
            <input
              type="text"
              className="form-input font-mono"
              required
              minLength={17}
              maxLength={17}
              placeholder="1XP5DB9X6YD527178"
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
            />
          </div>

          {/* Details Section */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-primary-100 dark:bg-zinc-800 flex items-center justify-center">
                <FiTool className="w-3.5 h-3.5 text-primary-600 dark:text-zinc-300" />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Make</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Freightliner"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Model</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Cascadia"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Year</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="2023"
                  min="1950"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Vehicles;
