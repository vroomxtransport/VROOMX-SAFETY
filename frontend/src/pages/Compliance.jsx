import { useState, useEffect } from 'react';
import { dashboardAPI } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { FiEdit2, FiCheck, FiAlertTriangle, FiAlertCircle, FiInfo, FiBarChart2, FiTarget } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import TabNav from '../components/TabNav';
import CSAEstimatorContent from '../components/CSAEstimatorContent';

const Compliance = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [auditReadiness, setAuditReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [basicsForm, setBasicsForm] = useState({
    unsafeDriving: '',
    hoursOfService: '',
    vehicleMaintenance: '',
    controlledSubstances: '',
    driverFitness: '',
    crashIndicator: ''
  });

  const tabs = [
    { key: 'overview', label: 'SMS BASICs Overview', icon: FiBarChart2 },
    { key: 'estimator', label: 'CSA Estimator', icon: FiTarget, badge: 'BETA' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashboardRes, auditRes] = await Promise.all([
        dashboardAPI.get(),
        dashboardAPI.getAuditReadiness()
      ]);
      setDashboard(dashboardRes.data.dashboard);
      setAuditReadiness(auditRes.data.auditReadiness);

      // Pre-fill form with current values
      if (dashboardRes.data.dashboard?.smsBasics) {
        const basics = dashboardRes.data.dashboard.smsBasics;
        setBasicsForm({
          unsafeDriving: basics.unsafeDriving?.percentile || '',
          hoursOfService: basics.hoursOfService?.percentile || '',
          vehicleMaintenance: basics.vehicleMaintenance?.percentile || '',
          controlledSubstances: basics.controlledSubstances?.percentile || '',
          driverFitness: basics.driverFitness?.percentile || '',
          crashIndicator: basics.crashIndicator?.percentile || ''
        });
      }
    } catch (error) {
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBasics = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await dashboardAPI.updateBasics({
        unsafeDriving: basicsForm.unsafeDriving ? parseInt(basicsForm.unsafeDriving) : null,
        hoursOfService: basicsForm.hoursOfService ? parseInt(basicsForm.hoursOfService) : null,
        vehicleMaintenance: basicsForm.vehicleMaintenance ? parseInt(basicsForm.vehicleMaintenance) : null,
        controlledSubstances: basicsForm.controlledSubstances ? parseInt(basicsForm.controlledSubstances) : null,
        driverFitness: basicsForm.driverFitness ? parseInt(basicsForm.driverFitness) : null,
        crashIndicator: basicsForm.crashIndicator ? parseInt(basicsForm.crashIndicator) : null
      });
      toast.success('BASICs updated successfully');
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update BASICs');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const basicsData = dashboard?.smsBasics ? Object.entries(dashboard.smsBasics).map(([key, value]) => ({
    name: value.name,
    percentile: value.percentile || 0,
    threshold: value.threshold,
    status: value.status,
    key
  })) : [];

  const getBarColor = (status) => {
    switch (status) {
      case 'critical': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'compliant': return '#28a745';
      default: return '#6c757d';
    }
  };

  const driverPieData = [
    { name: 'Compliant', value: dashboard?.drivers?.compliant || 0, color: '#28a745' },
    { name: 'Warning', value: dashboard?.drivers?.warning || 0, color: '#ffc107' },
    { name: 'Non-Compliant', value: dashboard?.drivers?.nonCompliant || 0, color: '#dc3545' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Compliance Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-300">SMS BASICs and compliance overview</p>
        </div>
        {activeTab === 'overview' && (
          <button
            onClick={() => setShowEditModal(true)}
            className="btn btn-outline flex items-center"
          >
            <FiEdit2 className="w-4 h-4 mr-2" />
            Update BASICs
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'overview' ? (
        <>
      {/* BASICs Overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">SMS BASICs Overview</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Based on FMCSA Safety Measurement System methodology</p>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={basicsData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value}% (Threshold: ${props.payload.threshold}%)`,
                      'Percentile'
                    ]}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Bar dataKey="percentile" radius={[0, 4, 4, 0]}>
                    {basicsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* BASIC Cards */}
            <div className="grid grid-cols-2 gap-3">
              {basicsData.map((basic) => (
                <div
                  key={basic.key}
                  className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                    basic.status === 'critical' ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10 hover:border-red-400 dark:hover:border-red-500/70' :
                    basic.status === 'warning' ? 'border-yellow-300 dark:border-yellow-500/50 bg-yellow-50 dark:bg-yellow-500/10 hover:border-yellow-400 dark:hover:border-yellow-500/70' :
                    basic.status === 'compliant' ? 'border-green-300 dark:border-green-500/50 bg-green-50 dark:bg-green-500/10 hover:border-green-400 dark:hover:border-green-500/70' :
                    'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{basic.name}</p>
                  <div className="flex items-end justify-between mt-2">
                    <span className={`text-2xl font-bold ${
                      basic.status === 'critical' ? 'text-red-600 dark:text-red-400' :
                      basic.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                      basic.status === 'compliant' ? 'text-green-600 dark:text-green-400' :
                      'text-zinc-500 dark:text-zinc-400'
                    }`}>
                      {basic.percentile || '--'}%
                    </span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-300">
                      Threshold: {basic.threshold}%
                    </span>
                  </div>
                  {basic.status === 'critical' && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">Over Critical Threshold</p>
                  )}
                  {basic.status === 'warning' && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">Over Intervention Threshold</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Driver & Vehicle Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Driver Compliance */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">Driver Qualification Status</h3>
          </div>
          <div className="card-body">
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={driverPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {driverPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-sm text-zinc-600 dark:text-zinc-300 mt-2">
              Total: {dashboard?.drivers?.active || 0} active drivers
            </div>
          </div>
        </div>

        {/* Audit Readiness */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">Audit Readiness</h3>
            {auditReadiness?.overallReadiness ? (
              <span className="badge badge-success">Ready</span>
            ) : (
              <span className="badge badge-warning">Needs Attention</span>
            )}
          </div>
          <div className="card-body space-y-4">
            {/* DQF Files */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:pl-4 border-l-2 border-transparent hover:border-accent-500 transition-all duration-200">
              <div className="flex items-center space-x-3">
                {auditReadiness?.dqFiles?.compliant ? (
                  <FiCheck className="w-6 h-6 text-green-500 dark:text-green-400" />
                ) : (
                  <FiAlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
                )}
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-100">Driver Qualification Files</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {auditReadiness?.dqFiles?.driversWithIssues || 0} of {auditReadiness?.dqFiles?.totalDrivers || 0} with issues
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle Records */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:pl-4 border-l-2 border-transparent hover:border-accent-500 transition-all duration-200">
              <div className="flex items-center space-x-3">
                {auditReadiness?.vehicleRecords?.compliant ? (
                  <FiCheck className="w-6 h-6 text-green-500 dark:text-green-400" />
                ) : (
                  <FiAlertCircle className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                )}
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-100">Vehicle Records</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {auditReadiness?.vehicleRecords?.vehiclesWithIssues || 0} of {auditReadiness?.vehicleRecords?.totalVehicles || 0} need attention
                  </p>
                </div>
              </div>
            </div>

            {/* Drug & Alcohol */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:pl-4 border-l-2 border-transparent hover:border-accent-500 transition-all duration-200">
              <div className="flex items-center space-x-3">
                {auditReadiness?.drugAlcohol?.compliant ? (
                  <FiCheck className="w-6 h-6 text-green-500 dark:text-green-400" />
                ) : (
                  <FiAlertTriangle className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                )}
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-100">Drug & Alcohol Program</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {auditReadiness?.drugAlcohol?.randomTestsCompleted || 0} of {auditReadiness?.drugAlcohol?.randomTestsRequired || 0} random tests completed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Threshold Reference */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">BASIC Threshold Reference</h3>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>BASIC Category</th>
                  <th>Intervention Threshold</th>
                  <th>Regulations</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">Unsafe Driving</td>
                  <td>65%</td>
                  <td>49 CFR 392</td>
                  <td className="text-sm text-zinc-600 dark:text-zinc-300">Operation of CMVs in dangerous manner</td>
                </tr>
                <tr>
                  <td className="font-medium">HOS Compliance</td>
                  <td>65%</td>
                  <td>49 CFR 395</td>
                  <td className="text-sm text-zinc-600 dark:text-zinc-300">Hours of service violations</td>
                </tr>
                <tr>
                  <td className="font-medium">Vehicle Maintenance</td>
                  <td>80%</td>
                  <td>49 CFR 393, 396</td>
                  <td className="text-sm text-zinc-600 dark:text-zinc-300">Failure to maintain CMVs properly</td>
                </tr>
                <tr>
                  <td className="font-medium">Controlled Substances</td>
                  <td>80%</td>
                  <td>49 CFR 382</td>
                  <td className="text-sm text-zinc-600 dark:text-zinc-300">Impairment due to drugs/alcohol</td>
                </tr>
                <tr>
                  <td className="font-medium">Driver Fitness</td>
                  <td>80%</td>
                  <td>49 CFR 391</td>
                  <td className="text-sm text-zinc-600 dark:text-zinc-300">Unfit drivers operating CMVs</td>
                </tr>
                <tr>
                  <td className="font-medium">Crash Indicator</td>
                  <td>65%</td>
                  <td>-</td>
                  <td className="text-sm text-zinc-600 dark:text-zinc-300">History of crash involvement</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
        </>
      ) : (
        <CSAEstimatorContent />
      )}

      {/* Edit BASICs Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Update SMS BASICs"
      >
        <form onSubmit={handleUpdateBasics} className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">
            Enter your current BASIC percentiles from the FMCSA SMS system.
            Leave blank if no data available.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries({
              unsafeDriving: 'Unsafe Driving',
              hoursOfService: 'HOS Compliance',
              vehicleMaintenance: 'Vehicle Maintenance',
              controlledSubstances: 'Controlled Substances',
              driverFitness: 'Driver Fitness',
              crashIndicator: 'Crash Indicator'
            }).map(([key, label]) => (
              <div key={key}>
                <label className="form-label">{label} (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  placeholder="0-100"
                  value={basicsForm[key]}
                  onChange={(e) => setBasicsForm({ ...basicsForm, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={updating}>
              {updating ? <LoadingSpinner size="sm" /> : 'Update'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Compliance;
