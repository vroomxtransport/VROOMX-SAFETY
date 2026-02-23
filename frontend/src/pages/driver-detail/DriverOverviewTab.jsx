import {
  FiUser, FiMail, FiPhone, FiCalendar, FiAward, FiFileText
} from 'react-icons/fi';
import { formatDate, formatPhone } from '../../utils/helpers';
import StatusBadge from '../../components/StatusBadge';

const DriverOverviewTab = ({ driver, cdlDays, medicalDays }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Profile Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold flex items-center gap-2">
            <FiUser className="w-4 h-4 text-primary-500" />
            Driver Profile
          </h3>
        </div>
        <div className="card-body space-y-4">
          {/* Contact Info */}
          <div className="space-y-3">
            {driver.email && (
              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                <FiMail className="w-4 h-4" />
                <span>{driver.email}</span>
              </div>
            )}
            {driver.phone && (
              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                <FiPhone className="w-4 h-4" />
                <span>{formatPhone(driver.phone)}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
              <FiCalendar className="w-4 h-4" />
              <span>Hired: {formatDate(driver.hireDate)}</span>
            </div>
            {driver.terminationDate && (
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <FiCalendar className="w-4 h-4" />
                <span>Terminated: {formatDate(driver.terminationDate)}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
              <FiUser className="w-4 h-4" />
              <span>DOB: {formatDate(driver.dateOfBirth)}</span>
            </div>
          </div>

          {/* Address */}
          {(driver.address?.street || driver.address?.city) && (
            <>
              <div className="border-t border-zinc-100 dark:border-zinc-800" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">Address</p>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {driver.address.street && <p>{driver.address.street}</p>}
                  <p>
                    {[driver.address.city, driver.address.state].filter(Boolean).join(', ')}
                    {driver.address.zipCode && ` ${driver.address.zipCode}`}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CDL & Medical Card Info */}
      <div className="space-y-6">
        {/* CDL Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold flex items-center gap-2">
              <FiAward className="w-4 h-4 text-primary-500" />
              CDL Information
            </h3>
          </div>
          <div className="card-body space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Number</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{driver.cdl?.number || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">State</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{driver.cdl?.state || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Class</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Class {driver.cdl?.class || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Endorsements</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {driver.cdl?.endorsements?.length > 0 ? driver.cdl.endorsements.join(', ') : 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Restrictions</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {driver.cdl?.restrictions?.length > 0 ? driver.cdl.restrictions.join(', ') : 'None'}
              </span>
            </div>
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-400">Expires</span>
                <div className="text-right">
                  <p className={`font-medium ${cdlDays !== null && cdlDays < 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {formatDate(driver.cdl?.expiryDate)}
                  </p>
                  <StatusBadge status={driver.complianceStatus?.cdlStatus} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold flex items-center gap-2">
              <FiFileText className="w-4 h-4 text-primary-500" />
              Medical Card
            </h3>
          </div>
          <div className="card-body space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-600 dark:text-zinc-400">Expires</span>
              <div className="text-right">
                <p className={`font-medium ${medicalDays !== null && medicalDays < 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                  {formatDate(driver.medicalCard?.expiryDate)}
                </p>
                <StatusBadge status={driver.complianceStatus?.medicalStatus} />
              </div>
            </div>
            {driver.medicalCard?.examinerName && (
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Examiner</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{driver.medicalCard.examinerName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverOverviewTab;
