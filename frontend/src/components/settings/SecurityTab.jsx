import { FiShield, FiLock } from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';

const SecurityTab = ({ passwordForm, setPasswordForm, handlePasswordChange, loading }) => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-warning-100 dark:bg-warning-500/20 flex items-center justify-center">
          <FiShield className="w-4 h-4 text-warning-600 dark:text-warning-400" />
        </div>
        <h3 className="font-semibold text-zinc-900 dark:text-white">Change Password</h3>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Current Password</label>
          <div className="relative">
            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
              type="password"
              className="form-input pl-10"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">New Password</label>
          <div className="relative">
            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
              type="password"
              className="form-input pl-10"
              required
              minLength={8}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Minimum 8 characters</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Confirm New Password</label>
          <div className="relative">
            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
              type="password"
              className="form-input pl-10"
              required
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <LoadingSpinner size="sm" /> : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default SecurityTab;
