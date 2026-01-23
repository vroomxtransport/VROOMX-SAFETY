import { FiUsers, FiPlus } from 'react-icons/fi';
import StatusBadge from '../StatusBadge';

const UsersTab = ({ users, setShowAddUserModal }) => {
  return (
    <div>
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <FiUsers className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">Team Members</h3>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="btn btn-primary"
        >
          <FiPlus className="w-4 h-4" />
          Add User
        </button>
      </div>
      <div>
        {users.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <FiUsers className="w-7 h-7 text-zinc-400" />
            </div>
            <p className="text-zinc-600 dark:text-zinc-300 font-medium">No team members yet</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Add users to your team to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-200 dark:border-primary-700 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {users.map((teamUser, index) => (
                  <tr
                    key={teamUser._id}
                    className={`hover:bg-accent-50/50 dark:hover:bg-accent-500/10 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50/30 dark:bg-zinc-800/30'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                          {teamUser.firstName?.[0]}{teamUser.lastName?.[0]}
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-white">{teamUser.firstName} {teamUser.lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{teamUser.email}</td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300 capitalize">{teamUser.role?.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={teamUser.isActive ? 'active' : 'inactive'} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersTab;
