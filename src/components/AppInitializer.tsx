import { useEffect } from 'react';
import { useSettings } from "@/hooks/useSettings";
import { setAppTimeZone } from "@/lib/i18n";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const { data: settings } = useSettings();
  const { loading: authLoading, isAuthenticated, currentAssignment } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (settings) {
      const timezoneSetting = settings.timezone;
      if (timezoneSetting) {
        setAppTimeZone(timezoneSetting);
      }
    }
  }, [settings]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const publicRoutes = ['/auth', '/register-tenant', '/update-password'];
      if (publicRoutes.includes(location.pathname)) {
        if (currentAssignment) {
          if (currentAssignment.role_name === 'super_admin') {
            navigate('/superadmin/dashboard', { replace: true });
          } else {
            navigate('/app', { replace: true });
          }
        }
        // If currentAssignment is not yet available, do nothing.
        // The effect will re-run when it's populated.
      }
    }
  }, [authLoading, isAuthenticated, currentAssignment, navigate, location.pathname]);

  if (authLoading) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
};

export default AppInitializer;