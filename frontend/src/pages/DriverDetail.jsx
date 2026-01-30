import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { driversAPI, violationsAPI } from '../utils/api';
import { formatDate, daysUntilExpiry, getStatusConfig, formatPhone, basicCategories } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiUpload, FiEdit2, FiFileText, FiCalendar, FiUser, FiPhone, FiMail, FiCheck, FiAlertCircle, FiAlertTriangle, FiShield, FiLink } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

const DriverDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState({ open: false, type: '' });
  const [uploading, setUploading] = useState(false);
  const [csaData, setCsaData] = useState(null);
  const [csaLoading, setCsaLoading] = useState(true);

  useEffect(() => {
    fetchDriver();
    fetchCSAData();
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
      // CSA data may not exist, that's okay
      setCsaData(null);
    } finally {
      setCsaLoading(false);
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

  const documentChecklist = [
    { key: 'cdl', label: 'CDL Copy', status: driver.cdl?.documentUrl ? 'complete' : 'missing', url: driver.cdl?.documentUrl },
    { key: 'medicalCard', label: 'Medical Card', status: driver.medicalCard?.documentUrl ? 'complete' : 'missing', url: driver.medicalCard?.documentUrl },
    { key: 'roadTest', label: 'Road Test Certificate', status: driver.documents?.roadTest?.result ? 'complete' : 'missing', url: driver.documents?.roadTest?.documentUrl },
    { key: 'employmentApplication', label: 'Employment Application', status: driver.documents?.employmentApplication?.complete ? 'complete' : 'missing', url: driver.documents?.employmentApplication?.documentUrl },
    { key: 'clearinghouse', label: 'Clearinghouse Query', status: driver.clearinghouse?.status === 'clear' ? 'complete' : driver.clearinghouse?.lastQueryDate ? 'warning' : 'missing' }
  ];

  const completedDocs = documentChecklist.filter(d => d.status === 'complete').length;
  const totalDocs = documentChecklist.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/drivers')}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {driver.firstName} {driver.lastName}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-300">Employee ID: {driver.employeeId}</p>
          </div>
        </div>
        <StatusBadge status={driver.complianceStatus?.overall} className="text-sm px-4 py-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Driver Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                    {driver.firstName?.[0]}{driver.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                    {driver.firstName} {driver.middleName ? `${driver.middleName} ` : ''}{driver.lastName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={driver.status} />
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                      {driver.driverType === 'owner_operator' ? 'Owner Operator' : 'Company Driver'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {driver.email && (
                  <div className="flex items-center text-zinc-600 dark:text-zinc-400">
                    <FiMail className="w-4 h-4 mr-3" />
                    <span className="text-sm">{driver.email}</span>
                  </div>
                )}
                {driver.phone && (
                  <div className="flex items-center text-zinc-600 dark:text-zinc-400">
                    <FiPhone className="w-4 h-4 mr-3" />
                    <span className="text-sm">{formatPhone(driver.phone)}</span>
                  </div>
                )}
                <div className="flex items-center text-zinc-600 dark:text-zinc-400">
                  <FiCalendar className="w-4 h-4 mr-3" />
                  <span className="text-sm">Hired: {formatDate(driver.hireDate)}</span>
                </div>
                {driver.terminationDate && (
                  <div className="flex items-center text-red-600 dark:text-red-400">
                    <FiCalendar className="w-4 h-4 mr-3" />
                    <span className="text-sm">Terminated: {formatDate(driver.terminationDate)}</span>
                  </div>
                )}
                <div className="flex items-center text-zinc-600 dark:text-zinc-400">
                  <FiUser className="w-4 h-4 mr-3" />
                  <span className="text-sm">DOB: {formatDate(driver.dateOfBirth)}</span>
                </div>
              </div>

              {/* Address Section */}
              {(driver.address?.street || driver.address?.city) && (
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">Address</p>
                  <div className="text-sm text-zinc-700 dark:text-zinc-300">
                    {driver.address.street && <p>{driver.address.street}</p>}
                    <p>
                      {[driver.address.city, driver.address.state].filter(Boolean).join(', ')}
                      {driver.address.zipCode && ` ${driver.address.zipCode}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CDL Info Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">CDL Information</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">Number</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{driver.cdl?.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">State</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{driver.cdl?.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">Class</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">Class {driver.cdl?.class}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">Endorsements</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {driver.cdl?.endorsements?.length > 0 ? driver.cdl.endorsements.join(', ') : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-300">Restrictions</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {driver.cdl?.restrictions?.length > 0 ? driver.cdl.restrictions.join(', ') : 'None'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-300">Expires</span>
                <div className="text-right">
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{formatDate(driver.cdl?.expiryDate)}</p>
                  <StatusBadge status={driver.complianceStatus?.cdlStatus} />
                </div>
              </div>
            </div>
          </div>

          {/* Medical Card Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Medical Card</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-300">Expires</span>
                <div className="text-right">
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{formatDate(driver.medicalCard?.expiryDate)}</p>
                  <StatusBadge status={driver.complianceStatus?.medicalStatus} />
                </div>
              </div>
              {driver.medicalCard?.examinerName && (
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-300">Examiner</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{driver.medicalCard.examinerName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Progress */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">DQF Document Checklist</h3>
              <span className="text-sm text-zinc-600 dark:text-zinc-300">{completedDocs}/{totalDocs} Complete</span>
            </div>
            <div className="card-body">
              {/* Progress bar */}
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 mb-6">
                <div
                  className={`h-2 rounded-full ${completedDocs === totalDocs ? 'bg-green-500' : 'bg-yellow-500'}`}
                  style={{ width: `${(completedDocs / totalDocs) * 100}%` }}
                />
              </div>

              {/* Document list */}
              <div className="space-y-3">
                {documentChecklist.map((doc) => (
                  <div
                    key={doc.key}
                    className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
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
                    <div className="flex items-center space-x-2">
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
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">MVR Reviews (49 CFR 391.25)</h3>
              <StatusBadge status={driver.complianceStatus?.mvrStatus} />
            </div>
            <div className="card-body">
              {driver.documents?.mvrReviews?.length > 0 ? (
                <div className="space-y-3">
                  {driver.documents.mvrReviews.slice(-3).reverse().map((mvr, index) => (
                    <div key={index} className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:shadow-md hover:-translate-y-0.5 hover:border-accent-300 dark:hover:border-accent-500/50 transition-all duration-200 cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">Review Date: {formatDate(mvr.reviewDate)}</p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-300">Reviewed by: {mvr.reviewerName}</p>
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
                <p className="text-zinc-600 dark:text-zinc-300 text-center py-4">No MVR reviews on file</p>
              )}
            </div>
          </div>

          {/* Clearinghouse Status */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Clearinghouse Status</h3>
              <StatusBadge status={driver.complianceStatus?.clearinghouseStatus} />
            </div>
            <div className="card-body">
              {driver.clearinghouse?.lastQueryDate ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-300">Last Query</span>
                    <span className="text-zinc-800 dark:text-zinc-200">{formatDate(driver.clearinghouse.lastQueryDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-300">Query Type</span>
                    <span className="capitalize text-zinc-800 dark:text-zinc-200">{driver.clearinghouse.queryType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-300">Result</span>
                    <StatusBadge status={driver.clearinghouse.status === 'clear' ? 'compliant' : 'warning'} />
                  </div>
                </div>
              ) : (
                <p className="text-zinc-600 dark:text-zinc-300 text-center py-4">No Clearinghouse query on file</p>
              )}
            </div>
          </div>

          {/* CSA Impact */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiShield className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">CSA Impact</h3>
              </div>
              {csaData && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(csaData.riskLevel)}`}>
                  {csaData.riskLevel} Risk
                </span>
              )}
            </div>
            <div className="card-body">
              {csaLoading ? (
                <div className="flex justify-center py-6">
                  <LoadingSpinner size="sm" />
                </div>
              ) : csaData && csaData.totalViolations > 0 ? (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                      <p className="text-2xl font-bold text-zinc-900 dark:text-white">{csaData.totalViolations}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Violations</p>
                    </div>
                    <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                      <p className="text-2xl font-bold text-zinc-900 dark:text-white">{Math.round(csaData.totalPoints)}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Total Points</p>
                    </div>
                    <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{csaData.oosViolations}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">OOS</p>
                    </div>
                  </div>

                  {/* BASIC Breakdown */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">BASIC Categories</p>
                    <div className="space-y-2">
                      {Object.entries(csaData.basicBreakdown || {})
                        .filter(([, data]) => data.count > 0)
                        .sort((a, b) => b[1].weightedPoints - a[1].weightedPoints)
                        .map(([basic, data]) => (
                          <div key={basic} className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">{data.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">{data.count} violations</span>
                              <span className="font-mono text-sm font-medium text-zinc-900 dark:text-white">{Math.round(data.weightedPoints)} pts</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Recent Violations */}
                  {csaData.recentViolations?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">Recent Violations</p>
                      <div className="space-y-2">
                        {csaData.recentViolations.map((violation) => (
                          <div key={violation._id} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                            <div className="flex-1">
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
                        className="mt-3 block text-center text-sm text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300"
                      >
                        View all violations →
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FiShield className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-zinc-600 dark:text-zinc-300">No violations linked to this driver</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Clean CSA record</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
          <div className="flex justify-end space-x-3">
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
    </div>
  );
};

export default DriverDetail;
