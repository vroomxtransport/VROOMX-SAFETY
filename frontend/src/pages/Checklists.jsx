import { useState, useEffect } from 'react';
import { checklistsAPI, driversAPI, vehiclesAPI } from '../utils/api';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiPlus, FiSearch, FiCheckCircle, FiClock, FiList, FiEdit2,
  FiTrash2, FiClipboard, FiCheck, FiSquare, FiUser, FiTruck,
  FiChevronDown, FiChevronUp, FiFileText, FiCalendar, FiAlertTriangle
} from 'react-icons/fi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import TabNav from '../components/TabNav';

const Checklists = () => {
  const [activeTab, setActiveTab] = useState('assignments');
  const [templates, setTemplates] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  const tabs = [
    { key: 'assignments', label: 'Assigned Checklists', icon: FiClipboard },
    { key: 'templates', label: 'Templates', icon: FiFileText }
  ];

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'custom',
    items: [{ title: '', description: '', required: true }]
  });

  const [assignForm, setAssignForm] = useState({
    templateId: '',
    assignedTo: { type: 'driver', refId: '', name: '' },
    dueDate: ''
  });

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    } else {
      fetchAssignments();
      fetchStats();
    }
    fetchRelatedData();
  }, [activeTab, page, statusFilter]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await checklistsAPI.getTemplates();
      setTemplates(response.data.templates);
    } catch (error) {
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        ...(statusFilter && { status: statusFilter })
      };
      const response = await checklistsAPI.getAssignments(params);
      setAssignments(response.data.assignments);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await checklistsAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
    }
  };

  const fetchRelatedData = async () => {
    try {
      const [driversRes, vehiclesRes, templatesRes] = await Promise.all([
        driversAPI.getAll({ limit: 100 }),
        vehiclesAPI.getAll({ limit: 100 }),
        checklistsAPI.getTemplates()
      ]);
      setDrivers(driversRes.data.drivers);
      setVehicles(vehiclesRes.data.vehicles);
      if (activeTab !== 'templates') {
        setTemplates(templatesRes.data.templates);
      }
    } catch (error) {
    }
  };

  const handleSeedDefaults = async () => {
    try {
      const response = await checklistsAPI.seedDefaults();
      toast.success(response.data.message);
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to seed default templates');
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Add order to items
      const itemsWithOrder = templateForm.items.map((item, idx) => ({
        ...item,
        order: idx + 1
      }));

      if (selectedTemplate) {
        await checklistsAPI.updateTemplate(selectedTemplate._id, { ...templateForm, items: itemsWithOrder });
        toast.success('Template updated');
      } else {
        await checklistsAPI.createTemplate({ ...templateForm, items: itemsWithOrder });
        toast.success('Template created');
      }
      setShowTemplateModal(false);
      resetTemplateForm();
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (template.isDefault) {
      toast.error('Cannot delete default templates');
      return;
    }
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await checklistsAPI.deleteTemplate(template._id);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleAssignChecklist = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await checklistsAPI.createAssignment(assignForm);
      toast.success('Checklist assigned');
      setShowAssignModal(false);
      resetAssignForm();
      fetchAssignments();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign checklist');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleItem = async (assignment, itemId) => {
    try {
      const response = await checklistsAPI.toggleItem(assignment._id, itemId);
      toast.success(response.data.message);
      // Update local state
      const updated = response.data.assignment;
      setAssignments(prev => prev.map(a => a._id === updated._id ? updated : a));
      if (selectedAssignment?._id === updated._id) {
        setSelectedAssignment(updated);
      }
      fetchStats();
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const handleDeleteAssignment = async (assignment) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await checklistsAPI.deleteAssignment(assignment._id);
      toast.success('Assignment deleted');
      fetchAssignments();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      category: 'custom',
      items: [{ title: '', description: '', required: true }]
    });
    setSelectedTemplate(null);
  };

  const resetAssignForm = () => {
    setAssignForm({
      templateId: '',
      assignedTo: { type: 'driver', refId: '', name: '' },
      dueDate: ''
    });
  };

  const openEditTemplate = (template) => {
    if (template.isDefault) {
      toast.error('Cannot edit default templates');
      return;
    }
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      category: template.category,
      items: template.items.map(i => ({
        title: i.title,
        description: i.description || '',
        required: i.required
      }))
    });
    setShowTemplateModal(true);
  };

  const openDetailModal = async (assignment) => {
    try {
      const response = await checklistsAPI.getAssignment(assignment._id);
      setSelectedAssignment(response.data.assignment);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to load assignment details');
    }
  };

  const addTemplateItem = () => {
    setTemplateForm({
      ...templateForm,
      items: [...templateForm.items, { title: '', description: '', required: true }]
    });
  };

  const removeTemplateItem = (index) => {
    if (templateForm.items.length <= 1) return;
    setTemplateForm({
      ...templateForm,
      items: templateForm.items.filter((_, i) => i !== index)
    });
  };

  const updateTemplateItem = (index, field, value) => {
    const newItems = [...templateForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setTemplateForm({ ...templateForm, items: newItems });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <StatusBadge status="active" text="Completed" />;
      case 'in_progress':
        return <StatusBadge status="warning" text="In Progress" />;
      default:
        return <StatusBadge status="inactive" text="Not Started" />;
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      onboarding: 'Onboarding',
      audit: 'Audit',
      maintenance: 'Maintenance',
      file_review: 'File Review',
      custom: 'Custom'
    };
    return labels[category] || category;
  };

  const templateColumns = [
    {
      key: 'name',
      label: 'Template Name',
      render: (template) => (
        <div>
          <div className="font-medium text-zinc-900 dark:text-white flex items-center gap-2">
            {template.name}
            {template.isDefault && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded">Default</span>
            )}
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">{template.description}</div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (template) => (
        <span className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded capitalize">
          {getCategoryLabel(template.category)}
        </span>
      )
    },
    {
      key: 'itemCount',
      label: 'Items',
      render: (template) => (
        <span className="text-zinc-600 dark:text-zinc-300">{template.itemCount || template.items?.length || 0} items</span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (template) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAssignForm({ ...assignForm, templateId: template._id });
              setShowAssignModal(true);
            }}
            className="btn btn-primary text-sm py-1"
          >
            Assign
          </button>
          {!template.isDefault && (
            <>
              <button
                onClick={() => openEditTemplate(template)}
                className="p-1 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
                title="Edit"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteTemplate(template)}
                className="p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded"
                title="Delete"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const assignmentColumns = [
    {
      key: 'templateName',
      label: 'Checklist',
      render: (assignment) => (
        <div className="cursor-pointer" onClick={() => openDetailModal(assignment)}>
          <div className="font-medium text-zinc-900 dark:text-white">{assignment.templateName}</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {assignment.assignedTo?.type === 'driver' ? (
              <span className="flex items-center gap-1"><FiUser className="w-3 h-3" /> {assignment.assignedTo.name}</span>
            ) : assignment.assignedTo?.type === 'vehicle' ? (
              <span className="flex items-center gap-1"><FiTruck className="w-3 h-3" /> {assignment.assignedTo.name}</span>
            ) : (
              <span>{assignment.assignedTo?.name || 'Company-wide'}</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (assignment) => (
        <div className="flex items-center gap-3">
          <div className="w-24 bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                assignment.progress === 100 ? 'bg-green-500' :
                assignment.progress > 0 ? 'bg-yellow-500' : 'bg-gray-600'
              }`}
              style={{ width: `${assignment.progress || 0}%` }}
            />
          </div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{assignment.progress || 0}%</span>
        </div>
      )
    },
    {
      key: 'itemsSummary',
      label: 'Items',
      render: (assignment) => (
        <span className="text-zinc-600 dark:text-zinc-300">
          {assignment.itemsSummary?.completed || 0} / {assignment.itemsSummary?.total || 0}
        </span>
      )
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (assignment) => assignment.dueDate ? (
        <div className="text-zinc-600 dark:text-zinc-300">{formatDate(assignment.dueDate)}</div>
      ) : (
        <span className="text-zinc-400 dark:text-zinc-500">No due date</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (assignment) => getStatusBadge(assignment.status)
    },
    {
      key: 'actions',
      label: '',
      render: (assignment) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openDetailModal(assignment); }}
            className="p-1 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
            title="View Details"
          >
            <FiList className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(assignment); }}
            className="p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Checklists</h1>
          <p className="text-zinc-600 dark:text-zinc-300">Manage compliance checklists and templates</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'templates' ? (
            <>
              <button
                onClick={handleSeedDefaults}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white rounded-lg transition-colors"
              >
                <FiFileText className="w-5 h-5" />
                Seed Defaults
              </button>
              <button
                onClick={() => { resetTemplateForm(); setShowTemplateModal(true); }}
                className="btn btn-primary"
              >
                <FiPlus className="w-5 h-5" />
                New Template
              </button>
            </>
          ) : (
            <button
              onClick={() => { resetAssignForm(); setShowAssignModal(true); }}
              className="btn btn-primary"
            >
              <FiPlus className="w-5 h-5" />
              Assign Checklist
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards (for assignments tab) */}
      {activeTab === 'assignments' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
                <FiClipboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.total || 0}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Total</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-500/10 rounded-lg">
                <FiClock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.inProgress || 0}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">In Progress</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg">
                <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.completed || 0}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Completed</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-lg">
                <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.overdue || 0}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Overdue</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <TabNav tabs={tabs} activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setPage(1); }} />

      {/* Filters for assignments */}
      {activeTab === 'assignments' && (
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSpinner />
      ) : activeTab === 'templates' ? (
        <DataTable
          columns={templateColumns}
          data={templates}
          emptyMessage="No templates found. Click 'Seed Defaults' to add pre-built FMCSA compliance checklists."
        />
      ) : (
        <DataTable
          columns={assignmentColumns}
          data={assignments}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="No checklists assigned yet"
        />
      )}

      {/* Template Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => { setShowTemplateModal(false); resetTemplateForm(); }}
        title={selectedTemplate ? 'Edit Template' : 'Create Template'}
        size="lg"
      >
        <form onSubmit={handleCreateTemplate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Name *</label>
            <input
              type="text"
              required
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Template name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Description</label>
            <textarea
              rows={2}
              value={templateForm.description}
              onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Template description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Category</label>
            <select
              value={templateForm.category}
              onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="onboarding">Onboarding</option>
              <option value="audit">Audit</option>
              <option value="maintenance">Maintenance</option>
              <option value="file_review">File Review</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">Checklist Items *</label>
              <button
                type="button"
                onClick={addTemplateItem}
                className="text-sm text-primary-400 hover:text-primary-300"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {templateForm.items.map((item, idx) => (
                <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={item.title}
                      onChange={(e) => updateTemplateItem(idx, 'title', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder={`Item ${idx + 1} title`}
                    />
                    {templateForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTemplateItem(idx)}
                        className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateTemplateItem(idx, 'description', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Description (optional)"
                  />
                  <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <input
                      type="checkbox"
                      checked={item.required}
                      onChange={(e) => updateTemplateItem(idx, 'required', e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-primary-500"
                    />
                    Required
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => { setShowTemplateModal(false); resetTemplateForm(); }}
              className="px-4 py-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Saving...' : (selectedTemplate ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => { setShowAssignModal(false); resetAssignForm(); }}
        title="Assign Checklist"
        size="md"
      >
        <form onSubmit={handleAssignChecklist} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Template *</label>
            <select
              required
              value={assignForm.templateId}
              onChange={(e) => setAssignForm({ ...assignForm, templateId: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select Template</option>
              {templates.map(template => (
                <option key={template._id} value={template._id}>
                  {template.name} ({template.itemCount || template.items?.length} items)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Assign To *</label>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={assignForm.assignedTo.type}
                onChange={(e) => setAssignForm({
                  ...assignForm,
                  assignedTo: { type: e.target.value, refId: '', name: '' }
                })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="driver">Driver</option>
                <option value="vehicle">Vehicle</option>
                <option value="company">Company</option>
                <option value="audit">Audit</option>
              </select>
              {assignForm.assignedTo.type === 'driver' && (
                <select
                  required
                  value={assignForm.assignedTo.refId}
                  onChange={(e) => {
                    const driver = drivers.find(d => d._id === e.target.value);
                    setAssignForm({
                      ...assignForm,
                      assignedTo: {
                        ...assignForm.assignedTo,
                        refId: e.target.value,
                        name: driver ? `${driver.firstName} ${driver.lastName}` : ''
                      }
                    });
                  }}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Driver</option>
                  {drivers.map(driver => (
                    <option key={driver._id} value={driver._id}>
                      {driver.firstName} {driver.lastName}
                    </option>
                  ))}
                </select>
              )}
              {assignForm.assignedTo.type === 'vehicle' && (
                <select
                  required
                  value={assignForm.assignedTo.refId}
                  onChange={(e) => {
                    const vehicle = vehicles.find(v => v._id === e.target.value);
                    setAssignForm({
                      ...assignForm,
                      assignedTo: {
                        ...assignForm.assignedTo,
                        refId: e.target.value,
                        name: vehicle ? `${vehicle.unitNumber} - ${vehicle.make} ${vehicle.model}` : ''
                      }
                    });
                  }}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Due Date</label>
            <input
              type="date"
              value={assignForm.dueDate}
              onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => { setShowAssignModal(false); resetAssignForm(); }}
              className="px-4 py-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Assigning...' : 'Assign Checklist'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedAssignment(null); }}
        title="Checklist Progress"
        size="lg"
      >
        {selectedAssignment && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{selectedAssignment.templateName}</h3>
                <div className="text-zinc-500 dark:text-zinc-400 mt-1">
                  {selectedAssignment.assignedTo?.type === 'driver' ? (
                    <span className="flex items-center gap-1"><FiUser className="w-4 h-4" /> {selectedAssignment.assignedTo.name}</span>
                  ) : selectedAssignment.assignedTo?.type === 'vehicle' ? (
                    <span className="flex items-center gap-1"><FiTruck className="w-4 h-4" /> {selectedAssignment.assignedTo.name}</span>
                  ) : (
                    <span>{selectedAssignment.assignedTo?.name || 'Company-wide'}</span>
                  )}
                </div>
              </div>
              {getStatusBadge(selectedAssignment.status)}
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-500 dark:text-zinc-400">Progress</span>
                <span className="text-zinc-900 dark:text-white font-medium">{selectedAssignment.progress || 0}%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    selectedAssignment.progress === 100 ? 'bg-green-500' :
                    selectedAssignment.progress > 0 ? 'bg-yellow-500' : 'bg-gray-600'
                  }`}
                  style={{ width: `${selectedAssignment.progress || 0}%` }}
                />
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {selectedAssignment.itemsSummary?.completed} of {selectedAssignment.itemsSummary?.total} items completed
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedAssignment.items?.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    item.completed ? 'bg-green-100 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30' : 'bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                  onClick={() => handleToggleItem(selectedAssignment, item._id)}
                >
                  <div className={`mt-0.5 ${item.completed ? 'text-green-600 dark:text-green-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {item.completed ? <FiCheckCircle className="w-5 h-5" /> : <FiSquare className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${item.completed ? 'text-green-600 dark:text-green-400 line-through' : 'text-zinc-900 dark:text-white'}`}>
                      {item.title}
                      {item.required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
                    </div>
                    {item.description && (
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">{item.description}</div>
                    )}
                    {item.completed && item.completedBy && (
                      <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                        Completed by {item.completedBy.firstName} {item.completedBy.lastName} on {formatDate(item.completedAt)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedAssignment.dueDate && (
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                <FiCalendar className="w-4 h-4" />
                Due: {formatDate(selectedAssignment.dueDate)}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Checklists;
