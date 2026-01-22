import { FiSend, FiMail } from 'react-icons/fi';
import Modal from '../Modal';
import LoadingSpinner from '../LoadingSpinner';

const InviteMemberModal = ({ isOpen, onClose, activeCompany, inviteForm, setInviteForm, handleInviteMember, loading }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invite to ${activeCompany?.name}`}
      icon={FiSend}
    >
      <form onSubmit={handleInviteMember} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email Address *</label>
          <div className="relative">
            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
              type="email"
              className="form-input pl-10"
              required
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              placeholder="colleague@example.com"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Role *</label>
          <select
            className="form-select"
            required
            value={inviteForm.role}
            onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
          >
            <option value="viewer">Viewer</option>
            <option value="dispatcher">Dispatcher</option>
            <option value="safety_manager">Safety Manager</option>
            <option value="admin">Admin</option>
          </select>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
            Admins have full access. Safety Managers can edit. Viewers are read-only.
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : (
              <>
                <FiSend className="w-4 h-4" />
                Send Invitation
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InviteMemberModal;
