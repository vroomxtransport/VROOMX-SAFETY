import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import {
  FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiFlag, FiCode
} from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  key: '',
  description: '',
  enabled: false,
};

const KEY_REGEX = /^[a-z0-9_]+$/;

const AdminFeatureFlags = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [keyError, setKeyError] = useState('');

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getFeatureFlags();
      setFlags(response.data.features || response.data.flags || []);
    } catch (err) {
      toast.error('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setKeyError('');
    setShowModal(true);
  };

  const openEditModal = (flag) => {
    setEditingId(flag._id);
    setForm({
      key: flag.key || '',
      description: flag.description || '',
      enabled: flag.enabled || false,
    });
    setKeyError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setKeyError('');
  };

  const validateKey = (value) => {
    if (!value.trim()) {
      setKeyError('Key is required');
      return false;
    }
    if (!KEY_REGEX.test(value)) {
      setKeyError('Key must be lowercase alphanumeric and underscores only');
      return false;
    }
    setKeyError('');
    return true;
  };

  const handleSave = async () => {
    if (!editingId && !validateKey(form.key)) return;

    try {
      setSaving(true);
      if (editingId) {
        await adminAPI.updateFeatureFlag(editingId, {
          description: form.description,
          enabled: form.enabled,
        });
        toast.success('Feature flag updated');
      } else {
        await adminAPI.createFeatureFlag(form);
        toast.success('Feature flag created');
      }
      closeModal();
      fetchFlags();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save feature flag');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (flag) => {
    try {
      await adminAPI.toggleFeatureFlag(flag._id);
      toast.success(`Flag "${flag.key}" ${flag.enabled ? 'disabled' : 'enabled'}`);
      fetchFlags();
    } catch (err) {
      toast.error('Failed to toggle feature flag');
    }
  };

  const handleDelete = async (flag) => {
    if (!window.confirm(`Are you sure you want to delete the feature flag "${flag.key}"?`)) return;

    try {
      await adminAPI.deleteFeatureFlag(flag._id);
      toast.success('Feature flag deleted');
      fetchFlags();
    } catch (err) {
      toast.error('Failed to delete feature flag');
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <FiFlag className="w-6 h-6 text-red-500" />
            Feature Flags
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            {flags.length} total flags
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" />
          New Flag
        </button>
      </div>

      {/* Table / Card List */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : flags.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <FiFlag className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
            <p className="text-zinc-600 dark:text-zinc-400 font-medium">No feature flags found</p>
            <p className="text-zinc-500 dark:text-zinc-500 text-sm">Create your first feature flag to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-300 dark:border-zinc-600">
                <tr>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Key</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Description</th>
                  <th className="text-left px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-4 text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {flags.map((flag) => (
                  <tr key={flag._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <code className="text-sm font-mono text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                        {flag.key}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
                      {flag.description || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(flag)}
                        className="flex items-center gap-2"
                      >
                        {flag.enabled ? (
                          <>
                            <FiToggleRight className="w-6 h-6 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">Enabled</span>
                          </>
                        ) : (
                          <>
                            <FiToggleLeft className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-500">Disabled</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(flag)}
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(flag)}
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
        title={editingId ? 'Edit Feature Flag' : 'New Feature Flag'}
        icon={FiCode}
      >
        <div className="space-y-4">
          {/* Key */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.key}
              onChange={(e) => {
                const val = e.target.value.toLowerCase();
                setForm({ ...form, key: val });
                if (val) validateKey(val);
              }}
              placeholder="e.g. enable_new_dashboard"
              disabled={!!editingId}
              className={`w-full px-3 py-2 rounded-lg border text-sm font-mono focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                editingId
                  ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-500 cursor-not-allowed'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white'
              } ${keyError ? 'border-red-500' : ''}`}
            />
            {keyError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{keyError}</p>
            )}
            {editingId && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Key cannot be changed after creation</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what this feature flag controls..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Enabled Toggle */}
          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Enabled</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Toggle this flag on or off</p>
            </div>
            <button
              onClick={() => setForm({ ...form, enabled: !form.enabled })}
              className="flex-shrink-0"
            >
              {form.enabled ? (
                <FiToggleRight className="w-8 h-8 text-green-600 dark:text-green-400" />
              ) : (
                <FiToggleLeft className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
              )}
            </button>
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
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Flag'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminFeatureFlags;
