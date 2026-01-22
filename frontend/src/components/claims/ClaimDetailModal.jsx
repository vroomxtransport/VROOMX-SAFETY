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
            <p className="font-mono text-lg font-bold text-primary-900">{claim.claimNumber}</p>
            <p className="text-sm text-primary-500">{formatDate(claim.incidentDate)}</p>
          </div>
          <StatusBadge
            status={statusOptions.find(s => s.value === claim.status)?.label || claim.status}
            type={getStatusBadgeType(claim.status)}
          />
        </div>

        {/* Driver & Vehicle */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-primary-50 border border-primary-200">
            <p className="text-xs text-primary-500 mb-1">Driver</p>
            {claim.driverId ? (
              <p className="text-sm font-medium text-primary-900">
                {claim.driverId.firstName} {claim.driverId.lastName}
              </p>
            ) : (
              <p className="text-sm text-primary-400">Not assigned</p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-primary-50 border border-primary-200">
            <p className="text-xs text-primary-500 mb-1">Vehicle</p>
            {claim.vehicleId ? (
              <p className="text-sm font-medium text-primary-900">
                Unit #{claim.vehicleId.unitNumber}
              </p>
            ) : (
              <p className="text-sm text-primary-400">Not assigned</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="p-4 rounded-xl bg-warning-50 border border-warning-200">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded ${
              claim.faultParty === 'driver' ? 'bg-danger-100 text-danger-700' :
              'bg-primary-100 text-primary-600'
            }`}>
              {getFaultLabel(claim.faultParty)}
            </span>
            <span className="text-xs text-primary-500">
              {getDamageTypeLabel(claim.damageType)}
            </span>
          </div>
          <p className="text-sm text-primary-800">{claim.description}</p>
          {claim.location && (
            <p className="text-xs text-primary-500 mt-2">Location: {claim.location}</p>
          )}
        </div>

        {/* Financial Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white border border-primary-200">
            <p className="text-xs text-primary-500 mb-1">Claim Amount</p>
            <p className="text-xl font-bold font-mono text-primary-900">
              {formatCurrency(claim.claimAmount)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white border border-primary-200">
            <p className="text-xs text-primary-500 mb-1">Settlement Amount</p>
            <p className="text-xl font-bold font-mono text-success-600">
              {formatCurrency(claim.settlementAmount)}
            </p>
          </div>
        </div>

        {/* Insurance Info */}
        {claim.insuranceClaimNumber && (
          <div className="p-3 rounded-lg bg-info-50 border border-info-200">
            <p className="text-xs text-info-600 mb-1">Insurance Claim #</p>
            <p className="text-sm font-mono text-info-800">{claim.insuranceClaimNumber}</p>
          </div>
        )}

        {/* Resolution Notes */}
        {claim.resolutionNotes && (
          <div className="p-3 rounded-lg bg-success-50 border border-success-200">
            <p className="text-xs text-success-600 mb-1">Resolution Notes</p>
            <p className="text-sm text-success-800">{claim.resolutionNotes}</p>
          </div>
        )}

        {/* Documents */}
        {claim.documents?.length > 0 && (
          <div>
            <p className="text-sm font-medium text-primary-700 mb-2">Attached Files</p>
            <div className="space-y-2">
              {claim.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded bg-primary-50 border border-primary-200">
                  <FiPaperclip className="w-4 h-4 text-primary-500" />
                  <span className="text-sm text-primary-700">{doc.originalName || doc.filename}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-primary-100">
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
