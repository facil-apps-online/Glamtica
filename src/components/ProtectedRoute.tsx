import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

const ProtectedRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('supabase.auth.token');
      // For a real application, you would also want to verify the token's validity (e.g., expiration)
      setIsAuthenticated(!!token);
    };

    checkAuth();

    // We no longer rely on supabase.auth.onAuthStateChange for our custom auth
    // However, if you have other parts of your app that might trigger auth state changes
    // (e.g., a logout button that clears localStorage), you might want a custom event listener here.

    // Example of a custom event listener (optional, depending on your app's needs)
    const handleStorageChange = () => {
      const token = localStorage.getItem('supabase.auth.token');
      setIsAuthenticated(!!token);
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (isAuthenticated === null) {
    return <div>Cargando autenticación...</div>; // Or a loading spinner
  }

  console.log("ProtectedRoute: isAuthenticated =", isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" />;
};

export default ProtectedRoute;