import React from 'react';
import { Navigate, Route, Routes, BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import TugasPage from './pages/TugasPage';
import ProfilePage from './pages/ProfilePage';
import InstitusiPage from './pages/InstitusiPage';
import { canAccess, getDefaultRoute } from '@/lib/units';

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={getDefaultRoute(user?.role)} replace />;
}

function DashboardRoute({ level }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!canAccess(user?.role, level)) {
    return <Navigate to={getDefaultRoute(user?.role)} replace />;
  }
  return <DashboardPage level={level} />;
}

function App() {
    return (
        <Router>
            <ScrollToTop />
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/daftar" element={<SignupPage />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<HomeRedirect />} />
                        <Route path="pusat" element={<DashboardRoute level="pusat" />} />
                        <Route path="wilayah" element={<DashboardRoute level="wilayah" />} />
                        <Route path="kota" element={<DashboardRoute level="kota" />} />
                        <Route path="tugas" element={<TugasPage />} />
                        <Route path="institusi" element={<InstitusiPage />} />
                        <Route path="profil" element={<ProfilePage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Toaster position="top-right" richColors />
            </AuthProvider>
        </Router>
    );
}

export default App;
