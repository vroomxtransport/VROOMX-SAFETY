import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehiclesAPI, integrationsAPI, damageClaimsAPI } from '../utils/api';
import { daysUntilExpiry } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiTruck, FiTool, FiClipboard, FiEdit2,
  FiAlertCircle, FiCheck, FiDollarSign, FiShield
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import HealthBadge from '../components/HealthBadge';
import TabButton from '../components/TabButton';

// Tab components
import VehicleOverviewTab from './vehicle-detail/VehicleOverviewTab';
import VehicleMaintenanceTab from './vehicle-detail/VehicleMaintenanceTab';
import VehicleInspectionsTab from './vehicle-detail/VehicleInspectionsTab';
import VehicleSafetyTab from './vehicle-detail/VehicleSafetyTab';
import VehicleClaimsTab from './vehicle-detail/VehicleClaimsTab';

// Modal components
import AddMaintenanceModal from './vehicle-detail/AddMaintenanceModal';
import RecordInspectionModal from './vehicle-detail/RecordInspectionModal';
import EditVehicleModal from './vehicle-detail/EditVehicleModal';

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
        <VehicleOverviewTab
          vehicle={vehicle}
          refreshingTelematics={refreshingTelematics}
          onRefreshTelematics={handleRefreshTelematics}
        />
      )}

      {activeTab === 'maintenance' && (
        <VehicleMaintenanceTab
          vehicle={vehicle}
          onAddMaintenance={() => setMaintenanceModal(true)}
        />
      )}

      {activeTab === 'inspections' && (
        <VehicleInspectionsTab
          vehicle={vehicle}
          onRecordInspection={() => setInspectionModal(true)}
        />
      )}

      {activeTab === 'safety' && (
        <VehicleSafetyTab
          vehicle={vehicle}
          oosData={oosData}
          oosLoading={oosLoading}
        />
      )}

      {activeTab === 'claims' && (
        <VehicleClaimsTab
          claims={vehicleClaims}
          claimsLoading={claimsLoading}
          getClaimStatusColor={getClaimStatusColor}
        />
      )}

      {/* Modals */}
      <AddMaintenanceModal
        isOpen={maintenanceModal}
        onClose={() => setMaintenanceModal(false)}
        formData={maintenanceForm}
        onChange={setMaintenanceForm}
        onSubmit={handleAddMaintenance}
        submitting={submitting}
      />

      <RecordInspectionModal
        isOpen={inspectionModal}
        onClose={() => setInspectionModal(false)}
        onSubmit={handleRecordInspection}
        submitting={submitting}
      />

      <EditVehicleModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        formData={editFormData}
        onChange={setEditFormData}
        onSubmit={handleEditSubmit}
        submitting={editSubmitting}
      />
    </div>
  );
};

export default VehicleDetail;
