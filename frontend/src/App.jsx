import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { FeatureFlagProvider } from './context/FeatureFlagContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Blog from './pages/Blog';
import CSACheckerPage from './pages/CSACheckerPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Platform from './pages/Platform';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import AcceptInvitation from './pages/AcceptInvitation';
import Drivers from './pages/Drivers';
import DriverDetail from './pages/DriverDetail';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import Violations from './pages/Violations';
import Tickets from './pages/Tickets';
import DamageClaims from './pages/DamageClaims';
import DrugAlcohol from './pages/DrugAlcohol';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import RegulationAssistant from './pages/RegulationAssistant';
import AlertsDashboard from './pages/AlertsDashboard';
import TemplateGenerator from './pages/TemplateGenerator';
import Tasks from './pages/Tasks';
import Checklists from './pages/Checklists';
import Maintenance from './pages/Maintenance';
import Accidents from './pages/Accidents';
import LoadingSpinner from './components/LoadingSpinner';
import ChatWidget from './components/AIChat/ChatWidget';
import NotFound from './pages/NotFound';

// Lazy load chart-heavy pages to reduce initial bundle size
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Compliance = lazy(() => import('./pages/Compliance'));

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCompanies from './pages/admin/AdminCompanies';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminEmails from './pages/admin/AdminEmails';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminFeatureFlags from './pages/admin/AdminFeatureFlags';
import AdminDataIntegrity from './pages/admin/AdminDataIntegrity';

// Design Demos
import EnterpriseDemo from './pages/designs/EnterpriseDemo';
import MinimalistDemo from './pages/designs/MinimalistDemo';

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
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
    <FeatureFlagProvider>
      <Routes>
        {/* Landing page - public, redirects to dashboard if logged in */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />}
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

        {/* Design Demos (Public for preview) */}
        <Route path="/design/enterprise" element={<EnterpriseDemo />} />
        <Route path="/design/minimalist" element={<MinimalistDemo />} />

        {/* Blog - public, accessible to everyone */}
        <Route path="/blog" element={<Blog />} />

        {/* CSA Checker - public lead magnet */}
        <Route path="/csa-checker" element={<CSACheckerPage />} />

        {/* Legal Pages - public */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* Platform Page - public showcase */}
        <Route path="/platform" element={<Platform />} />

        {/* Billing route - allows pending_payment users */}
        <Route
          path="/app/billing"
          element={
            <ProtectedRoute allowPendingPayment={true}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Billing />} />
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
          <Route path="drivers/:id" element={<DriverDetail />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="vehicles/:id" element={<VehicleDetail />} />
          <Route path="violations" element={<Violations />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="damage-claims" element={<DamageClaims />} />
          <Route path="drug-alcohol" element={<DrugAlcohol />} />
          <Route path="documents" element={<Documents />} />
          <Route path="compliance" element={<Suspense fallback={<LoadingSpinner size="lg" />}><Compliance /></Suspense>} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="ai-assistant" element={<RegulationAssistant />} />
          <Route path="alerts" element={<AlertsDashboard />} />
          <Route path="csa-estimator" element={<Navigate to="/app/compliance" replace />} />
          <Route path="inspection-upload" element={<Navigate to="/app/violations" replace />} />
          <Route path="templates" element={<TemplateGenerator />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="checklists" element={<Checklists />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="accidents" element={<Accidents />} />
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
              <AdminLayout />
            </SuperAdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="companies" element={<AdminCompanies />} />
          <Route path="emails" element={<AdminEmails />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="features" element={<AdminFeatureFlags />} />
          <Route path="data-integrity" element={<AdminDataIntegrity />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Floating AI Chat Widget - only show when authenticated */}
      {isAuthenticated && <ChatWidget />}
    </FeatureFlagProvider>
  );
}

export default App;
