import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { driversAPI, vehiclesAPI } from '../../utils/api';
import { FiCalendar, FiClock, FiAlertTriangle, FiUser, FiTruck, FiChevronDown, FiChevronRight, FiCheckCircle } from 'react-icons/fi';

const URGENCY_BANDS = [
  { key: 'overdue', label: 'Overdue or Expiring This Week', maxDays: 7, color: 'red', icon: FiAlertTriangle },
  { key: 'month', label: 'Expiring This Month', maxDays: 30, color: 'orange', icon: FiClock },
  { key: 'twoMonths', label: 'Expiring in 1-2 Months', maxDays: 60, color: 'yellow', icon: FiCalendar },
  { key: 'threeMonths', label: 'Expiring in 2-3 Months', maxDays: 90, color: 'green', icon: FiCalendar },
];

const colorClasses = {
  red: {
    bg: 'bg-red-100 dark:bg-red-500/10',
    border: 'border-red-200 dark:border-red-500/20',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
    hoverBorder: 'hover:border-red-400 dark:hover:border-red-500/40',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-500/10',
    border: 'border-orange-200 dark:border-orange-500/20',
    text: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
    hoverBorder: 'hover:border-orange-400 dark:hover:border-orange-500/40',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-500/10',
    border: 'border-yellow-200 dark:border-yellow-500/20',
    text: 'text-yellow-600 dark:text-yellow-400',
    badge: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    dot: 'bg-yellow-500',
    hoverBorder: 'hover:border-yellow-400 dark:hover:border-yellow-500/40',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-500/10',
    border: 'border-green-200 dark:border-green-500/20',
    text: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
    dot: 'bg-green-500',
    hoverBorder: 'hover:border-green-400 dark:hover:border-green-500/40',
  },
};

const ExpirationTimeline = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    fetchExpirations();

    const handleCompanySwitch = () => fetchExpirations();
    window.addEventListener('companySwitch', handleCompanySwitch);
    return () => window.removeEventListener('companySwitch', handleCompanySwitch);
  }, []);

  const fetchExpirations = async () => {
    setLoading(true);
    try {
      const [driverRes, vehicleRes] = await Promise.all([
        driversAPI.getAlerts(90).catch(() => ({ data: { alerts: [] } })),
        vehiclesAPI.getAlerts(90).catch(() => ({ data: { alerts: [] } })),
      ]);

      const driverAlerts = (driverRes.data?.alerts || []).map(a => ({ ...a, entityType: 'driver' }));
      const vehicleAlerts = (vehicleRes.data?.alerts || []).map(a => ({ ...a, entityType: 'vehicle' }));

      const combined = [...driverAlerts, ...vehicleAlerts].sort(
        (a, b) => new Date(a.expiryDate || a.dueDate || a.date) - new Date(b.expiryDate || b.dueDate || b.date)
      );

      setItems(combined);
    } catch (err) {
      console.error('Failed to fetch expiration data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (item) => {
    const expDate = new Date(item.expiryDate || item.dueDate || item.date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);
    return Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
  };

  const groupByUrgency = () => {
    const groups = {};
    URGENCY_BANDS.forEach(band => { groups[band.key] = []; });

    items.forEach(item => {
      const days = getDaysRemaining(item);
      if (days < 7) {
        groups.overdue.push(item);
      } else if (days < 30) {
        groups.month.push(item);
      } else if (days < 60) {
        groups.twoMonths.push(item);
      } else {
        groups.threeMonths.push(item);
      }
    });

    return groups;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getEntityName = (item) => {
    if (item.driverName) return item.driverName;
    if (item.driver?.firstName) return `${item.driver.firstName} ${item.driver.lastName || ''}`.trim();
    if (item.vehicleName) return item.vehicleName;
    if (item.vehicle?.unitNumber) return item.vehicle.unitNumber;
    if (item.entityName) return item.entityName;
    if (item.name) return item.name;
    return item.entityType === 'driver' ? 'Driver' : 'Vehicle';
  };

  const getEntityId = (item) => {
    return item.driverId || item.driver?._id || item.vehicleId || item.vehicle?._id || item.entityId || item._id;
  };

  const getDocType = (item) => {
    return item.documentType || item.alertType || item.type || item.category || 'Document';
  };

  const toggleSection = (key) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const groups = groupByUrgency();
  const totalItems = items.length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-500/10 flex items-center justify-center">
            <FiCalendar className="w-5 h-5 text-accent-600 dark:text-accent-400" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">Expiration Timeline</h3>
        </div>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-pulse flex items-center gap-2 text-sm text-zinc-400">
            <FiClock className="w-4 h-4" />
            Loading expirations...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-500/10 flex items-center justify-center">
            <FiCalendar className="w-5 h-5 text-accent-600 dark:text-accent-400" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Expiration Timeline</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Next 90 days</p>
          </div>
        </div>
        {totalItems > 0 && (
          <span className="px-2.5 py-1 bg-accent-100 dark:bg-accent-500/20 text-accent-600 dark:text-accent-400 text-xs font-semibold rounded-full">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Empty State */}
      {totalItems === 0 ? (
        <div className="p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-3">
            <FiCheckCircle className="w-7 h-7 text-green-500" />
          </div>
          <p className="font-medium text-zinc-700 dark:text-zinc-200">All Clear</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">No expirations in the next 90 days</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-white/5">
          {URGENCY_BANDS.map(band => {
            const bandItems = groups[band.key];
            if (bandItems.length === 0) return null;

            const colors = colorClasses[band.color];
            const isCollapsed = collapsed[band.key];
            const BandIcon = band.icon;

            return (
              <div key={band.key}>
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(band.key)}
                  className="w-full px-5 py-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg}`}>
                    <BandIcon className={`w-4 h-4 ${colors.text}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-semibold ${colors.text}`}>{band.label}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${colors.badge}`}>
                    {bandItems.length}
                  </span>
                  {isCollapsed ? (
                    <FiChevronRight className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </button>

                {/* Section Items */}
                {!isCollapsed && (
                  <div className="divide-y divide-zinc-50 dark:divide-white/[0.03]">
                    {bandItems.map((item, idx) => {
                      const days = getDaysRemaining(item);
                      const entityId = getEntityId(item);
                      const linkTo = item.entityType === 'driver'
                        ? `/app/drivers/${entityId}`
                        : `/app/vehicles/${entityId}`;
                      const isOverdue = days < 0;

                      return (
                        <Link
                          key={`${band.key}-${idx}`}
                          to={linkTo}
                          className={`group flex items-center gap-3 px-5 py-2.5 pl-16 hover:bg-zinc-50 dark:hover:bg-white/5 border-l-2 border-transparent hover:border-accent-500 transition-all duration-200`}
                        >
                          {/* Entity type icon */}
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                            {item.entityType === 'driver' ? (
                              <FiUser className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                            ) : (
                              <FiTruck className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                              {getEntityName(item)}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate capitalize">
                              {getDocType(item).replace(/_/g, ' ')}
                            </p>
                          </div>

                          {/* Date + days remaining */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {formatDate(item.expiryDate || item.dueDate || item.date)}
                            </p>
                            <p className={`text-xs font-semibold ${
                              isOverdue ? 'text-red-600 dark:text-red-400'
                              : days <= 7 ? 'text-red-600 dark:text-red-400'
                              : days <= 30 ? 'text-orange-600 dark:text-orange-400'
                              : 'text-zinc-500 dark:text-zinc-400'
                            }`}>
                              {isOverdue
                                ? `${Math.abs(days)}d overdue`
                                : days === 0
                                  ? 'Today'
                                  : days === 1
                                    ? 'Tomorrow'
                                    : `${days}d remaining`
                              }
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExpirationTimeline;
