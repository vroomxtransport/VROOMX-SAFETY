import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import {
  FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiMessageSquare, FiLink
} from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const TYPE_STYLES = {
  info: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
  warning: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
  critical: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
};

const AUDIENCE_OPTIONS = ['all', 'admins', 'solo', 'fleet', 'starter', 'professional'];
const TYPE_OPTIONS = ['info', 'warning', 'critical'];

const EMPTY_FORM = {
  message: '',
  type: 'info',
  targetAudience: 'all',
  startDate: '',
  endDate: '',
  linkUrl: '',
  linkText: '',
};

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAnnouncements();
      setAnnouncements(response.data.announcements || response.data || []);
    } catch (err) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEditModal = (announcement) => {
    setEditingId(announcement._id);
    setForm({
      message: announcement.message || '',
      type: announcement.type || 'info',
      targetAudience: announcement.targetAudience || 'all',
      startDate: announcement.startDate ? announcement.startDate.split('T')[0] : '',
      endDate: announcement.endDate ? announcement.endDate.split('T')[0] : '',
      linkUrl: announcement.linkUrl || '',
      linkText: announcement.linkText || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSave = async () => {
    if (!form.message.trim()) {
      toast.error('Message is required');
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await adminAPI.updateAnnouncement(editingId, form);
        toast.success('Announcement updated');
      } else {
        await adminAPI.createAnnouncement(form);
        toast.success('Announcement created');
      }
      closeModal();
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (announcement) => {
    try {
      await adminAPI.toggleAnnouncement(announcement._id);
      toast.success(`Announcement ${announcement.isActive ? 'deactivated' : 'activated'}`);
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to toggle announcement');
    }
  };

  const handleDelete = async (announcement) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await adminAPI.deleteAnnouncement(announcement._id);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  const truncateMessage = (msg, maxLength = 60) => {
    if (!msg) return '-';
    return msg.length > maxLength ? msg.substring(0, maxLength) + '...' : msg;
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <FiMessageSquare className="w-6 h-6 text-red-500" />
            Announcements
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            {announcements.length} total announcements
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <FiMessageSquare className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">No announcements found</p>
            <p className="text-zinc-500 dark:text-zinc-500 text-sm">Create your first announcement to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-300 dark:border-zinc-600">
                <tr>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Message</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Audience</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Date Range</th>
                  <th className="text-right px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {announcements.map((announcement) => (
                  <tr key={announcement._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <span className={`inline-block w-3 h-3 rounded-full ${
                        announcement.isActive ? 'bg-green-500' : 'bg-zinc-400 dark:bg-zinc-600'
                      }`} />
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-900 dark:text-white max-w-xs">
                      {truncateMessage(announcement.message)}
                      {announcement.linkUrl && (
                        <FiLink className="inline w-3.5 h-3.5 ml-1.5 text-zinc-400" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        TYPE_STYLES[announcement.type] || TYPE_STYLES.info
                      }`}>
                        {announcement.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 capitalize">
                      {announcement.targetAudience || 'all'}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-500 whitespace-nowrap">
                      {announcement.startDate
                        ? `${new Date(announcement.startDate).toLocaleDateString()} - ${announcement.endDate ? new Date(announcement.endDate).toLocaleDateString() : 'No end'}`
                        : 'Always'
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggle(announcement)}
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                          title={announcement.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {announcement.isActive ? (
                            <FiToggleRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <FiToggleLeft className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(announcement)}
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(announcement)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingId ? 'Edit Announcement' : 'New Announcement'}
      >
        <div className="space-y-4">
          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value.slice(0, 500) })}
              placeholder="Enter announcement message..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{form.message.length}/500</p>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target Audience</label>
            <select
              value={form.targetAudience}
              onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {AUDIENCE_OPTIONS.map((a) => (
                <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Link URL</label>
              <input
                type="url"
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Link Text</label>
              <input
                type="text"
                value={form.linkText}
                onChange={(e) => setForm({ ...form, linkText: e.target.value })}
                placeholder="Learn more"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
              disabled={saving}
            >
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminAnnouncements;
