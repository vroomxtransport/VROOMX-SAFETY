/**
 * VroomX Safety Platform - Common JavaScript
 * Shared utilities for HTML mockups
 * Note: This is for static mockups only, not production use
 */

// ============================================
// Navigation Highlighting
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('nav-link-active');
      link.classList.remove('nav-link-inactive');
    }
  });
});

// ============================================
// Theme Toggle (Dark/Light Mode)
// ============================================
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  const savedTheme = localStorage.getItem('vroomx-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;

  document.documentElement.classList.toggle('dark', isDark);
  updateThemeIcon(isDark);

  toggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('vroomx-theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
  });
}

function updateThemeIcon(isDark) {
  const sunIcon = document.getElementById('sun-icon');
  const moonIcon = document.getElementById('moon-icon');
  if (sunIcon && moonIcon) {
    sunIcon.classList.toggle('hidden', isDark);
    moonIcon.classList.toggle('hidden', !isDark);
  }
}

document.addEventListener('DOMContentLoaded', initThemeToggle);

// ============================================
// Format Utilities
// ============================================
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function formatNumber(num) {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('en-US').format(num);
}

function daysUntil(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getExpiryStatus(dateString) {
  const days = daysUntil(dateString);
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring-soon';
  if (days <= 90) return 'warning';
  return 'valid';
}

// ============================================
// Status Badge Classes
// ============================================
const statusClasses = {
  compliant: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
  warning: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  'non-compliant': 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
  valid: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
  'expiring_soon': 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  expired: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
  active: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
  inactive: 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400',
  pending: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  open: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
  resolved: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
  closed: 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400',
  completed: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
  in_progress: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
  scheduled: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400',
  maintenance: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400',
  critical: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
  high: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400',
  medium: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  low: 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400',
  info: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
  paid: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
  dismissed: 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400',
  under_review: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  not_started: 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400'
};

function getStatusClass(status) {
  return statusClasses[status] || statusClasses['pending'];
}

function formatStatus(status) {
  if (!status) return '-';
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================
// Table Utilities
// ============================================
function sortTable(tableId, columnIndex, type) {
  type = type || 'string';
  const table = document.getElementById(tableId);
  if (!table) return;

  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));

  const currentDir = table.getAttribute('data-sort-dir') || 'asc';
  const newDir = currentDir === 'asc' ? 'desc' : 'asc';
  table.setAttribute('data-sort-dir', newDir);
  table.setAttribute('data-sort-col', columnIndex);

  rows.sort((a, b) => {
    let aVal = a.cells[columnIndex].textContent.trim();
    let bVal = b.cells[columnIndex].textContent.trim();

    if (type === 'number') {
      aVal = parseFloat(aVal.replace(/[^0-9.-]/g, '')) || 0;
      bVal = parseFloat(bVal.replace(/[^0-9.-]/g, '')) || 0;
    } else if (type === 'date') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }

    if (aVal < bVal) return newDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return newDir === 'asc' ? 1 : -1;
    return 0;
  });

  rows.forEach(row => tbody.appendChild(row));
}

// ============================================
// Modal Utilities
// ============================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
      modal.classList.add('hidden');
    });
    document.body.classList.remove('overflow-hidden');
  }
});

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type, duration) {
  type = type || 'info';
  duration = duration || 3000;

  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-4 right-4 z-50';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  toast.className = (colors[type] || colors.info) + ' text-white px-6 py-3 rounded-lg shadow-lg mb-2 transform translate-x-full transition-transform duration-300';
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(function() { toast.classList.remove('translate-x-full'); }, 10);

  setTimeout(function() {
    toast.classList.add('translate-x-full');
    setTimeout(function() { toast.remove(); }, 300);
  }, duration);
}

// ============================================
// Export for global use
// ============================================
window.VroomX = {
  formatDate: formatDate,
  formatCurrency: formatCurrency,
  formatNumber: formatNumber,
  daysUntil: daysUntil,
  getExpiryStatus: getExpiryStatus,
  getStatusClass: getStatusClass,
  formatStatus: formatStatus,
  sortTable: sortTable,
  openModal: openModal,
  closeModal: closeModal,
  showToast: showToast
};
