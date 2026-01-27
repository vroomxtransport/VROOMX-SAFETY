import { useState, useEffect } from 'react';
import { ticketsAPI, driversAPI } from '../utils/api';
import { formatDate, formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiPlus, FiCalendar, FiDollarSign,
  FiCheck, FiAlertCircle, FiFileText, FiChevronRight
} from 'react-icons/fi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { TicketForm, TicketDetailModal, TicketDeleteModal } from '../components/tickets';
import {
  ticketTypes, statusOptions, initialFormData, getStatusBadgeType
} from '../data/ticketOptions';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stats, setStats] = useState(null);
  const [upcomingCourt, setUpcomingCourt] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchTickets();
    fetchStats();
    fetchUpcomingCourt();
    fetchDrivers();
  }, [page, statusFilter, typeFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { ticketType: typeFilter })
      };
      const response = await ticketsAPI.getAll(params);
      setTickets(response.data.tickets);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await ticketsAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
    }
  };

  const fetchUpcomingCourt = async () => {
    try {
      const response = await ticketsAPI.getUpcomingCourt();
      setUpcomingCourt(response.data.tickets);
    } catch (error) {
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await driversAPI.getAll({ status: 'active', limit: 100 });
      setDrivers(response.data.drivers);
    } catch (error) {
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editMode && selectedTicket) {
        await ticketsAPI.update(selectedTicket._id, formData);
        toast.success('Ticket updated successfully');
      } else {
        await ticketsAPI.create(formData);
        toast.success('Ticket created successfully');
      }
      setShowAddModal(false);
      setFormData(initialFormData);
      setEditMode(false);
      setSelectedTicket(null);
      fetchTickets();
      fetchStats();
      fetchUpcomingCourt();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ticket) => {
    setFormData({
      driverId: ticket.driverId?._id || '',
      ticketDate: ticket.ticketDate?.split('T')[0] || '',
      description: ticket.description || '',
      ticketType: ticket.ticketType || 'other',
      ticketNumber: ticket.ticketNumber || '',
      status: ticket.status || 'open',
      courtDate: ticket.courtDate?.split('T')[0] || '',
      courtDecision: ticket.courtDecision || 'not_yet',
      dataQDecision: ticket.dataQDecision || 'not_filed',
      fineAmount: ticket.fineAmount || 0,
      points: ticket.points || 0,
      notes: ticket.notes || '',
      location: ticket.location || { city: '', state: '' },
      attorney: ticket.attorney || { name: '', phone: '', firm: '' }
    });
    setSelectedTicket(ticket);
    setEditMode(true);
    setShowDetailModal(false);
    setShowAddModal(true);
  };

  const handleDelete = async () => {
    if (!selectedTicket) return;
    setSubmitting(true);
    try {
      await ticketsAPI.delete(selectedTicket._id);
      toast.success('Ticket deleted successfully');
      setShowDeleteModal(false);
      setSelectedTicket(null);
      fetchTickets();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async (ticket) => {
    try {
      await ticketsAPI.recordPayment(ticket._id, { paymentDate: new Date().toISOString() });
      toast.success('Ticket marked as paid');
      fetchTickets();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  const columns = [
    {
      header: 'Date',
      render: (row) => (
        <div>
          <span className="font-mono text-sm text-zinc-700 dark:text-zinc-200">{formatDate(row.ticketDate)}</span>
          {row.ticketNumber && (
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-mono">#{row.ticketNumber}</p>
          )}
        </div>
      )
    },
    {
      header: 'Driver',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {row.driverId?.firstName?.[0]}{row.driverId?.lastName?.[0]}
          </div>
          <span className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">
            {row.driverId ? `${row.driverId.firstName} ${row.driverId.lastName}` : 'N/A'}
          </span>
        </div>
      )
    },
    {
      header: 'Description',
      render: (row) => (
        <div className="max-w-xs">
          <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{row.description}</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 capitalize">
            {ticketTypes.find(t => t.value === row.ticketType)?.label || row.ticketType}
          </p>
        </div>
      )
    },
    {
      header: 'Court Date',
      render: (row) => (
        <div>
          {row.courtDate ? (
            <>
              <span className="font-mono text-sm text-zinc-700 dark:text-zinc-200">{formatDate(row.courtDate)}</span>
              {row.daysUntilCourt > 0 && row.daysUntilCourt <= 7 && (
                <p className="text-xs text-danger-600 dark:text-danger-400 font-medium flex items-center gap-1 mt-0.5">
                  <FiAlertCircle className="w-3 h-3" />
                  {row.daysUntilCourt} days
                </p>
              )}
            </>
          ) : (
            <span className="text-sm text-zinc-600 dark:text-zinc-300">Not set</span>
          )}
        </div>
      )
    },
    {
      header: 'Fine / Points',
      render: (row) => (
        <div className="text-right">
          <p className="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {formatCurrency(row.fineAmount)}
          </p>
          {row.points > 0 && (
            <p className="text-xs text-danger-600 dark:text-danger-400 font-medium">{row.points} pts</p>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <StatusBadge
          status={row.status}
          type={getStatusBadgeType(row.status)}
          size="sm"
        />
      )
    },
    {
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTicket(row);
              setShowDetailModal(true);
            }}
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-primary-50 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            title="View Details"
          >
            <FiChevronRight className="w-4 h-4" />
          </button>
          {row.status === 'open' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkPaid(row);
              }}
              className="p-2 text-success-600 dark:text-success-400 hover:text-success-700 dark:hover:text-success-300 hover:bg-success-50 dark:hover:bg-success-900/30 rounded-lg transition-colors"
              title="Mark Paid"
            >
              <FiDollarSign className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Ticket Tracker</h1>
          <p className="text-zinc-600 dark:text-zinc-300 text-sm mt-1">Manage driver tickets, court dates, and fines</p>
        </div>
        <button
          onClick={() => {
            setFormData(initialFormData);
            setEditMode(false);
            setSelectedTicket(null);
            setShowAddModal(true);
          }}
          className="btn btn-primary"
        >
          <FiPlus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 hover:shadow-lg hover:-translate-y-1 hover:border-warning-300 dark:hover:border-warning-500/30 transition-all duration-300 cursor-pointer" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiFileText className="w-5 h-5 text-warning-600 dark:text-warning-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">{stats?.openTickets || 0}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Open Tickets</p>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 hover:shadow-lg hover:-translate-y-1 hover:border-info-300 dark:hover:border-info-500/30 transition-all duration-300 cursor-pointer" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info-100 dark:bg-info-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiCalendar className="w-5 h-5 text-info-600 dark:text-info-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-info-600 dark:text-info-400 font-mono">{stats?.upcomingCourtDates || 0}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Upcoming Court</p>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 hover:shadow-lg hover:-translate-y-1 hover:border-danger-300 dark:hover:border-danger-500/30 transition-all duration-300 cursor-pointer" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiDollarSign className="w-5 h-5 text-danger-600 dark:text-danger-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-danger-600 dark:text-danger-400 font-mono">{formatCurrency(stats?.financials?.totalOutstanding || 0)}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Outstanding</p>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 hover:shadow-lg hover:-translate-y-1 hover:border-success-300 dark:hover:border-success-500/30 transition-all duration-300 cursor-pointer" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiCheck className="w-5 h-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400 font-mono">{formatCurrency(stats?.financials?.totalPaid || 0)}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Total Paid</p>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 hover:shadow-lg hover:-translate-y-1 hover:border-accent-300 dark:hover:border-accent-500/30 transition-all duration-300 cursor-pointer" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FiAlertCircle className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-accent-600 dark:text-accent-400 font-mono">{stats?.financials?.totalPoints || 0}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Total Points</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Court Dates Alert */}
      {upcomingCourt.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-info-200 dark:border-info-800 p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="flex items-center gap-2 mb-3">
            <FiCalendar className="w-5 h-5 text-info-600 dark:text-info-400" />
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Upcoming Court Dates</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingCourt.slice(0, 3).map((ticket) => (
              <div
                key={ticket._id}
                className="p-3 rounded-lg bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 cursor-pointer hover:bg-info-100 dark:hover:bg-info-900/30 hover:shadow-md hover:-translate-y-0.5 hover:border-info-300 dark:hover:border-info-600 transition-all duration-200"
                onClick={() => {
                  setSelectedTicket(ticket);
                  setShowDetailModal(true);
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm font-semibold text-info-700 dark:text-info-300">
                    {formatDate(ticket.courtDate)}
                  </span>
                  {ticket.daysUntilCourt <= 7 && (
                    <span className="text-xs font-medium text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/30 px-2 py-0.5 rounded">
                      {ticket.daysUntilCourt} days
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium truncate">{ticket.description}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-300">
                  {ticket.driverId?.firstName} {ticket.driverId?.lastName}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Types</option>
            {ticketTypes.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={tickets}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No tickets found"
        emptyIcon={FiFileText}
        onRowClick={(row) => {
          setSelectedTicket(row);
          setShowDetailModal(true);
        }}
      />

      {/* Add/Edit Ticket Modal */}
      <TicketForm
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditMode(false);
          setSelectedTicket(null);
        }}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        submitting={submitting}
        editMode={editMode}
        drivers={drivers}
        initialFormData={initialFormData}
      />

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        onEdit={handleEdit}
        onDelete={() => {
          setShowDetailModal(false);
          setShowDeleteModal(true);
        }}
        onMarkPaid={handleMarkPaid}
      />

      {/* Delete Confirmation Modal */}
      <TicketDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        onDelete={handleDelete}
        submitting={submitting}
      />
    </div>
  );
};

export default Tickets;
