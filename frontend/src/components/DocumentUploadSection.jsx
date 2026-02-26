import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  FiUpload, FiFile, FiImage, FiTrash2, FiDownload, FiX, FiPaperclip
} from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';
import { viewFile } from '../utils/api';

const ACCEPT_DEFAULT = '.pdf,.jpg,.jpeg,.png,.doc,.docx';

const getFileIcon = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return FiImage;
  return FiFile;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getDocName = (doc) =>
  doc.name || doc.originalName || doc.filename || doc.fileName || 'Document';

const getDocUrl = (doc) =>
  doc.documentUrl || doc.url || doc.path || doc.fileUrl || null;

const getDocDate = (doc) => {
  const d = doc.uploadDate || doc.uploadedAt || doc.createdAt;
  if (!d) return null;
  return new Date(d).toLocaleDateString();
};

const DocumentUploadSection = ({
  documents = [],
  onUpload,
  onDelete,
  onRefresh,
  accept = ACCEPT_DEFAULT,
  maxFiles = 5,
  fieldName = 'documents',
  documentTypes,
  title = 'Documents',
  emptyMessage = 'No documents uploaded yet.'
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [docType, setDocType] = useState(documentTypes?.[0]?.value || documentTypes?.[0] || '');
  const [showUploadArea, setShowUploadArea] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      if (selectedFiles.length === 1 && fieldName === 'document') {
        formData.append('document', selectedFiles[0]);
      } else {
        selectedFiles.forEach(f => formData.append(fieldName, f));
      }
      if (docType) {
        formData.append('documentType', docType);
        formData.append('name', selectedFiles[0]?.name || 'Document');
      }
      await onUpload(formData);
      toast.success(`${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} uploaded`);
      setSelectedFiles([]);
      setShowUploadArea(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc, idx) => {
    if (!onDelete) return;
    if (!confirm('Remove this document?')) return;
    try {
      await onDelete(doc._id || idx);
      toast.success('Document removed');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Failed to remove document');
    }
  };

  const typeOptions = documentTypes?.map(t =>
    typeof t === 'string' ? { value: t, label: t.replace(/_/g, ' ') } : t
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiPaperclip className="w-4 h-4 text-zinc-500" />
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h4>
          {documents.length > 0 && (
            <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded-full font-medium">
              {documents.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowUploadArea(!showUploadArea)}
          className="text-xs px-3 py-1.5 rounded-lg font-medium text-white bg-accent-500 hover:bg-accent-600 transition-colors flex items-center gap-1"
        >
          <FiUpload className="w-3 h-3" />
          Upload
        </button>
      </div>

      {/* Upload Area */}
      {showUploadArea && (
        <div className="p-4 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            onChange={handleFileSelect}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer text-center py-4 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded-lg transition-colors"
          >
            <FiUpload className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Click to select files
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              PDF, JPG, PNG, DOC up to 10MB
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              {selectedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 dark:border-zinc-700">
                  <FiFile className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span className="truncate flex-1">{f.name}</span>
                  <span className="text-xs text-zinc-400 flex-shrink-0">{formatFileSize(f.size)}</span>
                  <button type="button" onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}>
                    <FiX className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500" />
                  </button>
                </div>
              ))}

              {typeOptions && typeOptions.length > 0 && (
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="form-select text-sm w-full"
                >
                  {typeOptions.map(t => (
                    <option key={t.value} value={t.value} className="capitalize">{t.label}</option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="w-full btn btn-primary text-sm py-2 flex items-center justify-center gap-2"
              >
                {uploading ? <LoadingSpinner size="sm" /> : <FiUpload className="w-4 h-4" />}
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Document List */}
      {documents.length === 0 && !showUploadArea ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 py-2">{emptyMessage}</p>
      ) : (
        <div className="space-y-1.5">
          {documents.map((doc, idx) => {
            const Icon = getFileIcon(getDocName(doc));
            const url = getDocUrl(doc);
            const date = getDocDate(doc);
            const typeBadge = doc.type || doc.documentType;

            return (
              <div
                key={doc._id || idx}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700 group"
              >
                <Icon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                    {getDocName(doc)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {typeBadge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 uppercase font-medium">
                        {typeBadge.replace(/_/g, ' ')}
                      </span>
                    )}
                    {date && <span className="text-[10px] text-zinc-400">{date}</span>}
                    {doc.fileSize && <span className="text-[10px] text-zinc-400">{formatFileSize(doc.fileSize)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {url && (
                    <button
                      onClick={() => viewFile(url)}
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-accent-600"
                      title="Download"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(doc, idx)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-500/20 text-zinc-500 hover:text-red-500"
                      title="Remove"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentUploadSection;
