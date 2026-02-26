import { useState } from 'react';
import {
  FiFolder, FiCheck, FiAlertCircle, FiFileText, FiUpload, FiShield,
  FiPlus, FiTrash2, FiClipboard
} from 'react-icons/fi';
import { formatDate } from '../../utils/helpers';
import { companiesAPI, driversAPI, viewFile } from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const DriverDocumentsTab = ({
  driver,
  documentChecklist,
  completedDocs,
  totalDocs,
  onUpload,
  onDeleteDocument,
  onRefresh,
  customDqfItems = [],
  onCustomDqfItemsChange,
  activeCompany
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({ name: '', description: '', required: false });
  const [addSubmitting, setAddSubmitting] = useState(false);

  // MVR Review Modal state
  const [showMvrModal, setShowMvrModal] = useState(false);
  const [mvrFormData, setMvrFormData] = useState({
    reviewDate: new Date().toISOString().split('T')[0],
    reviewerName: '',
    hasViolations: false,
    violationNotes: '',
    approved: true,
    file: null
  });
  const [mvrSubmitting, setMvrSubmitting] = useState(false);

  // Certification Modal state
  const [showCertModal, setShowCertModal] = useState(false);
  const [certFormData, setCertFormData] = useState({
    year: new Date().getFullYear(),
    signatureDate: new Date().toISOString().split('T')[0],
    certified: true,
    hasViolations: false,
    violationNotes: '',
    file: null
  });
  const [certSubmitting, setCertSubmitting] = useState(false);

  const isAdmin = ['owner', 'admin'].includes(activeCompany?.role);
  const companyId = activeCompany?._id || activeCompany?.id;

  // Split checklist into FMCSA and custom items
  const fmcsaItems = documentChecklist.filter(d => !d.isCustom);
  const customItems = documentChecklist.filter(d => d.isCustom);

  const handleAddCustomItem = async (e) => {
    e.preventDefault();
    if (!companyId) return;
    setAddSubmitting(true);
    try {
      await companiesAPI.addCustomDqfItem(companyId, addFormData);
      toast.success('Custom requirement added');
      setAddFormData({ name: '', description: '', required: false });
      setShowAddForm(false);
      onCustomDqfItemsChange?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add requirement');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleDeleteCustomItem = async (itemId, itemName) => {
    if (!confirm(`Remove "${itemName}" from all drivers' checklists?`)) return;
    if (!companyId) return;
    try {
      await companiesAPI.deleteCustomDqfItem(companyId, itemId);
      toast.success('Custom requirement removed');
      onCustomDqfItemsChange?.();
    } catch (error) {
      toast.error('Failed to remove requirement');
    }
  };

  // MVR Review submission
  const handleMvrSubmit = async (e) => {
    e.preventDefault();
    setMvrSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('reviewDate', mvrFormData.reviewDate);
      formData.append('reviewerName', mvrFormData.reviewerName);
      formData.append('approved', mvrFormData.approved);
      if (mvrFormData.hasViolations && mvrFormData.violationNotes) {
        formData.append('violations', JSON.stringify([{
          date: new Date().toISOString(),
          description: mvrFormData.violationNotes
        }]));
      }
      if (mvrFormData.file) {
        formData.append('document', mvrFormData.file);
      }

      await driversAPI.addMvr(driver._id, formData);
      toast.success('MVR review recorded');
      setShowMvrModal(false);
      setMvrFormData({
        reviewDate: new Date().toISOString().split('T')[0],
        reviewerName: '',
        hasViolations: false,
        violationNotes: '',
        approved: true,
        file: null
      });
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record MVR review');
    } finally {
      setMvrSubmitting(false);
    }
  };

  // Certification submission
  const handleCertSubmit = async (e) => {
    e.preventDefault();
    setCertSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('year', certFormData.year);
      formData.append('signatureDate', certFormData.signatureDate);
      formData.append('certified', certFormData.certified);
      if (certFormData.hasViolations && certFormData.violationNotes) {
        formData.append('violations', JSON.stringify([{
          date: new Date().toISOString(),
          description: certFormData.violationNotes
        }]));
      }
      if (certFormData.file) {
        formData.append('document', certFormData.file);
      }

      await driversAPI.addCertificationOfViolations(driver._id, formData);
      toast.success('Certification of Violations recorded');
      setShowCertModal(false);
      setCertFormData({
        year: new Date().getFullYear(),
        signatureDate: new Date().toISOString().split('T')[0],
        certified: true,
        hasViolations: false,
        violationNotes: '',
        file: null
      });
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record certification');
    } finally {
      setCertSubmitting(false);
    }
  };

  const renderDocItem = (doc) => (
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
        {doc.isCustom && (
          <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded">
            Custom
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {doc.url && (
          <button
            onClick={() => viewFile(doc.url)}
            className="btn btn-sm btn-secondary"
          >
            <FiFileText className="w-4 h-4" />
          </button>
        )}
        {doc.url && (
          <button
            onClick={async () => {
              if (!confirm(`Delete ${doc.label} document?`)) return;
              try {
                if (doc.isOther) {
                  await driversAPI.deleteOtherDocument(driver._id, doc.otherDocId);
                } else {
                  await driversAPI.deleteDocument(driver._id, doc.key);
                }
                toast.success('Document deleted');
                if (onDeleteDocument) onDeleteDocument();
              } catch (err) {
                toast.error('Failed to delete document');
              }
            }}
            className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded"
            title="Delete document"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onUpload(doc.key)}
          className="btn btn-sm btn-outline"
        >
          <FiUpload className="w-4 h-4 mr-1" />
          Upload
        </button>
        {doc.isCustom && isAdmin && (
          <button
            onClick={() => handleDeleteCustomItem(doc.customDqfItemId, doc.label)}
            className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded"
            title="Remove requirement"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  const sortedCerts = [...(driver.documents?.certificationOfViolations || [])]
    .sort((a, b) => b.year - a.year)
    .slice(0, 5);

  return (
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
              style={{ width: `${totalDocs > 0 ? (completedDocs / totalDocs) * 100 : 0}%` }}
            />
          </div>

          {/* FMCSA Document list */}
          <div className="space-y-3">
            {fmcsaItems.map(renderDocItem)}
          </div>

          {/* Company Requirements Section */}
          {(customItems.length > 0 || isAdmin) && (
            <>
              <div className="mt-6 mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Company Requirements
                </span>
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
              </div>

              <div className="space-y-3">
                {customItems.map(renderDocItem)}
              </div>

              {/* Add Requirement Button + Inline Form (admin only) */}
              {isAdmin && (
                <div className="mt-4">
                  {showAddForm ? (
                    <form onSubmit={handleAddCustomItem} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">
                          Requirement Name *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={100}
                          value={addFormData.name}
                          onChange={(e) => setAddFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="e.g., Company Policy Acknowledgment"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          maxLength={300}
                          value={addFormData.description}
                          onChange={(e) => setAddFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Optional description"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <input
                          type="checkbox"
                          checked={addFormData.required}
                          onChange={(e) => setAddFormData(prev => ({ ...prev, required: e.target.checked }))}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-primary-500"
                        />
                        Mark as required
                      </label>
                      <div className="flex items-center gap-2">
                        <button type="submit" disabled={addSubmitting} className="btn btn-primary btn-sm">
                          {addSubmitting ? 'Adding...' : 'Add Requirement'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddForm(false); setAddFormData({ name: '', description: '', required: false }); }}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-colors"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Requirement
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MVR Reviews */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold flex items-center gap-2">
              <FiFileText className="w-4 h-4 text-primary-500" />
              MVR Reviews (49 CFR 391.25)
            </h3>
            <StatusBadge status={driver.complianceStatus?.mvrStatus} />
          </div>
          <button
            onClick={() => setShowMvrModal(true)}
            className="btn btn-primary btn-sm"
          >
            <FiClipboard className="w-4 h-4 mr-1" />
            Record Review
          </button>
        </div>
        <div className="card-body">
          {driver.documents?.mvrReviews?.length > 0 ? (
            <div className="space-y-3">
              {[...driver.documents.mvrReviews].sort((a, b) =>
                new Date(b.reviewDate) - new Date(a.reviewDate)
              ).slice(0, 5).map((mvr, index) => (
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
                    <div className="flex items-center gap-2">
                      {mvr.documentUrl && (
                        <button
                          onClick={() => viewFile(mvr.documentUrl)}
                          className="btn btn-sm btn-secondary"
                          title="View Document"
                        >
                          <FiFileText className="w-4 h-4" />
                        </button>
                      )}
                      <StatusBadge status={mvr.approved ? 'compliant' : 'warning'} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiFileText className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
              <p className="text-zinc-600 dark:text-zinc-400">No MVR reviews on file</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Annual reviews required per 49 CFR 391.25</p>
            </div>
          )}
        </div>
      </div>

      {/* Certification of Violations */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold flex items-center gap-2">
              <FiClipboard className="w-4 h-4 text-primary-500" />
              Certification of Violations (49 CFR 391.27)
            </h3>
            <StatusBadge status={driver.complianceStatus?.certificationStatus} />
          </div>
          <button
            onClick={() => setShowCertModal(true)}
            className="btn btn-primary btn-sm"
          >
            <FiClipboard className="w-4 h-4 mr-1" />
            Record Certification
          </button>
        </div>
        <div className="card-body">
          {sortedCerts.length > 0 ? (
            <div className="space-y-3">
              {sortedCerts.map((cert, index) => (
                <div key={index} className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">Year: {cert.year}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Signed: {formatDate(cert.signatureDate)}
                      </p>
                      {cert.violations?.length > 0 && (
                        <p className="text-sm text-yellow-600 mt-1">
                          {cert.violations.length} violation(s) reported
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {cert.documentUrl && (
                        <button
                          onClick={() => viewFile(cert.documentUrl)}
                          className="btn btn-sm btn-secondary"
                          title="View Document"
                        >
                          <FiFileText className="w-4 h-4" />
                        </button>
                      )}
                      <StatusBadge status={cert.certified ? 'compliant' : 'warning'} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiClipboard className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
              <p className="text-zinc-600 dark:text-zinc-400">No certifications on file</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                Drivers must annually certify traffic violations per 49 CFR 391.27
              </p>
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

      {/* MVR Review Modal */}
      <Modal
        isOpen={showMvrModal}
        onClose={() => setShowMvrModal(false)}
        title="Record MVR Annual Review"
      >
        <form onSubmit={handleMvrSubmit} className="space-y-4">
          <div>
            <label className="form-label">Review Date *</label>
            <input
              type="date"
              required
              value={mvrFormData.reviewDate}
              onChange={(e) => setMvrFormData(prev => ({ ...prev, reviewDate: e.target.value }))}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Reviewer Name *</label>
            <input
              type="text"
              required
              value={mvrFormData.reviewerName}
              onChange={(e) => setMvrFormData(prev => ({ ...prev, reviewerName: e.target.value }))}
              className="form-input"
              placeholder="Name of person who reviewed the MVR"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={mvrFormData.hasViolations}
              onChange={(e) => setMvrFormData(prev => ({ ...prev, hasViolations: e.target.checked }))}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600"
            />
            Violations found on MVR
          </label>
          {mvrFormData.hasViolations && (
            <div>
              <label className="form-label">Violation Notes</label>
              <textarea
                value={mvrFormData.violationNotes}
                onChange={(e) => setMvrFormData(prev => ({ ...prev, violationNotes: e.target.value }))}
                className="form-input"
                rows={3}
                placeholder="Describe violations found..."
              />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={mvrFormData.approved}
              onChange={(e) => setMvrFormData(prev => ({ ...prev, approved: e.target.checked }))}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600"
            />
            Driver approved to continue operating
          </label>
          <div>
            <label className="form-label">MVR Document (optional)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setMvrFormData(prev => ({ ...prev, file: e.target.files[0] || null }))}
              className="form-input"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowMvrModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={mvrSubmitting} className="btn btn-primary">
              {mvrSubmitting ? 'Saving...' : 'Record Review'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Certification of Violations Modal */}
      <Modal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        title="Record Certification of Violations"
      >
        <form onSubmit={handleCertSubmit} className="space-y-4">
          <div>
            <label className="form-label">Certification Year *</label>
            <input
              type="number"
              required
              min={2000}
              max={2100}
              value={certFormData.year}
              onChange={(e) => setCertFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Signature Date *</label>
            <input
              type="date"
              required
              value={certFormData.signatureDate}
              onChange={(e) => setCertFormData(prev => ({ ...prev, signatureDate: e.target.value }))}
              className="form-input"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={certFormData.certified}
              onChange={(e) => setCertFormData(prev => ({ ...prev, certified: e.target.checked }))}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600"
            />
            Driver has certified their violations
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={certFormData.hasViolations}
              onChange={(e) => setCertFormData(prev => ({ ...prev, hasViolations: e.target.checked }))}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600"
            />
            Driver reported violations
          </label>
          {certFormData.hasViolations && (
            <div>
              <label className="form-label">Violation Details</label>
              <textarea
                value={certFormData.violationNotes}
                onChange={(e) => setCertFormData(prev => ({ ...prev, violationNotes: e.target.value }))}
                className="form-input"
                rows={3}
                placeholder="Describe reported violations..."
              />
            </div>
          )}
          <div>
            <label className="form-label">Signed Document (optional)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setCertFormData(prev => ({ ...prev, file: e.target.files[0] || null }))}
              className="form-input"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCertModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={certSubmitting} className="btn btn-primary">
              {certSubmitting ? 'Saving...' : 'Record Certification'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DriverDocumentsTab;
