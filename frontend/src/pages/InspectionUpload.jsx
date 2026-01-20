import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { inspectionsAPI, driversAPI, vehiclesAPI } from '../utils/api';
import {
  FiUpload, FiFile, FiCheck, FiX, FiAlertTriangle, FiAlertCircle,
  FiUser, FiTruck, FiEdit2, FiTrash2, FiChevronRight, FiInfo,
  FiLoader, FiFileText, FiCheckCircle
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const InspectionUpload = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Step state
  const [step, setStep] = useState(1); // 1: Upload, 2: Review, 3: Assign, 4: Confirm

  // Upload state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  // Extracted data state
  const [inspection, setInspection] = useState(null);
  const [violations, setViolations] = useState([]);
  const [filePath, setFilePath] = useState(null);

  // Assignment state
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  // Editing state
  const [editingViolation, setEditingViolation] = useState(null);

  // Confirmation state
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAiStatus();
    fetchDropdownData();
  }, []);

  const checkAiStatus = async () => {
    try {
      const response = await inspectionsAPI.getAiStatus();
      setAiEnabled(response.data.aiEnabled);
    } catch (err) {
      setAiEnabled(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        driversAPI.getAll({ status: 'active', limit: 100 }),
        vehiclesAPI.getAll({ status: 'active', limit: 100 })
      ]);
      setDrivers(driversRes.data.drivers || []);
      setVehicles(vehiclesRes.data.vehicles || []);
    } catch (err) {
      console.error('Failed to fetch dropdown data:', err);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await inspectionsAPI.upload(formData);

      setInspection(response.data.inspection);
      setViolations(response.data.violations || []);
      setFilePath(response.data.filePath);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process inspection report');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateViolation = (index, field, value) => {
    const updated = [...violations];
    updated[index] = { ...updated[index], [field]: value };
    setViolations(updated);
  };

  const handleRemoveViolation = (index) => {
    setViolations(violations.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    setConfirming(true);
    setError(null);

    try {
      await inspectionsAPI.confirm({
        inspection,
        violations,
        driverId: selectedDriver || null,
        vehicleId: selectedVehicle || null,
        filePath
      });

      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create violation records');
    } finally {
      setConfirming(false);
    }
  };

  const getSeverityLabel = (weight) => {
    if (weight >= 8) return 'Critical';
    if (weight >= 5) return 'High';
    if (weight >= 3) return 'Medium';
    return 'Low';
  };

  const getSeverityColor = (weight) => {
    if (weight >= 8) return 'text-danger-600 bg-danger-100';
    if (weight >= 5) return 'text-warning-600 bg-warning-100';
    if (weight >= 3) return 'text-info-600 bg-info-100';
    return 'text-success-600 bg-success-100';
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((s, index) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
              step >= s
                ? 'bg-primary-600 text-white'
                : 'bg-primary-100 text-primary-400'
            }`}
          >
            {step > s ? <FiCheck className="w-5 h-5" /> : s}
          </div>
          {index < 3 && (
            <div
              className={`w-16 h-1 mx-2 rounded ${
                step > s ? 'bg-primary-600' : 'bg-primary-100'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const stepLabels = ['Upload', 'Review', 'Assign', 'Complete'];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-900">DOT Inspection Upload</h1>
        <p className="text-primary-500 text-sm mt-1">
          Upload an inspection report to automatically extract violations
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator />
      <div className="flex justify-center mb-8">
        <div className="flex gap-8">
          {stepLabels.map((label, index) => (
            <span
              key={label}
              className={`text-sm font-medium ${
                step === index + 1 ? 'text-primary-700' : 'text-primary-400'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-danger-800">{error}</p>
          </div>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 1 && (
        <div
          className="bg-white rounded-xl border border-primary-200/60 overflow-hidden"
          style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
        >
          {!aiEnabled && (
            <div className="p-4 bg-warning-50 border-b border-warning-200 flex items-start gap-3">
              <FiInfo className="w-5 h-5 text-warning-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning-800">AI Processing Unavailable</p>
                <p className="text-xs text-warning-700 mt-1">
                  OpenAI API key is not configured. Contact your administrator to enable AI-powered extraction.
                </p>
              </div>
            </div>
          )}

          <div className="p-6">
            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                file ? 'border-primary-400 bg-primary-50' : 'border-primary-200 hover:border-primary-400'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                    <FiFile className="w-8 h-8 text-primary-600" />
                  </div>
                  <p className="text-lg font-medium text-primary-800">{file.name}</p>
                  <p className="text-sm text-primary-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="mt-3 text-sm text-danger-600 hover:text-danger-700 flex items-center gap-1"
                  >
                    <FiX className="w-4 h-4" /> Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                    <FiUpload className="w-8 h-8 text-primary-600" />
                  </div>
                  <p className="text-lg font-medium text-primary-800">
                    Drop your inspection report here
                  </p>
                  <p className="text-sm text-primary-500 mt-1">
                    or click to browse (PDF, JPG, PNG)
                  </p>
                </div>
              )}
            </div>

            {/* Upload button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={!file || uploading || !aiEnabled}
                className="btn btn-primary"
              >
                {uploading ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Processing with AI...
                  </>
                ) : (
                  <>
                    <FiUpload className="w-4 h-4" />
                    Upload & Extract
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Review Extracted Data */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Inspection Details */}
          <div
            className="bg-white rounded-xl border border-primary-200/60 overflow-hidden"
            style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
          >
            <div
              className="px-5 py-4 border-b border-primary-100"
              style={{ background: 'linear-gradient(to bottom, #fafbfc, #f8fafc)' }}
            >
              <h2 className="text-base font-semibold text-primary-900">Inspection Details</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-primary-500 mb-1">Report Number</p>
                  <p className="text-sm font-medium text-primary-800">{inspection?.reportNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-500 mb-1">Date</p>
                  <p className="text-sm font-medium text-primary-800">{inspection?.date || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-500 mb-1">Location</p>
                  <p className="text-sm font-medium text-primary-800">
                    {inspection?.location?.city && inspection?.location?.state
                      ? `${inspection.location.city}, ${inspection.location.state}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-primary-500 mb-1">Level</p>
                  <p className="text-sm font-medium text-primary-800">Level {inspection?.inspectionLevel || 'N/A'}</p>
                </div>
              </div>

              {/* OOS Status */}
              {(inspection?.oosStatus?.driver || inspection?.oosStatus?.vehicle) && (
                <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-center gap-3">
                  <FiAlertTriangle className="w-5 h-5 text-danger-600" />
                  <div>
                    <p className="text-sm font-medium text-danger-800">Out of Service</p>
                    <p className="text-xs text-danger-700">
                      {inspection?.oosStatus?.driver && 'Driver OOS '}
                      {inspection?.oosStatus?.vehicle && 'Vehicle OOS'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Violations */}
          <div
            className="bg-white rounded-xl border border-primary-200/60 overflow-hidden"
            style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
          >
            <div
              className="px-5 py-4 border-b border-primary-100 flex items-center justify-between"
              style={{ background: 'linear-gradient(to bottom, #fafbfc, #f8fafc)' }}
            >
              <h2 className="text-base font-semibold text-primary-900">
                Extracted Violations ({violations.length})
              </h2>
            </div>
            <div className="divide-y divide-primary-100">
              {violations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-3">
                    <FiCheckCircle className="w-7 h-7 text-success-500" />
                  </div>
                  <p className="font-medium text-primary-700">No Violations Found</p>
                  <p className="text-sm text-primary-500 mt-1">This appears to be a clean inspection</p>
                </div>
              ) : (
                violations.map((v, index) => (
                  <div key={index} className="p-4 hover:bg-primary-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-semibold text-primary-800">
                            {v.normalizedCode || v.originalCode}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getSeverityColor(v.severityWeight)}`}>
                            {getSeverityLabel(v.severityWeight)}
                          </span>
                          {v.isOutOfService && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-danger-100 text-danger-700 rounded">
                              OOS
                            </span>
                          )}
                          {v.unknown && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-warning-100 text-warning-700 rounded">
                              Unknown Code
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-primary-600">{v.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-primary-500">
                          <span>BASIC: {v.basic?.replace(/_/g, ' ')}</span>
                          {v.cfrReference && <span>{v.cfrReference}</span>}
                          <span>Severity: {v.severityWeight}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingViolation(index)}
                          className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveViolation(index)}
                          className="p-2 text-primary-400 hover:text-danger-600 hover:bg-danger-50 rounded"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Edit form */}
                    {editingViolation === index && (
                      <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-primary-700 mb-1">Violation Code</label>
                            <input
                              type="text"
                              value={v.normalizedCode || v.originalCode}
                              onChange={(e) => handleUpdateViolation(index, 'normalizedCode', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-primary-200 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-primary-700 mb-1">Severity (1-10)</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={v.severityWeight}
                              onChange={(e) => handleUpdateViolation(index, 'severityWeight', parseInt(e.target.value))}
                              className="w-full px-3 py-2 text-sm border border-primary-200 rounded-lg"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-primary-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={v.description}
                              onChange={(e) => handleUpdateViolation(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-primary-200 rounded-lg"
                            />
                          </div>
                          <div className="col-span-2 flex items-center gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={v.isOutOfService}
                                onChange={(e) => handleUpdateViolation(index, 'isOutOfService', e.target.checked)}
                                className="rounded border-primary-300"
                              />
                              <span className="text-sm text-primary-700">Out of Service</span>
                            </label>
                            <button
                              onClick={() => setEditingViolation(null)}
                              className="ml-auto text-sm text-primary-600 hover:text-primary-800"
                            >
                              Done editing
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn btn-secondary">
              Back
            </button>
            <button onClick={() => setStep(3)} className="btn btn-primary">
              Continue <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Assign Driver/Vehicle */}
      {step === 3 && (
        <div className="space-y-6">
          <div
            className="bg-white rounded-xl border border-primary-200/60 overflow-hidden"
            style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
          >
            <div
              className="px-5 py-4 border-b border-primary-100"
              style={{ background: 'linear-gradient(to bottom, #fafbfc, #f8fafc)' }}
            >
              <h2 className="text-base font-semibold text-primary-900">Assign to Driver & Vehicle</h2>
              <p className="text-xs text-primary-500 mt-1">Optional: Link these violations to a driver and vehicle</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2 flex items-center gap-2">
                  <FiUser className="w-4 h-4" />
                  Driver
                </label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Select Driver (Optional) --</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.firstName} {d.lastName} - CDL: {d.cdlNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2 flex items-center gap-2">
                  <FiTruck className="w-4 h-4" />
                  Vehicle
                </label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Select Vehicle (Optional) --</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>
                      {v.unitNumber} - {v.year} {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div
            className="bg-white rounded-xl border border-primary-200/60 overflow-hidden"
            style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
          >
            <div
              className="px-5 py-4 border-b border-primary-100"
              style={{ background: 'linear-gradient(to bottom, #fafbfc, #f8fafc)' }}
            >
              <h2 className="text-base font-semibold text-primary-900">Confirmation Summary</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-primary-500">Report Number</p>
                  <p className="text-sm font-medium text-primary-800">{inspection?.reportNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-500">Date</p>
                  <p className="text-sm font-medium text-primary-800">{inspection?.date || 'N/A'}</p>
                </div>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-700">
                  <strong>{violations.length}</strong> violation{violations.length !== 1 ? 's' : ''} will be created
                  {violations.filter(v => v.isOutOfService).length > 0 && (
                    <span className="text-danger-600">
                      {' '}({violations.filter(v => v.isOutOfService).length} OOS)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="btn btn-secondary">
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="btn btn-primary"
            >
              {confirming ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating Records...
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
                  Confirm & Create
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 4 && (
        <div
          className="bg-white rounded-xl border border-primary-200/60 p-8 text-center"
          style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
        >
          <div className="w-20 h-20 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="w-10 h-10 text-success-500" />
          </div>
          <h2 className="text-xl font-bold text-primary-900 mb-2">Violations Created Successfully!</h2>
          <p className="text-primary-600 mb-6">
            {violations.length} violation record{violations.length !== 1 ? 's' : ''} have been added to your system.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setStep(1);
                setFile(null);
                setInspection(null);
                setViolations([]);
                setSelectedDriver('');
                setSelectedVehicle('');
              }}
              className="btn btn-secondary"
            >
              <FiUpload className="w-4 h-4" />
              Upload Another
            </button>
            <button
              onClick={() => navigate('/violations')}
              className="btn btn-primary"
            >
              <FiFileText className="w-4 h-4" />
              View Violations
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionUpload;
