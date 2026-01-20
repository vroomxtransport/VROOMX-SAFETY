import { useState, useEffect } from 'react';
import { ticketsAPI, driversAPI } from '../utils/api';
import { formatDate, formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiPlus, FiCalendar, FiDollarSign, FiUser, FiMapPin,
  FiCheck, FiX, FiClock, FiAlertCircle, FiFileText,
  FiEdit2, FiTrash2, FiMessageSquare, FiChevronRight
} from 'react-icons/fi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

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

  const initialFormData = {
    driverId: '',
    ticketDate: new Date().toISOString().split('T')[0],
    description: '',
    ticketType: 'speeding',
    ticketNumber: '',
    status: 'open',
    courtDate: '',
    courtDecision: 'not_yet',
    dataQDecision: 'not_filed',
    fineAmount: 0,
    points: 0,
    notes: '',
    location: { city: '', state: '' },
    attorney: { name: '', phone: '', firm: '' }
  };

  const [formData, setFormData] = useState(initialFormData);

  const ticketTypes = [
    { value: 'speeding', label: 'Speeding' },
    { value: 'logbook', label: 'Logbook Violation' },
    { value: 'equipment', label: 'Equipment Violation' },
    { value: 'parking', label: 'Parking' },
    { value: 'weight', label: 'Overweight' },
    { value: 'lane_violation', label: 'Lane Violation' },
    { value: 'red_light', label: 'Red Light' },
    { value: 'stop_sign', label: 'Stop Sign' },
    { value: 'reckless', label: 'Reckless Driving' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'pending_court', label: 'Pending Court' },
    { value: 'fighting', label: 'Fighting' },
    { value: 'dismissed', label: 'Dismissed' },
    { value: 'paid', label: 'Paid' },
    { value: 'points_reduced', label: 'Points Reduced' },
    { value: 'deferred', label: 'Deferred' }
  ];

  const courtDecisionOptions = [
    { value: 'not_yet', label: 'Not Yet' },
    { value: 'guilty', label: 'Guilty' },
    { value: 'not_guilty', label: 'Not Guilty' },
    { value: 'reduced', label: 'Reduced' },
    { value: 'dismissed', label: 'Dismissed' },
    { value: 'deferred', label: 'Deferred' }
  ];

  const dataQOptions = [
    { value: 'not_filed', label: 'Not Filed' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'denied', label: 'Denied' }
  ];

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
      console.error('Failed to fetch stats');
    }
  };

  const fetchUpcomingCourt = async () => {
    try {
      const response = await ticketsAPI.getUpcomingCourt();
      setUpcomingCourt(response.data.tickets);
    } catch (error) {
      console.error('Failed to fetch upcoming court dates');
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await driversAPI.getAll({ status: 'active', limit: 100 });
      setDrivers(response.data.drivers);
    } catch (error) {
      console.error('Failed to fetch drivers');
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

  const getStatusBadgeType = (status) => {
    switch (status) {
      case 'open': return 'warning';
      case 'pending_court': return 'info';
      case 'fighting': return 'info';
      case 'dismissed': return 'success';
      case 'paid': return 'success';
      case 'points_reduced': return 'success';
      case 'deferred': return 'warning';
      default: return 'default';
    }
  };

  const columns = [
    {
      header: 'Date',
      render: (row) => (
        <div>
          <span className="font-mono text-sm text-primary-700">{formatDate(row.ticketDate)}</span>
          {row.ticketNumber && (
            <p className="text-xs text-primary-400 font-mono">#{row.ticketNumber}</p>
          )}
        </div>
      )
    },
    {
      header: 'Driver',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-600">
            {row.driverId?.firstName?.[0]}{row.driverId?.lastName?.[0]}
          </div>
          <span className="text-sm text-primary-800 font-medium">
            {row.driverId ? `${row.driverId.firstName} ${row.driverId.lastName}` : 'N/A'}
          </span>
        </div>
      )
    },
    {
      header: 'Description',
      render: (row) => (
        <div className="max-w-xs">
          <p className="font-medium text-primary-900 truncate">{row.description}</p>
          <p className="text-xs text-primary-500 capitalize">
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
              <span className="font-mono text-sm text-primary-700">{formatDate(row.courtDate)}</span>
              {row.daysUntilCourt > 0 && row.daysUntilCourt <= 7 && (
                <p className="text-xs text-danger-600 font-medium flex items-center gap-1 mt-0.5">
                  <FiAlertCircle className="w-3 h-3" />
                  {row.daysUntilCourt} days
                </p>
              )}
            </>
          ) : (
            <span className="text-sm text-primary-400">Not set</span>
          )}
        </div>
      )
    },
    {
      header: 'Fine / Points',
      render: (row) => (
        <div className="text-right">
          <p className="font-mono text-sm font-semibold text-primary-800">
            {formatCurrency(row.fineAmount)}
          </p>
          {row.points > 0 && (
            <p className="text-xs text-danger-600 font-medium">{row.points} pts</p>
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
            className="p-2 text-primary-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
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
              className="p-2 text-success-600 hover:text-success-700 hover:bg-success-50 rounded-lg transition-colors"
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
          <h1 className="text-2xl font-bold text-primary-900">Ticket Tracker</h1>
          <p className="text-primary-500 text-sm mt-1">Manage driver tickets, court dates, and fines</p>
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
        <div className="bg-white rounded-xl border border-primary-200/60 p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-100 flex items-center justify-center">
              <FiFileText className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900 font-mono">
                {stats?.openTickets || 0}
              </p>
              <p className="text-xs text-primary-500">Open Tickets</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-primary-200/60 p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info-100 flex items-center justify-center">
              <FiCalendar className="w-5 h-5 text-info-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-info-600 font-mono">
                {stats?.upcomingCourtDates || 0}
              </p>
              <p className="text-xs text-primary-500">Upcoming Court</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-primary-200/60 p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-danger-600 font-mono">
                {formatCurrency(stats?.financials?.totalOutstanding || 0)}
              </p>
              <p className="text-xs text-primary-500">Outstanding</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-primary-200/60 p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
              <FiCheck className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success-600 font-mono">
                {formatCurrency(stats?.financials?.totalPaid || 0)}
              </p>
              <p className="text-xs text-primary-500">Total Paid</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-primary-200/60 p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
              <FiAlertCircle className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-accent-600 font-mono">
                {stats?.financials?.totalPoints || 0}
              </p>
              <p className="text-xs text-primary-500">Total Points</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Court Dates Alert */}
      {upcomingCourt.length > 0 && (
        <div className="bg-white rounded-xl border border-info-200 p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="flex items-center gap-2 mb-3">
            <FiCalendar className="w-5 h-5 text-info-600" />
            <h3 className="font-semibold text-primary-900">Upcoming Court Dates</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingCourt.slice(0, 3).map((ticket) => (
              <div
                key={ticket._id}
                className="p-3 rounded-lg bg-info-50 border border-info-200 cursor-pointer hover:bg-info-100 transition-colors"
                onClick={() => {
                  setSelectedTicket(ticket);
                  setShowDetailModal(true);
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm font-semibold text-info-700">
                    {formatDate(ticket.courtDate)}
                  </span>
                  {ticket.daysUntilCourt <= 7 && (
                    <span className="text-xs font-medium text-danger-600 bg-danger-50 px-2 py-0.5 rounded">
                      {ticket.daysUntilCourt} days
                    </span>
                  )}
                </div>
                <p className="text-sm text-primary-800 font-medium truncate">{ticket.description}</p>
                <p className="text-xs text-primary-500">
                  {ticket.driverId?.firstName} {ticket.driverId?.lastName}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div
        className="bg-white rounded-xl border border-primary-200/60 p-4"
        style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
      >
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
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditMode(false);
          setSelectedTicket(null);
          setFormData(initialFormData);
        }}
        title={editMode ? 'Edit Ticket' : 'New Ticket'}
        icon={FiFileText}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Driver & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Driver *</label>
              <select
                className="form-select"
                required
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
              >
                <option value="">Select Driver</option>
                {drivers.map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.firstName} {driver.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Status *</label>
              <select
                className="form-select"
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Ticket Date *</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.ticketDate}
                onChange={(e) => setFormData({ ...formData, ticketDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Court Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.courtDate}
                onChange={(e) => setFormData({ ...formData, courtDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Ticket Type</label>
              <select
                className="form-select"
                value={formData.ticketType}
                onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
              >
                {ticketTypes.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Ticket Description *</label>
            <textarea
              className="form-input"
              rows={2}
              required
              placeholder="e.g., Speeding 15mph over limit, Logbook violation..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Attorney Info */}
          <div className="border-t border-primary-100 pt-4">
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Attorney Info</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                className="form-input"
                placeholder="Attorney name"
                value={formData.attorney.name}
                onChange={(e) => setFormData({ ...formData, attorney: { ...formData.attorney, name: e.target.value } })}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Phone"
                value={formData.attorney.phone}
                onChange={(e) => setFormData({ ...formData, attorney: { ...formData.attorney, phone: e.target.value } })}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Firm"
                value={formData.attorney.firm}
                onChange={(e) => setFormData({ ...formData, attorney: { ...formData.attorney, firm: e.target.value } })}
              />
            </div>
          </div>

          {/* Decisions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Court Decision</label>
              <select
                className="form-select"
                value={formData.courtDecision}
                onChange={(e) => setFormData({ ...formData, courtDecision: e.target.value })}
              >
                {courtDecisionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">DataQ Decision</label>
              <select
                className="form-select"
                value={formData.dataQDecision}
                onChange={(e) => setFormData({ ...formData, dataQDecision: e.target.value })}
              >
                {dataQOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fine & Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Fine Amount ($)</label>
              <input
                type="number"
                className="form-input font-mono"
                min="0"
                step="0.01"
                value={formData.fineAmount}
                onChange={(e) => setFormData({ ...formData, fineAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1.5">Points</label>
              <input
                type="number"
                className="form-input font-mono"
                min="0"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1.5">Notes</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-primary-100">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setEditMode(false);
                setSelectedTicket(null);
                setFormData(initialFormData);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : (editMode ? 'Save Changes' : 'Create Ticket')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTicket(null);
        }}
        title="Ticket Details"
        icon={FiFileText}
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-600">
                    {selectedTicket.driverId?.firstName?.[0]}{selectedTicket.driverId?.lastName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-900">
                      {selectedTicket.driverId?.firstName} {selectedTicket.driverId?.lastName}
                    </h3>
                    <p className="text-sm text-primary-500">{selectedTicket.driverId?.employeeId}</p>
                  </div>
                </div>
              </div>
              <StatusBadge status={selectedTicket.status} type={getStatusBadgeType(selectedTicket.status)} />
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl bg-primary-50 border border-primary-200">
              <p className="font-medium text-primary-900 mb-1">{selectedTicket.description}</p>
              <div className="flex items-center gap-4 text-sm text-primary-600">
                <span className="flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" />
                  {formatDate(selectedTicket.ticketDate)}
                </span>
                <span className="capitalize">
                  {ticketTypes.find(t => t.value === selectedTicket.ticketType)?.label}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-white border border-primary-200">
                <p className="text-xs text-primary-500 mb-1">Fine Amount</p>
                <p className="text-lg font-bold font-mono text-primary-900">
                  {formatCurrency(selectedTicket.fineAmount)}
                </p>
                {selectedTicket.finePaid && (
                  <span className="text-xs text-success-600 font-medium">Paid</span>
                )}
              </div>
              <div className="p-3 rounded-lg bg-white border border-primary-200">
                <p className="text-xs text-primary-500 mb-1">Points</p>
                <p className="text-lg font-bold font-mono text-primary-900">{selectedTicket.points}</p>
                {selectedTicket.pointsOnRecord && (
                  <span className="text-xs text-danger-600 font-medium">On Record</span>
                )}
              </div>
              <div className="p-3 rounded-lg bg-white border border-primary-200">
                <p className="text-xs text-primary-500 mb-1">Court Date</p>
                <p className="text-sm font-medium text-primary-900">
                  {selectedTicket.courtDate ? formatDate(selectedTicket.courtDate) : 'Not set'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white border border-primary-200">
                <p className="text-xs text-primary-500 mb-1">Court Decision</p>
                <p className="text-sm font-medium text-primary-900 capitalize">
                  {courtDecisionOptions.find(o => o.value === selectedTicket.courtDecision)?.label || 'Not Yet'}
                </p>
              </div>
            </div>

            {/* Attorney */}
            {(selectedTicket.attorney?.name || selectedTicket.attorney?.firm) && (
              <div className="p-4 rounded-xl bg-info-50 border border-info-200">
                <h4 className="text-sm font-semibold text-info-800 mb-2">Attorney Information</h4>
                <p className="text-sm text-info-700">{selectedTicket.attorney.name}</p>
                {selectedTicket.attorney.firm && (
                  <p className="text-sm text-info-600">{selectedTicket.attorney.firm}</p>
                )}
                {selectedTicket.attorney.phone && (
                  <p className="text-sm text-info-600">{selectedTicket.attorney.phone}</p>
                )}
              </div>
            )}

            {/* Notes */}
            {selectedTicket.notes && (
              <div className="p-4 rounded-xl bg-warning-50 border border-warning-200">
                <h4 className="text-sm font-semibold text-warning-800 mb-2">Notes</h4>
                <p className="text-sm text-warning-700">{selectedTicket.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-primary-100">
              <button
                onClick={() => {
                  setSelectedTicket(selectedTicket);
                  setShowDetailModal(false);
                  setShowDeleteModal(true);
                }}
                className="btn btn-secondary text-danger-600 hover:text-danger-700 hover:bg-danger-50"
              >
                <FiTrash2 className="w-4 h-4" />
                Delete
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(selectedTicket)}
                  className="btn btn-secondary"
                >
                  <FiEdit2 className="w-4 h-4" />
                  Edit
                </button>
                {!selectedTicket.finePaid && selectedTicket.status !== 'dismissed' && (
                  <button
                    onClick={() => {
                      handleMarkPaid(selectedTicket);
                      setShowDetailModal(false);
                    }}
                    className="btn btn-primary"
                  >
                    <FiDollarSign className="w-4 h-4" />
                    Mark Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTicket(null);
        }}
        title="Delete Ticket"
        icon={FiTrash2}
      >
        <div className="space-y-4">
          <p className="text-primary-700">
            Are you sure you want to delete this ticket? This action cannot be undone.
          </p>
          <div className="p-4 rounded-xl bg-danger-50 border border-danger-200">
            <p className="font-medium text-danger-900">{selectedTicket?.description}</p>
            <p className="text-sm text-danger-700 mt-1">
              {selectedTicket?.driverId?.firstName} {selectedTicket?.driverId?.lastName} - {formatDate(selectedTicket?.ticketDate)}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-primary-100">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedTicket(null);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-primary bg-danger-600 hover:bg-danger-700"
              disabled={submitting}
            >
              {submitting ? <LoadingSpinner size="sm" /> : 'Delete Ticket'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tickets;
