import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiBookOpen, FiFile, FiDownload, FiTrash2, FiEye, FiUpload, FiEdit2 } from 'react-icons/fi';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';
import { formatDate, formatFileSize } from '../utils/helpers';

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  const categories = [
    { value: 'safety', label: 'Safety Policies' },
    { value: 'hr', label: 'HR Policies' },
    { value: 'operations', label: 'Operations' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'driver', label: 'Driver Policies' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'drug_alcohol', label: 'Drug & Alcohol' },
    { value: 'accident', label: 'Accident Procedures' },
    { value: 'training', label: 'Training' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchPolicies();
  }, [page, categoryFilter]);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        category: 'policy',
        ...(categoryFilter && { documentType: categoryFilter }),
        ...(search && { search })
      };
      const response = await api.get('/documents', { params });
      setPolicies(response.data.documents || []);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      toast.error('Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append('category', 'policy');
    setUploading(true);
    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Policy uploaded successfully');
      setShowUploadModal(false);
      fetchPolicies();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload policy');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Policy deleted');
      fetchPolicies();
    } catch (error) {
      toast.error('Failed to delete policy');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPolicies();
  };

  const downloadPolicy = async (docId, fileName) => {
    try {
      const response = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'policy');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download policy');
    }
  };

  const columns = [
    {
      header: 'Policy',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
            <FiBookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">{row.name}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{row.documentType}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      render: (row) => (
        <span className="capitalize text-sm px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md">
          {categories.find(c => c.value === row.documentType)?.label || row.documentType || 'General'}
        </span>
      )
    },
    {
      header: 'Last Updated',
      render: (row) => (
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {formatDate(row.updatedAt || row.createdAt)}
        </span>
      )
    },
    {
      header: 'Size',
      render: (row) => (
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {formatFileSize(row.fileSize)}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => downloadPolicy(row._id, row.fileName)}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-cta dark:hover:text-cta hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="View/Download"
          >
            <FiEye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row._id);
            }}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Company Policies</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Manage and distribute company policies and procedures</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary flex items-center"
        >
          <FiUpload className="w-5 h-5 mr-2" />
          Upload Policy
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <FiBookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-2xl font-bold">{policies.length}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Total Policies</p>
            </div>
          </div>
        </div>
        <div className="card p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {policies.filter(p => p.documentType === 'safety').length}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Safety</p>
          </div>
        </div>
        <div className="card p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {policies.filter(p => p.documentType === 'operations').length}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Operations</p>
          </div>
        </div>
        <div className="card p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {policies.filter(p => p.documentType === 'compliance').length}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Compliance</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
              <input
                type="text"
                placeholder="Search policies..."
                className="form-input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </form>
          <select
            className="form-select w-full sm:w-48"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={policies}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="No policies found. Upload your first policy to get started."
          emptyIcon={FiBookOpen}
        />
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Policy"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="form-label">Select File *</label>
            <input
              type="file"
              name="file"
              required
              className="form-input"
              accept=".pdf,.doc,.docx"
            />
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">PDF, DOC, DOCX (Max 10MB)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Policy Category *</label>
              <select name="documentType" className="form-select" required>
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Policy Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                required
                placeholder="e.g., Driver Safety Policy"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-input"
              rows={3}
              placeholder="Brief description of this policy..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setShowUploadModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? <LoadingSpinner size="sm" /> : 'Upload Policy'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Policies;
