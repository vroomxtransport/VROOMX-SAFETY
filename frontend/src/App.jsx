import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { FeatureFlagProvider } from './context/FeatureFlagContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ChatWidget from './components/AIChat/ChatWidget';

// Lazy load all pages to reduce initial bundle size
// Public pages
const Landing = lazy(() => import('./pages/Landing'));
const Blog = lazy(() => import('./pages/Blog'));
const CSACheckerPage = lazy(() => import('./pages/CSACheckerPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Platform = lazy(() => import('./pages/Platform'));
const Pricing = lazy(() => import('./pages/Pricing'));

// Auth pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AcceptInvitation = lazy(() => import('./pages/AcceptInvitation'));

// App pages
const Drivers = lazy(() => import('./pages/Drivers'));
const DriverDetail = lazy(() => import('./pages/DriverDetail'));
const Vehicles = lazy(() => import('./pages/Vehicles'));
const VehicleDetail = lazy(() => import('./pages/VehicleDetail'));
const Violations = lazy(() => import('./pages/Violations'));
const Tickets = lazy(() => import('./pages/Tickets'));
const DamageClaims = lazy(() => import('./pages/DamageClaims'));
const DrugAlcohol = lazy(() => import('./pages/DrugAlcohol'));
const Documents = lazy(() => import('./pages/Documents'));
const Reports = lazy(() => import('./pages/Reports'));
const ScheduledReports = lazy(() => import('./pages/ScheduledReports'));
const InspectionHistory = lazy(() => import('./pages/InspectionHistory'));
const Settings = lazy(() => import('./pages/Settings'));
const Billing = lazy(() => import('./pages/Billing'));
const RegulationAssistant = lazy(() => import('./pages/RegulationAssistant'));
const AlertsDashboard = lazy(() => import('./pages/AlertsDashboard'));
const TemplateGenerator = lazy(() => import('./pages/TemplateGenerator'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Checklists = lazy(() => import('./pages/Checklists'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const Accidents = lazy(() => import('./pages/Accidents'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Chart-heavy pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Compliance = lazy(() => import('./pages/Compliance'));

// Admin pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCompanies = lazy(() => import('./pages/admin/AdminCompanies'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs'));
const AdminEmails = lazy(() => import('./pages/admin/AdminEmails'));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'));
const AdminFeatureFlags = lazy(() => import('./pages/admin/AdminFeatureFlags'));
const AdminDataIntegrity = lazy(() => import('./pages/admin/AdminDataIntegrity'));

// Design demos
const EnterpriseDemo = lazy(() => import('./pages/designs/EnterpriseDemo'));
const MinimalistDemo = lazy(() => import('./pages/designs/MinimalistDemo'));

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
      <Suspense fallback={<LoadingSpinner size="lg" />}>
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
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="drivers/:id" element={<DriverDetail />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="vehicles/:id" element={<VehicleDetail />} />
          <Route path="violations" element={<Navigate to="/app/compliance" replace />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="damage-claims" element={<DamageClaims />} />
          <Route path="drug-alcohol" element={<DrugAlcohol />} />
          <Route path="documents" element={<Documents />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="scheduled-reports" element={<ScheduledReports />} />
          <Route path="inspection-history" element={<Navigate to="/app/compliance" replace />} />
          <Route path="settings" element={<Settings />} />
          <Route path="ai-assistant" element={<RegulationAssistant />} />
          <Route path="alerts" element={<AlertsDashboard />} />
          <Route path="csa-estimator" element={<Navigate to="/app/compliance" replace />} />
          <Route path="inspection-upload" element={<Navigate to="/app/compliance" replace />} />
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
        <Route path="/violations" element={<Navigate to="/app/compliance" replace />} />
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
      </Suspense>

      {/* Floating AI Chat Widget - only show when authenticated */}
      {isAuthenticated && <ChatWidget />}
    </FeatureFlagProvider>
  );
}

export default App;
