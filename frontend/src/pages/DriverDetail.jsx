import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { driversAPI, violationsAPI, damageClaimsAPI, companiesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { daysUntilExpiry } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiUpload, FiEdit2, FiUser,
  FiCheck, FiAlertCircle, FiShield,
  FiFolder, FiDollarSign
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import HealthBadge from '../components/HealthBadge';
import TabButton from '../components/TabButton';

import DriverOverviewTab from './driver-detail/DriverOverviewTab';
import DriverDocumentsTab from './driver-detail/DriverDocumentsTab';
import DriverSafetyTab from './driver-detail/DriverSafetyTab';
import DriverClaimsTab from './driver-detail/DriverClaimsTab';
import EditDriverModal from './driver-detail/EditDriverModal';

const DriverDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeCompany } = useAuth();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadModal, setUploadModal] = useState({ open: false, type: '' });
  const [uploading, setUploading] = useState(false);
  const [csaData, setCsaData] = useState(null);
  const [csaLoading, setCsaLoading] = useState(true);
  const [expandedDvir, setExpandedDvir] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [driverClaims, setDriverClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [customDqfItems, setCustomDqfItems] = useState([]);

  useEffect(() => {
    fetchDriver();
    fetchCSAData();
    fetchDriverClaims();
  }, [id]);

  useEffect(() => {
    fetchCustomDqfItems();
  }, [activeCompany?._id, activeCompany?.id]);

  const fetchDriver = async () => {
    try {
      const response = await driversAPI.getById(id);
      setDriver(response.data.driver);
    } catch (error) {
      toast.error('Failed to load driver details');
      navigate('/app/drivers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCSAData = async () => {
    setCsaLoading(true);
    try {
      const response = await driversAPI.getCSAImpact(id);
      setCsaData(response.data);
    } catch (error) {
      setCsaData(null);
    } finally {
      setCsaLoading(false);
    }
  };

  const fetchDriverClaims = async () => {
    if (!id) return;
    setClaimsLoading(true);
    try {
      const response = await damageClaimsAPI.getAll({ driverId: id, limit: 50 });
      setDriverClaims(response.data.claims || []);
    } catch (error) {
      console.error('Failed to fetch driver claims:', error);
    } finally {
      setClaimsLoading(false);
    }
  };

  const fetchCustomDqfItems = async () => {
    const companyId = activeCompany?._id || activeCompany?.id;
    if (!companyId) return;
    try {
      const response = await companiesAPI.getCustomDqfItems(companyId);
      setCustomDqfItems(response.data.customDqfItems || []);
    } catch (error) {
      console.error('Failed to fetch custom DQF items:', error);
    }
  };

  const handleUnlinkViolation = async (violationId) => {
    if (!confirm('Unlink this violation from the driver?')) return;
    try {
      await violationsAPI.unlinkDriver(violationId);
      toast.success('Violation unlinked');
      fetchCSAData();
    } catch (error) {
      toast.error('Failed to unlink violation');
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'High': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20';
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/20';
      case 'Low': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20';
      default: return 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700';
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

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const docType = uploadModal.type;

    // Handle custom DQF item uploads
    if (docType.startsWith('custom_')) {
      const customItemId = docType.replace('custom_', '');
      const customItem = customDqfItems.find(i => i._id === customItemId);
      formData.append('documentType', 'custom');
      formData.append('customDqfItemId', customItemId);
      formData.append('name', customItem?.name || 'Custom Document');
    } else {
      formData.append('documentType', docType);
    }

    setUploading(true);
    try {
      await driversAPI.uploadDocument(id, formData);
      toast.success('Document uploaded successfully');
      setUploadModal({ open: false, type: '' });
      fetchDriver();
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = () => {
    if (!driver) return;
    setEditFormData({
      firstName: driver.firstName || '',
      lastName: driver.lastName || '',
      email: driver.email || '',
      phone: driver.phone || '',
      dateOfBirth: driver.dateOfBirth?.split('T')[0] || '',
      hireDate: driver.hireDate?.split('T')[0] || '',
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
        expiryDate: driver.cdl?.expiryDate?.split('T')[0] || '',
        endorsements: driver.cdl?.endorsements || [],
        restrictions: driver.cdl?.restrictions || []
      },
      medicalCard: {
        expiryDate: driver.medicalCard?.expiryDate?.split('T')[0] || ''
      },
      mvrExpiryDate: driver.mvrExpiryDate?.split('T')[0] || '',
      clearinghouseExpiry: driver.clearinghouseExpiry?.split('T')[0] || '',
      terminationDate: driver.terminationDate?.split('T')[0] || '',
      status: driver.status || 'active'
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      await driversAPI.update(id, editFormData);
      toast.success('Driver updated successfully');
      setShowEditModal(false);
      fetchDriver();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update driver');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleEditNestedChange = (e) => {
    const { name, value } = e.target;
    const [parent, child] = name.split('.');
    setEditFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [child]: value }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!driver) {
    return null;
  }

  const cdlDays = daysUntilExpiry(driver.cdl?.expiryDate);
  const medicalDays = daysUntilExpiry(driver.medicalCard?.expiryDate);

  const documentChecklist = [
    { key: 'cdlFront', label: 'CDL Front Copy', status: driver.documents?.cdlFront?.documentUrl ? 'complete' : 'missing', url: driver.documents?.cdlFront?.documentUrl },
    { key: 'cdlBack', label: 'CDL Back Copy', status: driver.documents?.cdlBack?.documentUrl ? 'complete' : 'missing', url: driver.documents?.cdlBack?.documentUrl },
    { key: 'medicalCard', label: 'Medical Card', status: driver.medicalCard?.documentUrl ? 'complete' : 'missing', url: driver.medicalCard?.documentUrl },
    { key: 'medicalExaminerRegistry', label: 'Medical Examiner Registry Verification', status: driver.documents?.medicalExaminerRegistry?.verified ? 'complete' : 'missing', url: driver.documents?.medicalExaminerRegistry?.documentUrl },
    { key: 'roadTest', label: 'Road Test Certificate', status: driver.documents?.roadTest?.result ? 'complete' : 'missing', url: driver.documents?.roadTest?.documentUrl },
    { key: 'employmentApplication', label: 'Employment Application', status: driver.documents?.employmentApplication?.complete ? 'complete' : 'missing', url: driver.documents?.employmentApplication?.documentUrl },
    { key: 'previousEmploymentVerification', label: 'Previous Employment Safety Verification', status: driver.documents?.previousEmploymentVerification?.verified ? 'complete' : 'missing', url: driver.documents?.previousEmploymentVerification?.documentUrl },
    { key: 'goodFaithAttempt1', label: 'Good Faith Attempt 1', status: driver.documents?.goodFaithAttempt1?.documentUrl ? 'complete' : 'missing', url: driver.documents?.goodFaithAttempt1?.documentUrl },
    { key: 'goodFaithAttempt2', label: 'Good Faith Attempt 2', status: driver.documents?.goodFaithAttempt2?.documentUrl ? 'complete' : 'missing', url: driver.documents?.goodFaithAttempt2?.documentUrl },
    { key: 'goodFaithAttempt3', label: 'Good Faith Attempt 3', status: driver.documents?.goodFaithAttempt3?.documentUrl ? 'complete' : 'missing', url: driver.documents?.goodFaithAttempt3?.documentUrl },
    { key: 'safetyPerformanceHistory', label: 'Safety Performance History (SPH)', status: driver.documents?.safetyPerformanceHistory?.documentUrl ? 'complete' : 'missing', url: driver.documents?.safetyPerformanceHistory?.documentUrl },
    { key: 'clearinghouse', label: 'Clearinghouse Query', status: driver.clearinghouse?.status === 'clear' ? 'complete' : driver.clearinghouse?.lastQueryDate ? 'warning' : 'missing' },
    { key: 'clearinghouseVerification', label: 'Clearinghouse Query Verification', status: driver.documents?.clearinghouseVerification?.verified ? 'complete' : 'missing', url: driver.documents?.clearinghouseVerification?.documentUrl },
    { key: 'mvrPreEmployment', label: 'MVR (Pre-Employment)', status: driver.documents?.mvrPreEmployment?.documentUrl ? 'complete' : 'missing', url: driver.documents?.mvrPreEmployment?.documentUrl },
    { key: 'mvrAnnual', label: 'MVR (Annual)', status: driver.documents?.mvrAnnual?.documentUrl ? 'complete' : 'missing', url: driver.documents?.mvrAnnual?.documentUrl }
  ];

  // Build custom DQF checklist items from company config
  const customChecklistItems = customDqfItems.map(item => {
    const matchingDoc = driver.documents?.other?.find(
      doc => doc.customDqfItemId && doc.customDqfItemId.toString() === item._id.toString()
    );
    return {
      key: 'custom_' + item._id,
      label: item.name,
      status: matchingDoc?.documentUrl ? 'complete' : 'missing',
      url: matchingDoc?.documentUrl,
      isCustom: true,
      customDqfItemId: item._id
    };
  });

  const fullDocumentChecklist = [...documentChecklist, ...customChecklistItems];

  const completedDocs = fullDocumentChecklist.filter(d => d.status === 'complete').length;
  const totalDocs = fullDocumentChecklist.length;

  // Calculate overall health
  const getOverallHealth = () => {
    const issues = [];
    if (cdlDays !== null && cdlDays < 0) issues.push('expired');
    else if (cdlDays !== null && cdlDays <= 30) issues.push('warning');
    if (medicalDays !== null && medicalDays < 0) issues.push('expired');
    else if (medicalDays !== null && medicalDays <= 30) issues.push('warning');
    if (driver.clearinghouse?.status && driver.clearinghouse.status !== 'clear') issues.push('warning');

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
          {/* Left: Back + Driver Identity */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app/drivers')}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>

            {/* Avatar with Status Ring */}
            <div className="relative">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                health.color === 'red' ? 'bg-red-100 dark:bg-red-500/20' :
                health.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-500/20' :
                'bg-green-100 dark:bg-green-500/20'
              }`}>
                <span className={`text-2xl font-bold ${
                  health.color === 'red' ? 'text-red-600 dark:text-red-400' :
                  health.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {driver.firstName?.[0]}{driver.lastName?.[0]}
                </span>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900 ${
                driver.status === 'active' ? 'bg-green-500' :
                driver.status === 'inactive' ? 'bg-zinc-400' :
                driver.status === 'terminated' ? 'bg-red-500' : 'bg-zinc-400'
              }`} />
            </div>

            {/* Driver Info */}
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {driver.firstName} {driver.lastName}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-300">
                Employee ID: {driver.employeeId}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={driver.status} />
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {driver.driverType === 'owner_operator' ? 'Owner Operator' : 'Company Driver'}
                </span>
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
              onClick={() => setUploadModal({ open: true, type: 'cdl' })}
              className="btn btn-primary btn-sm"
            >
              <FiUpload className="w-4 h-4 mr-1.5" />
              Upload Document
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
            <HealthBadge label="CDL Expires" days={cdlDays} />
            <HealthBadge label="Medical Card" days={medicalDays} />
            <HealthBadge label="Clearinghouse" status={driver.clearinghouse?.status} />

            {/* DQF Progress */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <FiFolder className="w-4 h-4 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">DQF Complete</p>
                <p className={`text-sm font-semibold ${completedDocs === totalDocs ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {completedDocs}/{totalDocs}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl w-fit">
        <TabButton
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          icon={FiUser}
        >
          Overview
        </TabButton>
        <TabButton
          active={activeTab === 'documents'}
          onClick={() => setActiveTab('documents')}
          icon={FiFolder}
          badge={totalDocs - completedDocs}
        >
          Documents
        </TabButton>
        <TabButton
          active={activeTab === 'safety'}
          onClick={() => setActiveTab('safety')}
          icon={FiShield}
          badge={csaData?.totalViolations}
        >
          Safety & CSA
        </TabButton>
        <TabButton
          active={activeTab === 'claims'}
          onClick={() => setActiveTab('claims')}
          icon={FiDollarSign}
          badge={driverClaims.length}
        >
          Claims
        </TabButton>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <DriverOverviewTab
          driver={driver}
          cdlDays={cdlDays}
          medicalDays={medicalDays}
        />
      )}

      {activeTab === 'documents' && (
        <DriverDocumentsTab
          driver={driver}
          documentChecklist={fullDocumentChecklist}
          completedDocs={completedDocs}
          totalDocs={totalDocs}
          onUpload={(type) => setUploadModal({ open: true, type })}
          customDqfItems={customDqfItems}
          onCustomDqfItemsChange={fetchCustomDqfItems}
          activeCompany={activeCompany}
        />
      )}

      {activeTab === 'safety' && (
        <DriverSafetyTab
          driver={driver}
          driverId={id}
          csaData={csaData}
          csaLoading={csaLoading}
          expandedDvir={expandedDvir}
          setExpandedDvir={setExpandedDvir}
          onUnlinkViolation={handleUnlinkViolation}
          getRiskColor={getRiskColor}
        />
      )}

      {activeTab === 'claims' && (
        <DriverClaimsTab
          claims={driverClaims}
          claimsLoading={claimsLoading}
          getClaimStatusColor={getClaimStatusColor}
        />
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModal.open}
        onClose={() => setUploadModal({ open: false, type: '' })}
        title={`Upload ${fullDocumentChecklist.find(d => d.key === uploadModal.type)?.label || 'Document'}`}
      >
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div>
            <label className="form-label">Select File (PDF, JPG, PNG)</label>
            <input
              type="file"
              name="document"
              accept=".pdf,.jpg,.jpeg,.png"
              required
              className="form-input"
            />
          </div>
          {(uploadModal.type === 'cdl' || uploadModal.type === 'medicalCard') && (
            <div>
              <label className="form-label">New Expiry Date (optional)</label>
              <input
                type="date"
                name="expiryDate"
                className="form-input"
              />
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setUploadModal({ open: false, type: '' })}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? <LoadingSpinner size="sm" /> : 'Upload'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Driver Modal */}
      <EditDriverModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        formData={editFormData}
        onChange={setEditFormData}
        onNestedChange={handleEditNestedChange}
        onSubmit={handleEditSubmit}
        submitting={editSubmitting}
      />
    </div>
  );
};

export default DriverDetail;
