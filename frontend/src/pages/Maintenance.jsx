import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { maintenanceAPI, vehiclesAPI } from '../utils/api';
import { formatDate, formatCurrency, getFileViewUrl } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiPlus, FiSearch, FiTool, FiTruck, FiCalendar, FiDollarSign,
  FiEdit2, FiTrash2, FiDownload, FiAlertTriangle, FiCheckCircle,
  FiClock, FiFilter, FiFileText, FiUpload, FiX, FiZap, FiPaperclip
} from 'react-icons/fi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Maintenance = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [smartUploading, setSmartUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const recordTypes = [
    { value: 'preventive_maintenance', label: 'Preventive Maintenance' },
    { value: 'annual_inspection', label: 'Annual Inspection' },
    { value: 'repair', label: 'Repair' },
    { value: 'tire_service', label: 'Tire Service' },
    { value: 'brake_service', label: 'Brake Service' },
    { value: 'oil_change', label: 'Oil Change' },
    { value: 'dot_inspection', label: 'DOT Inspection' },
    { value: 'roadside_repair', label: 'Roadside Repair' },
    { value: 'recall', label: 'Recall' },
    { value: 'other', label: 'Other' }
  ];

  const [formData, setFormData] = useState({
    vehicleId: '',
    recordType: 'preventive_maintenance',
    serviceDate: new Date().toISOString().split('T')[0],
    odometerReading: '',
    provider: { name: '', address: '', phone: '', mechanic: '' },
    description: '',
    laborCost: 0,
    partsCost: 0,
    partsUsed: [],
    nextServiceDate: '',
    nextServiceMileage: '',
    inspectionResult: 'na',
    defectsFound: [],
    notes: '',
    warranty: { covered: false, claimNumber: '', notes: '' },
    invoiceNumber: ''
  });

  useEffect(() => {
    fetchRecords();
    fetchStats();
    fetchVehicles();
  }, [page, vehicleFilter, typeFilter]);

  // Handle URL param to open specific record from Vehicle Details
  useEffect(() => {
    const recordId = searchParams.get('record');
    if (recordId) {
      // Fetch the specific record and open detail modal
      const fetchRecord = async () => {
        try {
          const response = await maintenanceAPI.getById(recordId);
          if (response.data.record) {
            setSelectedRecord(response.data.record);
            setShowDetailModal(true);
            // Clear the URL param
            setSearchParams({});
          }
        } catch (error) {
          toast.error('Could not find the maintenance record');
          setSearchParams({});
        }
      };
      fetchRecord();
    }
  }, [searchParams]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        ...(vehicleFilter && { vehicleId: vehicleFilter }),
        ...(typeFilter && { recordType: typeFilter }),
        ...(searchQuery && { search: searchQuery })
      };
      const response = await maintenanceAPI.getAll(params);
      setRecords(response.data.records);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to fetch maintenance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await maintenanceAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await vehiclesAPI.getAll({ limit: 100 });
      setVehicles(response.data.vehicles);
    } catch (error) {
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Process partsUsed to ensure proper number types
      const processedParts = formData.partsUsed?.map(part => ({
        partName: part.partName || '',
        partNumber: part.partNumber || '',
        quantity: parseInt(part.quantity) || 1,
        cost: parseFloat(part.cost) || 0
      })).filter(part => part.partName || part.partNumber) || [];

      const submitData = {
        ...formData,
        odometerReading: formData.odometerReading ? parseInt(formData.odometerReading) : undefined,
        laborCost: parseFloat(formData.laborCost) || 0,
        partsCost: parseFloat(formData.partsCost) || 0,
        nextServiceMileage: formData.nextServiceMileage ? parseInt(formData.nextServiceMileage) : undefined,
        partsUsed: processedParts,
        invoiceNumber: formData.invoiceNumber || undefined
      };

      // If we have an uploaded file from smart upload, include it in documents
      if (uploadedFile && uploadedFile.url && !selectedRecord) {
        submitData.documents = [{
          name: uploadedFile.name || 'Invoice',
          url: uploadedFile.url,
          type: 'invoice',
          uploadedAt: new Date()
        }];
      }

      if (selectedRecord && !showDetailModal) {
        await maintenanceAPI.update(selectedRecord._id, submitData);
        toast.success('Record updated');
      } else {
        await maintenanceAPI.create(submitData);
        toast.success('Record created');
      }

      setShowAddModal(false);
      resetForm();
      fetchRecords();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await maintenanceAPI.delete(record._id);
      toast.success('Record deleted');
      fetchRecords();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const handleExport = async (vehicleId) => {
    try {
      const response = await maintenanceAPI.exportVehicle(vehicleId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const vehicle = vehicles.find(v => v._id === vehicleId);
      link.setAttribute('download', `maintenance_${vehicle?.unitNumber || 'vehicle'}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export downloaded');
    } catch (error) {
      toast.error('Failed to export records');
    }
  };

  // Smart Upload - AI extraction from invoice
  const handleSmartUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSmartUploading(true);
    try {
      const response = await maintenanceAPI.smartUpload(file);
      const {
        success,
        aiSuccess,
        extractedData,
        uploadedFile,
        message,
        error
      } = response.data || {};

      if (!success) {
        toast.error(message || 'Could not upload document');
        return;
      }

      // Store uploaded file info for attachment
      if (uploadedFile) {
        setUploadedFile(uploadedFile);
      }

      const data = extractedData?.data;
      if (!aiSuccess || !data) {
        toast.error(error || message || 'Could not extract data from document. Please fill in details manually.');
        return;
      }

      // Auto-match vehicle by unitNumber, VIN, or licensePlate from extracted data
      let matchedVehicleId = '';
      if (data.vehicleInfo) {
        const matchedVehicle = vehicles.find(v =>
          (data.vehicleInfo.unitNumber && v.unitNumber?.toLowerCase() === data.vehicleInfo.unitNumber?.toLowerCase()) ||
          (data.vehicleInfo.vin && v.vin?.toLowerCase() === data.vehicleInfo.vin?.toLowerCase()) ||
          (data.vehicleInfo.licensePlate && v.licensePlate?.toLowerCase() === data.vehicleInfo.licensePlate?.toLowerCase())
        );
        if (matchedVehicle) {
          matchedVehicleId = matchedVehicle._id;
          toast.success(`Matched vehicle: ${matchedVehicle.unitNumber}`);
        }
      }

      // Map extracted parts to form format
      const mappedParts = data.partsUsed?.map(p => ({
        partName: p.description || p.partName || '',
        partNumber: p.partNumber || '',
        quantity: p.quantity || 1,
        cost: p.cost || 0
      })) || [];

      // Auto-fill form with ALL extracted data
      setFormData(prev => ({
        ...prev,
        vehicleId: matchedVehicleId || prev.vehicleId,
        recordType: data.recordType || prev.recordType,
        serviceDate: data.serviceDate || prev.serviceDate,
        odometerReading: data.odometerReading || prev.odometerReading,
        description: data.description || prev.description,
        provider: {
          name: data.provider?.name || prev.provider.name,
          address: data.provider?.address || prev.provider.address,
          phone: data.provider?.phone || prev.provider.phone,
          mechanic: prev.provider.mechanic
        },
        laborCost: data.laborCost || prev.laborCost,
        partsCost: data.partsCost || prev.partsCost,
        partsUsed: mappedParts.length > 0 ? mappedParts : prev.partsUsed,
        nextServiceDate: data.nextServiceDate || prev.nextServiceDate,
        nextServiceMileage: data.nextServiceMileage || prev.nextServiceMileage,
        notes: data.notes || prev.notes,
        invoiceNumber: data.invoiceNumber || prev.invoiceNumber
      }));

      // Show confidence-based message
      const confidence = data.confidence || 0;
      if (confidence >= 0.8) {
        toast.success('Data extracted with high confidence! Please review and complete the form.');
      } else if (confidence >= 0.5) {
        toast.success('Data extracted. Some fields may need verification.');
      } else {
        toast.success('Data extracted with low confidence. Please verify all fields.');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to process document';
      toast.error(message);
      console.error('Smart upload failed:', error.response?.data || error);
    } finally {
      setSmartUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  // Upload document to existing record
  const handleDocumentUpload = async (e, recordId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await maintenanceAPI.uploadDocument(recordId, file, 'invoice', file.name);
      toast.success('Document uploaded');
      // Refresh record details
      const response = await maintenanceAPI.getById(recordId);
      setSelectedRecord(response.data.record);
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Delete document from record
  const handleDocumentDelete = async (recordId, docId) => {
    if (!confirm('Delete this document?')) return;
    try {
      await maintenanceAPI.deleteDocument(recordId, docId);
      toast.success('Document deleted');
      // Refresh record details
      const response = await maintenanceAPI.getById(recordId);
      setSelectedRecord(response.data.record);
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      recordType: 'preventive_maintenance',
      serviceDate: new Date().toISOString().split('T')[0],
      odometerReading: '',
      provider: { name: '', address: '', phone: '', mechanic: '' },
      description: '',
      laborCost: 0,
      partsCost: 0,
      partsUsed: [],
      nextServiceDate: '',
      nextServiceMileage: '',
      inspectionResult: 'na',
      defectsFound: [],
      notes: '',
      warranty: { covered: false, claimNumber: '', notes: '' },
      invoiceNumber: ''
    });
    setSelectedRecord(null);
    setUploadedFile(null);
  };

  const openEditModal = (record) => {
    setSelectedRecord(record);
    setFormData({
      vehicleId: record.vehicleId?._id || record.vehicleId,
      recordType: record.recordType,
      serviceDate: record.serviceDate?.split('T')[0] || '',
      odometerReading: record.odometerReading || '',
      provider: record.provider || { name: '', address: '', phone: '', mechanic: '' },
      description: record.description || '',
      laborCost: record.laborCost || 0,
      partsCost: record.partsCost || 0,
      partsUsed: record.partsUsed || [],
      nextServiceDate: record.nextServiceDate?.split('T')[0] || '',
      nextServiceMileage: record.nextServiceMileage || '',
      inspectionResult: record.inspectionResult || 'na',
      defectsFound: record.defectsFound || [],
      notes: record.notes || '',
      warranty: record.warranty || { covered: false, claimNumber: '', notes: '' },
      invoiceNumber: record.invoiceNumber || ''
    });
    setShowAddModal(true);
  };

  const openDetailModal = async (record) => {
    try {
      const response = await maintenanceAPI.getById(record._id);
      setSelectedRecord(response.data.record);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to load record details');
    }
  };

  const getTypeLabel = (type) => {
    const found = recordTypes.find(t => t.value === type);
    return found ? found.label : type.replace(/_/g, ' ');
  };

  const getInspectionResultBadge = (result) => {
    switch (result) {
      case 'passed':
        return <StatusBadge status="active" text="Passed" />;
      case 'passed_with_defects':
        return <StatusBadge status="warning" text="Passed w/ Defects" />;
      case 'failed':
        return <StatusBadge status="danger" text="Failed" />;
      default:
        return null;
    }
  };

  const columns = [
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (record) => (
        <div className="cursor-pointer" onClick={() => openDetailModal(record)}>
          <div className="font-medium text-zinc-900 dark:text-white flex items-center gap-2">
            <FiTruck className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            {record.vehicleId?.unitNumber || 'Unknown'}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {record.vehicleId?.make} {record.vehicleId?.model}
          </div>
        </div>
      )
    },
    {
      key: 'recordType',
      label: 'Type',
      render: (record) => (
        <span className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded capitalize">
          {getTypeLabel(record.recordType)}
        </span>
      )
    },
    {
      key: 'serviceDate',
      label: 'Service Date',
      render: (record) => (
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <FiCalendar className="w-4 h-4" />
          {formatDate(record.serviceDate)}
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (record) => (
        <div className="text-zinc-600 dark:text-zinc-300 truncate max-w-xs">{record.description}</div>
      )
    },
    {
      key: 'totalCost',
      label: 'Cost',
      render: (record) => (
        <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
          <FiDollarSign className="w-4 h-4" />
          {formatCurrency ? formatCurrency(record.totalCost) : `$${(record.totalCost || 0).toFixed(2)}`}
        </div>
      )
    },
    {
      key: 'nextService',
      label: 'Next Service',
      render: (record) => record.nextServiceDate ? (
        <div className={`text-sm ${record.isOverdue ? 'text-red-500 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
          {formatDate(record.nextServiceDate)}
          {record.daysUntilNextService !== null && (
            <span className="ml-1">
              ({record.daysUntilNextService < 0 ? 'Overdue' : `${record.daysUntilNextService}d`})
            </span>
          )}
        </div>
      ) : (
        <span className="text-zinc-400 dark:text-zinc-500">-</span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (record) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openEditModal(record); }}
            className="p-1 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
            title="Edit"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(record); }}
            className="p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Maintenance Records</h1>
          <p className="text-zinc-600 dark:text-zinc-300">Track vehicle maintenance per FMCSA 49 CFR Part 396</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="btn btn-primary"
        >
          <FiPlus className="w-5 h-5" />
          Add Record
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
                <FiFileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{stats.costs?.recordCount || 0}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Total Records</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg">
                <FiDollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                  ${((stats.costs?.grandTotal || 0) / 1000).toFixed(1)}k
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Total Spent</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-500/10 rounded-lg">
                <FiClock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{stats.upcomingServices || 0}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Due in 30 Days</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-lg">
                <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{stats.overdueServices || 0}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Overdue</div>
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
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </form>
        <select
          value={vehicleFilter}
          onChange={(e) => { setVehicleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Vehicles</option>
          {vehicles.map(vehicle => (
            <option key={vehicle._id} value={vehicle._id}>
              {vehicle.unitNumber} - {vehicle.make} {vehicle.model}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Types</option>
          {recordTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        {vehicleFilter && (
          <button
            onClick={() => handleExport(vehicleFilter)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white rounded-lg transition-colors"
          >
            <FiDownload className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Records Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable
          columns={columns}
          data={records}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="No maintenance records found"
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); setUploadedFile(null); }}
        title={selectedRecord ? 'Edit Record' : 'Add Maintenance Record'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Smart Upload - AI Extraction */}
          {!selectedRecord && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <FiZap className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-white">Smart Upload</h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Upload an invoice and AI will extract the details</p>
                  </div>
                </div>
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                  smartUploading ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                }`}>
                  {smartUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiUpload className="w-4 h-4" />
                      Upload Invoice
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleSmartUpload}
                    disabled={smartUploading}
                  />
                </label>
              </div>
              {uploadedFile && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
                  <FiPaperclip className="w-4 h-4" />
                  {uploadedFile.name} attached
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Record Type *</label>
              <select
                required
                value={formData.recordType}
                onChange={(e) => setFormData({ ...formData, recordType: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {recordTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Service Date *</label>
              <input
                type="date"
                required
                value={formData.serviceDate}
                onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Odometer Reading</label>
              <input
                type="number"
                value={formData.odometerReading}
                onChange={(e) => setFormData({ ...formData, odometerReading: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Miles"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Description *</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe the work performed"
            />
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Service Provider</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={formData.provider.name}
                onChange={(e) => setFormData({ ...formData, provider: { ...formData.provider, name: e.target.value } })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Provider Name"
              />
              <input
                type="text"
                value={formData.provider.phone}
                onChange={(e) => setFormData({ ...formData, provider: { ...formData.provider, phone: e.target.value } })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Phone"
              />
              <input
                type="text"
                value={formData.provider.address}
                onChange={(e) => setFormData({ ...formData, provider: { ...formData.provider, address: e.target.value } })}
                className="col-span-1 md:col-span-2 w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Address"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Labor Cost ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.laborCost}
                onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Parts Cost ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.partsCost}
                onChange={(e) => setFormData({ ...formData, partsCost: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Next Service Date</label>
              <input
                type="date"
                value={formData.nextServiceDate}
                onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Next Service Mileage</label>
              <input
                type="number"
                value={formData.nextServiceMileage}
                onChange={(e) => setFormData({ ...formData, nextServiceMileage: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Miles"
              />
            </div>
          </div>

          {(formData.recordType === 'annual_inspection' || formData.recordType === 'dot_inspection') && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Inspection Result</label>
              <select
                value={formData.inspectionResult}
                onChange={(e) => setFormData({ ...formData, inspectionResult: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="na">N/A</option>
                <option value="passed">Passed</option>
                <option value="passed_with_defects">Passed with Defects</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Additional notes"
            />
          </div>

          <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={formData.warranty.covered}
              onChange={(e) => setFormData({
                ...formData,
                warranty: { ...formData.warranty, covered: e.target.checked }
              })}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-primary-500"
            />
            Covered by Warranty
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
              {submitting ? 'Saving...' : (selectedRecord ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedRecord(null); }}
        title="Maintenance Record Details"
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-white">
                  <FiTruck className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  {selectedRecord.vehicleId?.unitNumber}
                </div>
                <div className="text-zinc-500 dark:text-zinc-400">
                  {selectedRecord.vehicleId?.make} {selectedRecord.vehicleId?.model} ({selectedRecord.vehicleId?.year})
                </div>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-full capitalize">
                  {getTypeLabel(selectedRecord.recordType)}
                </span>
                {selectedRecord.invoiceNumber && (
                  <div className="text-sm font-mono text-zinc-500 dark:text-zinc-400 mt-1">
                    Invoice #{selectedRecord.invoiceNumber}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Service Date</div>
                <div className="font-medium text-zinc-900 dark:text-white">{formatDate(selectedRecord.serviceDate)}</div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Odometer</div>
                <div className="font-medium text-zinc-900 dark:text-white">
                  {selectedRecord.odometerReading ? `${selectedRecord.odometerReading.toLocaleString()} miles` : '-'}
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Total Cost</div>
                <div className="font-medium text-zinc-900 dark:text-white text-lg">
                  ${(selectedRecord.totalCost || 0).toFixed(2)}
                </div>
                <div className="text-xs text-zinc-400 dark:text-zinc-500">
                  Labor: ${(selectedRecord.laborCost || 0).toFixed(2)} | Parts: ${(selectedRecord.partsCost || 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Next Service</div>
                <div className={`font-medium ${selectedRecord.isOverdue ? 'text-red-500 dark:text-red-400' : 'text-zinc-900 dark:text-white'}`}>
                  {selectedRecord.nextServiceDate ? formatDate(selectedRecord.nextServiceDate) : '-'}
                </div>
                {selectedRecord.nextServiceMileage && (
                  <div className="text-xs text-zinc-400 dark:text-zinc-500">or at {selectedRecord.nextServiceMileage.toLocaleString()} miles</div>
                )}
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Description</h4>
              <p className="text-zinc-900 dark:text-white">{selectedRecord.description}</p>
            </div>

            {selectedRecord.partsUsed?.length > 0 && (
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">Parts Used</h4>
                <div className="space-y-2">
                  {selectedRecord.partsUsed.map((part, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-zinc-900 dark:text-white">{part.partName}</span>
                        {part.partNumber && <span className="ml-2 text-xs text-zinc-400 font-mono">#{part.partNumber}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                        <span>Qty: {part.quantity || 1}</span>
                        {part.cost > 0 && <span>${part.cost.toFixed(2)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedRecord.provider?.name && (
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Service Provider</h4>
                <div className="text-zinc-900 dark:text-white">{selectedRecord.provider.name}</div>
                {selectedRecord.provider.address && (
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">{selectedRecord.provider.address}</div>
                )}
                {selectedRecord.provider.phone && (
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">{selectedRecord.provider.phone}</div>
                )}
                {selectedRecord.provider.mechanic && (
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">Mechanic: {selectedRecord.provider.mechanic}</div>
                )}
              </div>
            )}

            {selectedRecord.inspectionResult && selectedRecord.inspectionResult !== 'na' && (
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 dark:text-zinc-400">Inspection Result:</span>
                {getInspectionResultBadge(selectedRecord.inspectionResult)}
              </div>
            )}

            {selectedRecord.defectsFound?.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-400 mb-2">Defects Found</h4>
                <ul className="space-y-2">
                  {selectedRecord.defectsFound.map((defect, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      {defect.corrected ? (
                        <FiCheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                      ) : (
                        <FiAlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                      )}
                      <div>
                        <span className="text-zinc-900 dark:text-white">{defect.description}</span>
                        <span className={`ml-2 text-xs px-1 rounded ${
                          defect.severity === 'oos' ? 'bg-red-500/20 text-red-400' :
                          defect.severity === 'major' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {defect.severity.toUpperCase()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedRecord.warranty?.covered && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-400">
                  <FiCheckCircle className="w-4 h-4" />
                  Covered by Warranty
                  {selectedRecord.warranty.claimNumber && (
                    <span className="text-sm text-gray-400">- Claim #{selectedRecord.warranty.claimNumber}</span>
                  )}
                </div>
                {selectedRecord.warranty.notes && (
                  <p className="text-sm text-green-300 mt-2">{selectedRecord.warranty.notes}</p>
                )}
              </div>
            )}

            {selectedRecord.notes && (
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Notes</h4>
                <p className="text-zinc-900 dark:text-white">{selectedRecord.notes}</p>
              </div>
            )}

            {/* Documents Section */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Documents</h4>
                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${
                  uploading ? 'bg-primary-500/30 text-primary-300' : 'bg-primary-500/20 hover:bg-primary-500/30 text-primary-400'
                }`}>
                  {uploading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FiUpload className="w-3 h-3" />
                      Upload
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    onChange={(e) => handleDocumentUpload(e, selectedRecord._id)}
                    disabled={uploading}
                  />
                </label>
              </div>
              {selectedRecord.documents?.length > 0 ? (
                <div className="space-y-2">
                  {selectedRecord.documents.map((doc) => (
                    <div key={doc._id} className="flex items-center justify-between p-2 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FiFileText className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                        <div>
                          <div className="text-sm text-zinc-900 dark:text-white">{doc.name}</div>
                          <div className="text-xs text-zinc-400 dark:text-zinc-500 capitalize">{doc.type?.replace(/_/g, ' ')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={getFileViewUrl(doc.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded transition-colors"
                          title="Download"
                        >
                          <FiDownload className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDocumentDelete(selectedRecord._id, doc._id)}
                          className="p-1.5 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                          title="Delete"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">No documents attached</p>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => { setShowDetailModal(false); openEditModal(selectedRecord); }}
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

export default Maintenance;
