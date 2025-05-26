import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toast-fix.css'; // Fix for ReactToastify passive event listener issue

// Components
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminLogin from './components/auth/AdminLogin';
import PlayerHome from './components/player/PlayerHome';
import PlayerRankings from './components/player/PlayerRankings';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import NotFound from './components/layout/NotFound';

// Protected Route Components
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    // Redirect admin to admin dashboard, players to player home
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else {
      return <Navigate to="/player/home" />;
    }
  }
  
  return children;
};

const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole="admin">
    {children}
  </ProtectedRoute>
);

const PlayerRoute = ({ children }) => (
  <ProtectedRoute requiredRole="player">
    {children}
  </ProtectedRoute>
);

function App() {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <SocketProvider>
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : <Login />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/" /> : <Register />
        } />
        
        {/* Direct Admin Login */}
        <Route path="/admin-login" element={<AdminLogin />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          isAuthenticated ? (
            user.role === 'admin' ? 
              <Navigate to="/admin/dashboard" /> : 
              <Navigate to="/player/home" />
          ) : (
            <Navigate to="/login" />
          )
        } />
        
        {/* Player Routes */}
        <Route path="/player/home" element={
          <PlayerRoute>
            <PlayerHome />
          </PlayerRoute>
        } />
        <Route path="/player/rankings" element={
          <PlayerRoute>
            <PlayerRankings />
          </PlayerRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        } />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SocketProvider>
  );
}

export default App;
