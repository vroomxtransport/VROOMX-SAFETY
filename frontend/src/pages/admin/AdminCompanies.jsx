import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import {
  FiSearch, FiBriefcase, FiUsers, FiTruck, FiUserCheck,
  FiChevronLeft, FiChevronRight, FiExternalLink
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

  useEffect(() => {
    fetchCompanies();
  }, [page, search]);

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
    setPage(1);
    fetchCompanies();
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

  return (
    <div className="space-y-6">
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
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">DOT Number</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Members</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Drivers</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Vehicles</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Created</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Actions</th>
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
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => viewCompanyDetails(company)}
                        disabled={detailLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {detailLoading ? 'Loading...' : 'View Details'}
                        <FiExternalLink className="w-4 h-4" />
                      </button>
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
            {/* Company Info */}
            <div className="grid grid-cols-2 gap-4">
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

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{selectedCompany.driverCount}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Drivers</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{selectedCompany.vehicleCount}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Vehicles</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{selectedCompany.members?.length || 0}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Members</p>
              </div>
            </div>

            {/* Members List */}
            {selectedCompany.members && selectedCompany.members.length > 0 && (
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">Members</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedCompany.members.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800"
                    >
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">{member.name}</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{member.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 capitalize">
                          {member.role}
                        </span>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          {member.subscription?.plan || 'no plan'} / {member.subscription?.status || 'none'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner size="lg" />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminCompanies;
