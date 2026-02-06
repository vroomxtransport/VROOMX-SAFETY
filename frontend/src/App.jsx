import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Blog from './pages/Blog';
import CSACheckerPage from './pages/CSACheckerPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Platform from './pages/Platform';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import AcceptInvitation from './pages/AcceptInvitation';
import Drivers from './pages/Drivers';
import Vehicles from './pages/Vehicles';
import Violations from './pages/Violations';
import Tickets from './pages/Tickets';
import DamageClaims from './pages/DamageClaims';
import DrugAlcohol from './pages/DrugAlcohol';
import Documents from './pages/Documents';
import ScheduledReports from './pages/ScheduledReports';
import RegulationAssistant from './pages/RegulationAssistant';
import AlertsDashboard from './pages/AlertsDashboard';
import TemplateGenerator from './pages/TemplateGenerator';
import Tasks from './pages/Tasks';
import Checklists from './pages/Checklists';
import Maintenance from './pages/Maintenance';
import Accidents from './pages/Accidents';
import Policies from './pages/Policies';
import Integrations from './pages/Integrations';
import DataQDashboard from './pages/DataQDashboard';
import LoadingSpinner from './components/LoadingSpinner';
import PageTransition from './components/PageTransition';
import ChatWidget from './components/AIChat/ChatWidget';
import NotFound from './pages/NotFound';

// Lazy load chart-heavy and large pages to reduce initial bundle size
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Compliance = lazy(() => import('./pages/Compliance'));
const UnlinkedViolations = lazy(() => import('./pages/UnlinkedViolations'));
const DriverDetail = lazy(() => import('./pages/DriverDetail'));
const VehicleDetail = lazy(() => import('./pages/VehicleDetail'));
const Billing = lazy(() => import('./pages/Billing'));
const Settings = lazy(() => import('./pages/Settings'));
const Reports = lazy(() => import('./pages/Reports'));

// Admin pages - lazy loaded
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCompanies = lazy(() => import('./pages/admin/AdminCompanies'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs'));
const AdminEmails = lazy(() => import('./pages/admin/AdminEmails'));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'));
const AdminFeatureFlags = lazy(() => import('./pages/admin/AdminFeatureFlags'));
const AdminDataIntegrity = lazy(() => import('./pages/admin/AdminDataIntegrity'));
const AdminRevenue = lazy(() => import('./pages/admin/AdminRevenue'));
const AdminAlerts = lazy(() => import('./pages/admin/AdminAlerts'));
const AdminTickets = lazy(() => import('./pages/admin/AdminTickets'));

// Design Demos - lazy loaded, dev only
const EnterpriseDemo = lazy(() => import('./pages/designs/EnterpriseDemo'));
const MinimalistDemo = lazy(() => import('./pages/designs/MinimalistDemo'));
const DiffV1 = lazy(() => import('./pages/designs/DiffV1'));
const DiffV2 = lazy(() => import('./pages/designs/DiffV2'));
const DiffV3 = lazy(() => import('./pages/designs/DiffV3'));
const FooterPreview = lazy(() => import('./pages/FooterPreview'));

// Protected route wrapper
const ProtectedRoute = ({ children, allowPendingPayment = false }) => {
  const { isAuthenticated, loading, subscription } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Block users with pending_payment (Solo tier unpaid) unless explicitly allowed
  if (!allowPendingPayment && subscription?.status === 'pending_payment') {
    return <Navigate to="/app/billing" replace />;
  }

  return children;
};

// Legacy redirect helpers for dynamic routes
const LegacyDriverRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/app/drivers/${id}`} replace />;
};

const LegacyVehicleRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/app/vehicles/${id}`} replace />;
};

// Public route wrapper (redirects to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Don't block public routes while checking auth - render immediately
  // If user is logged in, redirect after auth check completes
  if (!loading && isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
};

// Super admin route wrapper (requires superadmin role)
const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isSuperAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <PageTransition />
      <Routes>
        {/* Landing page - public, redirects to dashboard if logged in */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          }
        />

        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Email token flow pages - public */}
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />

        {/* Design Demos (dev only) */}
        {import.meta.env.DEV && (
          <>
            <Route path="/design/enterprise" element={<Suspense fallback={<LoadingSpinner size="lg" />}><EnterpriseDemo /></Suspense>} />
            <Route path="/design/minimalist" element={<Suspense fallback={<LoadingSpinner size="lg" />}><MinimalistDemo /></Suspense>} />
            <Route path="/design/diff-v1" element={<Suspense fallback={<LoadingSpinner size="lg" />}><DiffV1 /></Suspense>} />
            <Route path="/design/diff-v2" element={<Suspense fallback={<LoadingSpinner size="lg" />}><DiffV2 /></Suspense>} />
            <Route path="/design/diff-v3" element={<Suspense fallback={<LoadingSpinner size="lg" />}><DiffV3 /></Suspense>} />
            <Route path="/design/footer-preview" element={<Suspense fallback={<LoadingSpinner size="lg" />}><FooterPreview /></Suspense>} />
          </>
        )}

        {/* Blog - public, accessible to everyone */}
        <Route path="/blog" element={<Blog />} />

        {/* CSA Checker - public lead magnet */}
        <Route path="/csa-checker" element={<CSACheckerPage />} />

        {/* Legal Pages - public */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* Platform Page - public showcase */}
        <Route path="/platform" element={<Platform />} />

        {/* Pricing Page - public */}
        <Route path="/pricing" element={<Pricing />} />

        {/* Billing route - allows pending_payment users */}
        <Route
          path="/app/billing"
          element={
            <ProtectedRoute allowPendingPayment={true}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Suspense fallback={<LoadingSpinner size="lg" />}><Billing /></Suspense>} />
        </Route>

        {/* Protected routes - blocks pending_payment users */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<LoadingSpinner size="lg" />}><Dashboard /></Suspense>} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="drivers/:id" element={<Suspense fallback={<LoadingSpinner size="lg" />}><DriverDetail /></Suspense>} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="vehicles/:id" element={<Suspense fallback={<LoadingSpinner size="lg" />}><VehicleDetail /></Suspense>} />
          <Route path="violations" element={<Violations />} />
          <Route path="unlinked-violations" element={<Suspense fallback={<LoadingSpinner size="lg" />}><UnlinkedViolations /></Suspense>} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="damage-claims" element={<DamageClaims />} />
          <Route path="drug-alcohol" element={<DrugAlcohol />} />
          <Route path="documents" element={<Documents />} />
          <Route path="compliance" element={<Suspense fallback={<LoadingSpinner size="lg" />}><Compliance /></Suspense>} />
          <Route path="reports" element={<Suspense fallback={<LoadingSpinner size="lg" />}><Reports /></Suspense>} />
          <Route path="scheduled-reports" element={<ScheduledReports />} />
          <Route path="inspection-history" element={<Navigate to="/app/compliance" replace />} />
          <Route path="settings" element={<Suspense fallback={<LoadingSpinner size="lg" />}><Settings /></Suspense>} />
          <Route path="ai-assistant" element={<RegulationAssistant />} />
          <Route path="alerts" element={<AlertsDashboard />} />
          <Route path="csa-estimator" element={<Navigate to="/app/compliance" replace />} />
          <Route path="inspection-upload" element={<Navigate to="/app/compliance" replace />} />
          <Route path="templates" element={<TemplateGenerator />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="checklists" element={<Checklists />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="accidents" element={<Accidents />} />
          <Route path="policies" element={<Policies />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="dataq-dashboard" element={<DataQDashboard />} />
        </Route>

        {/* Legacy routes - redirect to /app prefix */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/drivers" element={<Navigate to="/app/drivers" replace />} />
        <Route path="/drivers/:id" element={<LegacyDriverRedirect />} />
        <Route path="/vehicles" element={<Navigate to="/app/vehicles" replace />} />
        <Route path="/vehicles/:id" element={<LegacyVehicleRedirect />} />
        <Route path="/violations" element={<Navigate to="/app/violations" replace />} />
        <Route path="/tickets" element={<Navigate to="/app/tickets" replace />} />
        <Route path="/damage-claims" element={<Navigate to="/app/damage-claims" replace />} />
        <Route path="/drug-alcohol" element={<Navigate to="/app/drug-alcohol" replace />} />
        <Route path="/documents" element={<Navigate to="/app/documents" replace />} />
        <Route path="/compliance" element={<Navigate to="/app/compliance" replace />} />
        <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
        <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

        {/* Admin routes - requires superadmin role */}
        <Route
          path="/admin"
          element={
            <SuperAdminRoute>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
                <AdminLayout />
              </Suspense>
            </SuperAdminRoute>
          }
        >
          <Route index element={<Suspense fallback={<LoadingSpinner size="lg" />}><AdminDashboard /></Suspense>} />
          <Route path="revenue" element={<Suspense fallback={<LoadingSpinner size="lg" />}><AdminRevenue /></Suspense>} />
          <Route path="alerts" element={<Suspense fallback={<LoadingSpinner size="lg" />}><AdminAlerts /></Suspense>} />
          <Route path="users" element={<Suspense fallback={<LoadingSpinner size="lg" />}><AdminUsers /></Suspense>} />
          <Route path="companies" element={<Suspense fallback={<LoadingSpinner size="lg" />}><AdminCompanies /></Suspense>} />
          <Route path="tickets" element={<Suspense fallback={<LoadingSpinner size="lg" />}><AdminTickets /></Suspense>} />
          <Route path="emails" element={<Suspense fallback={<LoadingSpinner size="lg" />}><AdminEmails /></Suspense>} />
          <Route path="announcements" element={<Suspense fallback={<LoadingSpinner size="lg" />}><AdminAnnouncements /></Suspense>} />
          <Route path="features" element={<Suspense fallback={<LoadingSpinner size="lg" />}><AdminFeatureFlags /></Suspense>} />
          <Route path="data-integrity" element={<Suspense fallback={<LoadingSpinner size="lg" />}><AdminDataIntegrity /></Suspense>} />
          <Route path="audit-logs" element={<Suspense fallback={<LoadingSpinner size="lg" />}><AdminAuditLogs /></Suspense>} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Floating AI Chat Widget - only show when authenticated */}
      {isAuthenticated && <ChatWidget />}
    </>
  );
}

export default App;
