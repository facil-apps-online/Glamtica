import { useEffect } from 'react';
import { useSettings } from "@/hooks/useSettings";
import { setAppTimeZone } from "@/lib/i18n";
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext'; // Importar el hook de autenticación
import { FullScreenLoader } from '@/components/ui/FullScreenLoader'; // Importar el loader

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const { data: settings } = useSettings();
  const { loading: authLoading } = useAuth(); // Obtener el estado de carga de la autenticación
  const navigate = useNavigate();
  useEffect(() => {
    if (settings) {
      const timezoneSetting = settings.find(s => s.key === 'timezone');
      if (timezoneSetting && timezoneSetting.value) {
        setAppTimeZone(timezoneSetting.value);
      }
    }
  }, [settings]);

  // Si la autenticación está en proceso, mostrar el loader
  if (authLoading) {
    return <FullScreenLoader />;
  }

  // Si no, mostrar el contenido de la aplicación
  return <>{children}</>;
};

export default AppInitializer;