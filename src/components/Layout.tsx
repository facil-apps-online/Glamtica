import { Outlet, useNavigate, useLocation } from "react-router-dom";
import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useActiveSubscription";
import { ReadOnlyProvider } from "@/contexts/ReadOnlyContext";
import { ReadOnlyBanner } from "./ReadOnlyBanner";
import { GracePeriodBanner } from "./GracePeriodBanner";
import { CancelledBanner } from "./CancelledBanner";
import { tenantNavigationConfig } from "@/config/tenantNavigation"; // Importar la config del menú

export function Layout() {
  const { user } = useAuth();
  const { data: subscription, isLoading } = useSubscriptionStatus(user?.tenant_id);
  const navigate = useNavigate();
  const location = useLocation();

  const status = subscription?.status;
  const isAdmin = user?.role === 'tenant_super_admin' || user?.role === 'tenant_admin';
  const isReadOnly = status === 'suspendido' || status === 'cancelado';
  const showGraceBanner = status === 'gracia' && isAdmin;

  React.useEffect(() => {
    if (!isLoading && status === 'suspendido' && location.pathname !== '/subscribe') {
      navigate('/subscribe');
    }
  }, [status, isLoading, location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  return (
    <ReadOnlyProvider isReadOnly={isReadOnly}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
          <AppSidebar 
            menuConfig={tenantNavigationConfig}
            homeUrl="/"
            title={user?.tenant_name || "Panel de Tenant"}
            subtitle="Glamtica.app"
          />
          <div className="flex-1 flex flex-col">
            <Header />
            
            {showGraceBanner && <GracePeriodBanner />}
            {status === 'cancelado' && <CancelledBanner />}

            <main className="flex-1 overflow-auto relative p-4 sm:p-6">
              <Outlet />
              {status === 'cancelado' && (
                <div 
                  className="absolute inset-0 bg-black bg-opacity-5 z-50 cursor-not-allowed"
                  title="La funcionalidad está restringida. Por favor, renueva tu suscripción."
                />
              )}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ReadOnlyProvider>
  );
}
