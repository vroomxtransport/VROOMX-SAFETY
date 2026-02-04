import { useState, useEffect, useCallback } from 'react';
import { reportTemplatesAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { FiSave, FiCopy, FiTrash2, FiFolder, FiX, FiChevronDown, FiCheck } from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';

/**
 * TemplateManager - Save/load/duplicate report templates
 *
 * Props:
 * - reportType: string - The report type key (e.g., 'dqf', 'vehicle')
 * - currentConfig: object - { selectedFields: string[], filters: object }
 * - onLoadTemplate: function - Callback when template is loaded
 */
const TemplateManager = ({
  reportType,
  currentConfig,
  onLoadTemplate
}) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch templates for current report type
  const fetchTemplates = useCallback(async () => {
    if (!reportType) return;

    setLoading(true);
    try {
      const response = await reportTemplatesAPI.getAll({ reportType });
      setTemplates(response.data.templates || response.data || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      // Silent fail - templates are optional
    } finally {
      setLoading(false);
    }
  }, [reportType]);

  useEffect(() => {
    fetchTemplates();
    setSelectedTemplateId(''); // Reset selection when report type changes
  }, [fetchTemplates]);

  // Group templates by system vs user
  const systemTemplates = templates.filter(t => t.isSystemTemplate);
  const userTemplates = templates.filter(t => !t.isSystemTemplate);

  // Get selected template
  const selectedTemplate = templates.find(t => t._id === selectedTemplateId);

  // Handle load template
  const handleLoadTemplate = () => {
    if (!selectedTemplate) return;

    onLoadTemplate({
      reportType: selectedTemplate.reportType,
      selectedFields: selectedTemplate.selectedFields,
      filters: selectedTemplate.filters || {},
      name: selectedTemplate.name
    });
    setDropdownOpen(false);
  };

  // Handle save template
  const handleSaveTemplate = async () => {
    if (!saveName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (!currentConfig.selectedFields?.length) {
      toast.error('Please select at least one field');
      return;
    }

    setSaving(true);
    try {
      await reportTemplatesAPI.create({
        name: saveName.trim(),
        description: saveDescription.trim(),
        reportType,
        selectedFields: currentConfig.selectedFields,
        filters: currentConfig.filters || {}
      });
      toast.success('Template saved successfully');
      setShowSaveModal(false);
      setSaveName('');
      setSaveDescription('');
      fetchTemplates();
    } catch (err) {
      console.error('Failed to save template:', err);
      toast.error(err.response?.data?.error || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  // Handle duplicate template
  const handleDuplicate = async (templateId) => {
    try {
      await reportTemplatesAPI.duplicate(templateId);
      toast.success('Template duplicated');
      fetchTemplates();
    } catch (err) {
      console.error('Failed to duplicate template:', err);
      toast.error(err.response?.data?.error || 'Failed to duplicate template');
    }
  };

  // Handle delete template
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await reportTemplatesAPI.delete(deleteTarget);
      toast.success('Template deleted');
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      if (selectedTemplateId === deleteTarget) {
        setSelectedTemplateId('');
      }
      fetchTemplates();
    } catch (err) {
      console.error('Failed to delete template:', err);
      toast.error(err.response?.data?.error || 'Failed to delete template');
    }
  };

  // Confirm delete
  const confirmDelete = (templateId) => {
    setDeleteTarget(templateId);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Template Dropdown */}
          <div className="flex-1 relative">
            <label className="form-label">Report Template</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="form-select w-full flex items-center justify-between text-left"
              >
                <span className={selectedTemplate ? '' : 'text-zinc-400 dark:text-zinc-500'}>
                  {selectedTemplate
                    ? `${selectedTemplate.name}${selectedTemplate.isSystemTemplate ? ' (System)' : ''}`
                    : 'Select a template...'}
                </span>
                <FiChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-72 overflow-auto">
                  {loading ? (
                    <div className="px-4 py-3 flex items-center justify-center">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-zinc-500">
                      No templates available
                    </div>
                  ) : (
                    <>
                      {/* System Templates */}
                      {systemTemplates.length > 0 && (
                        <>
                          <div className="px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-50 dark:bg-zinc-900">
                            FMCSA Templates
                          </div>
                          {systemTemplates.map((template) => (
                            <div
                              key={template._id}
                              className={`
                                px-3 py-2 cursor-pointer flex items-center justify-between group
                                hover:bg-zinc-50 dark:hover:bg-zinc-700
                                ${selectedTemplateId === template._id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                              `}
                              onClick={() => {
                                setSelectedTemplateId(template._id);
                              }}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {selectedTemplateId === template._id && (
                                  <FiCheck className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
                                      {template.name}
                                    </span>
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex-shrink-0">
                                      System
                                    </span>
                                  </div>
                                  {template.description && (
                                    <p className="text-xs text-zinc-500 truncate">{template.description}</p>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicate(template._id);
                                }}
                                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Duplicate"
                              >
                                <FiCopy className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </>
                      )}

                      {/* User Templates */}
                      {userTemplates.length > 0 && (
                        <>
                          <div className="px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-50 dark:bg-zinc-900">
                            My Templates
                          </div>
                          {userTemplates.map((template) => (
                            <div
                              key={template._id}
                              className={`
                                px-3 py-2 cursor-pointer flex items-center justify-between group
                                hover:bg-zinc-50 dark:hover:bg-zinc-700
                                ${selectedTemplateId === template._id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                              `}
                              onClick={() => {
                                setSelectedTemplateId(template._id);
                              }}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {selectedTemplateId === template._id && (
                                  <FiCheck className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate block">
                                    {template.name}
                                  </span>
                                  {template.description && (
                                    <p className="text-xs text-zinc-500 truncate">{template.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicate(template._id);
                                  }}
                                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                  title="Duplicate"
                                >
                                  <FiCopy className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDelete(template._id);
                                  }}
                                  className="p-1.5 text-zinc-400 hover:text-red-500"
                                  title="Delete"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleLoadTemplate}
              disabled={!selectedTemplateId}
              className="btn btn-secondary"
            >
              <FiFolder className="w-4 h-4 mr-2" />
              Load
            </button>
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              disabled={!currentConfig.selectedFields?.length}
              className="btn btn-primary"
            >
              <FiSave className="w-4 h-4 mr-2" />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                Save Template
              </h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="form-label">Template Name *</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="My Custom Report"
                  className="form-input"
                  autoFocus
                />
              </div>
              <div>
                <label className="form-label">Description (optional)</label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Brief description of this template..."
                  className="form-input"
                  rows={3}
                />
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                This will save your current field selection ({currentConfig.selectedFields?.length || 0} fields) and filters.
              </div>
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={saving || !saveName.trim()}
                className="btn btn-primary"
              >
                {saving ? <LoadingSpinner size="sm" className="mr-2" /> : <FiSave className="w-4 h-4 mr-2" />}
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl max-w-sm w-full">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                Delete Template?
              </h3>
            </div>
            <div className="p-4">
              <p className="text-zinc-600 dark:text-zinc-300">
                Are you sure you want to delete this template? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn bg-red-500 hover:bg-red-600 text-white"
              >
                <FiTrash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
