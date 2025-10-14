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
import { tenantNavigationConfig } from "@/config/tenantNavigation";
import { useNotificationStore, Notification } from "@/stores/notificationStore";
import { supabase } from "@/lib/supabaseClient";

export function Layout() {
  const { currentAssignment } = useAuth();
  const { data: subscription, isLoading: isSubscriptionLoading } = useSubscriptionStatus(currentAssignment?.tenant_id);
  const { fetchNotifications, addNotification } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();

  const status = subscription?.status;
  const isAdmin = currentAssignment?.role_name === 'tenant_super_admin' || currentAssignment?.role_name === 'tenant_admin';
  const isReadOnly = status === 'suspendido' || status === 'cancelado';
  const showGraceBanner = status === 'gracia' && isAdmin;

  // Fetch initial notifications on load
  React.useEffect(() => {
    if (currentAssignment) {
      fetchNotifications();
    }
  }, [currentAssignment, fetchNotifications]);

  // Set up real-time listener for new notifications
  React.useEffect(() => {
    if (!currentAssignment) return;

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          // We check if the new notification is for the current user
          // RLS on the subscription should handle this, but an extra check is good practice
          if (payload.new.user_id === currentAssignment.user_id) {
            addNotification(payload.new as Notification);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAssignment, addNotification]);

  React.useEffect(() => {
    if (!isSubscriptionLoading && status === 'suspendido' && location.pathname !== '/subscribe') {
      navigate('/subscribe');
    }
  }, [status, isSubscriptionLoading, location.pathname, navigate]);

  if (isSubscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  return (
    <ReadOnlyProvider isReadOnly={isReadOnly}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar 
            menuConfig={tenantNavigationConfig}
            homeUrl="/app"
            title={currentAssignment?.tenant_name || "Panel de Tenant"}
            subtitle="Glamtica.app"
          />
          <div className="flex-1 flex flex-col">
            <Header />
            
            {showGraceBanner && <GracePeriodBanner />}
            {status === 'cancelado' && <CancelledBanner />}

            <main className="flex-1 overflow-auto relative p-2 sm:p-4 md:p-6">
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
