import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FiLink, FiCheck, FiX, FiRefreshCw, FiSettings, FiTruck,
  FiUsers, FiClock, FiAlertCircle, FiChevronRight, FiExternalLink,
  FiZap, FiShield, FiDatabase, FiAlertTriangle
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import SamsaraMatchingModal from '../components/SamsaraMatchingModal';
import api from '../utils/api';

const Integrations = () => {
  const [samsaraStatus, setSamsaraStatus] = useState({
    connected: false,
    lastSync: null,
    syncInProgress: false,
    error: null,
    stats: {
      drivers: 0,
      vehicles: 0,
      hosLogs: 0,
      pendingDrivers: 0,
      pendingVehicles: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [syncSettings, setSyncSettings] = useState({
    syncDrivers: true,
    syncVehicles: true,
    syncHOS: true,
    autoSync: false,
    syncInterval: 'daily'
  });

  useEffect(() => {
    fetchIntegrationStatus();
  }, []);

  const fetchIntegrationStatus = async () => {
    setLoading(true);
    try {
      const response = await api.get('/integrations/samsara/status');
      setSamsaraStatus(response.data);
    } catch (error) {
      // Integration not configured yet - this is fine
      setSamsaraStatus({
        connected: false,
        lastSync: null,
        syncInProgress: false,
        error: null,
        stats: { drivers: 0, vehicles: 0, hosLogs: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error('Please enter your Samsara API key');
      return;
    }
    setConnecting(true);
    try {
      await api.post('/integrations/samsara/connect', { apiKey });
      toast.success('Successfully connected to Samsara!');
      setShowConnectModal(false);
      setApiKey('');
      fetchIntegrationStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to connect to Samsara');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Samsara? This will stop all data syncing.')) return;
    try {
      await api.post('/integrations/samsara/disconnect');
      toast.success('Samsara disconnected');
      fetchIntegrationStatus();
    } catch (error) {
      toast.error('Failed to disconnect Samsara');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post('/integrations/samsara/sync');
      toast.success('Sync started! This may take a few minutes.');
      // Poll for status
      setTimeout(fetchIntegrationStatus, 5000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start sync');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/integrations/samsara/settings', syncSettings);
      toast.success('Settings saved');
      setShowSettingsModal(false);
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const formatLastSync = (date) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LoadingSpinner size="lg" variant="truck" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Loading integrations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Integrations</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Connect your fleet management tools to sync data automatically</p>
      </div>

      {/* Samsara Integration Card */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="/images/integrations/samsara.svg"
                alt="Samsara"
                className="w-14 h-14 rounded-xl"
              />
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Samsara</h2>
                <p className="text-zinc-600 dark:text-zinc-400">Fleet management & ELD integration</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {samsaraStatus.connected ? (
                <>
                  <span className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    Connected
                  </span>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Settings"
                  >
                    <FiSettings className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <span className="flex items-center text-zinc-500 text-sm">
                  <span className="w-2 h-2 bg-zinc-400 rounded-full mr-2"></span>
                  Not Connected
                </span>
              )}
            </div>
          </div>
        </div>

        {samsaraStatus.connected ? (
          <>
            {/* Sync Status */}
            <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-6">
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Last Sync</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white flex items-center">
                      <FiClock className="w-4 h-4 mr-1.5 text-zinc-400" />
                      {formatLastSync(samsaraStatus.lastSync)}
                    </p>
                  </div>
                  {samsaraStatus.error && (
                    <div className="flex items-center text-red-600 dark:text-red-400">
                      <FiAlertCircle className="w-4 h-4 mr-1.5" />
                      <span className="text-sm">{samsaraStatus.error}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSync}
                  disabled={syncing || samsaraStatus.syncInProgress}
                  className="btn btn-primary flex items-center"
                >
                  <FiRefreshCw className={`w-4 h-4 mr-2 ${(syncing || samsaraStatus.syncInProgress) ? 'animate-spin' : ''}`} />
                  {syncing || samsaraStatus.syncInProgress ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>

            {/* Sync Stats */}
            <div className="p-6">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-4">Synced Data</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                    <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">{samsaraStatus.stats?.drivers || 0}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Drivers</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center">
                    <FiTruck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">{samsaraStatus.stats?.vehicles || 0}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Vehicles</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                    <FiClock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">{samsaraStatus.stats?.hosLogs || 0}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">HOS Logs</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Matches Banner */}
            {((samsaraStatus.stats?.pendingDrivers || 0) + (samsaraStatus.stats?.pendingVehicles || 0)) > 0 && (
              <div className="mx-6 mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FiAlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">
                        {(samsaraStatus.stats?.pendingDrivers || 0) + (samsaraStatus.stats?.pendingVehicles || 0)} records need matching
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {samsaraStatus.stats?.pendingDrivers || 0} drivers, {samsaraStatus.stats?.pendingVehicles || 0} vehicles
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMatchingModal(true)}
                    className="btn btn-primary btn-sm"
                  >
                    Review Matches
                  </button>
                </div>
              </div>
            )}

            {/* Disconnect */}
            <div className="px-6 pb-6">
              <button
                onClick={handleDisconnect}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                Disconnect Samsara
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Features List */}
            <div className="p-6">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-4">What you'll get</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiUsers className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white text-sm">Driver Sync</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Auto-import driver profiles</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiTruck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white text-sm">Vehicle Sync</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Keep vehicle data up-to-date</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiClock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white text-sm">HOS Data</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Import hours of service logs</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiZap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white text-sm">Real-time Updates</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Automatic data synchronization</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connect Button */}
            <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setShowConnectModal(true)}
                className="btn btn-primary w-full sm:w-auto flex items-center justify-center"
              >
                <FiLink className="w-4 h-4 mr-2" />
                Connect Samsara
              </button>
            </div>
          </>
        )}
      </div>

      {/* More Integrations Coming Soon */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">More Integrations Coming Soon</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Geotab', desc: 'Telematics & fleet tracking', logo: '/images/integrations/geotab.svg' },
            { name: 'Motive', desc: 'Fleet management platform', logo: '/images/integrations/motive.svg' },
          ].map((integration) => (
            <div key={integration.name} className="flex items-center space-x-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl opacity-60">
              <img
                src={integration.logo}
                alt={integration.name}
                className="w-10 h-10 rounded-lg"
              />
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">{integration.name}</p>
                <p className="text-xs text-zinc-500">{integration.desc}</p>
              </div>
              <span className="ml-auto text-xs text-zinc-400 bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded">Soon</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connect Modal */}
      <Modal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        title="Connect Samsara"
      >
        <form onSubmit={handleConnect} className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="flex items-start space-x-3">
              <FiShield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-zinc-900 dark:text-white text-sm">Secure Connection</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Your API key is encrypted and stored securely. We only request read access to sync your fleet data.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Samsara API Key *</label>
            <input
              type="password"
              className="form-input font-mono"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="samsara_api_xxxxxxxxxxxxxxxx"
              required
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Find your API key in Samsara Dashboard → Settings → API Tokens
            </p>
          </div>

          <a
            href="https://cloud.samsara.com/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-cta hover:text-cta-600 flex items-center"
          >
            Get your API key from Samsara
            <FiExternalLink className="w-3 h-3 ml-1" />
          </a>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setShowConnectModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={connecting}>
              {connecting ? <LoadingSpinner size="sm" /> : 'Connect'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Samsara Sync Settings"
      >
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-white">Data to Sync</h4>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={syncSettings.syncDrivers}
                onChange={(e) => setSyncSettings({ ...syncSettings, syncDrivers: e.target.checked })}
                className="form-checkbox"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Sync Drivers</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={syncSettings.syncVehicles}
                onChange={(e) => setSyncSettings({ ...syncSettings, syncVehicles: e.target.checked })}
                className="form-checkbox"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Sync Vehicles</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={syncSettings.syncHOS}
                onChange={(e) => setSyncSettings({ ...syncSettings, syncHOS: e.target.checked })}
                className="form-checkbox"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Sync HOS Logs</span>
            </label>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-zinc-900 dark:text-white">Auto-sync</span>
              <input
                type="checkbox"
                checked={syncSettings.autoSync}
                onChange={(e) => setSyncSettings({ ...syncSettings, autoSync: e.target.checked })}
                className="form-checkbox"
              />
            </label>
            {syncSettings.autoSync && (
              <div className="mt-3">
                <label className="form-label">Sync Frequency</label>
                <select
                  className="form-select"
                  value={syncSettings.syncInterval}
                  onChange={(e) => setSyncSettings({ ...syncSettings, syncInterval: e.target.value })}
                >
                  <option value="hourly">Every hour</option>
                  <option value="daily">Once daily</option>
                  <option value="weekly">Once weekly</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setShowSettingsModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Settings
            </button>
          </div>
        </form>
      </Modal>

      {/* Samsara Matching Modal */}
      <SamsaraMatchingModal
        isOpen={showMatchingModal}
        onClose={() => setShowMatchingModal(false)}
        onComplete={fetchIntegrationStatus}
      />
    </div>
  );
};

export default Integrations;
