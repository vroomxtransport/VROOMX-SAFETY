import { FiTrash2 } from 'react-icons/fi';
import Modal from '../Modal';
import LoadingSpinner from '../LoadingSpinner';
import { formatDate } from '../../utils/helpers';

const TicketDeleteModal = ({
  isOpen,
  onClose,
  ticket,
  onDelete,
  submitting
}) => {
  if (!ticket) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Ticket"
      icon={FiTrash2}
    >
      <div className="space-y-4">
        <p className="text-primary-700">
          Are you sure you want to delete this ticket? This action cannot be undone.
        </p>
        <div className="p-4 rounded-xl bg-danger-50 border border-danger-200">
          <p className="font-medium text-danger-900">{ticket.description}</p>
          <p className="text-sm text-danger-700 mt-1">
            {ticket.driverId?.firstName} {ticket.driverId?.lastName} - {formatDate(ticket.ticketDate)}
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-primary-100">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className="btn btn-primary bg-danger-600 hover:bg-danger-700"
            disabled={submitting}
          >
            {submitting ? <LoadingSpinner size="sm" /> : 'Delete Ticket'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TicketDeleteModal;
