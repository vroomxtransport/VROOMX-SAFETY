/**
 * Report filter configuration per report type
 * Defines which filters are enabled and what options are available for each report
 */
export const REPORT_FILTER_CONFIG = {
  dqf: {
    enableDateRange: true,
    enableDriverFilter: true,
    enableVehicleFilter: false,
    enableStatusFilter: true,
    dateFilterField: 'hireDate',
    statusOptions: [
      { value: '', label: 'All Status' },
      { value: 'compliant', label: 'Compliant' },
      { value: 'warning', label: 'Warning' },
      { value: 'non_compliant', label: 'Non-Compliant' }
    ]
  },

  vehicle: {
    enableDateRange: true,
    enableDriverFilter: false,
    enableVehicleFilter: true,
    enableStatusFilter: true,
    dateFilterField: 'annualInspection.nextDueDate',
    statusOptions: [
      { value: '', label: 'All Status' },
      { value: 'compliant', label: 'Compliant' },
      { value: 'warning', label: 'Warning' },
      { value: 'non_compliant', label: 'Non-Compliant' },
      { value: 'out_of_service', label: 'Out of Service' }
    ]
  },

  violations: {
    enableDateRange: true,
    enableDriverFilter: true,
    enableVehicleFilter: true,
    enableStatusFilter: true,
    dateFilterField: 'violationDate',
    statusOptions: [
      { value: '', label: 'All Status' },
      { value: 'open', label: 'Open' },
      { value: 'dispute_in_progress', label: 'Dispute in Progress' },
      { value: 'resolved', label: 'Resolved' },
      { value: 'dismissed', label: 'Dismissed' },
      { value: 'upheld', label: 'Upheld' }
    ]
  },

  audit: {
    enableDateRange: false,
    enableDriverFilter: false,
    enableVehicleFilter: false,
    enableStatusFilter: false,
    dateFilterField: null,
    statusOptions: []
  }
};
