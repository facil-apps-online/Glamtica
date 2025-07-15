import { useEffect } from 'react';
import { useSettings } from "@/hooks/useSettings";
import { setAppTimeZone } from "@/lib/i18n";
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const { data: settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (settings) {
      const timezoneSetting = settings.find(s => s.key === 'timezone');
      if (timezoneSetting && timezoneSetting.value) {
        setAppTimeZone(timezoneSetting.value);
      }
    }
  }, [settings]);

  useEffect(() => {
    const checkSuperadmin = async () => {
      try {
        const { data, error } = await supabase.rpc('check_superadmin_exists');

        if (error) {
          console.error('Error al verificar superadministrador:', error);
          // Podrías manejar el error de otra manera, por ejemplo, mostrar un mensaje.
          return;
        }

        if (data === false) {
          // No existe superadministrador, redirigir a la página de configuración
          if (location.pathname !== '/setup-superadmin') {
            navigate('/setup-superadmin');
          }
        } else {
          // Existe superadministrador, redirigir a la página de autenticación si está en setup
          if (location.pathname === '/setup-superadmin') {
            navigate('/auth');
          }
        }
      } catch (err) {
        console.error('Excepción al verificar superadministrador:', err);
      }
    };

    checkSuperadmin();
  }, [navigate, location.pathname]);

  return <>{children}</>;
};

export default AppInitializer;
