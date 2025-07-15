import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

const ProtectedRoute: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Cargando autenticación...</div>; // Show loading state while auth is being initialized
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" />; // Redirect to login if not authenticated
  }

  // If authenticated, check user role for specific redirections
  if (user?.role === 'super_admin') {
    // If super_admin, ensure they are on a superadmin path
    if (!location.pathname.startsWith('/superadmin')) {
      return <Navigate to="/superadmin/dashboard" replace />;
    }
  } else if (location.pathname.startsWith('/superadmin')) {
    // If not super_admin but trying to access superadmin dashboard, redirect to default
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
