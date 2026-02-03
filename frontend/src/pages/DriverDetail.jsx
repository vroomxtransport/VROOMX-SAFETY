import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { driversAPI, violationsAPI, damageClaimsAPI } from '../utils/api';
import { formatDate, daysUntilExpiry, formatPhone, basicCategories } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiUpload, FiEdit2, FiFileText, FiCalendar, FiUser,
  FiPhone, FiMail, FiCheck, FiAlertCircle, FiShield, FiLink,
  FiClipboard, FiTruck, FiMapPin, FiChevronDown, FiChevronUp,
  FiClock, FiAward, FiFolder, FiUsers, FiCreditCard, FiDollarSign
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

// Health status badge component
const HealthBadge = ({ label, days, status }) => {
  let bgColor, textColor, icon;

  if (status === 'clear' || status === 'compliant') {
    bgColor = 'bg-green-100 dark:bg-green-500/20';
    textColor = 'text-green-600 dark:text-green-400';
    icon = <FiCheck className="w-4 h-4" />;
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bgColor}`}>
        <span className={textColor}>{icon}</span>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className={`text-sm font-semibold ${textColor}`}>Clear</p>
        </div>
      </div>
    );
  }

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
const TabButton = ({ active, onClick, children, icon: Icon, badge }) => (
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
    {badge !== undefined && badge > 0 && (
      <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${active ? 'bg-white/20' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
        {badge}
      </span>
    )}
  </button>
);

const DriverDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchDriver();
    fetchCSAData();
    fetchDriverClaims();
  }, [id]);

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
    formData.append('documentType', uploadModal.type);

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
    { key: 'cdl', label: 'CDL Copy', status: driver.cdl?.documentUrl ? 'complete' : 'missing', url: driver.cdl?.documentUrl },
    { key: 'medicalCard', label: 'Medical Card', status: driver.medicalCard?.documentUrl ? 'complete' : 'missing', url: driver.medicalCard?.documentUrl },
    { key: 'roadTest', label: 'Road Test Certificate', status: driver.documents?.roadTest?.result ? 'complete' : 'missing', url: driver.documents?.roadTest?.documentUrl },
    { key: 'employmentApplication', label: 'Employment Application', status: driver.documents?.employmentApplication?.complete ? 'complete' : 'missing', url: driver.documents?.employmentApplication?.documentUrl },
    { key: 'clearinghouse', label: 'Clearinghouse Query', status: driver.clearinghouse?.status === 'clear' ? 'complete' : driver.clearinghouse?.lastQueryDate ? 'warning' : 'missing' }
  ];

  const completedDocs = documentChecklist.filter(d => d.status === 'complete').length;
  const totalDocs = documentChecklist.length;

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center gap-2">
                <FiUser className="w-4 h-4 text-primary-500" />
                Driver Profile
              </h3>
            </div>
            <div className="card-body space-y-4">
              {/* Contact Info */}
              <div className="space-y-3">
                {driver.email && (
                  <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                    <FiMail className="w-4 h-4" />
                    <span>{driver.email}</span>
                  </div>
                )}
                {driver.phone && (
                  <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                    <FiPhone className="w-4 h-4" />
                    <span>{formatPhone(driver.phone)}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                  <FiCalendar className="w-4 h-4" />
                  <span>Hired: {formatDate(driver.hireDate)}</span>
                </div>
                {driver.terminationDate && (
                  <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                    <FiCalendar className="w-4 h-4" />
                    <span>Terminated: {formatDate(driver.terminationDate)}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                  <FiUser className="w-4 h-4" />
                  <span>DOB: {formatDate(driver.dateOfBirth)}</span>
                </div>
              </div>

              {/* Address */}
              {(driver.address?.street || driver.address?.city) && (
                <>
                  <div className="border-t border-zinc-100 dark:border-zinc-800" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">Address</p>
                    <div className="text-sm text-zinc-700 dark:text-zinc-300">
                      {driver.address.street && <p>{driver.address.street}</p>}
                      <p>
                        {[driver.address.city, driver.address.state].filter(Boolean).join(', ')}
                        {driver.address.zipCode && ` ${driver.address.zipCode}`}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CDL & Medical Card Info */}
          <div className="space-y-6">
            {/* CDL Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold flex items-center gap-2">
                  <FiAward className="w-4 h-4 text-primary-500" />
                  CDL Information
                </h3>
              </div>
              <div className="card-body space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Number</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{driver.cdl?.number || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">State</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{driver.cdl?.state || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Class</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Class {driver.cdl?.class || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Endorsements</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {driver.cdl?.endorsements?.length > 0 ? driver.cdl.endorsements.join(', ') : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Restrictions</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {driver.cdl?.restrictions?.length > 0 ? driver.cdl.restrictions.join(', ') : 'None'}
                  </span>
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-600 dark:text-zinc-400">Expires</span>
                    <div className="text-right">
                      <p className={`font-medium ${cdlDays !== null && cdlDays < 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {formatDate(driver.cdl?.expiryDate)}
                      </p>
                      <StatusBadge status={driver.complianceStatus?.cdlStatus} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold flex items-center gap-2">
                  <FiFileText className="w-4 h-4 text-primary-500" />
                  Medical Card
                </h3>
              </div>
              <div className="card-body space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600 dark:text-zinc-400">Expires</span>
                  <div className="text-right">
                    <p className={`font-medium ${medicalDays !== null && medicalDays < 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {formatDate(driver.medicalCard?.expiryDate)}
                    </p>
                    <StatusBadge status={driver.complianceStatus?.medicalStatus} />
                  </div>
                </div>
                {driver.medicalCard?.examinerName && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Examiner</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{driver.medicalCard.examinerName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* DQF Document Checklist */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <FiFolder className="w-4 h-4 text-primary-500" />
                DQF Document Checklist
              </h3>
              <span className={`text-sm font-medium ${completedDocs === totalDocs ? 'text-green-600' : 'text-yellow-600'}`}>
                {completedDocs}/{totalDocs} Complete
              </span>
            </div>
            <div className="card-body">
              {/* Progress bar */}
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 mb-6">
                <div
                  className={`h-2 rounded-full transition-all ${completedDocs === totalDocs ? 'bg-green-500' : 'bg-yellow-500'}`}
                  style={{ width: `${(completedDocs / totalDocs) * 100}%` }}
                />
              </div>

              {/* Document list */}
              <div className="space-y-3">
                {documentChecklist.map((doc) => (
                  <div
                    key={doc.key}
                    className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {doc.status === 'complete' ? (
                        <FiCheck className="w-5 h-5 text-green-500" />
                      ) : doc.status === 'warning' ? (
                        <FiAlertCircle className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <FiAlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={doc.status === 'complete' ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-300'}>
                        {doc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-secondary"
                        >
                          <FiFileText className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => setUploadModal({ open: true, type: doc.key })}
                        className="btn btn-sm btn-outline"
                      >
                        <FiUpload className="w-4 h-4 mr-1" />
                        Upload
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MVR Reviews */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-primary-500" />
                MVR Reviews (49 CFR 391.25)
              </h3>
              <StatusBadge status={driver.complianceStatus?.mvrStatus} />
            </div>
            <div className="card-body">
              {driver.documents?.mvrReviews?.length > 0 ? (
                <div className="space-y-3">
                  {driver.documents.mvrReviews.slice(-3).reverse().map((mvr, index) => (
                    <div key={index} className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">Review Date: {formatDate(mvr.reviewDate)}</p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">Reviewed by: {mvr.reviewerName}</p>
                          {mvr.violations?.length > 0 && (
                            <p className="text-sm text-yellow-600 mt-1">
                              {mvr.violations.length} violation(s) found
                            </p>
                          )}
                        </div>
                        <StatusBadge status={mvr.approved ? 'compliant' : 'warning'} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiFileText className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-zinc-600 dark:text-zinc-400">No MVR reviews on file</p>
                </div>
              )}
            </div>
          </div>

          {/* Clearinghouse Status */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <FiShield className="w-4 h-4 text-primary-500" />
                Clearinghouse Status
              </h3>
              <StatusBadge status={driver.complianceStatus?.clearinghouseStatus} />
            </div>
            <div className="card-body">
              {driver.clearinghouse?.lastQueryDate ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Last Query</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{formatDate(driver.clearinghouse.lastQueryDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Query Type</span>
                    <span className="capitalize text-zinc-900 dark:text-zinc-100">{driver.clearinghouse.queryType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Result</span>
                    <StatusBadge status={driver.clearinghouse.status === 'clear' ? 'compliant' : 'warning'} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiShield className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-zinc-600 dark:text-zinc-400">No Clearinghouse query on file</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'safety' && (
        <div className="space-y-6">
          {/* CSA Impact */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <FiShield className="w-4 h-4 text-primary-500" />
                CSA Impact
              </h3>
              {csaData && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(csaData.riskLevel)}`}>
                  {csaData.riskLevel} Risk
                </span>
              )}
            </div>
            <div className="card-body">
              {csaLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="sm" />
                </div>
              ) : csaData && csaData.totalViolations > 0 ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                      <p className="text-3xl font-bold text-zinc-900 dark:text-white">{csaData.totalViolations}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Violations</p>
                    </div>
                    <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                      <p className="text-3xl font-bold text-zinc-900 dark:text-white">{Math.round(csaData.totalPoints)}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Points</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-500/10 rounded-xl">
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">{csaData.oosViolations}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Out of Service</p>
                    </div>
                  </div>

                  {/* BASIC Breakdown */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">BASIC Categories</p>
                    <div className="space-y-2">
                      {Object.entries(csaData.basicBreakdown || {})
                        .filter(([, data]) => data.count > 0)
                        .sort((a, b) => b[1].weightedPoints - a[1].weightedPoints)
                        .map(([basic, data]) => (
                          <div key={basic} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">{data.name}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">{data.count} violations</span>
                              <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-white">{Math.round(data.weightedPoints)} pts</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Recent Violations */}
                  {csaData.recentViolations?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">Recent Violations</p>
                      <div className="space-y-2">
                        {csaData.recentViolations.map((violation) => (
                          <div key={violation._id} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{violation.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(violation.date)}</span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">•</span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{basicCategories?.[violation.basic]?.label || violation.basic?.replace('_', ' ')}</span>
                                {violation.outOfService && (
                                  <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded">OOS</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <span className="font-mono text-sm text-zinc-600 dark:text-zinc-300">{violation.severityWeight} pts</span>
                              <button
                                onClick={() => handleUnlinkViolation(violation._id)}
                                className="p-1.5 text-zinc-400 hover:text-warning-600 dark:hover:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-500/20 rounded transition-colors"
                                title="Unlink violation"
                              >
                                <FiLink className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Link
                        to={`/app/violations?driverId=${id}`}
                        className="mt-4 block text-center text-sm text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300"
                      >
                        View all violations →
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                    <FiShield className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">Clean Record</h3>
                  <p className="text-zinc-500 dark:text-zinc-400">No violations linked to this driver</p>
                </div>
              )}
            </div>
          </div>

          {/* Samsara DVIRs */}
          {driver.samsaraId && (
            <div className="card border-l-4 border-l-orange-500">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/images/integrations/samsara.svg" alt="Samsara" className="w-5 h-5" />
                  <h3 className="font-semibold">Recent DVIRs</h3>
                </div>
                {driver.samsaraDvirs?.length > 0 && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {driver.samsaraDvirs.length} inspection{driver.samsaraDvirs.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="card-body">
                {driver.samsaraDvirs?.length > 0 ? (
                  <div className="space-y-3">
                    {driver.samsaraDvirs
                      .slice()
                      .sort((a, b) => new Date(b.inspectedAt) - new Date(a.inspectedAt))
                      .slice(0, 10)
                      .map((dvir, index) => (
                        <div
                          key={dvir.samsaraId || index}
                          className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
                        >
                          {/* DVIR Header */}
                          <div
                            className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
                            onClick={() => setExpandedDvir(expandedDvir === dvir.samsaraId ? null : dvir.samsaraId)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                dvir.defectsFound
                                  ? 'bg-yellow-100 dark:bg-yellow-500/20'
                                  : 'bg-green-100 dark:bg-green-500/20'
                              }`}>
                                <FiClipboard className={`w-5 h-5 ${
                                  dvir.defectsFound
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-green-600 dark:text-green-400'
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium text-zinc-900 dark:text-white text-sm">
                                  {dvir.inspectionType === 'pre_trip' ? 'Pre-Trip' : dvir.inspectionType === 'post_trip' ? 'Post-Trip' : 'Inspection'}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {formatDate(dvir.inspectedAt)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-300">
                                  <FiTruck className="w-3.5 h-3.5" />
                                  <span>{dvir.vehicleName}</span>
                                </div>
                                {dvir.defectsFound ? (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                                    {dvir.defects?.length || 0} defect{(dvir.defects?.length || 0) !== 1 ? 's' : ''}
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
                                    No defects
                                  </span>
                                )}
                              </div>
                              {expandedDvir === dvir.samsaraId ? (
                                <FiChevronUp className="w-4 h-4 text-zinc-400" />
                              ) : (
                                <FiChevronDown className="w-4 h-4 text-zinc-400" />
                              )}
                            </div>
                          </div>

                          {/* Expanded DVIR Details */}
                          {expandedDvir === dvir.samsaraId && (
                            <div className="p-3 border-t border-zinc-200 dark:border-zinc-700 space-y-3">
                              {/* Safe to Operate */}
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Safe to Operate</span>
                                <span className={`text-sm font-medium ${
                                  dvir.safeToOperate
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {dvir.safeToOperate ? 'Yes' : 'No'}
                                </span>
                              </div>

                              {/* Location */}
                              {dvir.location?.address && (
                                <div className="flex items-start justify-between">
                                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Location</span>
                                  <a
                                    href={`https://www.google.com/maps?q=${dvir.location.latitude},${dvir.location.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-accent-600 hover:underline text-right max-w-[200px]"
                                  >
                                    {dvir.location.address}
                                  </a>
                                </div>
                              )}

                              {/* Defects List */}
                              {dvir.defects?.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                                    Defects Found
                                  </p>
                                  <div className="space-y-2">
                                    {dvir.defects.map((defect, dIndex) => (
                                      <div
                                        key={dIndex}
                                        className={`p-2 rounded-lg text-sm ${
                                          defect.resolved
                                            ? 'bg-green-50 dark:bg-green-500/10'
                                            : 'bg-yellow-50 dark:bg-yellow-500/10'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <span className="font-medium text-zinc-900 dark:text-white">
                                              {defect.category}
                                            </span>
                                            {defect.isMajor && (
                                              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                                                Major
                                              </span>
                                            )}
                                            <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-0.5">
                                              {defect.description}
                                            </p>
                                          </div>
                                          {defect.resolved ? (
                                            <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                                          ) : (
                                            <FiAlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiClipboard className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No DVIRs synced yet</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">DVIRs will appear after syncing with Samsara</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'claims' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Claims</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{driverClaims.length}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Open Claims</p>
              <p className="text-2xl font-bold text-warning-600">
                {driverClaims.filter(c => ['open', 'under_investigation', 'pending_settlement'].includes(c.status)).length}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Driver at Fault</p>
              <p className="text-2xl font-bold text-red-600">
                {driverClaims.filter(c => c.faultParty === 'driver').length}
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
              ) : driverClaims.length === 0 ? (
                <div className="text-center py-8">
                  <FiDollarSign className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No claims found for this driver</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {driverClaims.map(claim => (
                    <Link
                      key={claim._id}
                      to={`/app/damage-claims?claimId=${claim._id}`}
                      className="block bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-primary-300 dark:hover:border-primary-600"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">{claim.claimNumber}</p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {new Date(claim.incidentDate).toLocaleDateString()} • {claim.damageType?.replace('_', ' ')}
                          </p>
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
                      {claim.faultParty === 'driver' && (
                        <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 rounded">
                          Driver at Fault
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModal.open}
        onClose={() => setUploadModal({ open: false, type: '' })}
        title={`Upload ${documentChecklist.find(d => d.key === uploadModal.type)?.label || 'Document'}`}
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
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Driver"
        icon={FiUsers}
        size="lg"
      >
        {editFormData && (
          <form onSubmit={handleEditSubmit} className="space-y-5">
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
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Last Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Date of Birth *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={editFormData.dateOfBirth}
                  onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Driver Type</label>
                <select
                  value={editFormData.driverType}
                  onChange={(e) => setEditFormData({ ...editFormData, driverType: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-cta focus:border-cta"
                >
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
                  value={editFormData.hireDate}
                  onChange={(e) => setEditFormData({ ...editFormData, hireDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-cta focus:border-cta"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>

              {/* Address Section */}
              <div className="col-span-1 md:col-span-2 border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-2">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-3">Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Street</label>
                    <input
                      type="text"
                      name="address.street"
                      value={editFormData.address?.street || ''}
                      onChange={handleEditNestedChange}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">City</label>
                    <input
                      type="text"
                      name="address.city"
                      value={editFormData.address?.city || ''}
                      onChange={handleEditNestedChange}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">State</label>
                      <input
                        type="text"
                        name="address.state"
                        value={editFormData.address?.state || ''}
                        onChange={handleEditNestedChange}
                        maxLength={2}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">ZIP</label>
                      <input
                        type="text"
                        name="address.zipCode"
                        value={editFormData.address?.zipCode || ''}
                        onChange={handleEditNestedChange}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">CDL Number *</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    required
                    value={editFormData.cdl.number}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      cdl: { ...editFormData.cdl, number: e.target.value }
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
                    value={editFormData.cdl.state}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      cdl: { ...editFormData.cdl, state: e.target.value.toUpperCase() }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Class *</label>
                  <select
                    className="form-select"
                    required
                    value={editFormData.cdl.class}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      cdl: { ...editFormData.cdl, class: e.target.value }
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
                    value={editFormData.cdl.expiryDate}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      cdl: { ...editFormData.cdl, expiryDate: e.target.value }
                    })}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">CDL Endorsements</label>
                  <div className="flex flex-wrap gap-2">
                    {['H', 'N', 'P', 'S', 'T', 'X'].map(end => (
                      <label key={end} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={editFormData.cdl?.endorsements?.includes(end) || false}
                          onChange={(e) => {
                            const current = editFormData.cdl?.endorsements || [];
                            const updated = e.target.checked ? [...current, end] : current.filter(x => x !== end);
                            setEditFormData(prev => ({ ...prev, cdl: { ...prev.cdl, endorsements: updated } }));
                          }}
                          className="rounded text-cta focus:ring-cta"
                        />
                        <span className="text-sm text-zinc-700 dark:text-zinc-200">{end}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">CDL Restrictions</label>
                  <input
                    type="text"
                    value={editFormData.cdl?.restrictions?.join(', ') || ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      cdl: { ...prev.cdl, restrictions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                    }))}
                    placeholder="e.g. L, Z (comma-separated)"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
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
                  value={editFormData.medicalCard.expiryDate}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    medicalCard: { ...editFormData.medicalCard, expiryDate: e.target.value }
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
                  <input
                    type="date"
                    value={editFormData.mvrExpiryDate || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, mvrExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Clearinghouse Exp.</label>
                  <input
                    type="date"
                    value={editFormData.clearinghouseExpiry || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, clearinghouseExpiry: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                {editFormData.status === 'terminated' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Termination Date</label>
                    <input
                      type="date"
                      value={editFormData.terminationDate || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, terminationDate: e.target.value })}
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
                {editSubmitting ? <LoadingSpinner size="sm" /> : 'Update Driver'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default DriverDetail;
