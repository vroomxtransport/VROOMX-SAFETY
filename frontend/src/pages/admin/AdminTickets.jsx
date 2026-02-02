import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { FiSearch, FiFilter, FiMessageSquare, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const AdminTickets = () => {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [filters, pagination.page]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getTickets({
        page: pagination.page,
        limit: 20,
        ...filters
      });
      setTickets(response.data.tickets || []);
      setStats(response.data.stats || {});
      setPagination(prev => ({
        ...prev,
        pages: response.data.pagination?.pages || 1,
        total: response.data.pagination?.total || 0
      }));
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchInput }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await adminAPI.updateTicket(ticketId, { status: newStatus });
      toast.success('Ticket updated');
      fetchTickets();
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      open: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      closed: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
    };
    return styles[status] || styles.open;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return styles[priority] || styles.medium;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Support Tickets</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mr-3">
              <FiMessageSquare className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.open}</p>
              <p className="text-xs text-zinc-500">Open</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mr-3">
              <FiClock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.in_progress}</p>
              <p className="text-xs text-zinc-500">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
              <FiCheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.resolved}</p>
              <p className="text-xs text-zinc-500">Resolved</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center mr-3">
              <FiXCircle className="w-5 h-5 text-zinc-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.closed}</p>
              <p className="text-xs text-zinc-500">Closed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
              />
            </div>
          </form>

          <select
            value={filters.status}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, status: e.target.value }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, priority: e.target.value }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            No tickets found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Subject</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Company</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Created By</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Priority</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                {tickets.map(ticket => (
                  <tr key={ticket._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">{ticket.subject}</div>
                      <div className="text-xs text-zinc-500 truncate max-w-xs">{ticket.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      {ticket.company ? (
                        <div>
                          <div className="text-sm text-zinc-900 dark:text-white">{ticket.company.name}</div>
                          <div className="text-xs text-zinc-500">DOT: {ticket.company.dotNumber}</div>
                        </div>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {ticket.createdBy ? (
                        <div>
                          <div className="text-sm text-zinc-900 dark:text-white">{ticket.createdBy.name}</div>
                          <div className="text-xs text-zinc-500">{ticket.createdBy.email}</div>
                        </div>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(ticket.priority)} capitalize`}>
                        {ticket.priority || 'medium'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(ticket.status)} capitalize`}>
                        {ticket.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-zinc-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                        className="text-sm px-2 py-1 border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-700">
            <div className="text-sm text-zinc-500">
              Showing {(pagination.page - 1) * 20 + 1} - {Math.min(pagination.page * 20, pagination.total)} of {pagination.total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-zinc-200 dark:border-zinc-700 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-zinc-200 dark:border-zinc-700 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTickets;
