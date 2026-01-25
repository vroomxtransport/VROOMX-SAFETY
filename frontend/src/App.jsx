import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Blog from './pages/Blog';
import CSACheckerPage from './pages/CSACheckerPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import DriverDetail from './pages/DriverDetail';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import Violations from './pages/Violations';
import Tickets from './pages/Tickets';
import DamageClaims from './pages/DamageClaims';
import DrugAlcohol from './pages/DrugAlcohol';
import Documents from './pages/Documents';
import Compliance from './pages/Compliance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import RegulationAssistant from './pages/RegulationAssistant';
import AlertsDashboard from './pages/AlertsDashboard';
import TemplateGenerator from './pages/TemplateGenerator';
import LoadingSpinner from './components/LoadingSpinner';
import ChatWidget from './components/AIChat/ChatWidget';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCompanies from './pages/admin/AdminCompanies';

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
    return <Navigate to="/dashboard" replace />;
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

      {/* Blog - public, accessible to everyone */}
      <Route path="/blog" element={<Blog />} />

      {/* CSA Checker - public lead magnet */}
      <Route path="/csa-checker" element={<CSACheckerPage />} />

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
        <Route path="violations" element={<Violations />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="damage-claims" element={<DamageClaims />} />
        <Route path="drug-alcohol" element={<DrugAlcohol />} />
        <Route path="documents" element={<Documents />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="ai-assistant" element={<RegulationAssistant />} />
        <Route path="alerts" element={<AlertsDashboard />} />
        <Route path="csa-estimator" element={<Navigate to="/app/compliance" replace />} />
        <Route path="inspection-upload" element={<Navigate to="/app/violations" replace />} />
        <Route path="templates" element={<TemplateGenerator />} />
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
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>

    {/* Floating AI Chat Widget - only show when authenticated */}
    {isAuthenticated && <ChatWidget />}
    </>
  );
}

export default App;
