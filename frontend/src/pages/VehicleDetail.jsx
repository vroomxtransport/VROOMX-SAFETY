import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehiclesAPI } from '../utils/api';
import { formatDate, formatCurrency, daysUntilExpiry } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPlus, FiTruck, FiTool, FiFileText, FiCalendar, FiUser } from 'react-icons/fi';
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

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchVehicle();
  }, [id]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!vehicle) return null;

  const inspectionDays = daysUntilExpiry(vehicle.annualInspection?.nextDueDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/vehicles')}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiTruck className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{vehicle.unitNumber}</h1>
              <p className="text-zinc-600 dark:text-zinc-300">{vehicle.make} {vehicle.model} {vehicle.year}</p>
            </div>
          </div>
        </div>
        <StatusBadge status={vehicle.complianceStatus?.overall || vehicle.status} className="text-sm px-4 py-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Vehicle Info */}
        <div className="space-y-6">
          {/* Vehicle Details */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">Vehicle Details</h3>
            </div>
            <div className="card-body space-y-3">
              {/* Unit ID / Nickname */}
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">Unit ID / Nickname</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {vehicle.unitNumber}{vehicle.nickname ? ` (${vehicle.nickname})` : ''}
                </span>
              </div>

              {/* VIN */}
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">VIN #</span>
                <span className="font-mono text-xs text-zinc-800 dark:text-zinc-200">{vehicle.vin}</span>
              </div>

              {/* Year / Make / Model */}
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">Year / Make / Model</span>
                <span className="text-zinc-800 dark:text-zinc-200">
                  {vehicle.year || '—'} {vehicle.make || ''} {vehicle.model || ''}
                </span>
              </div>

              {/* Market Price */}
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">Market Price</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {vehicle.marketPrice ? formatCurrency(vehicle.marketPrice) : '—'}
                </span>
              </div>

              {/* Plate Number & State */}
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">Plate Number & State</span>
                <span className="text-zinc-800 dark:text-zinc-200">
                  {vehicle.licensePlate?.number
                    ? `${vehicle.licensePlate.number} ${vehicle.licensePlate.state || ''}`
                    : '—'}
                </span>
              </div>

              {/* Type (Tractor or Trailer) */}
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">Type</span>
                <span className="capitalize text-zinc-800 dark:text-zinc-200">
                  {vehicle.vehicleType?.replace('_', ' ') || '—'}
                </span>
              </div>

              {/* Assigned Driver */}
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-300">Assigned Driver</span>
                {vehicle.assignedDriver ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center">
                      <FiUser className="w-3 h-3 text-accent-600" />
                    </div>
                    <span className="text-zinc-800 dark:text-zinc-200">
                      {typeof vehicle.assignedDriver === 'object'
                        ? `${vehicle.assignedDriver.firstName} ${vehicle.assignedDriver.lastName}`
                        : 'Assigned'}
                    </span>
                  </div>
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500">Unassigned</span>
                )}
              </div>

              {/* Status with Date */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-700">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600 dark:text-zinc-300">Status</span>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusDotColor(vehicle.status)}`}></span>
                    <span className={`capitalize font-medium ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {/* Status Since Date */}
                {vehicle.statusHistory?.length > 0 && (
                  <div className="flex justify-between mt-1">
                    <span className="text-zinc-500 dark:text-zinc-400 text-sm">Status Since</span>
                    <span className="text-zinc-600 dark:text-zinc-300 text-sm">
                      {formatDate(vehicle.statusHistory[vehicle.statusHistory.length - 1]?.changedAt)}
                    </span>
                  </div>
                )}
              </div>

              {/* Odometer if available */}
              {vehicle.currentOdometer?.reading && (
                <div className="flex justify-between pt-2 border-t border-zinc-100 dark:border-zinc-700">
                  <span className="text-zinc-600 dark:text-zinc-300">Odometer</span>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {vehicle.currentOdometer.reading.toLocaleString()} mi
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Annual Inspection */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold">Annual Inspection</h3>
              <button
                onClick={() => setInspectionModal(true)}
                className="btn btn-sm btn-outline"
              >
                Record
              </button>
            </div>
            <div className="card-body">
              <div className="text-center mb-4">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                  inspectionDays < 0 ? 'bg-red-100' :
                  inspectionDays <= 30 ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <FiCalendar className={`w-8 h-8 ${
                    inspectionDays < 0 ? 'text-red-600' :
                    inspectionDays <= 30 ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-300">Last Inspection</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{formatDate(vehicle.annualInspection?.lastInspectionDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-300">Next Due</span>
                  <span className={inspectionDays < 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-zinc-800 dark:text-zinc-200'}>
                    {formatDate(vehicle.annualInspection?.nextDueDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-300">Result</span>
                  <StatusBadge status={vehicle.annualInspection?.result === 'pass' ? 'valid' : 'warning'} />
                </div>
              </div>
            </div>
          </div>

          {/* PM Schedule */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">PM Schedule</h3>
            </div>
            <div className="card-body space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">Last PM</span>
                <span className="text-zinc-800 dark:text-zinc-200">{formatDate(vehicle.pmSchedule?.lastPmDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">Next PM Due</span>
                <span className="text-zinc-800 dark:text-zinc-200">{formatDate(vehicle.pmSchedule?.nextPmDueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">Interval</span>
                <span className="text-zinc-800 dark:text-zinc-200">{vehicle.pmSchedule?.intervalMiles?.toLocaleString() || 25000} mi / {vehicle.pmSchedule?.intervalDays || 90} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">PM Status</span>
                <StatusBadge status={vehicle.complianceStatus?.pmStatus} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Maintenance Log */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold">Maintenance Log</h3>
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
                <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
                  {vehicle.maintenanceLog.slice().reverse().slice(0, 10).map((record, index) => (
                    <div
                      key={index}
                      className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:pl-6 border-l-2 border-transparent hover:border-accent-500 transition-all duration-200 cursor-pointer"
                      onClick={() => {
                        if (record.maintenanceRecordId) {
                          navigate(`/app/maintenance?record=${record.maintenanceRecordId}`);
                        } else {
                          toast.error('This record was created before linking was enabled');
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            record.severity === 'critical' ? 'bg-red-100' :
                            record.severity === 'high' ? 'bg-orange-100' :
                            record.severity === 'moderate' ? 'bg-yellow-100' : 'bg-blue-100'
                          }`}>
                            <FiTool className={`w-5 h-5 ${
                              record.severity === 'critical' ? 'text-red-600' :
                              record.severity === 'high' ? 'text-orange-600' :
                              record.severity === 'moderate' ? 'text-yellow-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">{record.description}</p>
                            <div className="flex items-center space-x-3 text-sm text-zinc-600 dark:text-zinc-300 mt-1">
                              <span>{formatDate(record.date)}</span>
                              <span className="capitalize">{record.maintenanceType}</span>
                              <span className="capitalize">{record.category}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={record.severity} />
                          {record.totalCost && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">{formatCurrency(record.totalCost)}</p>
                          )}
                        </div>
                      </div>
                      {record.odometer && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2 ml-13">
                          Odometer: {record.odometer.toLocaleString()} mi
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-600 dark:text-zinc-300">
                  <FiFileText className="w-12 h-12 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
                  <p>No maintenance records yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
          <div className="flex justify-end space-x-3 pt-4">
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
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setInspectionModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : 'Save Inspection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VehicleDetail;
