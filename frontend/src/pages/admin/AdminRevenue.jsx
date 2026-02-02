import { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiAlertCircle, FiUsers } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminRevenue = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      const response = await adminAPI.getRevenue();
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const COLORS = ['#ef4444', '#f97316', '#eab308'];

  const pieData = data?.planBreakdown ? [
    { name: 'Solo', value: data.planBreakdown.solo?.count || 0, revenue: data.planBreakdown.solo?.revenue || 0 },
    { name: 'Fleet', value: data.planBreakdown.fleet?.count || 0, revenue: data.planBreakdown.fleet?.revenue || 0 },
    { name: 'Pro', value: data.planBreakdown.pro?.count || 0, revenue: data.planBreakdown.pro?.revenue || 0 }
  ].filter(p => p.value > 0) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Revenue Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current MRR */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Monthly Recurring Revenue</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">${data?.mrr?.current || 0}</p>
              <p className={`text-sm ${data?.mrr?.current >= data?.mrr?.previous ? 'text-green-600' : 'text-red-600'}`}>
                {data?.mrr?.growth} from last month
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Churn Rate */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Churn Rate (30d)</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{data?.churn?.rate || 0}%</p>
              <p className="text-sm text-zinc-500">{data?.churn?.count || 0} cancelled</p>
            </div>
            <div className={`w-12 h-12 ${data?.churn?.rate > 5 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'} rounded-lg flex items-center justify-center`}>
              <FiTrendingDown className={`w-6 h-6 ${data?.churn?.rate > 5 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </div>
        </div>

        {/* Failed Payments */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Failed Payments</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{data?.failedPayments?.count || 0}</p>
              <p className="text-sm text-zinc-500">need attention</p>
            </div>
            <div className={`w-12 h-12 ${data?.failedPayments?.count > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-zinc-100 dark:bg-zinc-700'} rounded-lg flex items-center justify-center`}>
              <FiAlertCircle className={`w-6 h-6 ${data?.failedPayments?.count > 0 ? 'text-red-600' : 'text-zinc-400'}`} />
            </div>
          </div>
        </div>

        {/* Plan Changes */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Plan Changes (30d)</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                <span className="text-green-600">+{data?.upgrades || 0}</span>
                <span className="text-zinc-400 mx-1">/</span>
                <span className="text-red-600">-{data?.downgrades || 0}</span>
              </p>
              <p className="text-sm text-zinc-500">upgrades / downgrades</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MRR Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">MRR Trend (12 Months)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.mrr?.trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                  formatter={(value) => [`$${value}`, 'MRR']}
                />
                <Area type="monotone" dataKey="mrr" stroke="#10B981" fill="#10B98133" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Breakdown */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Revenue by Plan</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="revenue"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  formatter={(value, name, props) => [`$${value} (${props.payload.value} users)`, props.payload.name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {pieData.map((plan, index) => (
              <div key={plan.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index] }}></div>
                  <span className="text-zinc-600 dark:text-zinc-300">{plan.name}</span>
                </div>
                <span className="text-zinc-900 dark:text-white font-medium">${plan.revenue} ({plan.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Failed Payments Table */}
      {data?.failedPayments?.users?.length > 0 && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            <FiAlertCircle className="inline w-5 h-5 text-red-500 mr-2" />
            Users with Failed Payments
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Plan</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.failedPayments.users.map(user => (
                  <tr key={user._id} className="border-b border-zinc-100 dark:border-zinc-700">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-zinc-500">{user.email}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-300 capitalize">{user.plan}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {user.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRevenue;
