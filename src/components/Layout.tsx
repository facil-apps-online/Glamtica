import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { useActiveSubscription } from "@/hooks/useActiveSubscription";
import { ReadOnlyProvider } from "@/contexts/ReadOnlyContext";
import { ReadOnlyBanner } from "./ReadOnlyBanner";

export function Layout() {
  const { data: subscription, isLoading } = useActiveSubscription();

  // El modo de solo lectura se activa si la suscripción no es 'active' o 'trial'.
  // No bloqueamos durante la carga para evitar un parpadeo.
  const isReadOnly = !isLoading && subscription?.status !== 'active' && subscription?.status !== 'trial';

  return (
    <ReadOnlyProvider isReadOnly={isReadOnly}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            {isReadOnly && <ReadOnlyBanner />}
            <main className="flex-1 overflow-auto relative">
              <Outlet />
              {isReadOnly && (
                <div 
                  className="absolute inset-0 bg-black bg-opacity-5 z-50"
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
