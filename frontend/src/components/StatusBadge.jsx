import {
  FiCheck, FiAlertTriangle, FiAlertCircle, FiClock,
  FiX, FiMinus, FiLoader, FiActivity, FiTool, FiPause
} from 'react-icons/fi';

// Enhanced status configuration with icons and dark mode support
const statusVariants = {
  // Success states
  valid: {
    label: 'Valid',
    bg: 'bg-success-50 dark:bg-success-500/15',
    text: 'text-success-700 dark:text-success-400',
    border: 'border-success-200 dark:border-success-500/30',
    icon: FiCheck,
    iconBg: 'bg-success-100 dark:bg-success-500/20',
    iconColor: 'text-success-600 dark:text-success-400'
  },
  compliant: {
    label: 'Compliant',
    bg: 'bg-success-50 dark:bg-success-500/15',
    text: 'text-success-700 dark:text-success-400',
    border: 'border-success-200 dark:border-success-500/30',
    icon: FiCheck,
    iconBg: 'bg-success-100 dark:bg-success-500/20',
    iconColor: 'text-success-600 dark:text-success-400'
  },
  current: {
    label: 'Current',
    bg: 'bg-success-50 dark:bg-success-500/15',
    text: 'text-success-700 dark:text-success-400',
    border: 'border-success-200 dark:border-success-500/30',
    icon: FiCheck,
    iconBg: 'bg-success-100 dark:bg-success-500/20',
    iconColor: 'text-success-600 dark:text-success-400'
  },
  negative: {
    label: 'Negative',
    bg: 'bg-success-50 dark:bg-success-500/15',
    text: 'text-success-700 dark:text-success-400',
    border: 'border-success-200 dark:border-success-500/30',
    icon: FiCheck,
    iconBg: 'bg-success-100 dark:bg-success-500/20',
    iconColor: 'text-success-600 dark:text-success-400'
  },
  active: {
    label: 'Active',
    bg: 'bg-success-50 dark:bg-success-500/15',
    text: 'text-success-700 dark:text-success-400',
    border: 'border-success-200 dark:border-success-500/30',
    icon: FiActivity,
    iconBg: 'bg-success-100 dark:bg-success-500/20',
    iconColor: 'text-success-600 dark:text-success-400'
  },
  resolved: {
    label: 'Resolved',
    bg: 'bg-success-50 dark:bg-success-500/15',
    text: 'text-success-700 dark:text-success-400',
    border: 'border-success-200 dark:border-success-500/30',
    icon: FiCheck,
    iconBg: 'bg-success-100 dark:bg-success-500/20',
    iconColor: 'text-success-600 dark:text-success-400'
  },
  dismissed: {
    label: 'Dismissed',
    bg: 'bg-success-50 dark:bg-success-500/15',
    text: 'text-success-700 dark:text-success-400',
    border: 'border-success-200 dark:border-success-500/30',
    icon: FiCheck,
    iconBg: 'bg-success-100 dark:bg-success-500/20',
    iconColor: 'text-success-600 dark:text-success-400'
  },

  // Warning states
  warning: {
    label: 'Warning',
    bg: 'bg-warning-50 dark:bg-warning-500/15',
    text: 'text-warning-700 dark:text-warning-400',
    border: 'border-warning-200 dark:border-warning-500/30',
    icon: FiAlertTriangle,
    iconBg: 'bg-warning-100 dark:bg-warning-500/20',
    iconColor: 'text-warning-600 dark:text-warning-400',
    pulse: true
  },
  due_soon: {
    label: 'Due Soon',
    bg: 'bg-warning-50 dark:bg-warning-500/15',
    text: 'text-warning-700 dark:text-warning-400',
    border: 'border-warning-200 dark:border-warning-500/30',
    icon: FiClock,
    iconBg: 'bg-warning-100 dark:bg-warning-500/20',
    iconColor: 'text-warning-600 dark:text-warning-400',
    pulse: true
  },
  due: {
    label: 'Due',
    bg: 'bg-warning-50 dark:bg-warning-500/15',
    text: 'text-warning-700 dark:text-warning-400',
    border: 'border-warning-200 dark:border-warning-500/30',
    icon: FiClock,
    iconBg: 'bg-warning-100 dark:bg-warning-500/20',
    iconColor: 'text-warning-600 dark:text-warning-400',
    pulse: true
  },
  open: {
    label: 'Open',
    bg: 'bg-warning-50 dark:bg-warning-500/15',
    text: 'text-warning-700 dark:text-warning-400',
    border: 'border-warning-200 dark:border-warning-500/30',
    icon: FiAlertTriangle,
    iconBg: 'bg-warning-100 dark:bg-warning-500/20',
    iconColor: 'text-warning-600 dark:text-warning-400'
  },
  maintenance: {
    label: 'Maintenance',
    bg: 'bg-warning-50 dark:bg-warning-500/15',
    text: 'text-warning-700 dark:text-warning-400',
    border: 'border-warning-200 dark:border-warning-500/30',
    icon: FiTool,
    iconBg: 'bg-warning-100 dark:bg-warning-500/20',
    iconColor: 'text-warning-600 dark:text-warning-400'
  },

  // Danger states
  expired: {
    label: 'Expired',
    bg: 'bg-danger-50 dark:bg-danger-500/15',
    text: 'text-danger-700 dark:text-danger-400',
    border: 'border-danger-200 dark:border-danger-500/30',
    icon: FiAlertCircle,
    iconBg: 'bg-danger-100 dark:bg-danger-500/20',
    iconColor: 'text-danger-600 dark:text-danger-400',
    pulse: true
  },
  non_compliant: {
    label: 'Non-Compliant',
    bg: 'bg-danger-50 dark:bg-danger-500/15',
    text: 'text-danger-700 dark:text-danger-400',
    border: 'border-danger-200 dark:border-danger-500/30',
    icon: FiX,
    iconBg: 'bg-danger-100 dark:bg-danger-500/20',
    iconColor: 'text-danger-600 dark:text-danger-400'
  },
  overdue: {
    label: 'Overdue',
    bg: 'bg-danger-50 dark:bg-danger-500/15',
    text: 'text-danger-700 dark:text-danger-400',
    border: 'border-danger-200 dark:border-danger-500/30',
    icon: FiAlertCircle,
    iconBg: 'bg-danger-100 dark:bg-danger-500/20',
    iconColor: 'text-danger-600 dark:text-danger-400',
    pulse: true
  },
  critical: {
    label: 'Critical',
    bg: 'bg-danger-50 dark:bg-danger-500/15',
    text: 'text-danger-700 dark:text-danger-400',
    border: 'border-danger-200 dark:border-danger-500/30',
    icon: FiAlertCircle,
    iconBg: 'bg-danger-100 dark:bg-danger-500/20',
    iconColor: 'text-danger-600 dark:text-danger-400',
    pulse: true
  },
  positive: {
    label: 'Positive',
    bg: 'bg-danger-50 dark:bg-danger-500/15',
    text: 'text-danger-700 dark:text-danger-400',
    border: 'border-danger-200 dark:border-danger-500/30',
    icon: FiAlertCircle,
    iconBg: 'bg-danger-100 dark:bg-danger-500/20',
    iconColor: 'text-danger-600 dark:text-danger-400'
  },
  refused: {
    label: 'Refused',
    bg: 'bg-danger-50 dark:bg-danger-500/15',
    text: 'text-danger-700 dark:text-danger-400',
    border: 'border-danger-200 dark:border-danger-500/30',
    icon: FiX,
    iconBg: 'bg-danger-100 dark:bg-danger-500/20',
    iconColor: 'text-danger-600 dark:text-danger-400'
  },
  upheld: {
    label: 'Upheld',
    bg: 'bg-danger-50 dark:bg-danger-500/15',
    text: 'text-danger-700 dark:text-danger-400',
    border: 'border-danger-200 dark:border-danger-500/30',
    icon: FiAlertCircle,
    iconBg: 'bg-danger-100 dark:bg-danger-500/20',
    iconColor: 'text-danger-600 dark:text-danger-400'
  },
  out_of_service: {
    label: 'Out of Service',
    bg: 'bg-danger-50 dark:bg-danger-500/15',
    text: 'text-danger-700 dark:text-danger-400',
    border: 'border-danger-200 dark:border-danger-500/30',
    icon: FiX,
    iconBg: 'bg-danger-100 dark:bg-danger-500/20',
    iconColor: 'text-danger-600 dark:text-danger-400'
  },

  // Info/Pending states
  pending: {
    label: 'Pending',
    bg: 'bg-info-50 dark:bg-info-500/15',
    text: 'text-info-700 dark:text-info-400',
    border: 'border-info-200 dark:border-info-500/30',
    icon: FiLoader,
    iconBg: 'bg-info-100 dark:bg-info-500/20',
    iconColor: 'text-info-600 dark:text-info-400',
    spin: true
  },
  dispute_in_progress: {
    label: 'Dispute in Progress',
    bg: 'bg-info-50 dark:bg-info-500/15',
    text: 'text-info-700 dark:text-info-400',
    border: 'border-info-200 dark:border-info-500/30',
    icon: FiLoader,
    iconBg: 'bg-info-100 dark:bg-info-500/20',
    iconColor: 'text-info-600 dark:text-info-400',
    spin: true
  },

  // Neutral states
  missing: {
    label: 'Missing',
    bg: 'bg-zinc-100 dark:bg-zinc-500/15',
    text: 'text-zinc-600 dark:text-zinc-400',
    border: 'border-zinc-200 dark:border-zinc-500/30',
    icon: FiMinus,
    iconBg: 'bg-zinc-200 dark:bg-zinc-500/20',
    iconColor: 'text-zinc-500 dark:text-zinc-400'
  },
  no_data: {
    label: 'No Data',
    bg: 'bg-zinc-100 dark:bg-zinc-500/15',
    text: 'text-zinc-600 dark:text-zinc-400',
    border: 'border-zinc-200 dark:border-zinc-500/30',
    icon: FiMinus,
    iconBg: 'bg-zinc-200 dark:bg-zinc-500/20',
    iconColor: 'text-zinc-500 dark:text-zinc-400'
  },
  inactive: {
    label: 'Inactive',
    bg: 'bg-zinc-100 dark:bg-zinc-500/15',
    text: 'text-zinc-600 dark:text-zinc-400',
    border: 'border-zinc-200 dark:border-zinc-500/30',
    icon: FiPause,
    iconBg: 'bg-zinc-200 dark:bg-zinc-500/20',
    iconColor: 'text-zinc-500 dark:text-zinc-400'
  },
  sold: {
    label: 'Sold',
    bg: 'bg-zinc-100 dark:bg-zinc-500/15',
    text: 'text-zinc-500 dark:text-zinc-400',
    border: 'border-zinc-200 dark:border-zinc-500/30',
    icon: FiMinus,
    iconBg: 'bg-zinc-200 dark:bg-zinc-500/20',
    iconColor: 'text-zinc-400 dark:text-zinc-500'
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-zinc-100 dark:bg-zinc-500/15',
    text: 'text-zinc-500 dark:text-zinc-400',
    border: 'border-zinc-200 dark:border-zinc-500/30',
    icon: FiX,
    iconBg: 'bg-zinc-200 dark:bg-zinc-500/20',
    iconColor: 'text-zinc-400 dark:text-zinc-500'
  }
};

const StatusBadge = ({ status, size = 'md', showIcon = true, className = '' }) => {
  const config = statusVariants[status] || statusVariants.missing;
  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      badge: 'text-xs px-2 py-0.5 gap-1',
      iconWrapper: 'w-3.5 h-3.5',
      icon: 'w-2 h-2'
    },
    md: {
      badge: 'text-xs px-2.5 py-1 gap-1.5',
      iconWrapper: 'w-4 h-4',
      icon: 'w-2.5 h-2.5'
    },
    lg: {
      badge: 'text-sm px-3 py-1.5 gap-2',
      iconWrapper: 'w-5 h-5',
      icon: 'w-3 h-3'
    }
  };

  const sizes = sizeClasses[size];

  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-full border
        ${config.bg} ${config.text} ${config.border} ${sizes.badge}
        ${config.pulse ? 'animate-pulse-slow' : ''}
        ${className}
      `}
    >
      {showIcon && Icon && (
        <span
          className={`
            flex items-center justify-center rounded-full flex-shrink-0
            ${sizes.iconWrapper} ${config.iconBg}
          `}
        >
          <Icon
            className={`
              ${sizes.icon} ${config.iconColor}
              ${config.spin ? 'animate-spin' : ''}
            `}
          />
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
