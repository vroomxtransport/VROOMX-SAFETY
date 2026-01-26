import { useState, useEffect } from 'react';
import { accidentsAPI, driversAPI, vehiclesAPI } from '../utils/api';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiPlus, FiSearch, FiAlertOctagon, FiUser, FiTruck, FiCalendar,
  FiEdit2, FiTrash2, FiMapPin, FiFileText, FiDownload, FiEye,
  FiAlertTriangle, FiCheckCircle, FiXCircle, FiMessageSquare
} from 'react-icons/fi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Accidents = () => {
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAccident, setSelectedAccident] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const severityOptions = [
    { value: 'minor', label: 'Minor' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'severe', label: 'Severe' },
    { value: 'fatal', label: 'Fatal' }
  ];

  const accidentTypes = [
    { value: 'rear_end', label: 'Rear End' },
    { value: 'head_on', label: 'Head On' },
    { value: 'sideswipe', label: 'Sideswipe' },
    { value: 'angle', label: 'Angle' },
    { value: 'rollover', label: 'Rollover' },
    { value: 'jackknife', label: 'Jackknife' },
    { value: 'cargo_spill', label: 'Cargo Spill' },
    { value: 'fire', label: 'Fire' },
    { value: 'pedestrian', label: 'Pedestrian' },
    { value: 'cyclist', label: 'Cyclist' },
    { value: 'fixed_object', label: 'Fixed Object' },
    { value: 'animal', label: 'Animal' },
    { value: 'weather_related', label: 'Weather Related' },
    { value: 'other', label: 'Other' }
  ];

  const weatherOptions = [
    { value: 'clear', label: 'Clear' },
    { value: 'rain', label: 'Rain' },
    { value: 'snow', label: 'Snow' },
    { value: 'ice', label: 'Ice' },
    { value: 'fog', label: 'Fog' },
    { value: 'wind', label: 'Wind' },
    { value: 'other', label: 'Other' }
  ];

  const roadOptions = [
    { value: 'dry', label: 'Dry' },
    { value: 'wet', label: 'Wet' },
    { value: 'icy', label: 'Icy' },
    { value: 'snowy', label: 'Snowy' },
    { value: 'construction', label: 'Construction' },
    { value: 'other', label: 'Other' }
  ];

  const [formData, setFormData] = useState({
    accidentDate: new Date().toISOString().split('T')[0],
    accidentTime: '',
    driverId: '',
    vehicleId: '',
    severity: 'minor',
    accidentType: 'other',
    description: '',
    location: { city: '', state: '', address: '' },
    recordableCriteria: {
      fatality: false,
      injury: false,
      towAway: false
    },
    weatherConditions: 'clear',
    roadConditions: 'dry',
    policeReport: {
      filed: false,
      reportNumber: '',
      citationIssued: false,
      citationDetails: ''
    },
    cargoDamage: {
      hazmatSpill: false,
      hazmatDetails: ''
    }
  });

  useEffect(() => {
    fetchAccidents();
    fetchStats();
    fetchRelatedData();
  }, [page, statusFilter, severityFilter]);

  const fetchAccidents = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        ...(statusFilter && { status: statusFilter }),
        ...(severityFilter && { severity: severityFilter }),
        ...(searchQuery && { search: searchQuery })
      };
      const response = await accidentsAPI.getAll(params);
      setAccidents(response.data.accidents || []);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      toast.error('Failed to fetch accidents');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await accidentsAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchRelatedData = async () => {
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        driversAPI.getAll({ limit: 100 }),
        vehiclesAPI.getAll({ limit: 100 })
      ]);
      setDrivers(driversRes.data.drivers);
      setVehicles(vehiclesRes.data.vehicles);
    } catch (error) {
      console.error('Failed to fetch related data');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAccidents();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedAccident && !showDetailModal) {
        await accidentsAPI.update(selectedAccident._id, formData);
        toast.success('Accident updated');
      } else {
        await accidentsAPI.create(formData);
        toast.success('Accident recorded');
      }
      setShowAddModal(false);
      resetForm();
      fetchAccidents();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save accident');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      accidentDate: new Date().toISOString().split('T')[0],
      accidentTime: '',
      driverId: '',
      vehicleId: '',
      severity: 'minor',
      accidentType: 'other',
      description: '',
      location: { city: '', state: '', address: '' },
      recordableCriteria: {
        fatality: false,
        injury: false,
        towAway: false
      },
      weatherConditions: 'clear',
      roadConditions: 'dry',
      policeReport: {
        filed: false,
        reportNumber: '',
        citationIssued: false,
        citationDetails: ''
      },
      cargoDamage: {
        hazmatSpill: false,
        hazmatDetails: ''
      }
    });
    setSelectedAccident(null);
  };

  const openEditModal = (accident) => {
    setSelectedAccident(accident);
    setFormData({
      accidentDate: accident.accidentDate?.split('T')[0] || '',
      accidentTime: accident.accidentTime || '',
      driverId: accident.driverId?._id || accident.driverId || '',
      vehicleId: accident.vehicleId?._id || accident.vehicleId || '',
      severity: accident.severity || 'minor',
      accidentType: accident.accidentType || 'other',
      description: accident.description || '',
      location: accident.location || { city: '', state: '', address: '' },
      recordableCriteria: accident.recordableCriteria || { fatality: false, injury: false, towAway: false },
      weatherConditions: accident.weatherConditions || 'clear',
      roadConditions: accident.roadConditions || 'dry',
      policeReport: accident.policeReport || { filed: false, reportNumber: '', citationIssued: false, citationDetails: '' },
      cargoDamage: accident.cargoDamage || { hazmatSpill: false, hazmatDetails: '' }
    });
    setShowAddModal(true);
  };

  const openDetailModal = async (accident) => {
    try {
      const response = await accidentsAPI.getById(accident._id);
      setSelectedAccident(response.data.accident);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to load accident details');
    }
  };

  const handleDelete = async (accident) => {
    if (!confirm(`Delete this accident record? This cannot be undone.`)) return;
    try {
      await accidentsAPI.delete(accident._id);
      toast.success('Accident deleted');
      fetchAccidents();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete accident');
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'fatal':
        return <StatusBadge status="danger" text="Fatal" />;
      case 'severe':
        return <StatusBadge status="danger" text="Severe" />;
      case 'moderate':
        return <StatusBadge status="warning" text="Moderate" />;
      default:
        return <StatusBadge status="inactive" text="Minor" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'closed':
        return <StatusBadge status="active" text="Closed" />;
      case 'under_investigation':
        return <StatusBadge status="warning" text="Investigating" />;
      default:
        return <StatusBadge status="info" text="Reported" />;
    }
  };

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (accident) => (
        <div className="cursor-pointer" onClick={() => openDetailModal(accident)}>
          <div className="font-medium text-zinc-900 dark:text-white flex items-center gap-2">
            <FiCalendar className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            {formatDate(accident.accidentDate)}
          </div>
          {accident.accidentTime && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400">{accident.accidentTime}</div>
          )}
        </div>
      )
    },
    {
      key: 'driver',
      label: 'Driver',
      render: (accident) => accident.driverId ? (
        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
          <FiUser className="w-4 h-4" />
          {accident.driverId.firstName} {accident.driverId.lastName}
        </div>
      ) : (
        <span className="text-zinc-400 dark:text-zinc-500">-</span>
      )
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (accident) => accident.vehicleId ? (
        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
          <FiTruck className="w-4 h-4" />
          {accident.vehicleId.unitNumber}
        </div>
      ) : (
        <span className="text-zinc-400 dark:text-zinc-500">-</span>
      )
    },
    {
      key: 'location',
      label: 'Location',
      render: (accident) => (
        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
          <FiMapPin className="w-4 h-4" />
          {accident.location?.city && accident.location?.state
            ? `${accident.location.city}, ${accident.location.state}`
            : accident.location?.state || '-'}
        </div>
      )
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (accident) => getSeverityBadge(accident.severity)
    },
    {
      key: 'dotRecordable',
      label: 'DOT Recordable',
      render: (accident) => accident.isDotRecordable ? (
        <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
          <FiAlertTriangle className="w-4 h-4" />
          Yes
        </span>
      ) : (
        <span className="text-zinc-400 dark:text-zinc-500">No</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (accident) => getStatusBadge(accident.status)
    },
    {
      key: 'actions',
      label: '',
      render: (accident) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openDetailModal(accident); }}
            className="p-1 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
            title="View Details"
          >
            <FiEye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openEditModal(accident); }}
            className="p-1 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
            title="Edit"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(accident); }}
            className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Accident Register</h1>
          <p className="text-zinc-600 dark:text-zinc-300">Track accidents per FMCSA 49 CFR 390.15</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="btn btn-primary"
        >
          <FiPlus className="w-5 h-5" />
          Report Accident
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
                <FiAlertOctagon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.total || 0}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Total Accidents</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-lg">
                <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.dotRecordable || 0}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">DOT Recordable</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-500/10 rounded-lg">
                <FiSearch className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.underInvestigation || 0}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Investigating</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg">
                <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.closed || 0}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Closed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search accidents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Status</option>
          <option value="reported">Reported</option>
          <option value="under_investigation">Under Investigation</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Severity</option>
          <option value="minor">Minor</option>
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
          <option value="fatal">Fatal</option>
        </select>
      </div>

      {/* Accidents Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable
          columns={columns}
          data={accidents}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="No accidents recorded"
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title={selectedAccident ? 'Edit Accident Report' : 'Report New Accident'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.accidentDate}
                onChange={(e) => setFormData({ ...formData, accidentDate: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Time</label>
              <input
                type="time"
                value={formData.accidentTime}
                onChange={(e) => setFormData({ ...formData, accidentTime: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Driver and Vehicle */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Driver *</label>
              <select
                required
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Driver</option>
                {drivers.map(driver => (
                  <option key={driver._id} value={driver._id}>
                    {driver.firstName} {driver.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Vehicle *</label>
              <select
                required
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Vehicle</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.unitNumber} - {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Location</h4>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                value={formData.location.city}
                onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="City"
              />
              <input
                type="text"
                required
                maxLength={2}
                value={formData.location.state}
                onChange={(e) => setFormData({ ...formData, location: { ...formData.location, state: e.target.value.toUpperCase() } })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="State *"
              />
              <input
                type="text"
                value={formData.location.address}
                onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Address"
              />
            </div>
          </div>

          {/* Severity and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Severity *</label>
              <select
                required
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {severityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Accident Type</label>
              <select
                value={formData.accidentType}
                onChange={(e) => setFormData({ ...formData, accidentType: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {accidentTypes.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Description *</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe what happened"
            />
          </div>

          {/* DOT Recordable Criteria */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-400 mb-3">DOT Recordable Criteria (Check if applicable)</h4>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={formData.recordableCriteria.fatality}
                  onChange={(e) => setFormData({
                    ...formData,
                    recordableCriteria: { ...formData.recordableCriteria, fatality: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-red-500"
                />
                Fatality
              </label>
              <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={formData.recordableCriteria.injury}
                  onChange={(e) => setFormData({
                    ...formData,
                    recordableCriteria: { ...formData.recordableCriteria, injury: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-red-500"
                />
                Injury (Medical Transport)
              </label>
              <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={formData.recordableCriteria.towAway}
                  onChange={(e) => setFormData({
                    ...formData,
                    recordableCriteria: { ...formData.recordableCriteria, towAway: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-red-500"
                />
                Tow-Away
              </label>
            </div>
            {(formData.recordableCriteria.fatality || formData.recordableCriteria.injury || formData.recordableCriteria.towAway) && (
              <div className="mt-2 text-sm text-red-400 flex items-center gap-2">
                <FiAlertTriangle className="w-4 h-4" />
                This accident will be marked as DOT Recordable
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Weather Conditions</label>
              <select
                value={formData.weatherConditions}
                onChange={(e) => setFormData({ ...formData, weatherConditions: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {weatherOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Road Conditions</label>
              <select
                value={formData.roadConditions}
                onChange={(e) => setFormData({ ...formData, roadConditions: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {roadOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Police Report */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={formData.policeReport.filed}
                  onChange={(e) => setFormData({
                    ...formData,
                    policeReport: { ...formData.policeReport, filed: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-primary-500"
                />
                Police Report Filed
              </label>
              <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={formData.policeReport.citationIssued}
                  onChange={(e) => setFormData({
                    ...formData,
                    policeReport: { ...formData.policeReport, citationIssued: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-primary-500"
                />
                Citation Issued to Driver
              </label>
            </div>
            {formData.policeReport.filed && (
              <input
                type="text"
                value={formData.policeReport.reportNumber}
                onChange={(e) => setFormData({
                  ...formData,
                  policeReport: { ...formData.policeReport, reportNumber: e.target.value }
                })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Police Report Number"
              />
            )}
          </div>

          {/* Hazmat */}
          <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={formData.cargoDamage.hazmatSpill}
              onChange={(e) => setFormData({
                ...formData,
                cargoDamage: { ...formData.cargoDamage, hazmatSpill: e.target.checked }
              })}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-orange-500"
            />
            Hazmat Release/Spill
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className="px-4 py-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Saving...' : (selectedAccident ? 'Update' : 'Report Accident')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedAccident(null); }}
        title="Accident Details"
        size="lg"
      >
        {selectedAccident && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Header with DOT Recordable badge */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                    {formatDate(selectedAccident.accidentDate)}
                    {selectedAccident.accidentTime && ` at ${selectedAccident.accidentTime}`}
                  </h3>
                  {selectedAccident.isDotRecordable && (
                    <span className="px-2 py-1 text-xs font-bold bg-red-500/20 text-red-400 rounded border border-red-500/30">
                      DOT RECORDABLE
                    </span>
                  )}
                </div>
                <div className="text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                  <FiMapPin className="w-4 h-4" />
                  {selectedAccident.location?.city && `${selectedAccident.location.city}, `}
                  {selectedAccident.location?.state}
                </div>
              </div>
              <div className="flex gap-2">
                {getSeverityBadge(selectedAccident.severity)}
                {getStatusBadge(selectedAccident.status)}
              </div>
            </div>

            {/* Driver and Vehicle */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Driver</div>
                <div className="font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                  <FiUser className="w-4 h-4" />
                  {selectedAccident.driverId?.firstName} {selectedAccident.driverId?.lastName}
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Vehicle</div>
                <div className="font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                  <FiTruck className="w-4 h-4" />
                  {selectedAccident.vehicleId?.unitNumber} - {selectedAccident.vehicleId?.make} {selectedAccident.vehicleId?.model}
                </div>
              </div>
            </div>

            {/* Accident Type and Conditions */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Type</div>
                <div className="font-medium text-zinc-900 dark:text-white capitalize">
                  {selectedAccident.accidentType?.replace(/_/g, ' ') || 'Other'}
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Weather</div>
                <div className="font-medium text-zinc-900 dark:text-white capitalize">
                  {selectedAccident.weatherConditions || '-'}
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Road</div>
                <div className="font-medium text-zinc-900 dark:text-white capitalize">
                  {selectedAccident.roadConditions || '-'}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Description</h4>
              <p className="text-zinc-900 dark:text-white">{selectedAccident.description}</p>
            </div>

            {/* DOT Criteria */}
            {selectedAccident.isDotRecordable && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-400 mb-2">DOT Recordable Criteria Met</h4>
                <div className="flex flex-wrap gap-3">
                  {selectedAccident.recordableCriteria?.fatality && (
                    <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">Fatality</span>
                  )}
                  {selectedAccident.recordableCriteria?.injury && (
                    <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">Injury (Medical Transport)</span>
                  )}
                  {selectedAccident.recordableCriteria?.towAway && (
                    <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">Tow-Away</span>
                  )}
                </div>
              </div>
            )}

            {/* Police Report */}
            {selectedAccident.policeReport?.filed && (
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Police Report</h4>
                <div className="text-zinc-900 dark:text-white">
                  Report #: {selectedAccident.policeReport.reportNumber || 'N/A'}
                  {selectedAccident.policeReport.citationIssued && (
                    <span className="ml-3 text-yellow-600 dark:text-yellow-400">Citation Issued</span>
                  )}
                </div>
              </div>
            )}

            {/* Injuries/Fatalities Summary */}
            {(selectedAccident.totalInjuries > 0 || selectedAccident.totalFatalities > 0) && (
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Casualties</h4>
                <div className="flex gap-4">
                  {selectedAccident.totalInjuries > 0 && (
                    <span className="text-yellow-600 dark:text-yellow-400">{selectedAccident.totalInjuries} Injuries</span>
                  )}
                  {selectedAccident.totalFatalities > 0 && (
                    <span className="text-red-600 dark:text-red-400">{selectedAccident.totalFatalities} Fatalities</span>
                  )}
                </div>
              </div>
            )}

            {/* Cost Summary */}
            {selectedAccident.totalEstimatedCost > 0 && (
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Estimated Damages</h4>
                <div className="text-xl font-bold text-zinc-900 dark:text-white">
                  ${selectedAccident.totalEstimatedCost.toLocaleString()}
                </div>
              </div>
            )}

            {/* Investigation */}
            {selectedAccident.investigation?.findings && (
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Investigation Findings</h4>
                <p className="text-zinc-900 dark:text-white">{selectedAccident.investigation.findings}</p>
                {selectedAccident.investigation.preventable !== undefined && (
                  <div className="mt-2 flex items-center gap-2">
                    {selectedAccident.investigation.preventable ? (
                      <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                        <FiXCircle className="w-4 h-4" /> Preventable
                      </span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                        <FiCheckCircle className="w-4 h-4" /> Non-Preventable
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => { setShowDetailModal(false); openEditModal(selectedAccident); }}
                className="flex items-center gap-2 px-4 py-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <FiEdit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
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

export default Accidents;
