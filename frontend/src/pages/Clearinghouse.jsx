import { useState, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiShield, FiSearch, FiAlertTriangle, FiRefreshCw, FiFileText } from 'react-icons/fi';
import TabNav from '../components/TabNav';
import LoadingSpinner from '../components/LoadingSpinner';

const ClearinghouseOverview = lazy(() => import('../components/clearinghouse/ClearinghouseOverview'));
const ClearinghouseQueries = lazy(() => import('../components/clearinghouse/ClearinghouseQueries'));
const ClearinghouseViolations = lazy(() => import('../components/clearinghouse/ClearinghouseViolations'));
const ClearinghouseRTD = lazy(() => import('../components/clearinghouse/ClearinghouseRTD'));
const ClearinghouseConsent = lazy(() => import('../components/clearinghouse/ClearinghouseConsent'));

const tabs = [
  { key: 'overview', label: 'Overview', icon: FiShield },
  { key: 'queries', label: 'Query Management', icon: FiSearch },
  { key: 'violations', label: 'Violation Reporting', icon: FiAlertTriangle },
  { key: 'rtd', label: 'Return to Duty', icon: FiRefreshCw },
  { key: 'consent', label: 'Consent & Records', icon: FiFileText }
];

const Clearinghouse = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'overview');

  const fallback = (
    <div className="flex justify-center py-16">
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Clearinghouse</h1>
        <p className="text-zinc-600 dark:text-zinc-300">FMCSA Drug & Alcohol Clearinghouse query management and compliance tracking</p>
      </div>

      {/* Tab Navigation */}
      <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <Suspense fallback={fallback}>
        {activeTab === 'overview' && <ClearinghouseOverview onTabChange={setActiveTab} />}
        {activeTab === 'queries' && <ClearinghouseQueries />}
        {activeTab === 'violations' && <ClearinghouseViolations />}
        {activeTab === 'rtd' && <ClearinghouseRTD />}
        {activeTab === 'consent' && <ClearinghouseConsent />}
      </Suspense>
    </div>
  );
};

export default Clearinghouse;
