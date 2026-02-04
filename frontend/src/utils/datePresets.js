import { subDays, startOfQuarter, startOfYear, format } from 'date-fns';

/**
 * Get date range presets for report filtering
 * @returns {Array<{key: string, label: string, startDate: string, endDate: string}>}
 */
export const getDatePresets = () => {
  const today = new Date();
  const formatDate = (date) => format(date, 'yyyy-MM-dd');

  return [
    {
      key: 'last30',
      label: 'Last 30 Days',
      startDate: formatDate(subDays(today, 30)),
      endDate: formatDate(today)
    },
    {
      key: 'thisQuarter',
      label: 'This Quarter',
      startDate: formatDate(startOfQuarter(today)),
      endDate: formatDate(today)
    },
    {
      key: 'ytd',
      label: 'Year to Date',
      startDate: formatDate(startOfYear(today)),
      endDate: formatDate(today)
    },
    {
      key: 'custom',
      label: 'Custom',
      startDate: '',
      endDate: ''
    }
  ];
};

/**
 * Determine which preset matches the given date range
 * @param {string} startDate - Start date in yyyy-MM-dd format
 * @param {string} endDate - End date in yyyy-MM-dd format
 * @returns {string} The matching preset key, or 'custom' if no match
 */
export const getActivePreset = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return 'custom';
  }

  const presets = getDatePresets();

  for (const preset of presets) {
    if (preset.key === 'custom') continue;
    if (preset.startDate === startDate && preset.endDate === endDate) {
      return preset.key;
    }
  }

  return 'custom';
};
