import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { driversAPI } from '../utils/api';
import { formatDate, daysUntilExpiry } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiFilter, FiUsers, FiEye, FiCreditCard, FiCalendar, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [complianceFilter, setComplianceFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    employeeId: '',
    hireDate: '',
    cdl: { number: '', state: '', class: 'A', expiryDate: '', endorsements: [] },
    medicalCard: { expiryDate: '' }
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDrivers();
  }, [page, statusFilter, complianceFilter]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        ...(statusFilter && { status: statusFilter }),
        ...(complianceFilter && { complianceStatus: complianceFilter }),
        ...(search && { search })
      };
      const response = await driversAPI.getAll(params);
      setDrivers(response.data.drivers);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDrivers();
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await driversAPI.create(formData);
      toast.success('Driver added successfully');
      setShowAddModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        email: '',
        phone: '',
        employeeId: '',
        hireDate: '',
        cdl: { number: '', state: '', class: 'A', expiryDate: '', endorsements: [] },
        medicalCard: { expiryDate: '' }
      });
      fetchDrivers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add driver');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Driver',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
            <span className="text-zinc-700 dark:text-zinc-200 font-semibold text-sm">
              {row.firstName?.[0]}{row.lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-white">{row.firstName} {row.lastName}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-mono">{row.employeeId}</p>
          </div>
        </div>
      )
    },
    {
      header: 'CDL',
      render: (row) => (
        <div>
          <p className="text-sm font-mono text-zinc-800 dark:text-zinc-200">{row.cdl?.number || 'N/A'}</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">Class {row.cdl?.class} - {row.cdl?.state}</p>
        </div>
      )
    },
    {
      header: 'CDL Expiry',
      render: (row) => {
        const days = daysUntilExpiry(row.cdl?.expiryDate);
        return (
          <div>
            <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300">{formatDate(row.cdl?.expiryDate)}</p>
            {days !== null && days <= 30 && (
              <p className={`text-xs font-medium ${days < 0 ? 'text-danger-600 dark:text-danger-400' : 'text-warning-600 dark:text-warning-400'}`}>
                {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
              </p>
            )}
          </div>
        );
      }
    },
    {
      header: 'Med Card Expiry',
      render: (row) => {
        const days = daysUntilExpiry(row.medicalCard?.expiryDate);
        return (
          <div>
            <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300">{formatDate(row.medicalCard?.expiryDate)}</p>
            {days !== null && days <= 30 && (
              <p className={`text-xs font-medium ${days < 0 ? 'text-danger-600 dark:text-danger-400' : 'text-warning-600 dark:text-warning-400'}`}>
                {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
              </p>
            )}
          </div>
        );
      }
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.complianceStatus?.overall} size="sm" />
    },
    {
      header: '',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/app/drivers/${row._id}`);
          }}
          className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-primary-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          title="View Details"
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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Driver Qualification Files</h1>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm mt-1">Manage driver documents and compliance per 49 CFR 391</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <FiPlus className="w-4 h-4" />
          Add Driver
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 hover:border-primary-300 dark:hover:border-primary-500/30 transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiUsers className="w-5 h-5 text-primary-600 dark:text-zinc-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">{drivers.length || 0}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Total Drivers</p>
            </div>
          </div>
        </div>
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 hover:border-success-300 dark:hover:border-success-500/30 transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiCheckCircle className="w-5 h-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 font-mono">
                {drivers.filter(d => d.complianceStatus?.overall === 'compliant').length}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Compliant</p>
            </div>
          </div>
        </div>
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 hover:border-warning-300 dark:hover:border-warning-500/30 transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiAlertTriangle className="w-5 h-5 text-warning-600 dark:text-warning-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400 font-mono">
                {drivers.filter(d => d.complianceStatus?.overall === 'warning').length}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Expiring Soon</p>
            </div>
          </div>
        </div>
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4 hover:shadow-lg hover:-translate-y-1 hover:border-danger-300 dark:hover:border-danger-500/30 transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger-100 dark:bg-danger-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiAlertTriangle className="w-5 h-5 text-danger-600 dark:text-danger-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 font-mono">
                {drivers.filter(d => d.complianceStatus?.overall === 'non_compliant').length}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Non-Compliant</p>
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
                placeholder="Search by name, employee ID, or CDL..."
                className="form-input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </form>
          <div className="flex gap-3">
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
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
            <select
              className="form-select"
              value={complianceFilter}
              onChange={(e) => {
                setComplianceFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Compliance</option>
              <option value="compliant">Compliant</option>
              <option value="warning">Warning</option>
              <option value="non_compliant">Non-Compliant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={drivers}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/app/drivers/${row._id}`)}
        emptyMessage="No drivers found"
        emptyIcon={FiUsers}
      />

      {/* Add Driver Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Driver"
        icon={FiUsers}
        size="lg"
      >
        <form onSubmit={handleAddDriver} className="space-y-5">
          {/* Personal Info Section */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-primary-100 dark:bg-zinc-800 flex items-center justify-center">
              <FiUsers className="w-3.5 h-3.5 text-primary-600 dark:text-zinc-300" />
            </div>
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Personal Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">First Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Last Name *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Date of Birth *</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Employee ID *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Phone</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Hire Date *</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              />
            </div>
          </div>

          {/* CDL Section */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center">
                <FiCreditCard className="w-3.5 h-3.5 text-accent-600 dark:text-accent-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">CDL Information</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">CDL Number *</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  required
                  value={formData.cdl.number}
                  onChange={(e) => setFormData({
                    ...formData,
                    cdl: { ...formData.cdl, number: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">State *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  maxLength={2}
                  placeholder="TX"
                  value={formData.cdl.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    cdl: { ...formData.cdl, state: e.target.value.toUpperCase() }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Class *</label>
                <select
                  className="form-select"
                  required
                  value={formData.cdl.class}
                  onChange={(e) => setFormData({
                    ...formData,
                    cdl: { ...formData.cdl, class: e.target.value }
                  })}
                >
                  <option value="A">Class A</option>
                  <option value="B">Class B</option>
                  <option value="C">Class C</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">CDL Expiry Date *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={formData.cdl.expiryDate}
                  onChange={(e) => setFormData({
                    ...formData,
                    cdl: { ...formData.cdl, expiryDate: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Medical Card Section */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-success-100 dark:bg-success-500/20 flex items-center justify-center">
                <FiCalendar className="w-3.5 h-3.5 text-success-600 dark:text-success-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Medical Card</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Medical Card Expiry Date *</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.medicalCard.expiryDate}
                onChange={(e) => setFormData({
                  ...formData,
                  medicalCard: { ...formData.medicalCard, expiryDate: e.target.value }
                })}
              />
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
              {submitting ? <LoadingSpinner size="sm" /> : 'Add Driver'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Drivers;
