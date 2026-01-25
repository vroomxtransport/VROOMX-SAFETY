import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
  getFMCSAStatus: () => api.get('/dashboard/fmcsa-status')
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
  addMvr: (id, data) => api.post(`/drivers/${id}/mvr`, data)
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
  addDvir: (id, data) => api.post(`/vehicles/${id}/dvir`, data)
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
  })
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
  getDqfReport: (params) => api.get('/reports/dqf', { params, responseType: params.format === 'pdf' ? 'blob' : 'json' }),
  getVehicleMaintenanceReport: (params) => api.get('/reports/vehicle-maintenance', { params, responseType: params.format === 'pdf' ? 'blob' : 'json' }),
  getViolationsReport: (params) => api.get('/reports/violations', { params, responseType: params.format === 'pdf' ? 'blob' : 'json' }),
  getAuditReport: (params) => api.get('/reports/audit', { params, responseType: params.format === 'pdf' ? 'blob' : 'json' })
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
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
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
  reactivateSubscription: () => api.post('/billing/reactivate')
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
  })
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
  exportVehicle: (vehicleId) => api.get(`/maintenance/export/vehicle/${vehicleId}`, { responseType: 'blob' })
};

// Admin API - Platform administration (super admin only)
export const adminAPI = {
  // Stats
  getStats: () => api.get('/admin/stats'),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  impersonateUser: (id) => api.post(`/admin/users/${id}/impersonate`),
  updateSubscription: (id, data) => api.patch(`/admin/users/${id}/subscription`, data),

  // Companies
  getCompanies: (params) => api.get('/admin/companies', { params }),
  getCompany: (id) => api.get(`/admin/companies/${id}`)
};
