import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, csaAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  FiUsers, FiTruck, FiAlertTriangle, FiClock,
  FiCheckCircle, FiAlertCircle, FiFileText, FiShield,
  FiMessageCircle, FiArrowRight, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiMinus
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshingFMCSA, setRefreshingFMCSA] = useState(false);
  const [fmcsaMessage, setFmcsaMessage] = useState(null);
  const [trendData, setTrendData] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [dashboardRes, trendRes] = await Promise.all([
        dashboardAPI.get(),
        csaAPI.getTrendSummary(30).catch(() => null)
      ]);
      setData(dashboardRes.data.dashboard);
      if (trendRes?.data) {
        setTrendData(trendRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Handle FMCSA data refresh
  const handleRefreshFMCSA = async () => {
    setRefreshingFMCSA(true);
    setFmcsaMessage(null);
    try {
      const response = await dashboardAPI.refreshFMCSA();
      if (response.data.success) {
        // Reload dashboard to show updated data
        await fetchDashboard();
        setFmcsaMessage({ type: 'success', text: 'FMCSA data updated successfully!' });
        // Auto-hide message after 5 seconds
        setTimeout(() => setFmcsaMessage(null), 5000);
      }
    } catch (err) {
      setFmcsaMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to refresh FMCSA data. Please try again.'
      });
      // Auto-hide error after 8 seconds
      setTimeout(() => setFmcsaMessage(null), 8000);
    } finally {
      setRefreshingFMCSA(false);
    }
  };

  // Calculate compliance score
  const calculateComplianceScore = () => {
    if (!data) return 0;

    const driverScore = data?.drivers?.active > 0
      ? ((data.drivers.compliant || 0) / data.drivers.active) * 100
      : 100;

    const vehicleScore = data?.vehicles?.active > 0
      ? ((data.vehicles.active - (data.vehicles.outOfService || 0)) / data.vehicles.active) * 100
      : 100;

    const violationPenalty = (data?.recentViolations?.length || 0) * 2;

    return Math.max(0, Math.min(100, Math.round(
      (driverScore * 0.4 + vehicleScore * 0.3 + 100 * 0.3) - violationPenalty
    )));
  };

  const complianceScore = calculateComplianceScore();

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e'; // green
    if (score >= 60) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  // Get score status label
  const getScoreStatus = (score) => {
    if (score >= 80) return { label: 'Good Standing', bgClass: 'bg-green-100 dark:bg-green-500/20', textClass: 'text-green-700 dark:text-green-400', borderClass: 'border-green-200 dark:border-green-500/30' };
    if (score >= 60) return { label: 'Needs Attention', bgClass: 'bg-yellow-100 dark:bg-yellow-500/20', textClass: 'text-yellow-700 dark:text-yellow-400', borderClass: 'border-yellow-200 dark:border-yellow-500/30' };
    return { label: 'At Risk', bgClass: 'bg-red-100 dark:bg-red-500/20', textClass: 'text-red-700 dark:text-red-400', borderClass: 'border-red-200 dark:border-red-500/30' };
  };

  // Calculate gauge stroke dasharray
  const maxArc = 212; // 75% of full circle circumference
  const scoreArc = (complianceScore / 100) * maxArc;

  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Calculate score factors
  const getScoreFactors = () => {
    const dqfScore = data?.drivers?.active > 0
      ? Math.round(((data.drivers.compliant || 0) / data.drivers.active) * 100)
      : 100;

    const vehicleScore = data?.vehicles?.active > 0
      ? Math.round(((data.vehicles.active - (data.vehicles.outOfService || 0)) / data.vehicles.active) * 100)
      : 100;

    const violationScore = 100 - Math.min(100, (data?.recentViolations?.length || 0) * 10);

    return [
      { label: 'DQF Files', value: dqfScore },
      { label: 'Vehicles', value: vehicleScore },
      { label: 'Violations', value: violationScore },
      { label: 'D&A Testing', value: 100 }
    ];
  };

  // Prepare BASICs data for grid
  const getBasicsData = () => {
    if (!data?.smsBasics) return [];
    return Object.entries(data.smsBasics).map(([key, value]) => ({
      name: value.name?.replace(' Compliance', '').replace(' Indicator', '') || key,
      percentile: value.percentile || 0,
      status: value.status || 'compliant',
      key
    }));
  };

  // Get trend indicator for a BASIC category
  const getTrendIndicator = (basicKey) => {
    if (!trendData?.basicTrends) return null;
    // Map the key format from camelCase to match trendData format
    const keyMap = {
      unsafeDriving: 'unsafeDriving',
      hoursOfService: 'hoursOfService',
      vehicleMaintenance: 'vehicleMaintenance',
      controlledSubstances: 'controlledSubstances',
      driverFitness: 'driverFitness',
      crashIndicator: 'crashIndicator'
    };
    const trend = trendData.basicTrends[keyMap[basicKey]];
    if (!trend) return null;
    return {
      direction: trend.trend,
      change: trend.change || 0
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LoadingSpinner size="lg" variant="truck" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
          <FiAlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-red-600 dark:text-red-400 font-medium mb-2">{error}</p>
        <button onClick={fetchDashboard} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const scoreStatus = getScoreStatus(complianceScore);
  const scoreFactors = getScoreFactors();
  const basicsData = getBasicsData();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Hello, {user?.firstName || 'there'}</h2>
          <p className="text-zinc-600 dark:text-zinc-300 mt-1">Here's your compliance overview for today</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-300">{currentDate}</span>
          <Link
            to="/app/reports"
            className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-accent-500/30"
          >
            <FiFileText className="w-4 h-4" />
            Generate Report
          </Link>
        </div>
      </div>

      {/* Main Grid - Score Section */}
      <div className="grid grid-cols-12 gap-6">
        {/* Compliance Score Card (Main Feature) */}
        <div className="col-span-12 lg:col-span-5 bg-white dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Compliance Score</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">Overall fleet health</p>
              </div>
              <Link to="/app/compliance" className="text-sm text-accent-500 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                View Details
              </Link>
            </div>

            {/* Score Gauge */}
            <div className="flex flex-col items-center py-4">
              <div className="relative w-56 h-56">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    className="stroke-zinc-200 dark:stroke-zinc-800"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="212 71"
                  />
                  {/* Gradient arc (faint) */}
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="212 71"
                    opacity="0.2"
                  />
                  {/* Score indicator */}
                  <circle
                    className="gauge-circle"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={getScoreColor(complianceScore)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${scoreArc} ${283 - scoreArc}`}
                    strokeDashoffset="0"
                  />
                </svg>
                {/* Score number in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-xs font-semibold mb-1 ${complianceScore >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {complianceScore >= 50 ? '+' : ''}{complianceScore - 80} pts
                  </span>
                  <span className="text-6xl font-bold text-zinc-900 dark:text-white">{complianceScore}</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">out of 100</span>
                </div>
              </div>

              {/* Score status label */}
              <div className={`mt-4 px-4 py-2 rounded-full text-sm font-semibold border ${scoreStatus.bgClass} ${scoreStatus.textClass} ${scoreStatus.borderClass}`}>
                {scoreStatus.label}
              </div>
            </div>

            {/* Score factors */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-zinc-100 dark:border-white/5">
              {scoreFactors.map((factor, index) => (
                <div key={index} className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-600 dark:text-zinc-300">{factor.label}</span>
                    <span className={`text-xs font-semibold ${factor.value >= 80 ? 'text-green-600 dark:text-green-400' : factor.value >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                      {factor.value}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${factor.value >= 80 ? 'bg-green-500' : factor.value >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${factor.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Stats */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Drivers */}
            <Link to="/app/drivers" className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">All active</span>
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{data?.drivers?.active || 0}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Active Drivers</p>
            </Link>

            {/* Vehicles */}
            <Link to="/app/vehicles" className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-500/30 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FiTruck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs text-zinc-600 dark:text-zinc-300">All active</span>
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{data?.vehicles?.active || 0}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Fleet Vehicles</p>
            </Link>

            {/* Expiring Docs */}
            <Link to="/app/documents" className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-yellow-300 dark:hover:border-yellow-500/30 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FiClock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                {(data?.summary?.driversWithExpiringDocs || 0) > 0 && (
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">Action needed</span>
                )}
              </div>
              <p className={`text-3xl font-bold ${(data?.summary?.driversWithExpiringDocs || 0) > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-zinc-900 dark:text-white'}`}>
                {data?.summary?.driversWithExpiringDocs || 0}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Expiring Soon</p>
            </Link>

            {/* Violations */}
            <Link to="/app/violations" className="group bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-red-300 dark:hover:border-red-500/30 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">-2 this year</span>
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{data?.recentViolations?.length || 0}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Open Violations</p>
            </Link>
          </div>

          {/* SMS BASICs Overview */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-500/10 flex items-center justify-center">
                  <FiShield className="w-5 h-5 text-accent-600 dark:text-accent-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">SMS BASICs</h3>
                    {/* Overall Trend Badge */}
                    {trendData?.overallTrend && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        trendData.overallTrend === 'improving'
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                          : trendData.overallTrend === 'worsening'
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                          : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                      }`}>
                        {trendData.overallTrend === 'improving' ? (
                          <><FiTrendingDown className="w-3 h-3" /> Improving</>
                        ) : trendData.overallTrend === 'worsening' ? (
                          <><FiTrendingUp className="w-3 h-3" /> Worsening</>
                        ) : (
                          <><FiMinus className="w-3 h-3" /> Stable</>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">Safety Measurement System • 30-day trend</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefreshFMCSA}
                  disabled={refreshingFMCSA}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    refreshingFMCSA
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                      : 'bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400 hover:bg-accent-100 dark:hover:bg-accent-500/20'
                  }`}
                  title="Refresh FMCSA data from SAFER"
                >
                  <FiRefreshCw className={`w-4 h-4 ${refreshingFMCSA ? 'animate-spin' : ''}`} />
                  {refreshingFMCSA ? 'Refreshing...' : 'Refresh'}
                </button>
                <Link to="/app/compliance" className="text-sm text-accent-500 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                  Full Report
                </Link>
              </div>
            </div>
            {/* FMCSA Refresh Message */}
            {fmcsaMessage && (
              <div className={`mx-5 mt-4 px-4 py-3 rounded-xl text-sm ${
                fmcsaMessage.type === 'success'
                  ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20'
                  : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'
              }`}>
                {fmcsaMessage.text}
              </div>
            )}
            <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-4">
              {basicsData.length > 0 ? basicsData.map((basic, index) => {
                const trend = getTrendIndicator(basic.key);
                return (
                <div key={index} className="group flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 hover:shadow-md hover:-translate-y-0.5 hover:border-zinc-200 dark:hover:border-white/10 transition-all duration-200 cursor-pointer">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 ${
                    basic.status === 'critical' ? 'bg-red-100 dark:bg-red-500/20' :
                    basic.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-500/20' :
                    'bg-green-100 dark:bg-green-500/20'
                  }`}>
                    <span className={`text-lg font-bold ${
                      basic.status === 'critical' ? 'text-red-600 dark:text-red-400' :
                      basic.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {basic.percentile}%
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{basic.name}</p>
                      {/* Trend Indicator */}
                      {trend && (
                        <div className={`flex items-center gap-0.5 text-xs font-medium ${
                          trend.direction === 'improving' ? 'text-green-600 dark:text-green-400' :
                          trend.direction === 'worsening' ? 'text-red-600 dark:text-red-400' :
                          'text-zinc-500 dark:text-zinc-400'
                        }`}>
                          {trend.direction === 'improving' ? (
                            <FiTrendingDown className="w-3 h-3" />
                          ) : trend.direction === 'worsening' ? (
                            <FiTrendingUp className="w-3 h-3" />
                          ) : (
                            <FiMinus className="w-3 h-3" />
                          )}
                          {trend.change !== 0 && (
                            <span>{Math.abs(trend.change)}%</span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className={`text-xs ${
                      basic.status === 'critical' ? 'text-red-600 dark:text-red-400' :
                      basic.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {basic.status === 'critical' ? 'Above threshold' :
                       basic.status === 'warning' ? 'Warning zone' :
                       'Below threshold'}
                    </p>
                  </div>
                </div>
              )}) : (
                // Default placeholders if no data
                <>
                  {['Unsafe Driving', 'HOS Compliance', 'Vehicle Maint.', 'Controlled Sub.', 'Driver Fitness', 'Crash Indicator'].map((name, index) => (
                    <div key={index} className="group flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 hover:shadow-md hover:-translate-y-0.5 hover:border-zinc-200 dark:hover:border-white/10 transition-all duration-200 cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">0%</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{name}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">Below threshold</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-12 gap-6">
        {/* Recent Alerts */}
        <div className="col-span-12 lg:col-span-5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">Recent Alerts</h3>
            </div>
            <span className="px-2.5 py-1 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full">
              {data?.alerts?.length || 0} Active
            </span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-white/5">
            {data?.alerts?.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <FiCheckCircle className="w-7 h-7 text-green-500" />
                </div>
                <p className="font-medium text-zinc-700 dark:text-zinc-200">All Clear</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">No alerts at this time</p>
              </div>
            ) : (
              data?.alerts?.slice(0, 3).map((alert, index) => (
                <div key={index} className="group p-4 hover:bg-zinc-50 dark:hover:bg-white/5 hover:pl-5 border-l-2 border-transparent hover:border-accent-500 transition-all duration-200 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200 ${
                      alert.type === 'critical' ? 'bg-red-100 dark:bg-red-500/20' : 'bg-yellow-100 dark:bg-yellow-500/20'
                    }`}>
                      {alert.type === 'critical' ? (
                        <FiAlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      ) : (
                        <FiClock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">{alert.message}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
                        {alert.category || 'Compliance'} {alert.type === 'critical' ? '- Critical' : '- Warning'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {(data?.alerts?.length || 0) > 0 && (
            <div className="p-4 border-t border-zinc-100 dark:border-white/5">
              <Link
                to="/app/alerts"
                className="w-full py-2.5 text-sm font-medium text-accent-500 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                View All Alerts
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Driver & Vehicle Status */}
        <div className="col-span-12 lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Driver Status */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                  <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Driver Status</h3>
              </div>
              <Link to="/app/drivers" className="text-sm text-accent-500 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                Manage
              </Link>
            </div>
            <div className="p-5">
              {/* Status Grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 hover:shadow-md hover:-translate-y-0.5 hover:border-green-300 dark:hover:border-green-500/40 transition-all duration-200 cursor-pointer">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data?.drivers?.compliant || 0}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">Compliant</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 hover:shadow-md hover:-translate-y-0.5 hover:border-yellow-300 dark:hover:border-yellow-500/40 transition-all duration-200 cursor-pointer">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{data?.drivers?.warning || 0}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">Warning</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:shadow-md hover:-translate-y-0.5 hover:border-red-300 dark:hover:border-red-500/40 transition-all duration-200 cursor-pointer">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{data?.drivers?.nonCompliant || 0}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">Non-Compliant</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                {data?.drivers?.active > 0 && (
                  <>
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${((data?.drivers?.compliant || 0) / data?.drivers?.active) * 100}%` }}
                    />
                    <div
                      className="h-full bg-yellow-500"
                      style={{ width: `${((data?.drivers?.warning || 0) / data?.drivers?.active) * 100}%` }}
                    />
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${((data?.drivers?.nonCompliant || 0) / data?.drivers?.active) * 100}%` }}
                    />
                  </>
                )}
              </div>
              <p className="text-center text-xs text-zinc-600 dark:text-zinc-300 mt-3">
                {data?.drivers?.active || 0} Total Active Drivers
              </p>
            </div>
          </div>

          {/* Audit Readiness */}
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
                  <FiShield className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Audit Ready</h3>
              </div>
              <Link to="/app/reports" className="text-sm text-accent-500 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                Run Audit
              </Link>
            </div>
            <div className="p-5 space-y-3">
              {/* DQF Files */}
              <div className={`group flex items-center gap-3 p-3 rounded-xl border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
                (data?.drivers?.nonCompliant || 0) === 0
                  ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 hover:border-green-300 dark:hover:border-green-500/40'
                  : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 ${
                  (data?.drivers?.nonCompliant || 0) === 0
                    ? 'bg-green-100 dark:bg-green-500/20'
                    : 'bg-red-100 dark:bg-red-500/20'
                }`}>
                  {(data?.drivers?.nonCompliant || 0) === 0 ? (
                    <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <FiAlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">DQF Files</p>
                  <p className={`text-xs ${
                    (data?.drivers?.nonCompliant || 0) === 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {(data?.drivers?.nonCompliant || 0) === 0 ? 'All compliant' : `${data?.drivers?.nonCompliant} need attention`}
                  </p>
                </div>
              </div>
              {/* Vehicle Records */}
              <div className={`group flex items-center gap-3 p-3 rounded-xl border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
                (data?.vehicles?.outOfService || 0) === 0
                  ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 hover:border-green-300 dark:hover:border-green-500/40'
                  : 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20 hover:border-yellow-300 dark:hover:border-yellow-500/40'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 ${
                  (data?.vehicles?.outOfService || 0) === 0
                    ? 'bg-green-100 dark:bg-green-500/20'
                    : 'bg-yellow-100 dark:bg-yellow-500/20'
                }`}>
                  {(data?.vehicles?.outOfService || 0) === 0 ? (
                    <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <FiAlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">Vehicle Records</p>
                  <p className={`text-xs ${
                    (data?.vehicles?.outOfService || 0) === 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {(data?.vehicles?.outOfService || 0) === 0 ? 'Up to date' : `${data?.vehicles?.outOfService} out of service`}
                  </p>
                </div>
              </div>
              {/* Drug & Alcohol */}
              <div className="group flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 hover:shadow-md hover:-translate-y-0.5 hover:border-green-300 dark:hover:border-green-500/40 transition-all duration-200 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">Drug & Alcohol</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Program compliant</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Chat Button */}
      <Link
        to="/app/ai-assistant"
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 rounded-full shadow-lg shadow-accent-500/30 flex items-center justify-center transition-all hover:scale-105 z-40"
      >
        <FiMessageCircle className="w-6 h-6 text-white" />
      </Link>
    </div>
  );
};

export default Dashboard;
