import { FiUsers, FiMail, FiLock } from 'react-icons/fi';
import Modal from '../Modal';
import LoadingSpinner from '../LoadingSpinner';

const AddUserModal = ({ isOpen, onClose, newUserForm, setNewUserForm, handleAddUser, loading }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Team Member"
      icon={FiUsers}
    >
      <form onSubmit={handleAddUser} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">First Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={newUserForm.firstName}
              onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Last Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={newUserForm.lastName}
              onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email Address *</label>
          <div className="relative">
            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
              type="email"
              className="form-input pl-10"
              required
              value={newUserForm.email}
              onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Password *</label>
          <div className="relative">
            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
              type="password"
              className="form-input pl-10"
              required
              minLength={8}
              value={newUserForm.password}
              onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Role *</label>
          <select
            className="form-select"
            required
            value={newUserForm.role}
            onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
          >
            <option value="viewer">Viewer</option>
            <option value="dispatcher">Dispatcher</option>
            <option value="safety_manager">Safety Manager</option>
          </select>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
            Viewers can only view data. Safety Managers can edit. Dispatchers have limited access.
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Add User'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserModal;
