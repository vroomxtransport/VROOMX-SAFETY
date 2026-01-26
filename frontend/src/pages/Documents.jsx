import { useState, useEffect } from 'react';
import { documentsAPI } from '../utils/api';
import { formatDate, formatFileSize, daysUntilExpiry } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiFolder, FiFile, FiDownload, FiTrash2, FiEye, FiUpload, FiAlertCircle } from 'react-icons/fi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [expiring, setExpiring] = useState({ expiring: [], expired: [] });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const categories = [
    { value: 'company', label: 'Company Documents' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'registration', label: 'Registration (IRP/IFTA)' },
    { value: 'permit', label: 'Permits' },
    { value: 'driver', label: 'Driver Documents' },
    { value: 'vehicle', label: 'Vehicle Documents' },
    { value: 'drug_alcohol', label: 'Drug & Alcohol' },
    { value: 'violation', label: 'Violations' },
    { value: 'accident', label: 'Accident Records' },
    { value: 'training', label: 'Training' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchDocuments();
    fetchStats();
    fetchExpiring();
  }, [page, categoryFilter, statusFilter]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search })
      };
      const response = await documentsAPI.getAll(params);
      setDocuments(response.data.documents);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await documentsAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchExpiring = async () => {
    try {
      const response = await documentsAPI.getExpiring(30);
      setExpiring(response.data);
    } catch (error) {
      console.error('Failed to fetch expiring docs');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setUploading(true);
    try {
      await documentsAPI.upload(formData);
      toast.success('Document uploaded successfully');
      setShowUploadModal(false);
      fetchDocuments();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentsAPI.delete(id);
      toast.success('Document deleted');
      fetchDocuments();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  const columns = [
    {
      header: 'Document',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FiFile className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">{row.name}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">{row.documentType}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      render: (row) => (
        <span className="capitalize text-sm">
          {categories.find(c => c.value === row.category)?.label || row.category}
        </span>
      )
    },
    {
      header: 'Expiry',
      render: (row) => {
        if (!row.expiryDate) return <span className="text-zinc-500 dark:text-zinc-400">N/A</span>;
        const days = daysUntilExpiry(row.expiryDate);
        return (
          <div>
            <p className="text-sm">{formatDate(row.expiryDate)}</p>
            {days !== null && days <= 30 && (
              <p className={`text-xs ${days < 0 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`}
              </p>
            )}
          </div>
        );
      }
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Size',
      render: (row) => <span className="text-sm text-zinc-600 dark:text-zinc-300">{formatFileSize(row.fileSize)}</span>
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          {row.fileUrl && (
            <a
              href={row.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-primary-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
              title="View"
            >
              <FiEye className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row._id);
            }}
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Document Library</h1>
          <p className="text-zinc-600 dark:text-zinc-300">Centralized document management with expiration tracking</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary flex items-center"
        >
          <FiUpload className="w-5 h-5 mr-2" />
          Upload Document
        </button>
      </div>

      {/* Alert for expiring documents */}
      {(expiring.expiring?.count > 0 || expiring.expired?.count > 0) && (
        <div className="alert alert-warning flex items-center">
          <FiAlertCircle className="w-5 h-5 mr-3" />
          <div>
            {expiring.expired?.count > 0 && (
              <span className="font-medium text-red-600 dark:text-red-400">{expiring.expired.count} document(s) expired. </span>
            )}
            {expiring.expiring?.count > 0 && (
              <span>{expiring.expiring.count} document(s) expiring in the next 30 days.</span>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="group card p-4 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all duration-300 cursor-pointer">
          <div className="flex items-center space-x-3">
            <FiFolder className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
            <div>
              <p className="text-2xl font-bold">{stats?.totals?.total || 0}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">Total</p>
            </div>
          </div>
        </div>
        <div className="group card p-4 hover:shadow-lg hover:-translate-y-1 hover:border-green-300 dark:hover:border-green-500/30 transition-all duration-300 cursor-pointer">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.totals?.valid || 0}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">Valid</p>
          </div>
        </div>
        <div className="group card p-4 hover:shadow-lg hover:-translate-y-1 hover:border-yellow-300 dark:hover:border-yellow-500/30 transition-all duration-300 cursor-pointer">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats?.totals?.dueSoon || 0}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">Due Soon</p>
          </div>
        </div>
        <div className="group card p-4 hover:shadow-lg hover:-translate-y-1 hover:border-red-300 dark:hover:border-red-500/30 transition-all duration-300 cursor-pointer">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats?.totals?.expired || 0}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">Expired</p>
          </div>
        </div>
        <div className="group card p-4 hover:shadow-lg hover:-translate-y-1 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-300 cursor-pointer">
          <div className="text-center">
            <p className="text-2xl font-bold text-zinc-500 dark:text-zinc-400">{stats?.totals?.missing || 0}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">Missing</p>
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
                placeholder="Search documents..."
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
          <select
            className="form-select w-full sm:w-40"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="valid">Valid</option>
            <option value="due_soon">Due Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={documents}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="No documents found"
        />
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="form-label">Select File *</label>
            <input
              type="file"
              name="file"
              required
              className="form-input"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            />
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">PDF, JPG, PNG, DOC, XLS (Max 10MB)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Category *</label>
              <select name="category" className="form-select" required>
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Document Type *</label>
              <input
                type="text"
                name="documentType"
                className="form-input"
                required
                placeholder="e.g., Liability Insurance"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Document Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="Optional - defaults to filename"
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-input"
              rows={2}
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="form-label">Expiry Date (if applicable)</label>
            <input
              type="date"
              name="expiryDate"
              className="form-input"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setShowUploadModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? <LoadingSpinner size="sm" /> : 'Upload'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Documents;
