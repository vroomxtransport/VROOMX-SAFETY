import { useState, useEffect } from 'react';
import { fmcsaInspectionsAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  FiSearch, FiFilter, FiRefreshCw, FiDownload, FiChevronDown, FiChevronUp,
  FiAlertTriangle, FiCheckCircle, FiXCircle, FiMapPin, FiCalendar, FiHash
} from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';

const InspectionsTabContent = ({ onRefresh }) => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const [filters, setFilters] = useState({
    basic: '',
    oosOnly: false,
    startDate: '',
    endDate: '',
    level: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  const basicCategories = [
    { value: 'unsafe_driving', label: 'Unsafe Driving' },
    { value: 'hours_of_service', label: 'Hours of Service' },
    { value: 'vehicle_maintenance', label: 'Vehicle Maintenance' },
    { value: 'controlled_substances', label: 'Controlled Substances' },
    { value: 'driver_fitness', label: 'Driver Fitness' },
    { value: 'crash_indicator', label: 'Crash Indicator' },
    { value: 'hazmat', label: 'Hazmat' }
  ];

  const inspectionLevels = [
    { value: 1, label: 'Level I - Full Inspection' },
    { value: 2, label: 'Level II - Walk-Around' },
    { value: 3, label: 'Level III - Driver Only' },
    { value: 4, label: 'Level IV - Special' },
    { value: 5, label: 'Level V - Vehicle Only' },
    { value: 6, label: 'Level VI - Radioactive' }
  ];

  useEffect(() => {
    fetchInspections();
    fetchStats();
  }, [pagination.page, filters]);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === false) {
          delete params[key];
        }
      });

      const response = await fmcsaInspectionsAPI.getAll(params);
      setInspections(response.data.inspections || []);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }));
    } catch (error) {
      toast.error('Failed to load inspections');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fmcsaInspectionsAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fmcsaInspectionsAPI.sync();
      if (response.data.success) {
        toast.success(response.data.message);
        fetchInspections();
        fetchStats();
        onRefresh?.();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const toggleRowExpand = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      basic: '',
      oosOnly: false,
      startDate: '',
      endDate: '',
      level: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const exportToCSV = () => {
    if (inspections.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Report Number', 'Date', 'State', 'Level', 'Total Violations', 'Vehicle OOS', 'Driver OOS'];
    const rows = inspections.map(insp => [
      insp.reportNumber,
      new Date(insp.inspectionDate).toLocaleDateString(),
      insp.state,
      insp.inspectionLevel,
      insp.totalViolations || 0,
      insp.vehicleOOS ? 'Yes' : 'No',
      insp.driverOOS ? 'Yes' : 'No'
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspections-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Export complete');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBasicLabel = (basic) => {
    const found = basicCategories.find(b => b.value === basic);
    return found ? found.label : basic?.replace(/_/g, ' ') || 'Unknown';
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-end space-x-2">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn btn-secondary flex items-center"
        >
          {syncing ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <FiRefreshCw className="w-4 h-4 mr-2" />
          )}
          Sync from FMCSA
        </button>
        <button
          onClick={exportToCSV}
          className="btn btn-secondary flex items-center"
        >
          <FiDownload className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{stats.totalInspections}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Total Inspections</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{stats.totalViolations}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Total Violations</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-red-600">{stats.vehicleOOSCount}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Vehicle OOS</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-orange-600">{stats.driverOOSCount}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Driver OOS</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-header flex items-center justify-between cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
          <div className="flex items-center">
            <FiFilter className="w-4 h-4 mr-2" />
            <span className="font-medium">Filters</span>
          </div>
          {showFilters ? <FiChevronUp /> : <FiChevronDown />}
        </div>
        {showFilters && (
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="form-label">BASIC Category</label>
                <select
                  className="form-input"
                  value={filters.basic}
                  onChange={(e) => handleFilterChange('basic', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {basicCategories.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Inspection Level</label>
                <select
                  className="form-input"
                  value={filters.level}
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                >
                  <option value="">All Levels</option>
                  {inspectionLevels.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.oosOnly}
                    onChange={(e) => handleFilterChange('oosOnly', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-200">OOS Only</span>
                </label>
              </div>
            </div>
            <div className="mt-4">
              <button onClick={clearFilters} className="btn btn-secondary btn-sm">
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspections Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : inspections.length === 0 ? (
            <div className="text-center p-8">
              <FiSearch className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
              <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-200 mb-2">No Inspections Found</h3>
              <p className="text-zinc-500 dark:text-zinc-400">
                No inspection records match your filters. Try adjusting your filters or sync new data.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Report #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Level</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Violations</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">OOS Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {inspections.map((insp) => (
                    <>
                      <tr key={insp._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm">{insp.reportNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <FiCalendar className="w-4 h-4 mr-1 text-zinc-400" />
                            {formatDate(insp.inspectionDate)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <FiMapPin className="w-4 h-4 mr-1 text-zinc-400" />
                            {insp.state || '-'}
                            {insp.location && <span className="text-zinc-500 ml-1">({insp.location})</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                            Level {insp.inspectionLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${(insp.totalViolations || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {insp.totalViolations || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {(insp.vehicleOOS || insp.driverOOS || insp.hazmatOOS) ? (
                              <>
                                {insp.vehicleOOS && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
                                    Vehicle
                                  </span>
                                )}
                                {insp.driverOOS && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded">
                                    Driver
                                  </span>
                                )}
                                {insp.hazmatOOS && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                                    Hazmat
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="flex items-center text-green-600">
                                <FiCheckCircle className="w-4 h-4 mr-1" />
                                Clear
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {insp.violations?.length > 0 && (
                            <button
                              onClick={() => toggleRowExpand(insp._id)}
                              className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            >
                              {expandedRows[insp._id] ? <FiChevronUp /> : <FiChevronDown />}
                            </button>
                          )}
                        </td>
                      </tr>
                      {/* Expanded row with violation details */}
                      {expandedRows[insp._id] && insp.violations?.length > 0 && (
                        <tr key={`${insp._id}-expanded`}>
                          <td colSpan={7} className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/30">
                            <div className="pl-4">
                              <h4 className="font-medium text-sm mb-2 text-zinc-700 dark:text-zinc-200">Violations</h4>
                              <div className="space-y-2">
                                {insp.violations.map((v, idx) => (
                                  <div key={idx} className="flex items-start space-x-4 p-2 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                                    <div className="flex-shrink-0">
                                      {v.oos ? (
                                        <FiXCircle className="w-5 h-5 text-red-500" />
                                      ) : (
                                        <FiAlertTriangle className="w-5 h-5 text-yellow-500" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-mono text-sm font-medium text-zinc-800 dark:text-zinc-100">{v.code}</span>
                                        {v.oos && (
                                          <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
                                            OOS
                                          </span>
                                        )}
                                        <span className="px-1.5 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded">
                                          {getBasicLabel(v.basic)}
                                        </span>
                                        {v.severityWeight && (
                                          <span className="text-xs text-zinc-500">
                                            Severity: {v.severityWeight}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">{v.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="card-footer flex items-center justify-between">
            <div className="text-sm text-zinc-600 dark:text-zinc-300">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} inspections
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionsTabContent;
