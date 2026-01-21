import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../utils/api';
import { formatDate } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  FiUsers, FiTruck, FiAlertTriangle, FiDroplet, FiArrowRight,
  FiCheckCircle, FiAlertCircle, FiClock, FiFileText, FiShield,
  FiTrendingUp, FiActivity, FiClipboard
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await dashboardAPI.get();
      setData(response.data.dashboard);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LoadingSpinner size="lg" variant="truck" />
        <p className="mt-4 text-sm text-primary-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-16 h-16 rounded-full bg-danger-100 flex items-center justify-center mb-4">
          <FiAlertCircle className="w-8 h-8 text-danger-500" />
        </div>
        <p className="text-danger-600 font-medium mb-2">{error}</p>
        <button onClick={fetchDashboard} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  // Prepare BASICs chart data
  const basicsChartData = data?.smsBasics ? Object.entries(data.smsBasics).map(([key, value]) => ({
    name: value.name?.replace(' Compliance', '').replace(' Indicator', ''),
    percentile: value.percentile || 0,
    threshold: value.threshold,
    status: value.status
  })) : [];

  const getBarColor = (status) => {
    switch (status) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'compliant': return '#22c55e';
      default: return '#94a3b8';
    }
  };

  // Summary card configuration
  const summaryCards = [
    {
      title: 'Expiring Documents',
      value: data?.summary?.driversWithExpiringDocs || 0,
      subtitle: 'Drivers need attention',
      icon: FiUsers,
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-600',
      valueColor: data?.summary?.driversWithExpiringDocs > 0 ? 'text-warning-600' : 'text-success-600',
      alert: data?.summary?.driversWithExpiringDocs > 0,
      link: '/app/drivers'
    },
    {
      title: 'Inspections Due',
      value: data?.summary?.vehiclesDueForInspection || 0,
      subtitle: 'Vehicles scheduled',
      icon: FiTruck,
      iconBg: 'bg-accent-100',
      iconColor: 'text-accent-600',
      valueColor: data?.summary?.vehiclesDueForInspection > 0 ? 'text-accent-600' : 'text-success-600',
      link: '/app/vehicles'
    },
    {
      title: 'DataQ Disputes',
      value: data?.summary?.openDataQDisputes || 0,
      subtitle: 'Open cases',
      icon: FiClipboard,
      iconBg: 'bg-info-100',
      iconColor: 'text-info-600',
      valueColor: 'text-info-600',
      link: '/app/violations'
    },
    {
      title: 'Drug Tests',
      value: `${data?.summary?.randomDrugTests?.completed || 0}/${data?.summary?.randomDrugTests?.total || 0}`,
      subtitle: 'Completed this quarter',
      icon: FiDroplet,
      iconBg: 'bg-success-100',
      iconColor: 'text-success-600',
      valueColor: 'text-success-600',
      link: '/app/drug-alcohol'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Welcome back! Here's your compliance overview.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/app/reports" className="btn btn-secondary">
            <FiFileText className="w-4 h-4" />
            Generate Report
          </Link>
          <Link to="/app/compliance" className="btn btn-primary">
            <FiShield className="w-4 h-4" />
            View SMS Data
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-5 transition-all duration-200 hover:shadow-card hover:border-zinc-300/60 dark:hover:border-zinc-700"
          >
            {/* Accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(to bottom, #f97316, #ea580c)' }}
            />

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">{card.title}</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${card.valueColor}`}>
                    {card.value}
                  </span>
                  {card.alert && (
                    <FiAlertTriangle className="w-4 h-4 text-warning-500 animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{card.subtitle}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>

            {/* Hover arrow */}
            <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <FiArrowRight className="w-4 h-4 text-zinc-400" />
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BASICs Compliance Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900 dark:to-zinc-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
                <FiTrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white">SMS BASICs Overview</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Safety Measurement System percentiles</p>
              </div>
            </div>
            <Link to="/app/compliance" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1">
              Details <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={basicsChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Percentile']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="percentile" radius={[0, 4, 4, 0]}>
                  {basicsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Status Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success-500"></div>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning-500"></div>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Warning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-danger-500"></div>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Critical</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900 dark:to-zinc-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-danger-100 dark:bg-danger-500/20 flex items-center justify-center">
                <FiActivity className="w-5 h-5 text-danger-600 dark:text-danger-400" />
              </div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Recent Alerts</h2>
            </div>
            <Link to="/app/violations" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              View all
            </Link>
          </div>
          <div className="flex-1 overflow-hidden">
            {data?.alerts?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-success-100 dark:bg-success-500/20 flex items-center justify-center mb-3">
                  <FiCheckCircle className="w-7 h-7 text-success-500" />
                </div>
                <p className="font-medium text-zinc-700 dark:text-zinc-200">All Clear</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">No alerts at this time</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {data?.alerts?.slice(0, 5).map((alert, index) => (
                  <li
                    key={index}
                    className="px-5 py-3.5 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        alert.type === 'critical' ? 'bg-danger-100 dark:bg-danger-500/20' :
                        alert.type === 'warning' ? 'bg-warning-100 dark:bg-warning-500/20' :
                        'bg-info-100 dark:bg-info-500/20'
                      }`}>
                        {alert.type === 'critical' ? (
                          <FiAlertCircle className="w-4 h-4 text-danger-600 dark:text-danger-400" />
                        ) : alert.type === 'warning' ? (
                          <FiClock className="w-4 h-4 text-warning-600 dark:text-warning-400" />
                        ) : (
                          <FiFileText className="w-4 h-4 text-info-600 dark:text-info-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-snug">{alert.message}</p>
                        {alert.daysRemaining !== undefined && (
                          <p className={`text-xs mt-1 font-medium ${
                            alert.daysRemaining < 0 ? 'text-danger-500' :
                            alert.daysRemaining <= 7 ? 'text-warning-600 dark:text-warning-400' :
                            'text-zinc-500 dark:text-zinc-400'
                          }`}>
                            {alert.daysRemaining < 0 ? `${Math.abs(alert.daysRemaining)} days overdue` :
                             alert.daysRemaining === 0 ? 'Due today' :
                             `In ${alert.daysRemaining} days`}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violation Tracker */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900 dark:to-zinc-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-warning-100 dark:bg-warning-500/20 flex items-center justify-center">
                <FiAlertTriangle className="w-5 h-5 text-warning-600 dark:text-warning-400" />
              </div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Recent Violations</h2>
            </div>
            <Link to="/app/violations" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1">
              View all <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-0">
            {data?.recentViolations?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-success-100 dark:bg-success-500/20 flex items-center justify-center mb-3">
                  <FiCheckCircle className="w-7 h-7 text-success-500" />
                </div>
                <p className="font-medium text-zinc-700 dark:text-zinc-200">No Recent Violations</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Your fleet is running clean</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Violation</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {data?.recentViolations?.map((violation, index) => (
                      <tr
                        key={violation.id}
                        className={`group hover:bg-primary-50/50 dark:hover:bg-primary-500/10 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50/30 dark:bg-zinc-800/30'}`}
                      >
                        <td className="px-4 py-3 text-sm font-mono text-zinc-600 dark:text-zinc-400">{formatDate(violation.date)}</td>
                        <td className="px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200 max-w-[180px] truncate">{violation.type}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={violation.status} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/app/violations`}
                            className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium"
                          >
                            View <FiArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Driver Qualification Status */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900 dark:to-zinc-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Driver Qualification Files</h2>
            </div>
            <Link to="/app/drivers" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1">
              Manage <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-5">
            {/* Status Grid */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center p-4 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-200/50 dark:border-success-500/30">
                <p className="text-2xl font-bold text-success-600 font-mono">{data?.drivers?.compliant || 0}</p>
                <p className="text-xs font-medium text-success-700 dark:text-success-400 mt-1">Compliant</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-warning-50 dark:bg-warning-500/10 border border-warning-200/50 dark:border-warning-500/30">
                <p className="text-2xl font-bold text-warning-600 font-mono">{data?.drivers?.warning || 0}</p>
                <p className="text-xs font-medium text-warning-700 dark:text-warning-400 mt-1">Warning</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-danger-50 dark:bg-danger-500/10 border border-danger-200/50 dark:border-danger-500/30">
                <p className="text-2xl font-bold text-danger-600 font-mono">{data?.drivers?.nonCompliant || 0}</p>
                <p className="text-xs font-medium text-danger-700 dark:text-danger-400 mt-1">Non-Compliant</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                {data?.drivers?.active > 0 && (
                  <>
                    <div
                      className="h-full bg-success-500 transition-all"
                      style={{ width: `${((data?.drivers?.compliant || 0) / data?.drivers?.active) * 100}%` }}
                    />
                    <div
                      className="h-full bg-warning-500 transition-all"
                      style={{ width: `${((data?.drivers?.warning || 0) / data?.drivers?.active) * 100}%` }}
                    />
                    <div
                      className="h-full bg-danger-500 transition-all"
                      style={{ width: `${((data?.drivers?.nonCompliant || 0) / data?.drivers?.active) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </div>

            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">{data?.drivers?.active || 0}</span> Active Drivers
            </p>
          </div>
        </div>
      </div>

      {/* Audit Readiness Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900 dark:to-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
              <FiShield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Audit Readiness</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Quick compliance status check</p>
            </div>
          </div>
          <Link to="/app/reports" className="btn btn-accent">
            <FiClipboard className="w-4 h-4" />
            Run Mock Audit
          </Link>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* DQF Files */}
            <div className={`flex items-center gap-4 p-4 rounded-xl border ${
              data?.drivers?.nonCompliant === 0
                ? 'bg-success-50/50 dark:bg-success-500/10 border-success-200/50 dark:border-success-500/30'
                : 'bg-danger-50/50 dark:bg-danger-500/10 border-danger-200/50 dark:border-danger-500/30'
            }`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                data?.drivers?.nonCompliant === 0 ? 'bg-success-100 dark:bg-success-500/20' : 'bg-danger-100 dark:bg-danger-500/20'
              }`}>
                {data?.drivers?.nonCompliant === 0 ? (
                  <FiCheckCircle className="w-6 h-6 text-success-600" />
                ) : (
                  <FiAlertCircle className="w-6 h-6 text-danger-600" />
                )}
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">DQF Files</p>
                <p className={`text-sm ${data?.drivers?.nonCompliant === 0 ? 'text-success-700 dark:text-success-400' : 'text-danger-700 dark:text-danger-400'}`}>
                  {data?.drivers?.nonCompliant === 0 ? 'All compliant' : `${data?.drivers?.nonCompliant} need attention`}
                </p>
              </div>
            </div>

            {/* Vehicle Records */}
            <div className={`flex items-center gap-4 p-4 rounded-xl border ${
              data?.vehicles?.outOfService === 0
                ? 'bg-success-50/50 dark:bg-success-500/10 border-success-200/50 dark:border-success-500/30'
                : 'bg-warning-50/50 dark:bg-warning-500/10 border-warning-200/50 dark:border-warning-500/30'
            }`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                data?.vehicles?.outOfService === 0 ? 'bg-success-100 dark:bg-success-500/20' : 'bg-warning-100 dark:bg-warning-500/20'
              }`}>
                {data?.vehicles?.outOfService === 0 ? (
                  <FiCheckCircle className="w-6 h-6 text-success-600" />
                ) : (
                  <FiAlertCircle className="w-6 h-6 text-warning-600" />
                )}
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">Vehicle Records</p>
                <p className={`text-sm ${data?.vehicles?.outOfService === 0 ? 'text-success-700 dark:text-success-400' : 'text-warning-700 dark:text-warning-400'}`}>
                  {data?.vehicles?.outOfService === 0 ? 'Up to date' : `${data?.vehicles?.outOfService} out of service`}
                </p>
              </div>
            </div>

            {/* Drug & Alcohol */}
            <div className="flex items-center gap-4 p-4 rounded-xl border bg-success-50/50 dark:bg-success-500/10 border-success-200/50 dark:border-success-500/30">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-success-100 dark:bg-success-500/20">
                <FiCheckCircle className="w-6 h-6 text-success-600" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">Drug & Alcohol</p>
                <p className="text-sm text-success-700 dark:text-success-400">Program compliant</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
