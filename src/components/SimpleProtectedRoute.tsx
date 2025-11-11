import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const SimpleProtectedRoute: React.FC = () => {
  const { loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (!user) {
    // Si no hay usuario, redirigir al login.
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Si hay usuario, renderizar la página solicitada.
  return <Outlet />;
};

export default SimpleProtectedRoute;
