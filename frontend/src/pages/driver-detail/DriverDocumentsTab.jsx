import {
  FiFolder, FiCheck, FiAlertCircle, FiFileText, FiUpload, FiShield
} from 'react-icons/fi';
import { formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';

const DriverDocumentsTab = ({ driver, documentChecklist, completedDocs, totalDocs, onUpload }) => {
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
                    onClick={() => onUpload(doc.key)}
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
  );
};

export default DriverDocumentsTab;
