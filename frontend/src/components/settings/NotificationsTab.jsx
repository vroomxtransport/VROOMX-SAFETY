import { useState, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const PREFERENCE_OPTIONS = [
  {
    key: 'complianceAlerts',
    label: 'Compliance Alerts',
    description: 'Daily digest of critical compliance alerts and deadlines'
  },
  {
    key: 'billingNotifications',
    label: 'Billing Notifications',
    description: 'Payment success/failure and trial ending reminders'
  },
  {
    key: 'reportEmails',
    label: 'Report Emails',
    description: 'Receive generated reports directly to your email'
  },
  {
    key: 'productUpdates',
    label: 'Product Updates',
    description: 'New features, improvements, and announcements'
  }
];

const NotificationsTab = ({ user }) => {
  const [emailPreferences, setEmailPreferences] = useState({
    complianceAlerts: true,
    billingNotifications: true,
    reportEmails: true,
    productUpdates: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await authAPI.getMe();
        const prefs = response.data?.data?.emailPreferences || response.data?.emailPreferences;
        if (prefs) {
          setEmailPreferences((prev) => ({ ...prev, ...prefs }));
        }
      } catch (error) {
        // Fall back to defaults silently
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleToggle = async (key) => {
    const newValue = !emailPreferences[key];
    const previous = { ...emailPreferences };

    // Optimistic update
    setEmailPreferences((prev) => ({ ...prev, [key]: newValue }));
    setSaving(key);

    try {
      await authAPI.updateEmailPreferences({ [key]: newValue });
      toast.success('Email preference updated');
    } catch (error) {
      // Revert on failure
      setEmailPreferences(previous);
      toast.error(error.response?.data?.message || 'Failed to update preference');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <FiBell className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">Email Preferences</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Choose which emails you want to receive</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 max-w-lg">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-w-lg">
          {PREFERENCE_OPTIONS.map((option) => (
            <div
              key={option.key}
              className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900"
            >
              <div className="pr-4">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">{option.label}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">{option.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={emailPreferences[option.key]}
                disabled={saving === option.key}
                onClick={() => handleToggle(option.key)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
                  emailPreferences[option.key]
                    ? 'bg-accent-500'
                    : 'bg-zinc-300 dark:bg-zinc-600'
                } ${saving === option.key ? 'opacity-50 cursor-wait' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    emailPreferences[option.key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;
