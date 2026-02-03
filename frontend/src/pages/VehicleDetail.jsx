import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehiclesAPI, integrationsAPI, damageClaimsAPI } from '../utils/api';
import { formatDate, formatCurrency, daysUntilExpiry } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiPlus, FiTruck, FiTool, FiFileText, FiCalendar,
  FiUser, FiMapPin, FiRefreshCw, FiDroplet, FiActivity, FiEdit2,
  FiClipboard, FiAlertCircle, FiCheck, FiClock, FiSettings, FiDollarSign,
  FiShield
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

// Helper to get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'text-green-600 dark:text-green-400';
    case 'inactive': return 'text-zinc-500 dark:text-zinc-400';
    case 'maintenance': return 'text-yellow-600 dark:text-yellow-400';
    case 'out_of_service': return 'text-red-600 dark:text-red-400';
    case 'sold': return 'text-blue-600 dark:text-blue-400';
    default: return 'text-zinc-600 dark:text-zinc-300';
  }
};

// Helper to get status dot color
const getStatusDotColor = (status) => {
  switch (status) {
    case 'active': return 'bg-green-500';
    case 'inactive': return 'bg-zinc-400';
    case 'maintenance': return 'bg-yellow-500';
    case 'out_of_service': return 'bg-red-500';
    case 'sold': return 'bg-blue-500';
    default: return 'bg-zinc-400';
  }
};

const getClaimStatusColor = (status) => {
  const colors = {
    open: 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400',
    under_investigation: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    pending_settlement: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    settled: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    closed: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300',
    denied: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
  };
  return colors[status] || colors.closed;
};

// Health status badge component
const HealthBadge = ({ label, days, type = 'days' }) => {
  let bgColor, textColor, icon;

  if (days === null || days === undefined) {
    bgColor = 'bg-zinc-100 dark:bg-zinc-800';
    textColor = 'text-zinc-500 dark:text-zinc-400';
    icon = <FiClock className="w-4 h-4" />;
  } else if (days < 0) {
    bgColor = 'bg-red-100 dark:bg-red-500/20';
    textColor = 'text-red-600 dark:text-red-400';
    icon = <FiAlertCircle className="w-4 h-4" />;
  } else if (days <= 30) {
    bgColor = 'bg-yellow-100 dark:bg-yellow-500/20';
    textColor = 'text-yellow-600 dark:text-yellow-400';
    icon = <FiAlertCircle className="w-4 h-4" />;
  } else {
    bgColor = 'bg-green-100 dark:bg-green-500/20';
    textColor = 'text-green-600 dark:text-green-400';
    icon = <FiCheck className="w-4 h-4" />;
  }

  const displayValue = days === null || days === undefined
    ? 'Not set'
    : days < 0
      ? `${Math.abs(days)}d overdue`
      : `${days}d`;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bgColor}`}>
      <span className={textColor}>{icon}</span>
      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className={`text-sm font-semibold ${textColor}`}>{displayValue}</p>
      </div>
    </div>
  );
};

// Tab button component
const TabButton = ({ active, onClick, children, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
      active
        ? 'bg-primary-500 text-white shadow-md'
        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
    }`}
  >
    {Icon && <Icon className="w-4 h-4" />}
    {children}
  </button>
);

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [maintenanceModal, setMaintenanceModal] = useState(false);
  const [inspectionModal, setInspectionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    maintenanceType: 'repair',
    category: 'other',
    description: '',
    severity: 'moderate',
    odometer: '',
    totalCost: ''
  });
  const [refreshingTelematics, setRefreshingTelematics] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [vehicleClaims, setVehicleClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [oosData, setOosData] = useState(null);
  const [oosLoading, setOosLoading] = useState(true);

  useEffect(() => {
    fetchVehicle();
    fetchVehicleClaims();
    fetchOOSData();
  }, [id]);

  // Auto-refresh telematics from Samsara when viewing a linked vehicle
  useEffect(() => {
    if (vehicle?.samsaraId && !loading) {
      integrationsAPI.refreshTelematics(vehicle._id)
        .then(res => {
          setVehicle(prev => ({
            ...prev,
            samsaraTelematics: res.data.telematics
          }));
        })
        .catch(err => {
          console.error('Auto-refresh telematics failed:', err);
        });
    }
  }, [vehicle?.samsaraId, vehicle?._id, loading]);

  const fetchVehicle = async () => {
    try {
      const response = await vehiclesAPI.getById(id);
      setVehicle(response.data.vehicle);
    } catch (error) {
      toast.error('Failed to load vehicle details');
      navigate('/app/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleClaims = async () => {
    if (!id) return;
    setClaimsLoading(true);
    try {
      const response = await damageClaimsAPI.getAll({ vehicleId: id, limit: 50 });
      setVehicleClaims(response.data.claims || []);
    } catch (error) {
      console.error('Failed to fetch vehicle claims:', error);
    } finally {
      setClaimsLoading(false);
    }
  };

  const fetchOOSData = async () => {
    setOosLoading(true);
    try {
      const response = await vehiclesAPI.getOOSStats(id);
      setOosData(response.data);
    } catch (error) {
      console.error('Failed to fetch OOS data:', error);
      setOosData(null);
    } finally {
      setOosLoading(false);
    }
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await vehiclesAPI.addMaintenance(id, maintenanceForm);
      toast.success('Maintenance record added');
      setMaintenanceModal(false);
      setMaintenanceForm({
        date: new Date().toISOString().split('T')[0],
        maintenanceType: 'repair',
        category: 'other',
        description: '',
        severity: 'moderate',
        odometer: '',
        totalCost: ''
      });
      fetchVehicle();
    } catch (error) {
      toast.error('Failed to add maintenance record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordInspection = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setSubmitting(true);
    try {
      await vehiclesAPI.recordInspection(id, formData);
      toast.success('Inspection recorded successfully');
      setInspectionModal(false);
      fetchVehicle();
    } catch (error) {
      toast.error('Failed to record inspection');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshTelematics = async () => {
    setRefreshingTelematics(true);
    try {
      const response = await integrationsAPI.refreshTelematics(id);
      setVehicle(prev => ({
        ...prev,
        samsaraTelematics: response.data.telematics
      }));
      toast.success('Telematics updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to refresh telematics');
    } finally {
      setRefreshingTelematics(false);
    }
  };

  const openEditModal = () => {
    if (!vehicle) return;
    setEditFormData({
      unitNumber: vehicle.unitNumber || '',
      nickname: vehicle.nickname || '',
      vin: vehicle.vin || '',
      vehicleType: vehicle.vehicleType || 'tractor',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      marketPrice: vehicle.marketPrice || '',
      licensePlate: {
        number: vehicle.licensePlate?.number || '',
        state: vehicle.licensePlate?.state || ''
      },
      status: vehicle.status || 'active',
      color: vehicle.color || '',
      dateAddedToFleet: vehicle.dateAddedToFleet ? vehicle.dateAddedToFleet.slice(0, 10) : '',
      dateRemovedFromFleet: vehicle.dateRemovedFromFleet ? vehicle.dateRemovedFromFleet.slice(0, 10) : '',
      cabCardExpiry: vehicle.cabCardExpiry ? vehicle.cabCardExpiry.slice(0, 10) : '',
      annualExpiry: vehicle.annualExpiry ? vehicle.annualExpiry.slice(0, 10) : '',
      gvwr: vehicle.gvwr || '',
      tireSize: vehicle.tireSize || '',
      ownership: vehicle.ownership || 'owned',
      iftaDecalNumber: vehicle.iftaDecalNumber || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      await vehiclesAPI.update(id, editFormData);
      toast.success('Vehicle updated successfully');
      setShowEditModal(false);
      fetchVehicle();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update vehicle');
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!vehicle) return null;

  const inspectionDays = daysUntilExpiry(vehicle.annualInspection?.nextDueDate);
  const pmDays = daysUntilExpiry(vehicle.pmSchedule?.nextPmDueDate);
  const cabCardDays = daysUntilExpiry(vehicle.cabCardExpiry);

  // Calculate overall health score
  const getOverallHealth = () => {
    const issues = [];
    if (inspectionDays !== null && inspectionDays < 0) issues.push('expired');
    else if (inspectionDays !== null && inspectionDays <= 30) issues.push('warning');
    if (pmDays !== null && pmDays < 0) issues.push('expired');
    else if (pmDays !== null && pmDays <= 30) issues.push('warning');
    if (cabCardDays !== null && cabCardDays < 0) issues.push('expired');
    else if (cabCardDays !== null && cabCardDays <= 30) issues.push('warning');

    if (issues.includes('expired')) return { status: 'critical', label: 'Needs Attention', color: 'red' };
    if (issues.includes('warning')) return { status: 'warning', label: 'Upcoming Expirations', color: 'yellow' };
    return { status: 'good', label: 'All Good', color: 'green' };
  };

  const health = getOverallHealth();

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Back + Vehicle Identity */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app/vehicles')}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>

            {/* Vehicle Icon with Status Ring */}
            <div className="relative">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                health.color === 'red' ? 'bg-red-100 dark:bg-red-500/20' :
                health.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-500/20' :
                'bg-green-100 dark:bg-green-500/20'
              }`}>
                <FiTruck className={`w-8 h-8 ${
                  health.color === 'red' ? 'text-red-600 dark:text-red-400' :
                  health.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`} />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900 ${getStatusDotColor(vehicle.status)}`} />
            </div>

            {/* Vehicle Info */}
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{vehicle.unitNumber}</h1>
              <p className="text-zinc-600 dark:text-zinc-300">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusDotColor(vehicle.status)} bg-opacity-20 ${getStatusColor(vehicle.status)}`}>
                  {vehicle.status?.replace('_', ' ')}
                </span>
                {vehicle.vehicleType && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 capitalize">
                    {vehicle.vehicleType.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openEditModal}
              className="btn btn-secondary btn-sm"
            >
              <FiEdit2 className="w-4 h-4 mr-1.5" />
              Edit
            </button>
            <button
              onClick={() => setMaintenanceModal(true)}
              className="btn btn-secondary btn-sm"
            >
              <FiTool className="w-4 h-4 mr-1.5" />
              Add Maintenance
            </button>
            <button
              onClick={() => setInspectionModal(true)}
              className="btn btn-primary btn-sm"
            >
              <FiClipboard className="w-4 h-4 mr-1.5" />
              Record Inspection
            </button>
          </div>
        </div>

        {/* Health Summary Bar */}
        <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-3">
            {/* Overall Status */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              health.color === 'red' ? 'bg-red-100 dark:bg-red-500/20' :
              health.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-500/20' :
              'bg-green-100 dark:bg-green-500/20'
            }`}>
              {health.color === 'red' ? (
                <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              ) : health.color === 'yellow' ? (
                <FiAlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <FiCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              )}
              <span className={`text-sm font-semibold ${
                health.color === 'red' ? 'text-red-600 dark:text-red-400' :
                health.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                'text-green-600 dark:text-green-400'
              }`}>
                {health.label}
              </span>
            </div>

            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />

            {/* Expiration Badges */}
            <HealthBadge label="Annual Inspection" days={inspectionDays} />
            <HealthBadge label="PM Schedule" days={pmDays} />
            <HealthBadge label="Cab Card" days={cabCardDays} />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl w-fit">
        <TabButton
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          icon={FiTruck}
        >
          Overview
        </TabButton>
        <TabButton
          active={activeTab === 'maintenance'}
          onClick={() => setActiveTab('maintenance')}
          icon={FiTool}
        >
          Maintenance
          {vehicle.maintenanceLog?.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
              {vehicle.maintenanceLog.length}
            </span>
          )}
        </TabButton>
        <TabButton
          active={activeTab === 'inspections'}
          onClick={() => setActiveTab('inspections')}
          icon={FiClipboard}
        >
          Inspections
        </TabButton>
        <TabButton
          active={activeTab === 'safety'}
          onClick={() => setActiveTab('safety')}
          icon={FiShield}
        >
          Safety
          {oosData && oosData.totalViolations > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
              {oosData.totalViolations}
            </span>
          )}
        </TabButton>
        <TabButton
          active={activeTab === 'claims'}
          onClick={() => setActiveTab('claims')}
          icon={FiDollarSign}
        >
          Claims
          {vehicleClaims.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
              {vehicleClaims.length}
            </span>
          )}
        </TabButton>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Information Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center gap-2">
                <FiTruck className="w-4 h-4 text-primary-500" />
                Vehicle Information
              </h3>
            </div>
            <div className="card-body space-y-4">
              {/* Identity Section */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Unit ID</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {vehicle.unitNumber}{vehicle.nickname ? ` (${vehicle.nickname})` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">VIN</span>
                  <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">{vehicle.vin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Year / Make / Model</span>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {vehicle.year || '—'} {vehicle.make || ''} {vehicle.model || ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">License Plate</span>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {vehicle.licensePlate?.number
                      ? `${vehicle.licensePlate.number} (${vehicle.licensePlate.state || ''})`
                      : '—'}
                  </span>
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800" />

              {/* Specs Section */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Color</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{vehicle.color || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">GVWR</span>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {vehicle.gvwr ? `${Number(vehicle.gvwr).toLocaleString()} lbs` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Tire Size</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{vehicle.tireSize || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Ownership</span>
                  <span className="capitalize text-zinc-900 dark:text-zinc-100">{vehicle.ownership || '—'}</span>
                </div>
                {vehicle.marketPrice && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Market Price</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(vehicle.marketPrice)}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800" />

              {/* Assignment Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600 dark:text-zinc-400">Assigned Driver</span>
                  {vehicle.assignedDriver ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-accent-100 dark:bg-accent-500/20 rounded-full flex items-center justify-center">
                        <FiUser className="w-3 h-3 text-accent-600 dark:text-accent-400" />
                      </div>
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {typeof vehicle.assignedDriver === 'object'
                          ? `${vehicle.assignedDriver.firstName} ${vehicle.assignedDriver.lastName}`
                          : 'Assigned'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500">Unassigned</span>
                  )}
                </div>
                {vehicle.currentOdometer?.reading && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Current Odometer</span>
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {vehicle.currentOdometer.reading.toLocaleString()} mi
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compliance & Dates Card */}
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold flex items-center gap-2">
                  <FiCalendar className="w-4 h-4 text-primary-500" />
                  Compliance & Dates
                </h3>
              </div>
              <div className="card-body space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Added to Fleet</span>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {vehicle.dateAddedToFleet ? formatDate(vehicle.dateAddedToFleet) : '—'}
                  </span>
                </div>
                {vehicle.dateRemovedFromFleet && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Removed from Fleet</span>
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {formatDate(vehicle.dateRemovedFromFleet)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Cab Card Expiry</span>
                  <span className={`font-medium ${cabCardDays !== null && cabCardDays < 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {vehicle.cabCardExpiry ? formatDate(vehicle.cabCardExpiry) : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Annual Expiry</span>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {vehicle.annualExpiry ? formatDate(vehicle.annualExpiry) : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">IFTA Decal #</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{vehicle.iftaDecalNumber || '—'}</span>
                </div>
              </div>
            </div>

            {/* Samsara Telematics Card */}
            {vehicle.samsaraId && (
              <div className="card border-l-4 border-l-orange-500">
                <div className="card-header flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/images/integrations/samsara.svg" alt="Samsara" className="w-5 h-5" />
                    <h3 className="font-semibold">Live Telematics</h3>
                  </div>
                  <button
                    onClick={handleRefreshTelematics}
                    disabled={refreshingTelematics}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    title="Refresh telematics"
                  >
                    <FiRefreshCw className={`w-4 h-4 ${refreshingTelematics ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="card-body">
                  {vehicle.samsaraTelematics ? (
                    <div className="space-y-4">
                      {vehicle.samsaraTelematics.currentMileage && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <FiActivity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-zinc-600 dark:text-zinc-400">Mileage</span>
                          </div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {vehicle.samsaraTelematics.currentMileage.toLocaleString()} mi
                          </span>
                        </div>
                      )}

                      {vehicle.samsaraTelematics.location && (
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                              <FiMapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-zinc-600 dark:text-zinc-400">Location</span>
                          </div>
                          <div className="text-right max-w-[180px]">
                            {vehicle.samsaraTelematics.location.address ? (
                              <a
                                href={`https://www.google.com/maps?q=${vehicle.samsaraTelematics.location.latitude},${vehicle.samsaraTelematics.location.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-accent-600 hover:underline"
                              >
                                {vehicle.samsaraTelematics.location.address}
                              </a>
                            ) : (
                              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                {vehicle.samsaraTelematics.location.latitude?.toFixed(4)}, {vehicle.samsaraTelematics.location.longitude?.toFixed(4)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {vehicle.samsaraTelematics.fuelPercent !== undefined && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center">
                                <FiDroplet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              </div>
                              <span className="text-zinc-600 dark:text-zinc-400">Fuel</span>
                            </div>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {vehicle.samsaraTelematics.fuelPercent}%
                            </span>
                          </div>
                          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                vehicle.samsaraTelematics.fuelPercent > 50 ? 'bg-green-500' :
                                vehicle.samsaraTelematics.fuelPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${vehicle.samsaraTelematics.fuelPercent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {vehicle.samsaraTelematics.lastUpdated && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          Updated: {new Date(vehicle.samsaraTelematics.lastUpdated).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">No telematics data yet</p>
                      <button
                        onClick={handleRefreshTelematics}
                        disabled={refreshingTelematics}
                        className="mt-2 text-accent-600 hover:underline text-sm"
                      >
                        {refreshingTelematics ? 'Loading...' : 'Fetch from Samsara'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <FiTool className="w-4 h-4 text-primary-500" />
              Maintenance Log
            </h3>
            <button
              onClick={() => setMaintenanceModal(true)}
              className="btn btn-primary btn-sm"
            >
              <FiPlus className="w-4 h-4 mr-1" />
              Add Record
            </button>
          </div>
          <div className="card-body p-0">
            {vehicle.maintenanceLog?.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {vehicle.maintenanceLog.slice().reverse().map((record, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (record.maintenanceRecordId) {
                        navigate(`/app/maintenance?record=${record.maintenanceRecordId}`);
                      } else {
                        toast.error('This record was created before linking was enabled');
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          record.severity === 'critical' ? 'bg-red-100 dark:bg-red-500/20' :
                          record.severity === 'high' ? 'bg-orange-100 dark:bg-orange-500/20' :
                          record.severity === 'moderate' ? 'bg-yellow-100 dark:bg-yellow-500/20' : 'bg-blue-100 dark:bg-blue-500/20'
                        }`}>
                          <FiTool className={`w-5 h-5 ${
                            record.severity === 'critical' ? 'text-red-600 dark:text-red-400' :
                            record.severity === 'high' ? 'text-orange-600 dark:text-orange-400' :
                            record.severity === 'moderate' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">{record.description}</p>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            <span>{formatDate(record.date)}</span>
                            <span>•</span>
                            <span className="capitalize">{record.maintenanceType}</span>
                            <span>•</span>
                            <span className="capitalize">{record.category}</span>
                          </div>
                          {record.odometer && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                              {record.odometer.toLocaleString()} mi
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <StatusBadge status={record.severity} />
                        {record.totalCost && (
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                            {formatCurrency(record.totalCost)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                  <FiTool className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">No maintenance records</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">
                  Keep track of all repairs, inspections, and preventive maintenance for this vehicle.
                </p>
                <button
                  onClick={() => setMaintenanceModal(true)}
                  className="btn btn-primary"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Add First Record
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'inspections' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Annual Inspection Card */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <FiClipboard className="w-4 h-4 text-primary-500" />
                Annual Inspection
              </h3>
              <button
                onClick={() => setInspectionModal(true)}
                className="btn btn-sm btn-outline"
              >
                Record New
              </button>
            </div>
            <div className="card-body">
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                  inspectionDays !== null && inspectionDays < 0 ? 'bg-red-100 dark:bg-red-500/20' :
                  inspectionDays !== null && inspectionDays <= 30 ? 'bg-yellow-100 dark:bg-yellow-500/20' : 'bg-green-100 dark:bg-green-500/20'
                }`}>
                  <FiCalendar className={`w-10 h-10 ${
                    inspectionDays !== null && inspectionDays < 0 ? 'text-red-600 dark:text-red-400' :
                    inspectionDays !== null && inspectionDays <= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                  }`} />
                </div>
                <p className={`mt-3 text-lg font-semibold ${
                  inspectionDays !== null && inspectionDays < 0 ? 'text-red-600 dark:text-red-400' :
                  inspectionDays !== null && inspectionDays <= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {inspectionDays === null ? 'Not scheduled' :
                   inspectionDays < 0 ? `${Math.abs(inspectionDays)} days overdue` :
                   inspectionDays === 0 ? 'Due today' :
                   `${inspectionDays} days remaining`}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Last Inspection</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{formatDate(vehicle.annualInspection?.lastInspectionDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Next Due</span>
                  <span className={inspectionDays !== null && inspectionDays < 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-zinc-900 dark:text-zinc-100'}>
                    {formatDate(vehicle.annualInspection?.nextDueDate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600 dark:text-zinc-400">Last Result</span>
                  <StatusBadge status={vehicle.annualInspection?.result === 'pass' ? 'valid' : 'warning'} />
                </div>
              </div>
            </div>
          </div>

          {/* PM Schedule Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center gap-2">
                <FiSettings className="w-4 h-4 text-primary-500" />
                PM Schedule
              </h3>
            </div>
            <div className="card-body">
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
                  pmDays !== null && pmDays < 0 ? 'bg-red-100 dark:bg-red-500/20' :
                  pmDays !== null && pmDays <= 30 ? 'bg-yellow-100 dark:bg-yellow-500/20' : 'bg-green-100 dark:bg-green-500/20'
                }`}>
                  <FiSettings className={`w-10 h-10 ${
                    pmDays !== null && pmDays < 0 ? 'text-red-600 dark:text-red-400' :
                    pmDays !== null && pmDays <= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                  }`} />
                </div>
                <p className={`mt-3 text-lg font-semibold ${
                  pmDays !== null && pmDays < 0 ? 'text-red-600 dark:text-red-400' :
                  pmDays !== null && pmDays <= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {pmDays === null ? 'Not scheduled' :
                   pmDays < 0 ? `${Math.abs(pmDays)} days overdue` :
                   pmDays === 0 ? 'Due today' :
                   `${pmDays} days remaining`}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Last PM</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{formatDate(vehicle.pmSchedule?.lastPmDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Next PM Due</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{formatDate(vehicle.pmSchedule?.nextPmDueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Interval</span>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {vehicle.pmSchedule?.intervalMiles?.toLocaleString() || 25000} mi / {vehicle.pmSchedule?.intervalDays || 90} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600 dark:text-zinc-400">Status</span>
                  <StatusBadge status={vehicle.complianceStatus?.pmStatus} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'safety' && (
        <div className="space-y-6">
          {/* Vehicle Safety - OOS Rate */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <FiShield className="w-4 h-4 text-primary-500" />
                Safety Record
              </h3>
              {oosData && oosData.totalViolations > 0 && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  oosData.oosRate > 20 ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20' :
                  oosData.oosRate > 10 ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/20' :
                  'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20'
                }`}>
                  {oosData.oosRate.toFixed(1)}% OOS Rate
                </span>
              )}
            </div>
            <div className="card-body">
              {oosLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="sm" />
                </div>
              ) : oosData && oosData.totalViolations > 0 ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                      <p className="text-3xl font-bold text-zinc-900 dark:text-white">{oosData.totalViolations}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Violations</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-500/10 rounded-xl">
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">{oosData.oosViolations}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Out of Service</p>
                    </div>
                    <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                      <p className={`text-3xl font-bold ${
                        oosData.oosRate > 20 ? 'text-red-600 dark:text-red-400' :
                        oosData.oosRate > 10 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-green-600 dark:text-green-400'
                      }`}>{oosData.oosRate.toFixed(1)}%</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">OOS Rate</p>
                    </div>
                  </div>

                  {/* BASIC Breakdown */}
                  {oosData.basicBreakdown && Object.keys(oosData.basicBreakdown).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">BASIC Categories</p>
                      <div className="space-y-2">
                        {Object.entries(oosData.basicBreakdown)
                          .filter(([, data]) => data.count > 0)
                          .sort((a, b) => b[1].count - a[1].count)
                          .map(([basic, data]) => (
                            <div key={basic} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                              <span className="text-sm text-zinc-700 dark:text-zinc-300">{data.name}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">{data.count} violations</span>
                                {data.oosCount > 0 && (
                                  <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded">
                                    {data.oosCount} OOS
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Violations */}
                  {oosData.recentViolations?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">Recent Violations</p>
                      <div className="space-y-2">
                        {oosData.recentViolations.map((violation) => (
                          <div key={violation._id} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{violation.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(violation.date)}</span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">•</span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{violation.basic?.replace('_', ' ')}</span>
                                {violation.outOfService && (
                                  <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded">OOS</span>
                                )}
                              </div>
                              {violation.driver && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                  Driver: {violation.driver.firstName} {violation.driver.lastName}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                    <FiShield className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">Clean Record</h3>
                  <p className="text-zinc-500 dark:text-zinc-400">No violations linked to this vehicle</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'claims' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Claims</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{vehicleClaims.length}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Open Claims</p>
              <p className="text-2xl font-bold text-warning-600">
                {vehicleClaims.filter(c => ['open', 'under_investigation', 'pending_settlement'].includes(c.status)).length}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Amount</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                ${vehicleClaims.reduce((sum, c) => sum + (c.claimAmount || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Claims List */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center gap-2">
                <FiDollarSign className="w-4 h-4 text-primary-500" />
                Damage Claims
              </h3>
            </div>
            <div className="card-body">
              {claimsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : vehicleClaims.length === 0 ? (
                <div className="text-center py-8">
                  <FiDollarSign className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No claims found for this vehicle</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicleClaims.map(claim => (
                    <a
                      key={claim._id}
                      href={`/app/damage-claims?claimId=${claim._id}`}
                      className="block bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-primary-300 dark:hover:border-primary-600"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">{claim.claimNumber}</p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {new Date(claim.incidentDate).toLocaleDateString()} • {claim.damageType?.replace('_', ' ')}
                          </p>
                          {claim.driverId && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                              Driver: {claim.driverId.firstName} {claim.driverId.lastName}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getClaimStatusColor(claim.status)}`}>
                            {claim.status?.replace('_', ' ')}
                          </span>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">
                            ${claim.claimAmount?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                      {claim.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2">{claim.description}</p>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Maintenance Modal */}
      <Modal
        isOpen={maintenanceModal}
        onClose={() => setMaintenanceModal(false)}
        title="Add Maintenance Record"
      >
        <form onSubmit={handleAddMaintenance} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                required
                value={maintenanceForm.date}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Type *</label>
              <select
                className="form-select"
                required
                value={maintenanceForm.maintenanceType}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenanceType: e.target.value })}
              >
                <option value="preventive">Preventive</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
                <option value="recall">Recall</option>
                <option value="breakdown">Breakdown</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={maintenanceForm.category}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, category: e.target.value })}
              >
                <option value="brakes">Brakes</option>
                <option value="tires">Tires</option>
                <option value="engine">Engine</option>
                <option value="transmission">Transmission</option>
                <option value="electrical">Electrical</option>
                <option value="lights">Lights</option>
                <option value="suspension">Suspension</option>
                <option value="steering">Steering</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Severity</label>
              <select
                className="form-select"
                value={maintenanceForm.severity}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, severity: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Description *</label>
            <textarea
              className="form-input"
              rows={3}
              required
              placeholder="Describe the maintenance performed..."
              value={maintenanceForm.description}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Odometer</label>
              <input
                type="number"
                className="form-input"
                placeholder="Current mileage"
                value={maintenanceForm.odometer}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, odometer: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Total Cost</label>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                step="0.01"
                value={maintenanceForm.totalCost}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, totalCost: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setMaintenanceModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : 'Add Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Inspection Modal */}
      <Modal
        isOpen={inspectionModal}
        onClose={() => setInspectionModal(false)}
        title="Record Annual Inspection"
      >
        <form onSubmit={handleRecordInspection} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Inspection Date *</label>
              <input
                type="date"
                name="inspectionDate"
                className="form-input"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="form-label">Result *</label>
              <select name="result" className="form-select" required>
                <option value="pass">Pass</option>
                <option value="pass_with_defects">Pass with Defects</option>
                <option value="fail">Fail</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Inspector Name *</label>
            <input type="text" name="inspectorName" className="form-input" required />
          </div>
          <div>
            <label className="form-label">Inspector Number</label>
            <input type="text" name="inspectorNumber" className="form-input" />
          </div>
          <div>
            <label className="form-label">Location</label>
            <input type="text" name="location" className="form-input" placeholder="Shop name or address" />
          </div>
          <div>
            <label className="form-label">Inspection Report (PDF)</label>
            <input type="file" name="document" className="form-input" accept=".pdf,.jpg,.jpeg,.png" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setInspectionModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : 'Save Inspection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Vehicle"
        icon={FiTruck}
        size="lg"
      >
        {editFormData && (
          <form onSubmit={handleEditSubmit} className="space-y-5">
            {/* Vehicle Identity Section */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-primary-100 dark:bg-zinc-800 flex items-center justify-center">
                <FiTruck className="w-3.5 h-3.5 text-primary-600 dark:text-zinc-300" />
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
                  value={editFormData.unitNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, unitNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nickname</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.nickname}
                  onChange={(e) => setEditFormData({ ...editFormData, nickname: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">VIN *</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  required
                  value={editFormData.vin}
                  onChange={(e) => setEditFormData({ ...editFormData, vin: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Vehicle Type</label>
                <select
                  value={editFormData.vehicleType}
                  onChange={(e) => setEditFormData({ ...editFormData, vehicleType: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="tractor">Tractor</option>
                  <option value="trailer">Trailer</option>
                  <option value="straight_truck">Straight Truck</option>
                  <option value="bus">Bus</option>
                  <option value="van">Van</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">In Maintenance</option>
                  <option value="out_of_service">Out of Service</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Year</label>
                <input
                  type="number"
                  className="form-input"
                  min="1900"
                  max="2100"
                  value={editFormData.year}
                  onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Make</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.make}
                  onChange={(e) => setEditFormData({ ...editFormData, make: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Model</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.model}
                  onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Color</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.color}
                  onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
                />
              </div>
            </div>

            {/* License Plate Section */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center">
                  <FiFileText className="w-3.5 h-3.5 text-accent-600 dark:text-accent-400" />
                </div>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">License & Registration</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">License Plate</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.licensePlate.number}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      licensePlate: { ...editFormData.licensePlate, number: e.target.value.toUpperCase() }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Plate State</label>
                  <input
                    type="text"
                    className="form-input"
                    maxLength={2}
                    value={editFormData.licensePlate.state}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      licensePlate: { ...editFormData.licensePlate, state: e.target.value.toUpperCase() }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Cab Card Expiry</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editFormData.cabCardExpiry}
                    onChange={(e) => setEditFormData({ ...editFormData, cabCardExpiry: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Annual Expiry</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editFormData.annualExpiry}
                    onChange={(e) => setEditFormData({ ...editFormData, annualExpiry: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">IFTA Decal Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.iftaDecalNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, iftaDecalNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Specs Section */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-success-100 dark:bg-success-500/20 flex items-center justify-center">
                  <FiSettings className="w-3.5 h-3.5 text-success-600 dark:text-success-400" />
                </div>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Specifications</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">GVWR (lbs)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editFormData.gvwr}
                    onChange={(e) => setEditFormData({ ...editFormData, gvwr: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Tire Size</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.tireSize}
                    onChange={(e) => setEditFormData({ ...editFormData, tireSize: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Ownership</label>
                  <select
                    value={editFormData.ownership}
                    onChange={(e) => setEditFormData({ ...editFormData, ownership: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="owned">Owned</option>
                    <option value="leased">Leased</option>
                    <option value="rented">Rented</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Market Price</label>
                  <input
                    type="number"
                    className="form-input"
                    step="0.01"
                    value={editFormData.marketPrice}
                    onChange={(e) => setEditFormData({ ...editFormData, marketPrice: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Dates Section */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-warning-100 dark:bg-warning-500/20 flex items-center justify-center">
                  <FiCalendar className="w-3.5 h-3.5 text-warning-600 dark:text-warning-400" />
                </div>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Fleet Dates</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Date Added to Fleet</label>
                  <input
                    type="date"
                    value={editFormData.dateAddedToFleet}
                    onChange={(e) => setEditFormData({ ...editFormData, dateAddedToFleet: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                {(editFormData.status === 'sold' || editFormData.status === 'inactive') && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Date Removed from Fleet</label>
                    <input
                      type="date"
                      value={editFormData.dateRemovedFromFleet}
                      onChange={(e) => setEditFormData({ ...editFormData, dateRemovedFromFleet: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                {editSubmitting ? <LoadingSpinner size="sm" /> : 'Update Vehicle'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default VehicleDetail;
