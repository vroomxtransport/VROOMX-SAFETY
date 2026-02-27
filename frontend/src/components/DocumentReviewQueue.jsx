import { useState, useEffect } from 'react';
import { documentsAPI } from '../utils/api';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiFileText, FiInbox, FiUser, FiTruck } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';

const DocumentReviewQueue = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const fetchPending = async () => {
    try {
      const res = await documentsAPI.getPendingReview();
      setDocs(res.data.documents || []);
    } catch {
      toast.error('Failed to load review queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleReview = async (docId, action) => {
    setReviewing(docId);
    try {
      await documentsAPI.review(docId, action, reviewNotes);
      toast.success(`Document ${action === 'approve' ? 'approved' : 'rejected'}`);
      setDocs(prev => prev.filter(d => d._id !== docId));
      setReviewNotes('');
    } catch {
      toast.error(`Failed to ${action} document`);
    } finally {
      setReviewing(null);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;

  if (docs.length === 0) {
    return (
      <div className="p-12 flex flex-col items-center text-center">
        <FiInbox className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-3" />
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">No documents pending review</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">AI-processed documents will appear here for approval</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <FiFileText className="w-4 h-4 text-accent-500" />
          Documents Pending Review
          <span className="text-xs bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">
            {docs.length}
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {docs.map(doc => (
          <div key={doc._id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900 dark:text-white text-sm truncate">{doc.name || doc.documentType}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 capitalize">{doc.category?.replace(/_/g, ' ')}</p>
                </div>
                {doc.aiConfidence != null && (
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full flex-shrink-0 ${
                    doc.aiConfidence >= 0.9 ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                    : doc.aiConfidence >= 0.7 ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                    : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                  }`}>
                    {Math.round(doc.aiConfidence * 100)}%
                  </span>
                )}
              </div>

              {/* Linked entity */}
              <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                {doc.driverId && (
                  <span className="flex items-center gap-1">
                    <FiUser className="w-3 h-3" />
                    {doc.driverId.firstName} {doc.driverId.lastName}
                  </span>
                )}
                {doc.vehicleId && (
                  <span className="flex items-center gap-1">
                    <FiTruck className="w-3 h-3" />
                    {doc.vehicleId.unitNumber}
                  </span>
                )}
                <span>{formatDate(doc.createdAt)}</span>
              </div>
            </div>

            {/* AI Extracted Data Preview */}
            {doc.extractedData && (
              <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 text-xs">
                <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-1">AI Extracted:</p>
                <div className="space-y-0.5 max-h-16 overflow-y-auto">
                  {Object.entries(doc.extractedData).slice(0, 4).map(([key, val]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <span className="text-zinc-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-3 flex items-center gap-2">
              <button
                onClick={() => handleReview(doc._id, 'approve')}
                disabled={reviewing === doc._id}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <FiCheck className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => handleReview(doc._id, 'reject')}
                disabled={reviewing === doc._id}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50 transition-colors border border-red-200 dark:border-red-500/20"
              >
                <FiX className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentReviewQueue;
