import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { loading, isAuthenticated, currentAssignment } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Si no está autenticado, redirigir al login.
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Si está autenticado pero por alguna razón no hay asignación, es un estado inválido.
  if (!currentAssignment) {
    // Esto puede pasar en un estado transitorio, lo mandamos al login para reiniciar.
    return <Navigate to="/auth" replace />;
  }

  // Lógica de redirección basada en roles del 'currentAssignment'
  const userRole = currentAssignment.role_name;
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');

  if (userRole === 'super_admin' && !isSuperAdminPath) {
    // Si es super_admin pero está fuera de las rutas de superadmin, redirigir a su dashboard.
    return <Navigate to="/superadmin/dashboard" replace />;
  }
  
  if (userRole !== 'super_admin' && isSuperAdminPath) {
    // Si no es super_admin pero intenta acceder a una ruta de superadmin, redirigir al dashboard del tenant.
    return <Navigate to="/" replace />;
  }

  // Si todo es correcto, renderizar la página solicitada.
  return <Outlet />;
};

export default ProtectedRoute;