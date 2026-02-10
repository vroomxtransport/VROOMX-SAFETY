import { useState, useEffect, useCallback } from 'react';
import { announcementsAPI } from '../utils/api';
import { FiX, FiExternalLink } from 'react-icons/fi';

const TYPE_STYLES = {
  info: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300',
  warning: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300',
  critical: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300',
};

const DISMISS_STYLES = {
  info: 'text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-500/20',
  warning: 'text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-500/20',
  critical: 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-100 dark:hover:bg-red-500/20',
};

const LINK_STYLES = {
  info: 'bg-blue-600 hover:bg-blue-700 text-white',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  critical: 'bg-red-600 hover:bg-red-700 text-white',
};

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try {
      const stored = Object.keys(localStorage).filter(k => k.startsWith('dismissed-announcement-'));
      return stored.map(k => k.replace('dismissed-announcement-', ''));
    } catch {
      return [];
    }
  });

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await announcementsAPI.getActive();
      const raw = response.data?.announcements;
      setAnnouncements(Array.isArray(raw) ? raw : []);
    } catch {
      // Silently fail - announcements are non-critical
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();

    // Re-fetch every 5 minutes
    const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  const handleDismiss = (id) => {
    try {
      localStorage.setItem(`dismissed-announcement-${id}`, 'true');
    } catch {
      // localStorage might be full
    }
    setDismissed((prev) => [...prev, id]);
  };

  const visibleAnnouncements = (Array.isArray(announcements) ? announcements : []).filter(
    (a) => !dismissed.includes(a._id)
  );

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-0">
      {visibleAnnouncements.map((announcement) => {
        const type = announcement.type || 'info';
        return (
          <div
            key={announcement._id}
            className={`w-full border-b px-4 py-3 ${TYPE_STYLES[type] || TYPE_STYLES.info}`}
          >
            <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
              <p className="text-sm font-medium flex-1">
                {announcement.message}
              </p>

              <div className="flex items-center gap-2 flex-shrink-0">
                {announcement.linkUrl && announcement.linkText && (
                  <a
                    href={announcement.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      LINK_STYLES[type] || LINK_STYLES.info
                    }`}
                  >
                    {announcement.linkText}
                    <FiExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  onClick={() => handleDismiss(announcement._id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    DISMISS_STYLES[type] || DISMISS_STYLES.info
                  }`}
                  aria-label="Dismiss announcement"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnnouncementBanner;
