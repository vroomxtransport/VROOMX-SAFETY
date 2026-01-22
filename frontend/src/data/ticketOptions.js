// Ticket Options - Extracted from Tickets.jsx

export const ticketTypes = [
  { value: 'speeding', label: 'Speeding' },
  { value: 'logbook', label: 'Logbook Violation' },
  { value: 'equipment', label: 'Equipment Violation' },
  { value: 'parking', label: 'Parking' },
  { value: 'weight', label: 'Overweight' },
  { value: 'lane_violation', label: 'Lane Violation' },
  { value: 'red_light', label: 'Red Light' },
  { value: 'stop_sign', label: 'Stop Sign' },
  { value: 'reckless', label: 'Reckless Driving' },
  { value: 'other', label: 'Other' }
];

export const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'pending_court', label: 'Pending Court' },
  { value: 'fighting', label: 'Fighting' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'paid', label: 'Paid' },
  { value: 'points_reduced', label: 'Points Reduced' },
  { value: 'deferred', label: 'Deferred' }
];

export const courtDecisionOptions = [
  { value: 'not_yet', label: 'Not Yet' },
  { value: 'guilty', label: 'Guilty' },
  { value: 'not_guilty', label: 'Not Guilty' },
  { value: 'reduced', label: 'Reduced' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'deferred', label: 'Deferred' }
];

export const dataQOptions = [
  { value: 'not_filed', label: 'Not Filed' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'denied', label: 'Denied' }
];

export const initialFormData = {
  driverId: '',
  ticketDate: new Date().toISOString().split('T')[0],
  description: '',
  ticketType: 'speeding',
  ticketNumber: '',
  status: 'open',
  courtDate: '',
  courtDecision: 'not_yet',
  dataQDecision: 'not_filed',
  fineAmount: 0,
  points: 0,
  notes: '',
  location: { city: '', state: '' },
  attorney: { name: '', phone: '', firm: '' }
};

export const getStatusBadgeType = (status) => {
  switch (status) {
    case 'open': return 'warning';
    case 'pending_court': return 'info';
    case 'fighting': return 'info';
    case 'dismissed': return 'success';
    case 'paid': return 'success';
    case 'points_reduced': return 'success';
    case 'deferred': return 'warning';
    default: return 'default';
  }
};
