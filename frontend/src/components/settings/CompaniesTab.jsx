import { useNavigate } from 'react-router-dom';
import { FiMail, FiBriefcase, FiPlus, FiZap, FiSend, FiCheck, FiX, FiUsers, FiTrash2 } from 'react-icons/fi';

const CompaniesTab = ({
  companies,
  activeCompany,
  subscription,
  canCreateCompany,
  pendingInvitations,
  sentInvitations,
  companyMembers,
  getRoleBadgeColor,
  setShowAddCompanyModal,
  setShowInviteModal,
  handleAcceptInvitation,
  handleDeclineInvitation,
  handleRemoveMember,
  handleCancelInvitation
}) => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="px-6 py-4 bg-accent-50/50 dark:bg-accent-500/10 border-b border-accent-200 dark:border-accent-500/30">
          <h4 className="text-sm font-semibold text-accent-800 dark:text-accent-400 mb-3 flex items-center gap-2">
            <FiMail className="w-4 h-4" />
            Pending Invitations
          </h4>
          <div className="space-y-2">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-lg border border-accent-200 dark:border-accent-500/30"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">{inv.company.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Invited as {inv.role?.replace('_', ' ')} by {inv.invitedBy.firstName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptInvitation(inv.token)}
                    className="btn btn-success btn-sm"
                  >
                    <FiCheck className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclineInvitation(inv.token)}
                    className="btn btn-secondary btn-sm"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company List Header */}
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <FiBriefcase className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Your Companies</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {companies.length} of {subscription?.limits?.maxCompanies === Infinity ? 'unlimited' : subscription?.limits?.maxCompanies || 1} companies
            </p>
          </div>
        </div>
        {canCreateCompany() ? (
          <button
            onClick={() => setShowAddCompanyModal(true)}
            className="btn btn-primary"
          >
            <FiPlus className="w-4 h-4" />
            Add Company
          </button>
        ) : (
          <button
            onClick={() => navigate('/app/billing')}
            className="btn btn-secondary text-accent-600 dark:text-accent-400"
          >
            <FiZap className="w-4 h-4" />
            Upgrade to Add More
          </button>
        )}
      </div>

      {/* Company List */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {companies.map((company) => {
          const isActive = (company.id || company._id) === (activeCompany?.id || activeCompany?._id);
          return (
            <div
              key={company.id || company._id}
              className={`px-6 py-4 flex items-center justify-between ${isActive ? 'bg-accent-50/30 dark:bg-accent-500/10' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isActive ? 'bg-accent-500/20' : 'bg-zinc-100 dark:bg-zinc-800'
                }`}>
                  <FiBriefcase className={`w-5 h-5 ${isActive ? 'text-accent-500' : 'text-zinc-500 dark:text-zinc-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-900 dark:text-white">{company.name}</p>
                    {isActive && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-accent-100 dark:bg-accent-500/20 text-accent-700 dark:text-accent-400 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">DOT# {company.dotNumber}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(company.role)}`}>
                      {company.role?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {company.role === 'owner' && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="btn btn-secondary btn-sm"
                  >
                    <FiSend className="w-4 h-4" />
                    Invite
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Company Members Section (for active company) */}
      {activeCompany && (activeCompany.role === 'owner' || activeCompany.role === 'admin') && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 mt-4">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiUsers className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">
                {activeCompany.name} - Team Members
              </h4>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn btn-primary btn-sm"
            >
              <FiPlus className="w-4 h-4" />
              Invite Member
            </button>
          </div>

          {companyMembers.length === 0 ? (
            <div className="text-center py-8">
              <FiUsers className="w-10 h-10 text-zinc-400 dark:text-primary-500 mx-auto mb-2" />
              <p className="text-zinc-500 dark:text-zinc-400">No team members yet</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Invite people to join this company</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {companyMembers.map((member) => (
                <div key={member.userId} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {member.firstName?.[0]}{member.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">{member.firstName} {member.lastName}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                      {member.role?.replace('_', ' ').toUpperCase()}
                    </span>
                    {member.role !== 'owner' && activeCompany.role === 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/20 rounded"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sent Invitations */}
          {sentInvitations.filter(i => i.status === 'pending').length > 0 && (
            <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h5 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Pending Invitations</h5>
              <div className="space-y-2">
                {sentInvitations.filter(i => i.status === 'pending').map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{inv.email}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Invited as {inv.role?.replace('_', ' ')}</p>
                    </div>
                    <button
                      onClick={() => handleCancelInvitation(inv.id)}
                      className="text-xs text-danger-600 dark:text-danger-400 hover:text-danger-700 dark:hover:text-danger-300"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompaniesTab;
