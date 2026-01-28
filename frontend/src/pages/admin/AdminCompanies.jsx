import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import {
  FiSearch, FiBriefcase, FiUsers, FiTruck, FiUserCheck,
  FiChevronLeft, FiChevronRight, FiExternalLink, FiTrash2,
  FiEdit, FiUserMinus, FiToggleLeft, FiToggleRight
} from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const AdminCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit company modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', mcNumber: '', phone: '', address: '' });
  const [editLoading, setEditLoading] = useState(false);

  // Member management
  const [memberRoleLoading, setMemberRoleLoading] = useState(null);
  const [memberRemoveLoading, setMemberRemoveLoading] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, [page]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCompanies();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getCompanies({ page, limit: 20, search });
      setCompanies(response.data.companies);
      setPagination(response.data.pagination);
    } catch (err) {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is already triggered by the useEffect
  };

  const viewCompanyDetails = async (company) => {
    try {
      setDetailLoading(true);
      // Fetch data first before showing modal
      const response = await adminAPI.getCompany(company._id);
      setSelectedCompany(response.data.company);
      // Only show modal after data is loaded
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Failed to load company details');
      setSelectedCompany(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCompany(null);
  };

  const openEditModal = (company) => {
    setEditForm({
      name: company.name || '',
      mcNumber: company.mcNumber || '',
      phone: company.phone || '',
      address: company.address || ''
    });
    setShowEditModal(true);
  };

  const handleEditCompany = async () => {
    try {
      setEditLoading(true);
      await adminAPI.updateCompany(selectedCompany._id, editForm);
      toast.success('Company updated successfully');
      setShowEditModal(false);
      // Refresh the detail modal data
      const response = await adminAPI.getCompany(selectedCompany._id);
      setSelectedCompany(response.data.company);
      fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update company');
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleCompanyStatus = async (company) => {
    const newActive = !company.isActive;
    if (!window.confirm(`Are you sure you want to ${newActive ? 'activate' : 'deactivate'} "${company.name}"?`)) return;

    try {
      await adminAPI.updateCompany(company._id, { isActive: newActive });
      toast.success(`Company ${newActive ? 'activated' : 'deactivated'} successfully`);
      // Refresh detail modal data
      const response = await adminAPI.getCompany(company._id);
      setSelectedCompany(response.data.company);
      fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update company status');
    }
  };

  const handleMemberRoleChange = async (memberId, newRole) => {
    try {
      setMemberRoleLoading(memberId);
      await adminAPI.updateCompanyMemberRole(selectedCompany._id, memberId, { role: newRole });
      toast.success('Member role updated');
      // Refresh
      const response = await adminAPI.getCompany(selectedCompany._id);
      setSelectedCompany(response.data.company);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setMemberRoleLoading(null);
    }
  };

  const handleRemoveMember = async (memberId, memberEmail) => {
    if (!window.confirm(`Are you sure you want to remove ${memberEmail} from this company?`)) return;

    try {
      setMemberRemoveLoading(memberId);
      await adminAPI.removeCompanyMember(selectedCompany._id, memberId);
      toast.success('Member removed from company');
      // Refresh
      const response = await adminAPI.getCompany(selectedCompany._id);
      setSelectedCompany(response.data.company);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setMemberRemoveLoading(null);
    }
  };

  const handleDeleteCompany = async (company) => {
    const confirmMessage = `Are you sure you want to delete "${company.name}"?\n\nThis will permanently delete:\n- ${company.driverCount || 0} drivers\n- ${company.vehicleCount || 0} vehicles\n- All violations, accidents, documents, and other data\n\nThis action cannot be undone!`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await adminAPI.deleteCompany(company._id);
      toast.success(`Company "${company.name}" deleted successfully`);
      fetchCompanies();
      closeDetailModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete company');
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Companies</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            {pagination?.total || 0} total companies
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or DOT..."
              className="pl-10 pr-4 py-2 w-64 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Companies Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-300 dark:border-zinc-600">
                <tr>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Company</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">DOT Number</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Members</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Drivers</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Vehicles</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Created</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {companies.map((company) => (
                  <tr key={company._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                          <FiBriefcase className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">{company.name}</p>
                          {company.mcNumber && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">MC# {company.mcNumber}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-zinc-900 dark:text-white">
                        {company.dotNumber || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <FiUsers className="w-4 h-4" />
                        {company.memberCount || 0}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <FiUserCheck className="w-4 h-4" />
                        {company.driverCount || 0}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <FiTruck className="w-4 h-4" />
                        {company.vehicleCount || 0}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        company.isActive !== false
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                      }`}>
                        {company.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewCompanyDetails(company)}
                          disabled={detailLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {detailLoading ? 'Loading...' : 'View'}
                          <FiExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(company)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete company"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Company Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={closeDetailModal}
        title="Company Details"
        size="lg"
      >
        {selectedCompany ? (
          <div className="space-y-6">
            {/* Company Info + Edit/Status Actions */}
            <div className="flex items-start justify-between">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                <div>
                  <label className="text-sm text-zinc-600 dark:text-zinc-400">Company Name</label>
                  <p className="font-medium text-zinc-900 dark:text-white">{selectedCompany.name}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-600 dark:text-zinc-400">DOT Number</label>
                  <p className="font-mono font-medium text-zinc-900 dark:text-white">{selectedCompany.dotNumber || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-600 dark:text-zinc-400">MC Number</label>
                  <p className="font-mono font-medium text-zinc-900 dark:text-white">{selectedCompany.mcNumber || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-600 dark:text-zinc-400">Created</label>
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {new Date(selectedCompany.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => openEditModal(selectedCompany)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors"
                >
                  <FiEdit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleCompanyStatus(selectedCompany)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    selectedCompany.isActive !== false
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30'
                      : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30'
                  }`}
                >
                  {selectedCompany.isActive !== false ? (
                    <><FiToggleRight className="w-4 h-4" /> Deactivate</>
                  ) : (
                    <><FiToggleLeft className="w-4 h-4" /> Activate</>
                  )}
                </button>
              </div>
            </div>

            {/* Status Badge */}
            <div>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                selectedCompany.isActive !== false
                  ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
              }`}>
                {selectedCompany.isActive !== false ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 lg:gap-4">
              <div className="text-center p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{selectedCompany.driverCount}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Drivers</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{selectedCompany.vehicleCount}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Vehicles</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{selectedCompany.members?.length || 0}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Members</p>
              </div>
            </div>

            {/* Members List with Role Management */}
            {selectedCompany.members && selectedCompany.members.length > 0 && (
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">Members</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedCompany.members.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-zinc-900 dark:text-white">{member.name}</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{member.email}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                          {member.subscription?.plan || 'no plan'} / {member.subscription?.status || 'none'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <select
                          value={member.role || 'viewer'}
                          onChange={(e) => handleMemberRoleChange(member._id, e.target.value)}
                          disabled={memberRoleLoading === member._id}
                          className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 focus:ring-1 focus:ring-red-500"
                        >
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="safety_manager">Safety Manager</option>
                          <option value="dispatcher">Dispatcher</option>
                          <option value="driver">Driver</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member._id, member.email)}
                          disabled={memberRemoveLoading === member._id}
                          className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                          title="Remove member"
                        >
                          <FiUserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delete Button */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => handleDeleteCompany(selectedCompany)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
                Delete Company
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner size="lg" />
          </div>
        )}
      </Modal>

      {/* Edit Company Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Company"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Company Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="form-input"
              disabled={editLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">DOT Number</label>
            <input
              type="text"
              value={selectedCompany?.dotNumber || ''}
              className="form-input bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">DOT number cannot be changed after creation.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">MC Number</label>
            <input
              type="text"
              value={editForm.mcNumber}
              onChange={(e) => setEditForm({ ...editForm, mcNumber: e.target.value })}
              className="form-input"
              disabled={editLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Phone</label>
            <input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="form-input"
              placeholder="(555) 123-4567"
              disabled={editLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Address</label>
            <input
              type="text"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              className="form-input"
              placeholder="123 Main St, City, State"
              disabled={editLoading}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowEditModal(false)}
              className="btn btn-secondary"
              disabled={editLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleEditCompany}
              className="btn btn-primary"
              disabled={editLoading || !editForm.name}
            >
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCompanies;
