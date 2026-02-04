import { useState, useEffect, useCallback } from 'react';
import DateRangeFilter from './DateRangeFilter';
import MultiSelectDropdown from './MultiSelectDropdown';
import StatusFilter from './StatusFilter';

const ReportFilters = ({
  onFilterChange,
  enableDateRange = false,
  enableDriverFilter = false,
  enableVehicleFilter = false,
  enableStatusFilter = false,
  drivers = [],
  vehicles = [],
  statusOptions = [],
  initialFilters = {}
}) => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    driverIds: [],
    vehicleIds: [],
    status: '',
    ...initialFilters
  });

  // Debounce filter changes (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  const handleDateChange = useCallback((startDate, endDate) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  }, []);

  const handleDriversChange = useCallback((driverIds) => {
    setFilters(prev => ({ ...prev, driverIds }));
  }, []);

  const handleVehiclesChange = useCallback((vehicleIds) => {
    setFilters(prev => ({ ...prev, vehicleIds }));
  }, []);

  const handleStatusChange = useCallback((status) => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  // Check if any filters are enabled
  const hasFilters = enableDateRange || enableDriverFilter || enableVehicleFilter || enableStatusFilter;

  if (!hasFilters) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-4">
      <div className="flex flex-col gap-4">
        {enableDateRange && (
          <DateRangeFilter
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={handleDateChange}
          />
        )}
        <div className="flex flex-wrap gap-4">
          {enableDriverFilter && (
            <MultiSelectDropdown
              label="Drivers"
              options={drivers.map(d => ({
                value: d._id,
                label: `${d.firstName} ${d.lastName}`
              }))}
              selected={filters.driverIds}
              onChange={handleDriversChange}
              placeholder="All Drivers"
            />
          )}
          {enableVehicleFilter && (
            <MultiSelectDropdown
              label="Vehicles"
              options={vehicles.map(v => ({
                value: v._id,
                label: v.unitNumber
              }))}
              selected={filters.vehicleIds}
              onChange={handleVehiclesChange}
              placeholder="All Vehicles"
            />
          )}
          {enableStatusFilter && statusOptions.length > 0 && (
            <StatusFilter
              options={statusOptions}
              value={filters.status}
              onChange={handleStatusChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
