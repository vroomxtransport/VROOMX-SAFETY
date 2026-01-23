import { FiMail, FiBriefcase } from 'react-icons/fi';

const ProfileTab = ({ user, activeCompany, getRoleBadgeColor }) => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold text-zinc-700 dark:text-zinc-200">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </span>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-zinc-900 dark:text-white">{user?.firstName} {user?.lastName}</h4>
          <p className="text-zinc-600 dark:text-zinc-300 capitalize text-sm">{user?.role?.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">First Name</label>
          <input type="text" className="form-input bg-zinc-50 dark:bg-zinc-900" value={user?.firstName || ''} disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Last Name</label>
          <input type="text" className="form-input bg-zinc-50 dark:bg-zinc-900" value={user?.lastName || ''} disabled />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email Address</label>
          <div className="relative">
            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input type="email" className="form-input pl-10 bg-zinc-50 dark:bg-zinc-900" value={user?.email || ''} disabled />
          </div>
        </div>
      </div>

      {/* Active Company Info */}
      {activeCompany && (
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <FiBriefcase className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">Active Company</h4>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-zinc-600 dark:text-zinc-300">Company:</span>
              <span className="ml-2 font-medium text-zinc-800 dark:text-zinc-200">{activeCompany.name}</span>
            </div>
            <div>
              <span className="text-zinc-600 dark:text-zinc-300">DOT#:</span>
              <span className="ml-2 font-mono font-medium text-zinc-800 dark:text-zinc-200">{activeCompany.dotNumber}</span>
            </div>
            {activeCompany.role && (
              <div>
                <span className="text-zinc-600 dark:text-zinc-300">Your Role:</span>
                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(activeCompany.role)}`}>
                  {activeCompany.role?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
