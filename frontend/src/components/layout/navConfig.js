import {
  FiHome, FiUsers, FiTruck, FiDroplet,
  FiFolder, FiBarChart2, FiFileText, FiTag, FiMessageCircle, FiDollarSign,
  FiActivity, FiCheckSquare, FiClipboard, FiTool, FiAlertOctagon,
  FiBookOpen, FiLink, FiShield
} from 'react-icons/fi';

const navigation = [
  // Main section (no header)
  { name: 'Dashboard', path: '/app/dashboard', icon: FiHome },
  { name: 'Regulation Assistant', path: '/app/ai-assistant', icon: FiMessageCircle, isAI: true },
  { name: 'AI Compliance Report', path: '/app/compliance-report', icon: FiShield, isAI: true },
  { name: 'Alerts', path: '/app/alerts', icon: FiActivity, hasAlerts: true },
  { name: 'Tasks', path: '/app/tasks', icon: FiCheckSquare },

  // Management section
  { section: 'MANAGEMENT' },
  { name: 'FMCSA Dashboard', path: '/app/compliance', icon: FiBarChart2 },
  { name: 'Driver Files', path: '/app/drivers', icon: FiUsers },
  { name: 'Vehicle Files', path: '/app/vehicles', icon: FiTruck },
  { name: 'Maintenance', path: '/app/maintenance', icon: FiTool },

  // Tracking section
  { section: 'TRACKING' },
  { name: 'Tickets', path: '/app/tickets', icon: FiTag },
  { name: 'Accidents', path: '/app/accidents', icon: FiAlertOctagon },
  { name: 'DVIRs', path: '/app/dvir', icon: FiClipboard },
  { name: 'Damage Claims', path: '/app/damage-claims', icon: FiDollarSign },
  { name: 'Drug & Alcohol', path: '/app/drug-alcohol', icon: FiDroplet },
  { name: 'Clearinghouse', path: '/app/clearinghouse', icon: FiShield },

  // Company Files section
  { section: 'COMPANY FILES' },
  { name: 'Policies', path: '/app/policies', icon: FiBookOpen },
  { name: 'Templates', path: '/app/templates', icon: FiFileText },
  { name: 'Checklists', path: '/app/checklists', icon: FiClipboard },
  { name: 'Documents', path: '/app/documents', icon: FiFolder },

  // Tools section
  { section: 'TOOLS' },
  { name: 'Reports', path: '/app/reports', icon: FiFileText },
  { name: 'Integrations', path: '/app/integrations', icon: FiLink },
];

export default navigation;
