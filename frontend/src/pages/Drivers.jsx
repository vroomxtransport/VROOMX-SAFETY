import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { driversAPI } from '../utils/api';
import { formatDate, daysUntilExpiry } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiFilter, FiUsers, FiEye, FiCreditCard, FiCalendar, FiCheckCircle, FiAlertTriangle, FiEdit2, FiTrash2, FiRotateCcw } from 'react-icons/fi';
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
    hireDate: '',
    driverType: 'company_driver',
    address: { street: '', city: '', state: '', zipCode: '' },
    cdl: { number: '', state: '', class: 'A', expiryDate: '', endorsements: [], restrictions: [] },
    medicalCard: { expiryDate: '' },
    mvrExpiryDate: '',
    clearinghouseExpiry: '',
    terminationDate: '',
    status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const navigate = useNavigate();

  const initialFormData = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    hireDate: '',
    driverType: 'company_driver',
    address: { street: '', city: '', state: '', zipCode: '' },
    cdl: { number: '', state: '', class: 'A', expiryDate: '', endorsements: [], restrictions: [] },
    medicalCard: { expiryDate: '' },
    mvrExpiryDate: '',
    clearinghouseExpiry: '',
    terminationDate: '',
    status: 'active'
  };

  const [activeTab, setActiveTab] = useState('active');
  const [archivedDrivers, setArchivedDrivers] = useState([]);
  const [archivedCount, setArchivedCount] = useState(0);
  const [pagination, setPagination] = useState(null);

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
      setPagination(response.data.pagination || null);
      // Also get archived count
      driversAPI.getAll({ archived: 'true', limit: 1 }).then(res => {
        setArchivedCount(res.data.pagination?.total || 0);
      }).catch(() => {});
    } catch (error) {
      toast.error('Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedDrivers = async () => {
    try {
      const res = await driversAPI.getAll({ archived: 'true' });
      setArchivedDrivers(res.data.drivers || []);
      setArchivedCount(res.data.pagination?.total || res.data.drivers?.length || 0);
    } catch (err) {
      toast.error('Failed to load archived drivers');
    }
  };

  const handleNestedChange = (e) => {
    const [parent, child] = e.target.name.split('.');
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [child]: e.target.value }
    }));
  };

  const handleRestore = async (driverId) => {
    try {
      await api.patch(`/drivers/${driverId}/restore`);
      toast.success('Driver restored successfully');
      fetchArchivedDrivers();
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore driver');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDrivers();
  };

  const handleSubmitDriver = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        cdl: {
          ...formData.cdl,
          endorsements: formData.cdl?.endorsements || [],
          restrictions: formData.cdl?.restrictions || []
        },
        clearinghouse: {
          expiryDate: formData.clearinghouseExpiry || undefined
        }
      };
      if (selectedDriver) {
        await driversAPI.update(selectedDriver._id, payload);
        toast.success('Driver updated successfully');
      } else {
        await driversAPI.create(payload);
        toast.success('Driver added successfully');
      }
      setShowAddModal(false);
      setSelectedDriver(null);
      setFormData(initialFormData);
      fetchDrivers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save driver');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (driver) => {
    setSelectedDriver(driver);
    setFormData({
      firstName: driver.firstName || '',
      lastName: driver.lastName || '',
      dateOfBirth: driver.dateOfBirth ? driver.dateOfBirth.split('T')[0] : '',
      email: driver.email || '',
      phone: driver.phone || '',
      hireDate: driver.hireDate ? driver.hireDate.split('T')[0] : '',
      driverType: driver.driverType || 'company_driver',
      address: {
        street: driver.address?.street || '',
        city: driver.address?.city || '',
        state: driver.address?.state || '',
        zipCode: driver.address?.zipCode || ''
      },
      cdl: {
        number: driver.cdl?.number || '',
        state: driver.cdl?.state || '',
        class: driver.cdl?.class || 'A',
        expiryDate: driver.cdl?.expiryDate ? driver.cdl.expiryDate.split('T')[0] : '',
        endorsements: driver.cdl?.endorsements || [],
        restrictions: driver.cdl?.restrictions || []
      },
      medicalCard: {
        expiryDate: driver.medicalCard?.expiryDate ? driver.medicalCard.expiryDate.split('T')[0] : ''
      },
      mvrExpiryDate: driver.mvrExpiryDate ? driver.mvrExpiryDate.split('T')[0] : '',
      clearinghouseExpiry: driver.clearinghouse?.expiryDate ? driver.clearinghouse.expiryDate.split('T')[0] : '',
      terminationDate: driver.terminationDate ? driver.terminationDate.split('T')[0] : '',
      status: driver.status || 'active'
    });
    setShowAddModal(true);
  };

  const handleDelete = async (driver) => {
    if (!confirm(`Delete driver "${driver.firstName} ${driver.lastName}"? This cannot be undone.`)) return;
    try {
      await driversAPI.delete(driver._id);
      toast.success('Driver deleted successfully');
      fetchDrivers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete driver');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedDriver(null);
    setFormData(initialFormData);
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
        <div className="flex items-center space-x-1">
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-lg transition-colors"
            title="Edit Driver"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete Driver"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
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

      {/* Tab Bar */}
      <div className="flex gap-1 mb-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 w-fit">
        <button onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'active' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}>
          Active Drivers {drivers.length > 0 && <span className="ml-1.5 text-xs bg-zinc-200 dark:bg-zinc-600 px-1.5 py-0.5 rounded-full">{pagination?.total || drivers.length}</span>}
        </button>
        <button onClick={() => { setActiveTab('archived'); fetchArchivedDrivers(); }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'archived' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}>
          Archived {archivedCount > 0 && <span className="ml-1.5 text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full">{archivedCount}</span>}
        </button>
      </div>

      {activeTab === 'active' && (<>
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

      </>)}

      {activeTab === 'archived' && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
          {archivedDrivers.length === 0 ? (
            <div className="p-12 text-center">
              <FiUsers className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">No archived drivers</p>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">Terminated drivers will appear here after archival</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Driver</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Termination Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Retention</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {archivedDrivers.map(driver => {
                    const retentionDate = driver.retentionExpiresAt ? new Date(driver.retentionExpiresAt) : null;
                    const canDelete = retentionDate && retentionDate < new Date();
                    return (
                      <tr key={driver._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                              <span className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm">
                                {driver.firstName?.[0]}{driver.lastName?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-white">{driver.firstName} {driver.lastName}</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">{driver.email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            Terminated
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300 font-mono">
                          {driver.terminationDate ? formatDate(driver.terminationDate) : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          {retentionDate ? (
                            canDelete ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                Safe to delete
                              </span>
                            ) : (
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                Can be deleted after {retentionDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">No retention date</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRestore(driver._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-lg transition-colors"
                            title="Restore Driver"
                          >
                            <FiRotateCcw className="w-3.5 h-3.5" />
                            Restore
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
      )}

      {/* Add/Edit Driver Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={selectedDriver ? 'Edit Driver' : 'Add New Driver'}
        icon={FiUsers}
        size="lg"
      >
        <form onSubmit={handleSubmitDriver} className="space-y-5">
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
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Driver Type</label>
              <select name="driverType" value={formData.driverType} onChange={(e) => setFormData({ ...formData, driverType: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-cta focus:border-cta">
                <option value="company_driver">Company Driver</option>
                <option value="owner_operator">Owner-Operator</option>
              </select>
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

            {/* Address Section */}
            <div className="col-span-2 border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-2">
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-3">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Street</label>
                  <input type="text" name="address.street" value={formData.address?.street || ''} onChange={handleNestedChange}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">City</label>
                  <input type="text" name="address.city" value={formData.address?.city || ''} onChange={handleNestedChange}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">State</label>
                    <input type="text" name="address.state" value={formData.address?.state || ''} onChange={handleNestedChange} maxLength={2}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 uppercase" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">ZIP</label>
                    <input type="text" name="address.zipCode" value={formData.address?.zipCode || ''} onChange={handleNestedChange}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                  </div>
                </div>
              </div>
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
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">CDL Endorsements</label>
                <div className="flex flex-wrap gap-2">
                  {['H', 'N', 'P', 'S', 'T', 'X'].map(end => (
                    <label key={end} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                      <input type="checkbox" checked={formData.cdl?.endorsements?.includes(end) || false}
                        onChange={(e) => {
                          const current = formData.cdl?.endorsements || [];
                          const updated = e.target.checked ? [...current, end] : current.filter(x => x !== end);
                          setFormData(prev => ({ ...prev, cdl: { ...prev.cdl, endorsements: updated } }));
                        }}
                        className="rounded text-cta focus:ring-cta" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-200">{end}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">CDL Restrictions</label>
                <input type="text" name="cdlRestrictions" value={formData.cdl?.restrictions?.join(', ') || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cdl: { ...prev.cdl, restrictions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))}
                  placeholder="e.g. L, Z (comma-separated)"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
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

          {/* Compliance Dates Section */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-warning-100 dark:bg-warning-500/20 flex items-center justify-center">
                <FiCalendar className="w-3.5 h-3.5 text-warning-600 dark:text-warning-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Compliance Dates</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">MVR Expiry Date</label>
                <input type="date" name="mvrExpiryDate" value={formData.mvrExpiryDate || ''} onChange={(e) => setFormData({ ...formData, mvrExpiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Clearinghouse Exp.</label>
                <input type="date" name="clearinghouseExpiry" value={formData.clearinghouseExpiry || ''} onChange={(e) => setFormData({ ...formData, clearinghouseExpiry: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
              </div>
              {selectedDriver && formData.status === 'terminated' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Termination Date</label>
                  <input type="date" name="terminationDate" value={formData.terminationDate || ''} onChange={(e) => setFormData({ ...formData, terminationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : (selectedDriver ? 'Update Driver' : 'Add Driver')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Drivers;
