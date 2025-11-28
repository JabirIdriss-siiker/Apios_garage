import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import TenantDashboard from './pages/TenantDashboard';
import Login from './pages/Login';
import PublicBookingPage from './pages/PublicBookingPage';

function AppContent() {
  const { profile, loading } = useAuth();
  const [isBookingPage, setIsBookingPage] = useState(false);

  useEffect(() => {
    setIsBookingPage(window.location.pathname.startsWith('/booking/'));
  }, []);

  if (isBookingPage) {
    return <PublicBookingPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!profile) {
    return <Login />;
  }

  if (profile.role === 'SUPERADMIN') {
    return <SuperAdminDashboard />;
  }

  return (
    <ProtectedRoute>
      <TenantDashboard />
    </ProtectedRoute>
  );
}

function App() {
  return (
     <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
