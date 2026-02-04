import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  withCredentials: true, // Send httpOnly cookies as fallback
  headers: {
    'Content-Type': 'application/json'
  }
});

// Token storage with localStorage persistence for session survival across page refresh
let authToken = localStorage.getItem('authToken') || null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('authToken');
};

// Request interceptor — attach token to every request
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Don't redirect for session-check or if already on login page
      if (!url.includes('/auth/me') && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 503 && error.response?.data?.code === 'MAINTENANCE_MODE') {
      window.__maintenanceMode = true;
      window.__maintenanceMessage = error.response.data.message;
      window.dispatchEvent(new CustomEvent('maintenance-mode'));
    }
    return Promise.reject(error);
  }
);

export default api;

// API service functions
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
  getAuditReadiness: () => api.get('/dashboard/audit-readiness'),
  updateBasics: (data) => api.put('/dashboard/basics', data),
  refreshFMCSA: () => api.post('/dashboard/refresh-fmcsa'),
  getFMCSAStatus: () => api.get('/dashboard/fmcsa-status'),
  // Compliance score endpoints
  getComplianceScore: () => api.get('/dashboard/compliance-score'),
  getComplianceHistory: (days = 30) => api.get('/dashboard/compliance-score/history', { params: { days } }),
  getComplianceBreakdown: () => api.get('/dashboard/compliance-score/breakdown'),
  calculateComplianceScore: () => api.post('/dashboard/compliance-score/calculate'),
  // Data audit endpoints
  runFullAudit: () => api.get('/dashboard/audit/full'),
  auditFMCSA: () => api.get('/dashboard/audit/fmcsa'),
  auditConsistency: () => api.get('/dashboard/audit/consistency'),
  auditStats: () => api.get('/dashboard/audit/stats')
};

export const driversAPI = {
  getAll: (params) => api.get('/drivers', { params }),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
  getAlerts: (days = 30) => api.get('/drivers/alerts', { params: { days } }),
  getStats: () => api.get('/drivers/stats'),
  uploadDocument: (id, formData) => api.post(`/drivers/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  addMvr: (id, data) => api.post(`/drivers/${id}/mvr`, data),
  // CSA impact methods
  getRiskRanking: (limit = 5) => api.get('/drivers/risk-ranking', { params: { limit } }),
  getCSAImpact: (id) => api.get(`/drivers/${id}/csa`),
  getViolations: (id, params) => api.get(`/drivers/${id}/violations`, { params }),
  // Archive/restore methods
  restore: (id) => api.patch(`/drivers/${id}/restore`)
};

export const vehiclesAPI = {
  getAll: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
  getAlerts: (days = 30) => api.get('/vehicles/alerts', { params: { days } }),
  getStats: () => api.get('/vehicles/stats'),
  addMaintenance: (id, data) => api.post(`/vehicles/${id}/maintenance`, data),
  recordInspection: (id, formData) => api.post(`/vehicles/${id}/inspection`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  addDvir: (id, data) => api.post(`/vehicles/${id}/dvir`, data),
  // Safety/OOS methods
  getOOSStats: (id) => api.get(`/vehicles/${id}/oos-stats`),
  getViolations: (id, params) => api.get(`/vehicles/${id}/violations`, { params })
};

export const violationsAPI = {
  getAll: (params) => api.get('/violations', { params }),
  getById: (id) => api.get(`/violations/${id}`),
  create: (data) => api.post('/violations', data),
  update: (id, data) => api.put(`/violations/${id}`, data),
  delete: (id) => api.delete(`/violations/${id}`),
  getStats: () => api.get('/violations/stats'),
  getSeverityWeights: () => api.get('/violations/severity-weights'),
  submitDataQ: (id, formData) => api.post(`/violations/${id}/dataq`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateDataQStatus: (id, data) => api.put(`/violations/${id}/dataq/status`, data),
  resolve: (id, data) => api.post(`/violations/${id}/resolve`, data),
  uploadDocuments: (id, formData) => api.post(`/violations/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // Driver linking methods
  linkDriver: (id, driverId) => api.put(`/violations/${id}/link-driver`, { driverId }),
  unlinkDriver: (id) => api.delete(`/violations/${id}/link-driver`),
  getUnassigned: (params) => api.get('/violations/unassigned', { params }),
  bulkLink: (violationIds, driverId) => api.post('/violations/bulk-link', { violationIds, driverId }),
  getReviewQueue: (params = {}) => api.get('/violations/review-queue', { params }),
  // DataQ AI-powered analysis methods
  getDataQOpportunities: (params) => api.get('/violations/dataq-opportunities', { params }),
  getDataQDashboard: () => api.get('/violations/dataq-dashboard'),
  analyzeOpportunities: (params) => api.post('/ai/analyze-dataq-opportunities', params),
  analyzeViolation: (id) => api.post(`/ai/analyze-violation/${id}`),
  generateLetter: (id, data) => api.post(`/ai/generate-dataq-letter/${id}`, data),
  saveDataQLetter: (id, data) => api.put(`/violations/${id}/dataq/letter`, data),
  updateEvidenceChecklist: (id, evidenceChecklist) => api.put(`/violations/${id}/dataq/evidence`, { evidenceChecklist })
};

export const drugAlcoholAPI = {
  getAll: (params) => api.get('/drug-alcohol', { params }),
  getById: (id) => api.get(`/drug-alcohol/${id}`),
  create: (data) => api.post('/drug-alcohol', data),
  update: (id, data) => api.put(`/drug-alcohol/${id}`, data),
  delete: (id) => api.delete(`/drug-alcohol/${id}`),
  getStats: () => api.get('/drug-alcohol/stats'),
  getRequirements: () => api.get('/drug-alcohol/requirements'),
  getRandomPool: () => api.get('/drug-alcohol/random-pool'),
  reportToClearinghouse: (id, data) => api.post(`/drug-alcohol/${id}/clearinghouse`, data),
  uploadDocument: (id, formData) => api.post(`/drug-alcohol/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  recordClearinghouseQuery: (data) => api.post('/drug-alcohol/clearinghouse-query', data)
};

export const documentsAPI = {
  getAll: (params) => api.get('/documents', { params }),
  getById: (id) => api.get(`/documents/${id}`),
  upload: (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadBulk: (formData) => api.post('/documents/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  getExpiring: (days = 30) => api.get('/documents/expiring', { params: { days } }),
  getStats: () => api.get('/documents/stats'),
  getTypes: () => api.get('/documents/types'),
  verify: (id) => api.post(`/documents/${id}/verify`),
  replace: (id, formData) => api.post(`/documents/${id}/replace`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const accidentsAPI = {
  getAll: (params) => api.get('/accidents', { params }),
  getById: (id) => api.get(`/accidents/${id}`),
  create: (data) => api.post('/accidents', data),
  update: (id, data) => api.put(`/accidents/${id}`, data),
  delete: (id) => api.delete(`/accidents/${id}`),
  getStats: () => api.get('/accidents/stats'),
  uploadDocuments: (id, formData) => api.post(`/accidents/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  recordInvestigation: (id, data) => api.post(`/accidents/${id}/investigation`, data)
};

export const reportsAPI = {
  getDqfReport: (params) => api.get('/reports/dqf', {
    params: {
      ...params,
      // Convert arrays to comma-separated strings, omit if empty
      driverIds: params.driverIds?.length ? params.driverIds.join(',') : undefined
    },
    responseType: ['pdf', 'csv', 'xlsx'].includes(params.format) ? 'blob' : 'json',
    ...(['pdf', 'csv', 'xlsx'].includes(params.format) && { timeout: 300000 })
  }),
  getVehicleMaintenanceReport: (params) => api.get('/reports/vehicle-maintenance', {
    params: {
      ...params,
      vehicleIds: params.vehicleIds?.length ? params.vehicleIds.join(',') : undefined
    },
    responseType: ['pdf', 'csv', 'xlsx'].includes(params.format) ? 'blob' : 'json',
    ...(['pdf', 'csv', 'xlsx'].includes(params.format) && { timeout: 300000 })
  }),
  getViolationsReport: (params) => api.get('/reports/violations', {
    params: {
      ...params,
      driverIds: params.driverIds?.length ? params.driverIds.join(',') : undefined,
      vehicleIds: params.vehicleIds?.length ? params.vehicleIds.join(',') : undefined
    },
    responseType: ['pdf', 'csv', 'xlsx'].includes(params.format) ? 'blob' : 'json',
    ...(['pdf', 'csv', 'xlsx'].includes(params.format) && { timeout: 300000 })
  }),
  getAuditReport: (params) => api.get('/reports/audit', {
    params,
    responseType: ['pdf', 'csv', 'xlsx'].includes(params.format) ? 'blob' : 'json',
    ...(['pdf', 'csv', 'xlsx'].includes(params.format) && { timeout: 300000 })
  }),
  getDocumentExpirationReport: (params) => api.get('/reports/document-expiration', {
    params: {
      ...params,
      driverIds: params.driverIds?.length ? params.driverIds.join(',') : undefined,
      vehicleIds: params.vehicleIds?.length ? params.vehicleIds.join(',') : undefined
    },
    responseType: ['pdf', 'csv', 'xlsx'].includes(params.format) ? 'blob' : 'json',
    ...(['pdf', 'csv', 'xlsx'].includes(params.format) && { timeout: 300000 })
  }),
  getDrugAlcoholReport: (params) => api.get('/reports/drug-alcohol-summary', {
    params,
    responseType: ['pdf', 'csv', 'xlsx'].includes(params.format) ? 'blob' : 'json',
    ...(['pdf', 'csv', 'xlsx'].includes(params.format) && { timeout: 300000 })
  }),
  getDataQHistoryReport: (params) => api.get('/reports/dataq-history', {
    params: {
      ...params,
      driverIds: params.driverIds?.length ? params.driverIds.join(',') : undefined
    },
    responseType: ['pdf', 'csv', 'xlsx'].includes(params.format) ? 'blob' : 'json',
    ...(['pdf', 'csv', 'xlsx'].includes(params.format) && { timeout: 300000 })
  }),
  getAccidentSummaryReport: (params) => api.get('/reports/accident-summary', {
    params: {
      ...params,
      driverIds: params.driverIds?.length ? params.driverIds.join(',') : undefined,
      vehicleIds: params.vehicleIds?.length ? params.vehicleIds.join(',') : undefined
    },
    responseType: ['pdf', 'csv', 'xlsx'].includes(params.format) ? 'blob' : 'json',
    ...(['pdf', 'csv', 'xlsx'].includes(params.format) && { timeout: 300000 })
  }),
  getMaintenanceCostReport: (params) => api.get('/reports/maintenance-costs', {
    params: {
      ...params,
      vehicleIds: params.vehicleIds?.length ? params.vehicleIds.join(',') : undefined
    },
    responseType: ['pdf', 'csv', 'xlsx'].includes(params.format) ? 'blob' : 'json',
    ...(['pdf', 'csv', 'xlsx'].includes(params.format) && { timeout: 300000 })
  }),
  // Preview endpoint - returns first 10 rows with metadata
  getPreview: (reportType, params) => {
    const endpoints = {
      'dqf': '/reports/dqf/preview',
      'vehicle': '/reports/vehicle-maintenance/preview',
      'violations': '/reports/violations/preview',
      'audit': '/reports/audit/preview',
      'document-expiration': '/reports/document-expiration/preview',
      'drug-alcohol': '/reports/drug-alcohol-summary/preview',
      'dataq-history': '/reports/dataq-history/preview',
      'accident-summary': '/reports/accident-summary/preview',
      'maintenance-costs': '/reports/maintenance-costs/preview'
    };
    return api.get(endpoints[reportType], { params });
  }
};

export const scheduledReportsAPI = {
  getAll: (params) => api.get('/scheduled-reports', { params }),
  getById: (id) => api.get(`/scheduled-reports/${id}`),
  create: (data) => api.post('/scheduled-reports', data),
  update: (id, data) => api.put(`/scheduled-reports/${id}`, data),
  delete: (id, permanent = false) => api.delete(`/scheduled-reports/${id}`, { params: { permanent } }),
  run: (id) => api.post(`/scheduled-reports/${id}/run`),
  toggle: (id) => api.post(`/scheduled-reports/${id}/toggle`),
  getAvailableTypes: () => api.get('/scheduled-reports/types/available')
};

export const fmcsaInspectionsAPI = {
  getAll: (params) => api.get('/inspections/fmcsa', { params }),
  getById: (id) => api.get(`/inspections/fmcsa/${id}`),
  getByBasic: (basic) => api.get(`/inspections/fmcsa/by-basic/${basic}`),
  getViolations: (params) => api.get('/inspections/fmcsa/violations', { params }),
  getRecent: (limit = 5) => api.get('/inspections/fmcsa/recent', { params: { limit } }),
  getStats: () => api.get('/inspections/fmcsa/stats'),
  sync: () => api.post('/inspections/fmcsa/sync'),
  syncViolations: () => api.post('/inspections/fmcsa/sync-violations'),
  syncAll: () => api.post('/inspections/fmcsa/sync-all'),
  delete: (id) => api.delete(`/inspections/fmcsa/${id}`)
};

export const ticketsAPI = {
  getAll: (params) => api.get('/tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
  getStats: () => api.get('/tickets/stats'),
  getUpcomingCourt: () => api.get('/tickets/upcoming-court'),
  addNote: (id, data) => api.post(`/tickets/${id}/notes`, data),
  updateCourtDecision: (id, data) => api.put(`/tickets/${id}/court-decision`, data),
  recordPayment: (id, data) => api.put(`/tickets/${id}/payment`, data)
};

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  demoLogin: () => api.post('/auth/demo-login'),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
  updateEmailPreferences: (data) => api.put('/auth/email-preferences', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  createUser: (data) => api.post('/auth/users', data),
  getUsers: () => api.get('/auth/users')
};

export const damageClaimsAPI = {
  getAll: (params) => api.get('/damage-claims', { params }),
  getById: (id) => api.get(`/damage-claims/${id}`),
  create: (data) => api.post('/damage-claims', data),
  update: (id, data) => api.put(`/damage-claims/${id}`, data),
  delete: (id) => api.delete(`/damage-claims/${id}`),
  getStats: () => api.get('/damage-claims/stats'),
  settle: (id, data) => api.put(`/damage-claims/${id}/settle`, data),
  uploadDocuments: (id, formData) => api.post(`/damage-claims/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  addNote: (id, data) => api.post(`/damage-claims/${id}/notes`, data)
};

// Companies API - Multi-company management
export const companiesAPI = {
  getAll: () => api.get('/companies'),
  create: (data) => api.post('/companies', data),
  getById: (id) => api.get(`/companies/${id}`),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
  switch: (id) => api.post(`/companies/${id}/switch`),
  getMembers: (id) => api.get(`/companies/${id}/members`),
  invite: (id, data) => api.post(`/companies/${id}/invite`, data),
  removeMember: (companyId, userId) => api.delete(`/companies/${companyId}/members/${userId}`),
  getStats: (id) => api.get(`/companies/${id}/stats`)
};

// Billing API - Subscription management
export const billingAPI = {
  getPlans: () => api.get('/billing/plans'),
  getSubscription: () => api.get('/billing/subscription'),
  createCheckoutSession: (plan) => api.post('/billing/create-checkout-session', { plan }),
  createPortalSession: (returnUrl) => api.post('/billing/create-portal-session', { returnUrl }),
  cancelSubscription: () => api.post('/billing/cancel'),
  reactivateSubscription: () => api.post('/billing/reactivate'),
  previewUpgrade: (plan) => api.post('/billing/preview-upgrade', { plan }),
  upgradePlan: (plan) => api.post('/billing/upgrade', { plan })
};

// Invitations API - Company invitations
export const invitationsAPI = {
  getPending: () => api.get('/invitations/pending'),
  accept: (token) => api.post(`/invitations/${token}/accept`),
  decline: (token) => api.post(`/invitations/${token}/decline`),
  getSent: () => api.get('/invitations/sent'),
  cancel: (id) => api.delete(`/invitations/${id}`)
};

// Alerts API - Alert management
export const alertsAPI = {
  getAll: (params) => api.get('/dashboard/alerts', { params }),
  getGrouped: () => api.get('/dashboard/alerts/grouped'),
  dismiss: (id, reason) => api.put(`/dashboard/alerts/${id}/dismiss`, { reason }),
  resolve: (id, notes) => api.put(`/dashboard/alerts/${id}/resolve`, { notes }),
  getAuditTrail: (params) => api.get('/dashboard/alerts/audit-trail', { params }),
  dismissBulk: (ids, reason) => api.post('/dashboard/alerts/dismiss-bulk', { alertIds: ids, reason }),
  getCounts: () => api.get('/dashboard/alerts/counts'),
  generate: () => api.post('/dashboard/alerts/generate'),
  escalate: () => api.post('/dashboard/alerts/escalate')
};

// Compliance Score API
export const complianceScoreAPI = {
  get: () => api.get('/dashboard/compliance-score'),
  getHistory: (days) => api.get('/dashboard/compliance-score/history', { params: { days } }),
  getBreakdown: () => api.get('/dashboard/compliance-score/breakdown'),
  recalculate: () => api.post('/dashboard/compliance-score/recalculate')
};

// CSA API - CSA Score Estimation
export const csaAPI = {
  getCurrent: () => api.get('/csa/current'),
  getSummary: () => api.get('/csa/summary'),
  getScores: () => api.get('/csa/scores'),
  projectImpact: (violation) => api.post('/csa/project-impact', violation),
  getTimeDecay: (months) => api.get('/csa/time-decay', { params: { months } }),
  getThresholds: () => api.get('/csa/thresholds'),
  getBasics: () => api.get('/csa/basics'),
  // History & Trends endpoints
  getHistory: (days = 90) => api.get('/csa/history', { params: { days } }),
  getTrendSummary: (days = 30) => api.get('/csa/trend-summary', { params: { days } }),
  getAlerts: () => api.get('/csa/alerts'),
  compare: (startDate, endDate) => api.get('/csa/compare', { params: { startDate, endDate } }),
  exportHistory: (days = 365, format = 'csv') => api.get('/csa/export', {
    params: { days, format },
    responseType: format === 'csv' ? 'blob' : 'json'
  }),
  // Industry benchmarking
  getBenchmark: () => api.get('/csa/benchmark')
};

// FMCSA Inspection & Violation History API
export const fmcsaAPI = {
  // Get inspection history
  getInspections: (params) => api.get('/fmcsa/inspections', { params }),
  // Get violation summary by BASIC
  getSummary: () => api.get('/fmcsa/inspections/summary'),
  // Get sync status
  getSyncStatus: () => api.get('/fmcsa/sync-status'),
  // Trigger manual sync
  syncViolations: (forceRefresh = false) => api.post('/fmcsa/sync-violations', { forceRefresh }),
  // Public lookup (for registration)
  lookup: (dotNumber) => api.get(`/fmcsa/lookup/${dotNumber}`),
  verify: (dotNumber) => api.get(`/fmcsa/verify/${dotNumber}`)
};

// Inspections API - DOT Inspection Upload
export const inspectionsAPI = {
  upload: (formData) => api.post('/inspections/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  confirm: (data) => api.post('/inspections/confirm', data),
  dispute: (violationId, data) => api.post(`/inspections/${violationId}/dispute`, data),
  getViolationCodes: (params) => api.get('/inspections/violation-codes', { params }),
  lookupCode: (code) => api.post('/inspections/lookup-code', { code }),
  getAiStatus: () => api.get('/inspections/ai-status')
};

// Smart Document Upload API
export const smartUploadAPI = {
  upload: (formData) => api.post('/documents/smart-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  applyExtraction: (documentId, data) => api.post(`/documents/${documentId}/apply-extraction`, data),
  getAiStatus: () => api.get('/documents/ai-status')
};

// Templates API - Document Template Generation
export const templatesAPI = {
  getAll: () => api.get('/templates'),
  getByKey: (templateKey) => api.get(`/templates/${templateKey}`),
  preview: (templateKey, data) => api.post(`/templates/${templateKey}/preview`, { data }),
  validate: (templateKey, data) => api.post(`/templates/${templateKey}/validate`, { data }),
  generate: (templateKey, data, options = {}) => api.post(`/templates/${templateKey}/generate`, {
    data,
    saveToDocuments: options.saveToDocuments,
    documentName: options.documentName,
    driverId: options.driverId,
    vehicleId: options.vehicleId
  }, options.saveToDocuments ? {} : { responseType: 'blob' }),
  getByCategory: () => api.get('/templates/by/category')
};

// Tasks API - Compliance task management
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  complete: (id, notes) => api.patch(`/tasks/${id}/complete`, { notes }),
  reopen: (id) => api.patch(`/tasks/${id}/reopen`),
  getStats: () => api.get('/tasks/stats'),
  getOverdue: () => api.get('/tasks/overdue'),
  addNote: (id, content) => api.post(`/tasks/${id}/notes`, { content })
};

// Checklists API - Checklist templates and assignments
export const checklistsAPI = {
  // Templates
  getTemplates: (params) => api.get('/checklists/templates', { params }),
  getTemplate: (id) => api.get(`/checklists/templates/${id}`),
  createTemplate: (data) => api.post('/checklists/templates', data),
  updateTemplate: (id, data) => api.put(`/checklists/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/checklists/templates/${id}`),
  seedDefaults: () => api.post('/checklists/seed-defaults'),
  // Assignments
  getAssignments: (params) => api.get('/checklists/assignments', { params }),
  getAssignment: (id) => api.get(`/checklists/assignments/${id}`),
  createAssignment: (data) => api.post('/checklists/assignments', data),
  deleteAssignment: (id) => api.delete(`/checklists/assignments/${id}`),
  toggleItem: (id, itemId, notes) => api.patch(`/checklists/assignments/${id}/items/${itemId}`, { notes }),
  addNote: (id, content) => api.post(`/checklists/assignments/${id}/notes`, { content }),
  getStats: () => api.get('/checklists/assignments/stats')
};

// Maintenance API - Vehicle maintenance records
export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
  getStats: () => api.get('/maintenance/stats'),
  getUpcoming: (days = 30) => api.get('/maintenance/upcoming', { params: { days } }),
  getOverdue: () => api.get('/maintenance/overdue'),
  getVehicleHistory: (vehicleId, params) => api.get(`/maintenance/vehicle/${vehicleId}`, { params }),
  correctDefect: (id, defectIndex) => api.post(`/maintenance/${id}/defects/${defectIndex}/correct`),
  exportVehicle: (vehicleId) => api.get(`/maintenance/export/vehicle/${vehicleId}`, { responseType: 'blob' }),
  // Document upload
  uploadDocument: (id, file, documentType = 'other', name = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (name) formData.append('name', name);
    return api.post(`/maintenance/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteDocument: (id, docId) => api.delete(`/maintenance/${id}/documents/${docId}`),
  // AI Smart Upload
  smartUpload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/maintenance/smart-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    });
  }
};

// Admin API - Platform administration (super admin only)
export const adminAPI = {
  // Stats
  getStats: () => api.get('/admin/stats'),

  // Analytics
  getAnalytics: () => api.get('/admin/analytics'),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  impersonateUser: (id) => api.post(`/admin/users/${id}/impersonate`),
  updateSubscription: (id, data) => api.patch(`/admin/users/${id}/subscription`, data),

  // User Power Tools
  createUser: (data) => api.post('/admin/users', data),
  forcePasswordReset: (id) => api.post(`/admin/users/${id}/force-reset`),
  getLoginHistory: (id) => api.get(`/admin/users/${id}/login-history`),
  getUserAuditLog: (id) => api.get(`/admin/users/${id}/audit-log`),
  bulkAction: (data) => api.post('/admin/users/bulk', data),

  // Companies
  getCompanies: (params) => api.get('/admin/companies', { params }),
  getCompany: (id) => api.get(`/admin/companies/${id}`),
  deleteCompany: (id) => api.delete(`/admin/companies/${id}`),

  // Company Power Tools
  updateCompany: (id, data) => api.patch(`/admin/companies/${id}`, data),
  removeCompanyMember: (companyId, userId) => api.delete(`/admin/companies/${companyId}/members/${userId}`),
  updateCompanyMemberRole: (companyId, userId, data) => api.patch(`/admin/companies/${companyId}/members/${userId}`, data),

  // System & Operations
  getSystemHealth: () => api.get('/admin/system'),
  getEmails: (params) => api.get('/admin/emails', { params }),
  getEmail: (id) => api.get(`/admin/emails/${id}`),
  getEmailStats: () => api.get('/admin/emails/stats'),

  // Announcements
  getAnnouncements: (params) => api.get('/admin/announcements', { params }),
  createAnnouncement: (data) => api.post('/admin/announcements', data),
  updateAnnouncement: (id, data) => api.put(`/admin/announcements/${id}`, data),
  toggleAnnouncement: (id) => api.patch(`/admin/announcements/${id}/toggle`),
  deleteAnnouncement: (id) => api.delete(`/admin/announcements/${id}`),

  // Feature Flags
  getFeatureFlags: () => api.get('/admin/features'),
  createFeatureFlag: (data) => api.post('/admin/features', data),
  updateFeatureFlag: (id, data) => api.put(`/admin/features/${id}`, data),
  toggleFeatureFlag: (id) => api.patch(`/admin/features/${id}/toggle`),
  deleteFeatureFlag: (id) => api.delete(`/admin/features/${id}`),

  // Maintenance
  getMaintenanceStatus: () => api.get('/admin/maintenance'),
  setMaintenanceMode: (data) => api.post('/admin/maintenance', data),

  // Data Integrity
  getDataIntegrity: () => api.get('/admin/data-integrity'),
  getDataIntegrityFull: () => api.get('/admin/data-integrity/full'),
  getDataIntegrityDetails: (resource) => api.get(`/admin/data-integrity/details/${resource}`),
  deleteOrphanedRecords: (resource) => api.delete(`/admin/data-integrity/orphaned/${resource}`),
  deleteAllOrphanedRecords: () => api.delete('/admin/data-integrity/orphaned'),
  deleteInvalidReferences: (resource, field) => api.delete(`/admin/data-integrity/invalid-refs/${resource}/${field}`),

  // Audit Logs
  getAuditLogs: (params) => api.get('/audit', { params }),
  exportAuditLogs: (params) => api.get('/audit/export', { params, responseType: 'blob' }),

  // Revenue Dashboard
  getRevenue: () => api.get('/admin/revenue'),

  // User Analytics
  getUserAnalytics: () => api.get('/admin/user-analytics'),

  // Platform Alerts
  getPlatformAlerts: () => api.get('/admin/platform-alerts'),

  // Support Tickets (Admin)
  getTickets: (params) => api.get('/admin/tickets', { params }),
  updateTicket: (id, data) => api.patch(`/admin/tickets/${id}`, data),
};

// Audit API - Company-scoped audit logs (owner/admin)
export const auditAPI = {
  getLogs: (params) => api.get('/audit', { params }),
  exportLogs: (params) => api.get('/audit/export', { params, responseType: 'blob' }),
};

// Integrations API - External integrations (Samsara, etc.)
export const integrationsAPI = {
  // Samsara
  getSamsaraStatus: () => api.get('/integrations/samsara/status'),
  connectSamsara: (apiKey) => api.post('/integrations/samsara/connect', { apiKey }),
  disconnectSamsara: () => api.post('/integrations/samsara/disconnect'),
  syncSamsara: () => api.post('/integrations/samsara/sync'),
  updateSamsaraSettings: (settings) => api.put('/integrations/samsara/settings', settings),
  getPendingSamsara: () => api.get('/integrations/samsara/pending'),
  matchSamsaraRecord: (samsaraRecordId, vroomxRecordId, recordType) =>
    api.post('/integrations/samsara/match', { samsaraRecordId, vroomxRecordId, recordType }),
  createFromSamsara: (samsaraRecordId, additionalData) =>
    api.post('/integrations/samsara/create', { samsaraRecordId, additionalData }),
  skipSamsaraRecord: (samsaraRecordId) => api.post('/integrations/samsara/skip', { samsaraRecordId }),
  refreshTelematics: (vehicleId) => api.post(`/integrations/samsara/refresh-telematics/${vehicleId}`),
};

// Announcements API - Public announcements
export const announcementsAPI = {
  getActive: () => api.get('/announcements/active'),
};

// Report Templates API - Save/load report configurations
export const reportTemplatesAPI = {
  getAll: (params) => api.get('/report-templates', { params }),
  getById: (id) => api.get(`/report-templates/${id}`),
  create: (data) => api.post('/report-templates', data),
  update: (id, data) => api.put(`/report-templates/${id}`, data),
  delete: (id) => api.delete(`/report-templates/${id}`),
  duplicate: (id) => api.post(`/report-templates/${id}/duplicate`)
};
