import { useState, useEffect } from 'react';
import { FiUsers, FiTruck, FiCheck, FiPlus, FiX, FiLink, FiChevronDown } from 'react-icons/fi';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import api, { driversAPI, vehiclesAPI } from '../utils/api';
import toast from 'react-hot-toast';

const SamsaraMatchingModal = ({ isOpen, onClose, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [pendingRecords, setPendingRecords] = useState({ drivers: [], vehicles: [] });
  const [existingDrivers, setExistingDrivers] = useState([]);
  const [existingVehicles, setExistingVehicles] = useState([]);
  const [processing, setProcessing] = useState({});
  const [activeTab, setActiveTab] = useState('drivers');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, driversRes, vehiclesRes] = await Promise.all([
        api.get('/integrations/samsara/pending'),
        driversAPI.getAll({ limit: 500 }),
        vehiclesAPI.getAll({ limit: 500 })
      ]);

      setPendingRecords(pendingRes.data);
      setExistingDrivers(driversRes.data.drivers || []);
      setExistingVehicles(vehiclesRes.data.vehicles || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async (samsaraRecordId, vroomxRecordId, recordType) => {
    setProcessing(prev => ({ ...prev, [samsaraRecordId]: true }));
    try {
      await api.post('/integrations/samsara/match', {
        samsaraRecordId,
        vroomxRecordId,
        recordType
      });
      toast.success('Record matched successfully');
      // Remove from pending list
      setPendingRecords(prev => ({
        ...prev,
        [recordType + 's']: prev[recordType + 's'].filter(r => r._id !== samsaraRecordId)
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to match record');
    } finally {
      setProcessing(prev => ({ ...prev, [samsaraRecordId]: false }));
    }
  };

  const handleCreate = async (samsaraRecordId, recordType) => {
    setProcessing(prev => ({ ...prev, [samsaraRecordId]: true }));
    try {
      await api.post('/integrations/samsara/create', {
        samsaraRecordId
      });
      toast.success(`${recordType === 'driver' ? 'Driver' : 'Vehicle'} created successfully`);
      // Remove from pending list
      setPendingRecords(prev => ({
        ...prev,
        [recordType + 's']: prev[recordType + 's'].filter(r => r._id !== samsaraRecordId)
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create record');
    } finally {
      setProcessing(prev => ({ ...prev, [samsaraRecordId]: false }));
    }
  };

  const handleSkip = async (samsaraRecordId, recordType) => {
    setProcessing(prev => ({ ...prev, [samsaraRecordId]: true }));
    try {
      await api.post('/integrations/samsara/skip', { samsaraRecordId });
      toast.success('Record skipped');
      setPendingRecords(prev => ({
        ...prev,
        [recordType + 's']: prev[recordType + 's'].filter(r => r._id !== samsaraRecordId)
      }));
    } catch (error) {
      toast.error('Failed to skip record');
    } finally {
      setProcessing(prev => ({ ...prev, [samsaraRecordId]: false }));
    }
  };

  const handleClose = () => {
    onClose();
    if (onComplete) onComplete();
  };

  const totalPending = pendingRecords.drivers.length + pendingRecords.vehicles.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Match Samsara Data"
      size="xl"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="lg" variant="truck" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Loading Samsara data...</p>
        </div>
      ) : totalPending === 0 ? (
        <div className="text-center py-12">
          <FiCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">All Matched!</h3>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            All Samsara records have been matched or created.
          </p>
          <button onClick={handleClose} className="btn btn-primary mt-6">
            Done
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setActiveTab('drivers')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'drivers'
                  ? 'border-cta text-cta'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <FiUsers className="inline-block w-4 h-4 mr-2" />
              Drivers ({pendingRecords.drivers.length})
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'vehicles'
                  ? 'border-cta text-cta'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <FiTruck className="inline-block w-4 h-4 mr-2" />
              Vehicles ({pendingRecords.vehicles.length})
            </button>
          </div>

          {/* Records List */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {activeTab === 'drivers' && pendingRecords.drivers.map(record => (
              <RecordCard
                key={record._id}
                record={record}
                recordType="driver"
                existingRecords={existingDrivers}
                processing={processing[record._id]}
                onMatch={handleMatch}
                onCreate={handleCreate}
                onSkip={handleSkip}
              />
            ))}
            {activeTab === 'vehicles' && pendingRecords.vehicles.map(record => (
              <RecordCard
                key={record._id}
                record={record}
                recordType="vehicle"
                existingRecords={existingVehicles}
                processing={processing[record._id]}
                onMatch={handleMatch}
                onCreate={handleCreate}
                onSkip={handleSkip}
              />
            ))}
            {((activeTab === 'drivers' && pendingRecords.drivers.length === 0) ||
              (activeTab === 'vehicles' && pendingRecords.vehicles.length === 0)) && (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                No pending {activeTab} to match
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {totalPending} record{totalPending !== 1 ? 's' : ''} remaining
            </p>
            <button onClick={handleClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// Individual record card component
const RecordCard = ({ record, recordType, existingRecords, processing, onMatch, onCreate, onSkip }) => {
  const [selectedMatch, setSelectedMatch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const getDisplayName = (existing) => {
    if (recordType === 'driver') {
      return `${existing.firstName} ${existing.lastName}`;
    }
    return existing.unitNumber || existing.vin?.slice(-6) || 'Unknown';
  };

  const getIdentifier = (existing) => {
    if (recordType === 'driver') {
      return existing.cdl?.number || existing.email || '';
    }
    return existing.vin || '';
  };

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            {recordType === 'driver' ? (
              <FiUsers className="w-5 h-5 text-blue-500" />
            ) : (
              <FiTruck className="w-5 h-5 text-orange-500" />
            )}
            <h4 className="font-medium text-zinc-900 dark:text-white">
              {record.displayName}
            </h4>
          </div>
          {record.identifier && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 ml-7">
              {recordType === 'driver' ? 'License' : 'VIN'}: {record.identifier}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Match dropdown */}
          <div className="relative">
            <select
              value={selectedMatch}
              onChange={(e) => setSelectedMatch(e.target.value)}
              disabled={processing}
              className="form-select text-sm w-48"
            >
              <option value="">Match to existing...</option>
              {existingRecords.map(existing => (
                <option key={existing._id} value={existing._id}>
                  {getDisplayName(existing)} {getIdentifier(existing) && `(${getIdentifier(existing).slice(-6)})`}
                </option>
              ))}
            </select>
          </div>

          {/* Match button */}
          <button
            onClick={() => onMatch(record._id, selectedMatch, recordType)}
            disabled={!selectedMatch || processing}
            className="btn btn-primary btn-sm"
            title="Match to selected"
          >
            {processing ? <LoadingSpinner size="sm" /> : <FiLink className="w-4 h-4" />}
          </button>

          {/* Create new button */}
          <button
            onClick={() => onCreate(record._id, recordType)}
            disabled={processing}
            className="btn btn-secondary btn-sm"
            title="Create new"
          >
            <FiPlus className="w-4 h-4" />
          </button>

          {/* Skip button */}
          <button
            onClick={() => onSkip(record._id, recordType)}
            disabled={processing}
            className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
            title="Skip"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SamsaraMatchingModal;
