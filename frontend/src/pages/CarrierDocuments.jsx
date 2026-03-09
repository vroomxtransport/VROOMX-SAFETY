import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  FiArchive, FiPlus, FiEdit2, FiTrash2, FiCalendar,
  FiCheckCircle, FiAlertTriangle, FiAlertOctagon, FiHelpCircle,
  FiX, FiFileText, FiSave
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import { carrierDocumentsAPI } from '../utils/api';

const DOC_TYPES = [
  { value: 'ucr', label: 'UCR Registration', description: 'Unified Carrier Registration' },
  { value: 'boc3', label: 'BOC-3', description: 'Designation of Process Agent' },
  { value: 'biennial_update', label: 'Biennial Update', description: 'MCS-150 Biennial Update' },
  { value: 'mcs90', label: 'MCS-90', description: 'Endorsement for Motor Carrier Policies' },
  { value: 'w9', label: 'W-9', description: 'IRS Tax Form' },
  { value: 'cert_of_authority', label: 'Certificate of Authority', description: 'Operating Authority' },
  { value: 'notice_of_assignment', label: 'Notice of Assignment', description: 'NOA Filing' },
  { value: 'insurance_cert', label: 'Insurance Certificate', description: 'Certificate of Insurance / COI' },
  { value: 'ifta', label: 'IFTA License', description: 'International Fuel Tax Agreement' },
  { value: 'irp', label: 'IRP Registration', description: 'International Registration Plan' },
  { value: 'other', label: 'Other', description: 'Other carrier document' }
];

const STATUS_CONFIG = {
  valid: { label: 'Valid', icon: FiCheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', ring: 'ring-green-500/20' },
  due_soon: { label: 'Due Soon', icon: FiAlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', ring: 'ring-yellow-500/20' },
  expired: { label: 'Expired', icon: FiAlertOctagon, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', ring: 'ring-red-500/20' },
  missing: { label: 'Missing', icon: FiHelpCircle, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', ring: 'ring-gray-500/20' }
};

const CarrierDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    docType: 'ucr',
    name: '',
    expirationDate: '',
    fileUrl: '',
    notes: ''
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await carrierDocumentsAPI.getAll();
      setDocuments(response.data.documents || []);
    } catch (error) {
      toast.error('Failed to load carrier documents');
    } finally {
      setLoading(false);
    }
  };

  // Merge saved documents with the full list of doc types to show all types
  const mergedDocuments = useMemo(() => {
    const docMap = {};
    documents.forEach(doc => {
      // If multiple docs of same type, keep all (keyed by _id)
      if (!docMap[doc.docType]) docMap[doc.docType] = [];
      docMap[doc.docType].push(doc);
    });

    const result = [];
    DOC_TYPES.forEach(type => {
      if (docMap[type.value]) {
        docMap[type.value].forEach(doc => result.push({ ...doc, typeInfo: type }));
      } else {
        // Show placeholder for missing types
        result.push({
          _id: `placeholder-${type.value}`,
          docType: type.value,
          name: type.label,
          status: 'missing',
          isPlaceholder: true,
          typeInfo: type
        });
      }
    });
    return result;
  }, [documents]);

  const statusSummary = useMemo(() => {
    const summary = { valid: 0, due_soon: 0, expired: 0, missing: 0 };
    mergedDocuments.forEach(doc => {
      summary[doc.status] = (summary[doc.status] || 0) + 1;
    });
    return summary;
  }, [mergedDocuments]);

  const openAddModal = (docType = 'ucr') => {
    const typeInfo = DOC_TYPES.find(t => t.value === docType);
    setEditingDoc(null);
    setFormData({
      docType,
      name: typeInfo?.label || '',
      expirationDate: '',
      fileUrl: '',
      notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = (doc) => {
    setEditingDoc(doc);
    setFormData({
      docType: doc.docType,
      name: doc.name,
      expirationDate: doc.expirationDate ? new Date(doc.expirationDate).toISOString().split('T')[0] : '',
      fileUrl: doc.fileUrl || '',
      notes: doc.notes || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Document name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        expirationDate: formData.expirationDate || undefined,
        fileUrl: formData.fileUrl || undefined,
        notes: formData.notes || undefined
      };

      if (editingDoc) {
        await carrierDocumentsAPI.update(editingDoc._id, payload);
        toast.success('Document updated');
      } else {
        await carrierDocumentsAPI.create(payload);
        toast.success('Document added');
      }
      setShowModal(false);
      fetchDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await carrierDocumentsAPI.delete(id);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilExpiry = (dateStr) => {
    if (!dateStr) return null;
    const days = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FiArchive className="text-blue-400" />
            Carrier Documents
          </h1>
          <p className="text-sm text-gray-400 mt-1">Track carrier-level compliance filings</p>
        </div>
        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add Document
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div key={key} className={`${config.bg} border ${config.border} rounded-lg p-4`}>
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <span className="text-sm font-medium text-gray-300">{config.label}</span>
              </div>
              <p className={`text-2xl font-bold mt-1 ${config.color}`}>{statusSummary[key] || 0}</p>
            </div>
          );
        })}
      </div>

      {/* Document Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mergedDocuments.map((doc) => {
          const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.missing;
          const StatusIcon = statusCfg.icon;
          const daysUntil = getDaysUntilExpiry(doc.expirationDate);

          return (
            <div
              key={doc._id}
              className={`bg-gray-800 border ${statusCfg.border} rounded-xl p-5 hover:ring-2 ${statusCfg.ring} transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FiFileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {doc.typeInfo?.label || doc.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">{doc.typeInfo?.description}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${statusCfg.bg} ${statusCfg.color} flex-shrink-0`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusCfg.label}
                </span>
              </div>

              {/* Expiration info */}
              <div className="flex items-center gap-2 text-sm mb-3">
                <FiCalendar className="w-4 h-4 text-gray-500" />
                {doc.expirationDate ? (
                  <span className={daysUntil !== null && daysUntil < 0 ? 'text-red-400' : daysUntil !== null && daysUntil <= 30 ? 'text-yellow-400' : 'text-gray-300'}>
                    Expires {formatDate(doc.expirationDate)}
                    {daysUntil !== null && (
                      <span className="ml-1 text-xs">
                        ({daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : `${daysUntil}d remaining`})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-gray-500">No expiration set</span>
                )}
              </div>

              {/* Notes preview */}
              {doc.notes && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{doc.notes}</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                {doc.isPlaceholder ? (
                  <button
                    onClick={() => openAddModal(doc.docType)}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                    Add Document
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => openEditModal(doc)}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white font-medium transition-colors"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 font-medium transition-colors ml-auto"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg mx-4 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                {editingDoc ? 'Edit Carrier Document' : 'Add Carrier Document'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Document Type</label>
                <select
                  value={formData.docType}
                  onChange={(e) => {
                    const typeInfo = DOC_TYPES.find(t => t.value === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      docType: e.target.value,
                      name: prev.name === (DOC_TYPES.find(t => t.value === prev.docType)?.label || '') ? (typeInfo?.label || '') : prev.name
                    }));
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DOC_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Document Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., UCR Registration 2026"
                />
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* File URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">File URL (optional)</label>
                <input
                  type="url"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, fileUrl: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Add any notes about this document..."
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? <LoadingSpinner size="sm" /> : <FiSave className="w-4 h-4" />}
                  {editingDoc ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarrierDocuments;
