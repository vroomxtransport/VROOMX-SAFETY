import { useState, useEffect } from 'react';
import { scheduledReportsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  FiCalendar, FiPlus, FiEdit2, FiTrash2, FiPlay, FiPause,
  FiClock, FiMail, FiFileText, FiCheck, FiX, FiSend,
  FiUsers, FiTruck, FiAlertTriangle, FiClipboard, FiBarChart2
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const ScheduledReports = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [reportTypes, setReportTypes] = useState([]);

  const [formData, setFormData] = useState({
    reportType: 'dqf',
    reportName: '',
    frequency: 'weekly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: '09:00',
    recipients: '',
    format: 'pdf'
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const reportIcons = {
    'dqf': FiUsers,
    'vehicle-maintenance': FiTruck,
    'violations': FiAlertTriangle,
    'audit': FiClipboard,
    'csa': FiBarChart2
  };

  const reportColors = {
    'dqf': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
    'vehicle-maintenance': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
    'violations': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
    'audit': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
    'csa': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' }
  };

  useEffect(() => {
    fetchSchedules();
    fetchReportTypes();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await scheduledReportsAPI.getAll({ includeInactive: true });
      setSchedules(response.data.schedules || []);
    } catch (error) {
      toast.error('Failed to load scheduled reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportTypes = async () => {
    try {
      const response = await scheduledReportsAPI.getAvailableTypes();
      setReportTypes(response.data.reportTypes || []);
    } catch (error) {
      // Use defaults if fetch fails
      setReportTypes([
        { value: 'dqf', label: 'Driver Qualification Files', description: 'Driver compliance status' },
        { value: 'vehicle-maintenance', label: 'Vehicle Maintenance', description: 'Fleet overview' },
        { value: 'violations', label: 'Violations Summary', description: 'Violation history' },
        { value: 'audit', label: 'Comprehensive Audit', description: 'Full compliance audit' },
        { value: 'csa', label: 'CSA/SMS BASICs', description: 'SMS BASIC percentiles' }
      ]);
    }
  };

  const handleOpenModal = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        reportType: schedule.reportType,
        reportName: schedule.reportName || '',
        frequency: schedule.frequency,
        dayOfWeek: schedule.dayOfWeek || 1,
        dayOfMonth: schedule.dayOfMonth || 1,
        time: schedule.time || '09:00',
        recipients: schedule.recipients?.join(', ') || '',
        format: schedule.format || 'pdf'
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        reportType: 'dqf',
        reportName: '',
        frequency: 'weekly',
        dayOfWeek: 1,
        dayOfMonth: 1,
        time: '09:00',
        recipients: user?.email || '',
        format: 'pdf'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const recipients = formData.recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email);

    const data = {
      ...formData,
      recipients,
      dayOfWeek: parseInt(formData.dayOfWeek),
      dayOfMonth: parseInt(formData.dayOfMonth)
    };

    try {
      if (editingSchedule) {
        await scheduledReportsAPI.update(editingSchedule._id, data);
        toast.success('Schedule updated');
      } else {
        await scheduledReportsAPI.create(data);
        toast.success('Schedule created');
      }
      handleCloseModal();
      fetchSchedules();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save schedule');
    }
  };

  const handleToggle = async (scheduleId) => {
    setActionLoading({ ...actionLoading, [scheduleId]: 'toggle' });
    try {
      const response = await scheduledReportsAPI.toggle(scheduleId);
      toast.success(response.data.message);
      fetchSchedules();
    } catch (error) {
      toast.error('Failed to toggle schedule');
    } finally {
      setActionLoading({ ...actionLoading, [scheduleId]: null });
    }
  };

  const handleRunNow = async (scheduleId) => {
    setActionLoading({ ...actionLoading, [scheduleId]: 'run' });
    try {
      await scheduledReportsAPI.run(scheduleId);
      toast.success('Report sent successfully');
      fetchSchedules();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to run report');
    } finally {
      setActionLoading({ ...actionLoading, [scheduleId]: null });
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this scheduled report?')) return;

    setActionLoading({ ...actionLoading, [scheduleId]: 'delete' });
    try {
      await scheduledReportsAPI.delete(scheduleId, true);
      toast.success('Schedule deleted');
      fetchSchedules();
    } catch (error) {
      toast.error('Failed to delete schedule');
    } finally {
      setActionLoading({ ...actionLoading, [scheduleId]: null });
    }
  };

  const formatNextRun = (nextRun) => {
    if (!nextRun) return 'Not scheduled';
    const date = new Date(nextRun);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Scheduled Reports</h1>
          <p className="text-zinc-600 dark:text-zinc-300">Automate report delivery to your inbox</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center"
        >
          <FiPlus className="w-4 h-4 mr-2" />
          New Schedule
        </button>
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="card p-8 text-center">
          <FiCalendar className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
          <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-200 mb-2">No Scheduled Reports</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            Set up automated reports to be delivered to your email on a regular schedule.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary"
          >
            Create Your First Schedule
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {schedules.map((schedule) => {
            const Icon = reportIcons[schedule.reportType] || FiFileText;
            const colors = reportColors[schedule.reportType] || reportColors['dqf'];
            const isActionLoading = actionLoading[schedule._id];

            return (
              <div key={schedule._id} className={`card ${!schedule.isActive ? 'opacity-60' : ''}`}>
                <div className="card-body">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Icon & Title */}
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                            {schedule.reportDisplayName || schedule.reportName || reportTypes.find(t => t.value === schedule.reportType)?.label || schedule.reportType}
                          </h3>
                          {!schedule.isActive && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded">
                              Paused
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                          <span className="flex items-center">
                            <FiClock className="w-4 h-4 mr-1" />
                            {schedule.frequencyDisplay}
                          </span>
                          <span className="flex items-center">
                            <FiMail className="w-4 h-4 mr-1" />
                            {schedule.recipients?.length || 0} recipient{schedule.recipients?.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Next Run & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="text-sm">
                        <p className="text-zinc-500 dark:text-zinc-400">Next run</p>
                        <p className="font-medium text-zinc-700 dark:text-zinc-200">
                          {schedule.isActive ? formatNextRun(schedule.nextRun) : 'Paused'}
                        </p>
                      </div>

                      {schedule.lastRunStatus && (
                        <div className="text-sm">
                          <p className="text-zinc-500 dark:text-zinc-400">Last run</p>
                          <p className={`font-medium flex items-center ${
                            schedule.lastRunStatus === 'success' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {schedule.lastRunStatus === 'success' ? (
                              <FiCheck className="w-4 h-4 mr-1" />
                            ) : (
                              <FiX className="w-4 h-4 mr-1" />
                            )}
                            {schedule.lastRunStatus}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRunNow(schedule._id)}
                          disabled={isActionLoading}
                          className="btn btn-secondary btn-sm flex items-center"
                          title="Run now"
                        >
                          {isActionLoading === 'run' ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <FiSend className="w-4 h-4 mr-1" />
                              Run Now
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleToggle(schedule._id)}
                          disabled={isActionLoading}
                          className={`btn btn-sm ${schedule.isActive ? 'btn-secondary' : 'btn-primary'}`}
                          title={schedule.isActive ? 'Pause' : 'Resume'}
                        >
                          {isActionLoading === 'toggle' ? (
                            <LoadingSpinner size="sm" />
                          ) : schedule.isActive ? (
                            <FiPause className="w-4 h-4" />
                          ) : (
                            <FiPlay className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenModal(schedule)}
                          className="btn btn-secondary btn-sm"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(schedule._id)}
                          disabled={isActionLoading}
                          className="btn btn-secondary btn-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete"
                        >
                          {isActionLoading === 'delete' ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <FiTrash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-4">
                {editingSchedule ? 'Edit Schedule' : 'New Scheduled Report'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Report Type */}
                <div>
                  <label className="form-label">Report Type</label>
                  <select
                    className="form-input"
                    value={formData.reportType}
                    onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                    required
                  >
                    {reportTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Name (optional) */}
                <div>
                  <label className="form-label">Custom Name (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Weekly DQF Report"
                    value={formData.reportName}
                    onChange={(e) => setFormData({ ...formData, reportName: e.target.value })}
                  />
                </div>

                {/* Frequency */}
                <div>
                  <label className="form-label">Frequency</label>
                  <select
                    className="form-input"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    required
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {/* Day Selection */}
                {formData.frequency === 'weekly' && (
                  <div>
                    <label className="form-label">Day of Week</label>
                    <select
                      className="form-input"
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                    >
                      {dayNames.map((day, index) => (
                        <option key={index} value={index}>{day}</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.frequency === 'monthly' && (
                  <div>
                    <label className="form-label">Day of Month</label>
                    <select
                      className="form-input"
                      value={formData.dayOfMonth}
                      onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                    >
                      {[...Array(31)].map((_, index) => (
                        <option key={index + 1} value={index + 1}>{index + 1}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Time */}
                <div>
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>

                {/* Recipients */}
                <div>
                  <label className="form-label">Recipients (comma-separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="email1@example.com, email2@example.com"
                    value={formData.recipients}
                    onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Leave blank to send to your email only
                  </p>
                </div>

                {/* Format */}
                <div>
                  <label className="form-label">Format</label>
                  <select
                    className="form-input"
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  >
                    <option value="pdf">PDF</option>
                    <option value="csv">CSV</option>
                    <option value="both">Both (PDF + CSV)</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledReports;
