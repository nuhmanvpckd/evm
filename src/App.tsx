import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminLayout from './components/AdminLayout';
import EVMPage from './pages/EVMPage';
import VVPATPage from './pages/VVPATPage';
import VoteSuccess from './pages/VoteSuccess';
import DemoDetail from './pages/admin/DemoDetail';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/demo/:slug" element={<EVMPage />} />
          <Route path="/vvpat" element={<VVPATPage />} />
          <Route path="/vote-success" element={<VoteSuccess />} />
          
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="demo/:id" element={<DemoDetail />} />
          </Route>
          
          <Route path="/" element={<Navigate to="/admin" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
