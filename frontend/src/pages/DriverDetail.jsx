import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { driversAPI } from '../utils/api';
import { formatDate, daysUntilExpiry, getStatusConfig, formatPhone } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiUpload, FiEdit2, FiFileText, FiCalendar, FiUser, FiPhone, FiMail, FiCheck, FiAlertCircle } from 'react-icons/fi';
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

  useEffect(() => {
    fetchDriver();
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
                  <p className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">{driver.firstName} {driver.lastName}</p>
                  <StatusBadge status={driver.status} />
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
                <div className="flex items-center text-zinc-600 dark:text-zinc-400">
                  <FiUser className="w-4 h-4 mr-3" />
                  <span className="text-sm">DOB: {formatDate(driver.dateOfBirth)}</span>
                </div>
              </div>
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
