// Damage Claim Options - Extracted from DamageClaims.jsx

export const damageTypes = [
  { value: 'cargo_damage', label: 'Cargo Damage' },
  { value: 'vehicle_damage', label: 'Vehicle Damage' },
  { value: 'property_damage', label: 'Property Damage' },
  { value: 'third_party', label: 'Third Party Damage' },
  { value: 'other', label: 'Other' }
];

export const faultParties = [
  { value: 'unknown', label: 'UNKNOWN' },
  { value: 'driver', label: 'DRIVER' },
  { value: 'company', label: 'COMPANY' },
  { value: 'third_party', label: 'THIRD PARTY' },
  { value: 'weather', label: 'WEATHER/ACT OF GOD' },
  { value: 'mechanical', label: 'MECHANICAL FAILURE' }
];

export const statusOptions = [
  { value: 'open', label: 'OPEN' },
  { value: 'under_investigation', label: 'UNDER INVESTIGATION' },
  { value: 'pending_settlement', label: 'PENDING SETTLEMENT' },
  { value: 'settled', label: 'SETTLED' },
  { value: 'closed', label: 'CLOSED' },
  { value: 'denied', label: 'DENIED' }
];

export const initialFormData = {
  incidentDate: new Date().toISOString().split('T')[0],
  claimNumber: '',
  vehicleId: '',
  driverId: '',
  tripId: '',
  damageType: 'cargo_damage',
  faultParty: 'unknown',
  status: 'open',
  description: '',
  claimAmount: 0,
  settlementAmount: 0,
  insuranceClaimNumber: '',
  location: '',
  resolutionNotes: ''
};

export const getStatusBadgeType = (status) => {
  switch (status) {
    case 'open': return 'warning';
    case 'under_investigation': return 'info';
    case 'pending_settlement': return 'info';
    case 'settled': return 'success';
    case 'closed': return 'success';
    case 'denied': return 'danger';
    default: return 'default';
  }
};

export const getDamageTypeLabel = (type) => {
  return damageTypes.find(t => t.value === type)?.label || type;
};

export const getFaultLabel = (fault) => {
  return faultParties.find(f => f.value === fault)?.label || fault;
};
