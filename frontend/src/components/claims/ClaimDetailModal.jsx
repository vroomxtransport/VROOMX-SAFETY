import { FiAlertTriangle, FiEdit2, FiTrash2, FiPaperclip } from 'react-icons/fi';
import Modal from '../Modal';
import StatusBadge from '../StatusBadge';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { statusOptions, getStatusBadgeType, getDamageTypeLabel, getFaultLabel } from '../../data/claimOptions';

const ClaimDetailModal = ({
  isOpen,
  onClose,
  claim,
  onEdit,
  onDelete
}) => {
  if (!claim) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Claim Details"
      icon={FiAlertTriangle}
      size="lg"
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100">{claim.claimNumber}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{formatDate(claim.incidentDate)}</p>
          </div>
          <StatusBadge
            status={statusOptions.find(s => s.value === claim.status)?.label || claim.status}
            type={getStatusBadgeType(claim.status)}
          />
        </div>

        {/* Driver & Vehicle */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700">
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">Driver</p>
            {claim.driverId ? (
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {claim.driverId.firstName} {claim.driverId.lastName}
              </p>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-300">Not assigned</p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700">
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">Vehicle</p>
            {claim.vehicleId ? (
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Unit #{claim.vehicleId.unitNumber}
              </p>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-300">Not assigned</p>
            )}
          </div>
          {claim.tripId && (
            <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700">
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">Trip / Reference</p>
              <p className="text-sm font-medium font-mono text-zinc-900 dark:text-zinc-100">{claim.tripId}</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="p-4 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded ${
              claim.faultParty === 'driver' ? 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400' :
              'bg-primary-100 dark:bg-primary-900/30 text-zinc-700 dark:text-zinc-300'
            }`}>
              {getFaultLabel(claim.faultParty)}
            </span>
            <span className="text-xs text-zinc-600 dark:text-zinc-300">
              {getDamageTypeLabel(claim.damageType)}
            </span>
          </div>
          <p className="text-sm text-zinc-800 dark:text-zinc-200">{claim.description}</p>
          {claim.location && (
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-2">Location: {claim.location}</p>
          )}
        </div>

        {/* Financial Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white dark:bg-primary-800 border border-primary-200 dark:border-primary-700">
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">Claim Amount</p>
            <p className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
              {formatCurrency(claim.claimAmount)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-primary-800 border border-primary-200 dark:border-primary-700">
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">Settlement Amount</p>
            <p className="text-xl font-bold font-mono text-success-600 dark:text-success-400">
              {formatCurrency(claim.settlementAmount)}
            </p>
          </div>
        </div>

        {/* Insurance Info */}
        {claim.insuranceClaimNumber && (
          <div className="p-3 rounded-lg bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-700">
            <p className="text-xs text-info-600 dark:text-info-400 mb-1">Insurance Claim #</p>
            <p className="text-sm font-mono text-info-800 dark:text-info-300">{claim.insuranceClaimNumber}</p>
          </div>
        )}

        {/* Resolution Notes */}
        {claim.resolutionNotes && (
          <div className="p-3 rounded-lg bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700">
            <p className="text-xs text-success-600 dark:text-success-400 mb-1">Resolution Notes</p>
            <p className="text-sm text-success-800 dark:text-success-300">{claim.resolutionNotes}</p>
          </div>
        )}

        {/* Documents */}
        {claim.documents?.length > 0 && (
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">Attached Files</p>
            <div className="space-y-2">
              {claim.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700">
                  <FiPaperclip className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-200">{doc.originalName || doc.filename}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-primary-100 dark:border-primary-700">
          <button
            onClick={onDelete}
            className="btn btn-secondary text-danger-600 hover:text-danger-700 hover:bg-danger-50"
          >
            <FiTrash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={() => onEdit(claim)}
            className="btn btn-primary"
          >
            <FiEdit2 className="w-4 h-4" />
            Edit Claim
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ClaimDetailModal;
