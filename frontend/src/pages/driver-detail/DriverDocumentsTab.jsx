import { useState } from 'react';
import {
  FiFolder, FiCheck, FiAlertCircle, FiFileText, FiUpload, FiShield,
  FiPlus, FiTrash2
} from 'react-icons/fi';
import { formatDate } from '../../utils/helpers';
import { companiesAPI, driversAPI, viewFile } from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';

const DriverDocumentsTab = ({
  driver,
  documentChecklist,
  completedDocs,
  totalDocs,
  onUpload,
  onDeleteDocument,
  customDqfItems = [],
  onCustomDqfItemsChange,
  activeCompany
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({ name: '', description: '', required: false });
  const [addSubmitting, setAddSubmitting] = useState(false);

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
  );
};

export default DriverDocumentsTab;
