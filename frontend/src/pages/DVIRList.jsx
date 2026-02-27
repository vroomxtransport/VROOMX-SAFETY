import { useState, useEffect } from 'react';
import { dvirAPI, driversAPI, vehiclesAPI } from '../utils/api';
import { formatDate, daysUntilExpiry } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiClipboard, FiAlertTriangle, FiCheck, FiTruck, FiUser, FiFilter } from 'react-icons/fi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const DVIRList = () => {
  const [dvirs, setDvirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [defectsOnly, setDefectsOnly] = useState(false);
  const [stats, setStats] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    inspectionType: 'pre_trip',
    date: new Date().toISOString().split('T')[0],
    odometer: '',
    defectsFound: false,
    safeToOperate: true,
    defects: [],
    location: { city: '', state: '' }
  });

  useEffect(() => { fetchDVIRs(); fetchStats(); }, [page, statusFilter, defectsOnly]);

  useEffect(() => {
    // Load drivers and vehicles for form dropdowns
    driversAPI.getAll({ limit: 200, status: 'active' }).then(r => setDrivers(r.data.drivers || [])).catch(() => {});
    vehiclesAPI.getAll({ limit: 200, status: 'active' }).then(r => setVehicles(r.data.vehicles || [])).catch(() => {});
  }, []);

  const fetchDVIRs = async () => {
    setLoading(true);
    try {
      const params = {
        page, limit: 15,
        ...(statusFilter && { status: statusFilter }),
        ...(defectsOnly && { defectsOnly: 'true' })
      };
      const res = await dvirAPI.getAll(params);
      setDvirs(res.data.dvirs || []);
      setTotalPages(res.data.pages || 1);
    } catch { toast.error('Failed to load DVIRs'); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await dvirAPI.getStats();
      setStats(res.data.stats);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await dvirAPI.create(formData);
      toast.success('DVIR created successfully');
      setShowAddModal(false);
      setFormData({
        vehicleId: '', driverId: '', inspectionType: 'pre_trip',
        date: new Date().toISOString().split('T')[0], odometer: '',
        defectsFound: false, safeToOperate: true, defects: [],
        location: { city: '', state: '' }
      });
      fetchDVIRs();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create DVIR');
    } finally { setSubmitting(false); }
  };

  const addDefect = () => {
    setFormData(prev => ({
      ...prev,
      defectsFound: true,
      defects: [...prev.defects, { item: '', description: '', severity: 'minor' }]
    }));
  };

  const updateDefect = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      defects: prev.defects.map((d, i) => i === index ? { ...d, [field]: value } : d)
    }));
  };

  const removeDefect = (index) => {
    setFormData(prev => {
      const defects = prev.defects.filter((_, i) => i !== index);
      return { ...prev, defects, defectsFound: defects.length > 0 };
    });
  };

  const columns = [
    {
      header: 'Date',
      key: 'date',
      render: (row) => (
        <div>
          <p className="text-sm font-mono text-zinc-800 dark:text-zinc-200">{formatDate(row.date)}</p>
          <p className="text-xs text-zinc-500 capitalize">{row.inspectionType?.replace('_', '-')}</p>
        </div>
      )
    },
    {
      header: 'Driver',
      render: (row) => (
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          {row.driverId?.firstName} {row.driverId?.lastName}
        </span>
      )
    },
    {
      header: 'Vehicle',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FiTruck className="w-4 h-4 text-zinc-400" />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">{row.vehicleId?.unitNumber}</span>
        </div>
      )
    },
    {
      header: 'Defects',
      render: (row) => row.defectsFound ? (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 font-medium">
          <FiAlertTriangle className="w-3 h-3" />
          {row.defects?.length || 0} defect{(row.defects?.length || 0) !== 1 ? 's' : ''}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 font-medium">
          <FiCheck className="w-3 h-3" />
          No defects
        </span>
      )
    },
    {
      header: 'Safe',
      render: (row) => (
        <span className={`text-xs font-medium ${row.safeToOperate ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {row.safeToOperate ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      header: 'Status',
      render: (row) => {
        const statusMap = {
          open: { label: 'Open', color: 'text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400' },
          repairs_needed: { label: 'Repairs Needed', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 dark:text-yellow-400' },
          resolved: { label: 'Resolved', color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400' }
        };
        const s = statusMap[row.status] || statusMap.open;
        return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>;
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <FiClipboard className="w-7 h-7 text-accent-500" />
            DVIRs
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">Daily Vehicle Inspection Reports (49 CFR 396.11)</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" /> New DVIR
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total DVIRs', value: stats.total, icon: FiClipboard, color: 'text-primary-600 bg-primary-100 dark:bg-primary-500/10' },
            { label: 'Open Defects', value: stats.openDefects, icon: FiAlertTriangle, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/10' },
            { label: 'This Week', value: stats.thisWeek, icon: FiClipboard, color: 'text-blue-600 bg-blue-100 dark:bg-blue-500/10' },
            { label: 'Resolution Rate', value: `${stats.resolutionRate}%`, icon: FiCheck, color: 'text-green-600 bg-green-100 dark:bg-green-500/10' }
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-auto min-w-[140px]"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="repairs_needed">Repairs Needed</option>
          <option value="resolved">Resolved</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={defectsOnly}
            onChange={(e) => { setDefectsOnly(e.target.checked); setPage(1); }}
            className="w-4 h-4 rounded border-zinc-300 text-accent-600 focus:ring-accent-500"
          />
          Defects only
        </label>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={dvirs}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No DVIRs found"
        emptyIcon={FiClipboard}
        exportable
        exportFilename="dvir-report"
      />

      {/* Add DVIR Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="New DVIR" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Vehicle *</label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData(p => ({ ...p, vehicleId: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Select Vehicle</option>
                {vehicles.map(v => (
                  <option key={v._id} value={v._id}>{v.unitNumber} ({v.vehicleType})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Driver *</label>
              <select
                value={formData.driverId}
                onChange={(e) => setFormData(p => ({ ...p, driverId: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Select Driver</option>
                {drivers.map(d => (
                  <option key={d._id} value={d._id}>{d.firstName} {d.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Inspection Type *</label>
              <select
                value={formData.inspectionType}
                onChange={(e) => setFormData(p => ({ ...p, inspectionType: e.target.value }))}
                className="input-field"
              >
                <option value="pre_trip">Pre-Trip</option>
                <option value="post_trip">Post-Trip</option>
              </select>
            </div>
            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Odometer</label>
              <input
                type="number"
                value={formData.odometer}
                onChange={(e) => setFormData(p => ({ ...p, odometer: e.target.value }))}
                className="input-field"
                placeholder="Current mileage"
              />
            </div>
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.safeToOperate}
                  onChange={(e) => setFormData(p => ({ ...p, safeToOperate: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Safe to Operate</span>
              </label>
            </div>
          </div>

          {/* Defects */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Defects</label>
              <button type="button" onClick={addDefect} className="text-xs text-accent-600 hover:text-accent-700 font-medium">
                + Add Defect
              </button>
            </div>
            {formData.defects.length === 0 ? (
              <p className="text-sm text-zinc-400 italic">No defects reported</p>
            ) : (
              <div className="space-y-3">
                {formData.defects.map((defect, i) => (
                  <div key={i} className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={defect.item}
                        onChange={(e) => updateDefect(i, 'item', e.target.value)}
                        className="input-field flex-1"
                        placeholder="Item (e.g., Brakes)"
                        required
                      />
                      <select
                        value={defect.severity}
                        onChange={(e) => updateDefect(i, 'severity', e.target.value)}
                        className="input-field w-32"
                      >
                        <option value="minor">Minor</option>
                        <option value="major">Major</option>
                        <option value="out_of_service">OOS</option>
                      </select>
                      <button type="button" onClick={() => removeDefect(i)} className="text-red-500 hover:text-red-700 px-2">
                        &times;
                      </button>
                    </div>
                    <input
                      type="text"
                      value={defect.description}
                      onChange={(e) => updateDefect(i, 'description', e.target.value)}
                      className="input-field"
                      placeholder="Describe the defect..."
                      required
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Saving...' : 'Create DVIR'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DVIRList;
