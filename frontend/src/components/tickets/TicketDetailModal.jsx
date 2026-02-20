import { FiFileText, FiCalendar, FiEdit2, FiTrash2, FiDollarSign } from 'react-icons/fi';
import Modal from '../Modal';
import StatusBadge from '../StatusBadge';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { ticketTypes, courtDecisionOptions, dataQOptions, getStatusBadgeType } from '../../data/ticketOptions';

const TicketDetailModal = ({
  isOpen,
  onClose,
  ticket,
  onEdit,
  onDelete,
  onMarkPaid
}) => {
  if (!ticket) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ticket Details"
      icon={FiFileText}
      size="lg"
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-600">
                {ticket.driverId?.firstName?.[0]}{ticket.driverId?.lastName?.[0]}
              </div>
              <div>
                <h3 className="font-semibold text-primary-900">
                  {ticket.driverId?.firstName} {ticket.driverId?.lastName}
                </h3>
                {ticket.ticketNumber && (
                  <p className="text-xs font-mono text-primary-400">#{ticket.ticketNumber}</p>
                )}
                <p className="text-sm text-primary-500">{ticket.driverId?.employeeId}</p>
              </div>
            </div>
          </div>
          <StatusBadge status={ticket.status} type={getStatusBadgeType(ticket.status)} />
        </div>

        {/* Description */}
        <div className="p-4 rounded-xl bg-primary-50 border border-primary-200">
          <p className="font-medium text-primary-900 mb-1">{ticket.description}</p>
          <div className="flex items-center gap-4 text-sm text-primary-600">
            <span className="flex items-center gap-1">
              <FiCalendar className="w-4 h-4" />
              {formatDate(ticket.ticketDate)}
            </span>
            <span className="capitalize">
              {ticketTypes.find(t => t.value === ticket.ticketType)?.label}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white border border-primary-200">
            <p className="text-xs text-primary-500 mb-1">Fine Amount</p>
            <p className="text-lg font-bold font-mono text-primary-900">
              {formatCurrency(ticket.fineAmount)}
            </p>
            {ticket.finePaid && (
              <span className="text-xs text-success-600 font-medium">Paid</span>
            )}
          </div>
          <div className="p-3 rounded-lg bg-white border border-primary-200">
            <p className="text-xs text-primary-500 mb-1">Points</p>
            <p className="text-lg font-bold font-mono text-primary-900">{ticket.points}</p>
            {ticket.pointsOnRecord && (
              <span className="text-xs text-danger-600 font-medium">On Record</span>
            )}
          </div>
          <div className="p-3 rounded-lg bg-white border border-primary-200">
            <p className="text-xs text-primary-500 mb-1">Court Date</p>
            <p className="text-sm font-medium text-primary-900">
              {ticket.courtDate ? formatDate(ticket.courtDate) : 'Not set'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white border border-primary-200">
            <p className="text-xs text-primary-500 mb-1">Court Decision</p>
            <p className="text-sm font-medium text-primary-900 capitalize">
              {courtDecisionOptions.find(o => o.value === ticket.courtDecision)?.label || 'Not Yet'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white border border-primary-200">
            <p className="text-xs text-primary-500 mb-1">DataQ Decision</p>
            <p className="text-sm font-medium text-primary-900 capitalize">
              {dataQOptions.find(o => o.value === ticket.dataQDecision)?.label || 'Not Filed'}
            </p>
          </div>
        </div>

        {/* Attorney */}
        {(ticket.attorney?.name || ticket.attorney?.firm) && (
          <div className="p-4 rounded-xl bg-info-50 border border-info-200">
            <h4 className="text-sm font-semibold text-info-800 mb-2">Attorney Information</h4>
            <p className="text-sm text-info-700">{ticket.attorney.name}</p>
            {ticket.attorney.firm && (
              <p className="text-sm text-info-600">{ticket.attorney.firm}</p>
            )}
            {ticket.attorney.phone && (
              <p className="text-sm text-info-600">{ticket.attorney.phone}</p>
            )}
          </div>
        )}

        {/* Notes */}
        {ticket.notes && (
          <div className="p-4 rounded-xl bg-warning-50 border border-warning-200">
            <h4 className="text-sm font-semibold text-warning-800 mb-2">Notes</h4>
            <p className="text-sm text-warning-700">{ticket.notes}</p>
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
          <div className="flex gap-3">
            <button
              onClick={() => onEdit(ticket)}
              className="btn btn-secondary"
            >
              <FiEdit2 className="w-4 h-4" />
              Edit
            </button>
            {!ticket.finePaid && ticket.status !== 'dismissed' && (
              <button
                onClick={() => {
                  onMarkPaid(ticket);
                  onClose();
                }}
                className="btn btn-primary"
              >
                <FiDollarSign className="w-4 h-4" />
                Mark Paid
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TicketDetailModal;
