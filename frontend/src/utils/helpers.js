import { format, differenceInDays, parseISO, isValid } from 'date-fns';

// Format date for display
export const formatDate = (date, formatStr = 'MM/dd/yyyy') => {
  if (!date) return 'N/A';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return isValid(parsed) ? format(parsed, formatStr) : 'Invalid date';
};

// Calculate days until expiration
export const daysUntilExpiry = (date) => {
  if (!date) return null;
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return null;
  return differenceInDays(parsed, new Date());
};

// Get status based on days remaining
export const getExpiryStatus = (date) => {
  const days = daysUntilExpiry(date);
  if (days === null) return 'missing';
  if (days < 0) return 'expired';
  if (days <= 30) return 'due_soon';
  return 'valid';
};

// Status display configuration
export const statusConfig = {
  valid: { label: 'Valid', color: 'success', bgClass: 'bg-green-100', textClass: 'text-green-800' },
  compliant: { label: 'Compliant', color: 'success', bgClass: 'bg-green-100', textClass: 'text-green-800' },
  current: { label: 'Current', color: 'success', bgClass: 'bg-green-100', textClass: 'text-green-800' },
  due_soon: { label: 'Due Soon', color: 'warning', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
  warning: { label: 'Warning', color: 'warning', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
  due: { label: 'Due', color: 'warning', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
  expired: { label: 'Expired', color: 'danger', bgClass: 'bg-red-100', textClass: 'text-red-800' },
  non_compliant: { label: 'Non-Compliant', color: 'danger', bgClass: 'bg-red-100', textClass: 'text-red-800' },
  overdue: { label: 'Overdue', color: 'danger', bgClass: 'bg-red-100', textClass: 'text-red-800' },
  critical: { label: 'Critical', color: 'danger', bgClass: 'bg-red-100', textClass: 'text-red-800' },
  missing: { label: 'Missing', color: 'gray', bgClass: 'bg-gray-100', textClass: 'text-gray-800' },
  pending: { label: 'Pending', color: 'info', bgClass: 'bg-blue-100', textClass: 'text-blue-800' },
  no_data: { label: 'No Data', color: 'gray', bgClass: 'bg-gray-100', textClass: 'text-gray-600' },
  // Violation statuses
  open: { label: 'Open', color: 'warning', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
  dispute_in_progress: { label: 'Dispute in Progress', color: 'info', bgClass: 'bg-blue-100', textClass: 'text-blue-800' },
  resolved: { label: 'Resolved', color: 'success', bgClass: 'bg-green-100', textClass: 'text-green-800' },
  dismissed: { label: 'Dismissed', color: 'success', bgClass: 'bg-green-100', textClass: 'text-green-800' },
  upheld: { label: 'Upheld', color: 'danger', bgClass: 'bg-red-100', textClass: 'text-red-800' },
  // Vehicle statuses
  active: { label: 'Active', color: 'success', bgClass: 'bg-green-100', textClass: 'text-green-800' },
  inactive: { label: 'Inactive', color: 'gray', bgClass: 'bg-gray-100', textClass: 'text-gray-800' },
  maintenance: { label: 'Maintenance', color: 'warning', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
  out_of_service: { label: 'Out of Service', color: 'danger', bgClass: 'bg-red-100', textClass: 'text-red-800' },
  sold: { label: 'Sold', color: 'gray', bgClass: 'bg-gray-100', textClass: 'text-gray-600' },
  // Test results
  negative: { label: 'Negative', color: 'success', bgClass: 'bg-green-100', textClass: 'text-green-800' },
  positive: { label: 'Positive', color: 'danger', bgClass: 'bg-red-100', textClass: 'text-red-800' },
  refused: { label: 'Refused', color: 'danger', bgClass: 'bg-red-100', textClass: 'text-red-800' },
  cancelled: { label: 'Cancelled', color: 'gray', bgClass: 'bg-gray-100', textClass: 'text-gray-600' }
};

// Get status configuration
export const getStatusConfig = (status) => {
  return statusConfig[status] || statusConfig.missing;
};

// BASIC categories
export const basicCategories = {
  unsafe_driving: { label: 'Unsafe Driving', threshold: 65 },
  hours_of_service: { label: 'HOS Compliance', threshold: 65 },
  vehicle_maintenance: { label: 'Vehicle Maintenance', threshold: 80 },
  controlled_substances: { label: 'Controlled Substances', threshold: 80 },
  driver_fitness: { label: 'Driver Fitness', threshold: 80 },
  crash_indicator: { label: 'Crash Indicator', threshold: 65 },
  hazmat: { label: 'Hazmat', threshold: 80 }
};

// Format currency
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Format phone number
export const formatPhone = (phone) => {
  if (!phone) return 'N/A';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// File size formatter
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Download blob as file
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Severity colors for violations
export const getSeverityColor = (severity) => {
  if (severity >= 8) return 'bg-red-500';
  if (severity >= 5) return 'bg-orange-500';
  if (severity >= 3) return 'bg-yellow-500';
  return 'bg-blue-500';
};
