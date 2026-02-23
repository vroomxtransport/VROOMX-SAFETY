import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiX, FiSend } from 'react-icons/fi';
import { bugReportsAPI } from '../../utils/api';

const BugReportModal = ({ isOpen, onClose, initialCategory = 'bug' }) => {
  const [reportForm, setReportForm] = useState({ subject: '', category: initialCategory, description: '' });
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const location = useLocation();

  // Sync category when modal opens with a different initialCategory
  useEffect(() => {
    if (isOpen) {
      setReportForm(prev => ({ ...prev, category: initialCategory }));
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportForm.subject.trim() || !reportForm.description.trim()) return;
    setReportSubmitting(true);
    try {
      await bugReportsAPI.submit({
        subject: reportForm.subject,
        description: reportForm.description,
        category: reportForm.category,
        page: location.pathname
      });
      onClose();
      setReportForm({ subject: '', category: 'bug', description: '' });
    } catch (error) {
      console.error('Failed to submit bug report:', error);
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {reportForm.category === 'feature_request' ? 'Suggest a Feature' : 'Report an Issue'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleReportSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Subject</label>
            <input
              type="text"
              value={reportForm.subject}
              onChange={(e) => setReportForm(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief summary of the issue"
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              required
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
            <select
              value={reportForm.category}
              onChange={(e) => setReportForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="bug">Bug</option>
              <option value="feature_request">Feature Request</option>
              <option value="ui_issue">UI Issue</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
            <textarea
              value={reportForm.description}
              onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder={reportForm.category === 'feature_request'
                ? 'Describe the feature or idea. What problem would it solve?'
                : 'Describe the issue in detail. What happened? What did you expect to happen?'}
              rows={4}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
              required
              maxLength={5000}
            />
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Page: {location.pathname}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reportSubmitting || !reportForm.subject.trim() || !reportForm.description.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {reportSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiSend className="w-4 h-4" />
              )}
              {reportSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BugReportModal;
