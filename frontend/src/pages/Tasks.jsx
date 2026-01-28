import { useState, useEffect } from 'react';
import { tasksAPI, driversAPI, vehiclesAPI } from '../utils/api';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiPlus, FiSearch, FiCheckCircle, FiClock, FiAlertTriangle,
  FiEdit2, FiTrash2, FiMoreVertical, FiUser, FiTruck, FiCalendar,
  FiFlag, FiRefreshCw, FiMessageSquare, FiX
} from 'react-icons/fi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'medium',
    assignedTo: '',
    assignedToType: 'staff',
    linkedTo: { type: 'none', refId: '', refName: '' },
    recurring: { enabled: false, intervalDays: 30 }
  });

  useEffect(() => {
    fetchTasks();
    fetchStats();
    fetchRelatedData();
  }, [page, statusFilter, priorityFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(searchQuery && { search: searchQuery })
      };
      const response = await tasksAPI.getAll(params);
      setTasks(response.data.tasks);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await tasksAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
    }
  };

  const fetchRelatedData = async () => {
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        driversAPI.getAll({ limit: 100 }),
        vehiclesAPI.getAll({ limit: 100 })
      ]);
      setDrivers(driversRes.data.drivers);
      setVehicles(vehiclesRes.data.vehicles);
    } catch (error) {
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTasks();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedTask && !showDetailModal) {
        await tasksAPI.update(selectedTask._id, formData);
        toast.success('Task updated');
      } else {
        await tasksAPI.create(formData);
        toast.success('Task created');
      }
      setShowAddModal(false);
      resetForm();
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (task) => {
    try {
      await tasksAPI.complete(task._id);
      toast.success('Task completed');
      fetchTasks();
      fetchStats();
      if (showDetailModal) {
        const updated = await tasksAPI.getById(task._id);
        setSelectedTask(updated.data.task);
      }
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const handleReopen = async (task) => {
    try {
      await tasksAPI.reopen(task._id);
      toast.success('Task reopened');
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to reopen task');
    }
  };

  const handleDelete = async (task) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await tasksAPI.delete(task._id);
      toast.success('Task deleted');
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    try {
      await tasksAPI.addNote(selectedTask._id, noteContent);
      toast.success('Note added');
      setNoteContent('');
      const updated = await tasksAPI.getById(selectedTask._id);
      setSelectedTask(updated.data.task);
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium',
      assignedTo: '',
      assignedToType: 'staff',
      linkedTo: { type: 'none', refId: '', refName: '' },
      recurring: { enabled: false, intervalDays: 30 }
    });
    setSelectedTask(null);
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate?.split('T')[0] || '',
      priority: task.priority,
      assignedTo: task.assignedTo?._id || '',
      assignedToType: task.assignedToType || 'staff',
      linkedTo: task.linkedTo || { type: 'none', refId: '', refName: '' },
      recurring: task.recurring || { enabled: false, intervalDays: 30 }
    });
    setShowAddModal(true);
  };

  const openDetailModal = async (task) => {
    try {
      const response = await tasksAPI.getById(task._id);
      setSelectedTask(response.data.task);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to load task details');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-zinc-500 dark:text-zinc-400';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <StatusBadge status="active" text="Completed" />;
      case 'in_progress':
        return <StatusBadge status="warning" text="In Progress" />;
      case 'overdue':
        return <StatusBadge status="danger" text="Overdue" />;
      default:
        return <StatusBadge status="inactive" text="Not Started" />;
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Task',
      render: (task) => (
        <div className="cursor-pointer" onClick={() => openDetailModal(task)}>
          <div className="font-medium text-zinc-900 dark:text-white">{task.title}</div>
          {task.description && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-xs">{task.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (task) => (
        <div className={`flex items-center gap-2 ${task.isOverdue ? 'text-red-500 dark:text-red-400' : 'text-zinc-600 dark:text-zinc-300'}`}>
          <FiCalendar className="w-4 h-4" />
          {formatDate(task.dueDate)}
          {task.daysUntilDue !== null && task.status !== 'completed' && (
            <span className="text-xs">
              ({task.daysUntilDue < 0 ? `${Math.abs(task.daysUntilDue)}d overdue` : `${task.daysUntilDue}d left`})
            </span>
          )}
        </div>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (task) => (
        <div className={`flex items-center gap-1 capitalize ${getPriorityColor(task.priority)}`}>
          <FiFlag className="w-4 h-4" />
          {task.priority}
        </div>
      )
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (task) => task.assignedTo ? (
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <FiUser className="w-4 h-4" />
          {task.assignedTo.firstName} {task.assignedTo.lastName}
        </div>
      ) : (
        <span className="text-zinc-400 dark:text-zinc-500">Unassigned</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (task) => getStatusBadge(task.status)
    },
    {
      key: 'actions',
      label: '',
      render: (task) => (
        <div className="flex items-center gap-2">
          {task.status !== 'completed' ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleComplete(task); }}
              className="p-1 text-green-400 hover:bg-green-400/10 rounded"
              title="Complete"
            >
              <FiCheckCircle className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); handleReopen(task); }}
              className="p-1 text-blue-400 hover:bg-blue-400/10 rounded"
              title="Reopen"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
            className="p-1 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
            title="Edit"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(task); }}
            className="p-1 text-red-400 hover:bg-red-400/10 rounded"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Tasks</h1>
          <p className="text-zinc-600 dark:text-zinc-300">Manage compliance tasks and reminders</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-cta-500 hover:bg-cta-600 text-white rounded-lg transition-colors"
        >
          <FiPlus className="w-5 h-5" />
          Add Task
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FiClock className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{stats.total || 0}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Total Tasks</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <FiClock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{stats.inProgress || 0}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">In Progress</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{stats.completed || 0}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Completed</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{stats.overdueCount || 0}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Overdue</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <FiCalendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">{stats.dueThisWeek || 0}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Due This Week</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-cta-500"
            />
          </div>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-cta-500"
        >
          <option value="">All Status</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
          <option value="active">Active (Not Completed)</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-cta-500"
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Tasks Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable
          columns={columns}
          data={tasks}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="No tasks found"
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title={selectedTask ? 'Edit Task' : 'Add New Task'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-cta-500"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-cta-500"
              placeholder="Enter task description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-cta-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-cta-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">Link To</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={formData.linkedTo.type}
                onChange={(e) => setFormData({
                  ...formData,
                  linkedTo: { ...formData.linkedTo, type: e.target.value, refId: '', refName: '' }
                })}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-cta-500"
              >
                <option value="none">None</option>
                <option value="driver">Driver</option>
                <option value="vehicle">Vehicle</option>
              </select>
              {formData.linkedTo.type === 'driver' && (
                <select
                  value={formData.linkedTo.refId}
                  onChange={(e) => {
                    const driver = drivers.find(d => d._id === e.target.value);
                    setFormData({
                      ...formData,
                      linkedTo: {
                        ...formData.linkedTo,
                        refId: e.target.value,
                        refName: driver ? `${driver.firstName} ${driver.lastName}` : ''
                      }
                    });
                  }}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-cta-500"
                >
                  <option value="">Select Driver</option>
                  {drivers.map(driver => (
                    <option key={driver._id} value={driver._id}>
                      {driver.firstName} {driver.lastName}
                    </option>
                  ))}
                </select>
              )}
              {formData.linkedTo.type === 'vehicle' && (
                <select
                  value={formData.linkedTo.refId}
                  onChange={(e) => {
                    const vehicle = vehicles.find(v => v._id === e.target.value);
                    setFormData({
                      ...formData,
                      linkedTo: {
                        ...formData.linkedTo,
                        refId: e.target.value,
                        refName: vehicle ? `${vehicle.unitNumber} - ${vehicle.make} ${vehicle.model}` : ''
                      }
                    });
                  }}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-cta-500"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.unitNumber} - {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={formData.recurring.enabled}
                onChange={(e) => setFormData({
                  ...formData,
                  recurring: { ...formData.recurring, enabled: e.target.checked }
                })}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-cta-500 focus:ring-cta-500"
              />
              Recurring Task
            </label>
            {formData.recurring.enabled && (
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 dark:text-zinc-400">Every</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.recurring.intervalDays}
                  onChange={(e) => setFormData({
                    ...formData,
                    recurring: { ...formData.recurring, intervalDays: parseInt(e.target.value) || 30 }
                  })}
                  className="w-20 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-white focus:outline-none focus:border-cta-500"
                />
                <span className="text-zinc-500 dark:text-zinc-400">days</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className="px-4 py-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-cta-500 hover:bg-cta-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : (selectedTask ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedTask(null); }}
        title="Task Details"
        size="lg"
      >
        {selectedTask && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{selectedTask.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">{selectedTask.description || 'No description'}</p>
              </div>
              {getStatusBadge(selectedTask.status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-3">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Due Date</div>
                <div className={`font-medium ${selectedTask.isOverdue ? 'text-red-500 dark:text-red-400' : 'text-zinc-900 dark:text-white'}`}>
                  {formatDate(selectedTask.dueDate)}
                </div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-3">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Priority</div>
                <div className={`font-medium capitalize ${getPriorityColor(selectedTask.priority)}`}>
                  {selectedTask.priority}
                </div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-3">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Assigned To</div>
                <div className="font-medium text-zinc-900 dark:text-white">
                  {selectedTask.assignedTo
                    ? `${selectedTask.assignedTo.firstName} ${selectedTask.assignedTo.lastName}`
                    : 'Unassigned'}
                </div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-3">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Created By</div>
                <div className="font-medium text-zinc-900 dark:text-white">
                  {selectedTask.createdBy
                    ? `${selectedTask.createdBy.firstName} ${selectedTask.createdBy.lastName}`
                    : 'Unknown'}
                </div>
              </div>
            </div>

            {selectedTask.linkedTo?.type !== 'none' && selectedTask.linkedTo?.refName && (
              <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-3">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Linked To</div>
                <div className="font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                  {selectedTask.linkedTo.type === 'driver' ? <FiUser /> : <FiTruck />}
                  {selectedTask.linkedTo.refName}
                </div>
              </div>
            )}

            {selectedTask.recurring?.enabled && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <FiRefreshCw className="w-4 h-4" />
                  Recurring every {selectedTask.recurring.intervalDays} days
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div>
              <h4 className="text-lg font-medium text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                <FiMessageSquare className="w-5 h-5" />
                Notes
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {selectedTask.notes?.length > 0 ? (
                  selectedTask.notes.map((note, idx) => (
                    <div key={idx} className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-zinc-900 dark:text-white">{note.content}</p>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {note.createdBy?.firstName} {note.createdBy?.lastName} - {formatDate(note.createdAt)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-400 dark:text-zinc-500">No notes yet</p>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-cta-500"
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-cta-500 hover:bg-cta-600 text-white rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => { setShowDetailModal(false); openEditModal(selectedTask); }}
                className="flex items-center gap-2 px-4 py-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <FiEdit2 className="w-4 h-4" />
                Edit
              </button>
              <div className="flex gap-2">
                {selectedTask.status !== 'completed' ? (
                  <button
                    onClick={() => handleComplete(selectedTask)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    Complete
                  </button>
                ) : (
                  <button
                    onClick={() => handleReopen(selectedTask)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Reopen
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Tasks;
