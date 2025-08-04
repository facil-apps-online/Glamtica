import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AuthRedirector = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Solo redirigir si la carga ha terminado y el usuario está autenticado.
    // Esto previene redirecciones prematuras antes de que el estado de auth esté resuelto.
    if (!loading && isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate]);

  return null; // Este componente no renderiza nada.
};

export default AuthRedirector;
