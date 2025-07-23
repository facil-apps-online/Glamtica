import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar"; // Usar el sidebar unificado
import { Header } from "@/components/Header"; // Usar el header unificado
import { motion, AnimatePresence } from "framer-motion";
import { superadminNavigationConfig } from "@/config/superadminNavigation"; // Importar la config del menú

function MainContent() {
  const location = useLocation();

  return (
    <div className="flex-1 flex flex-col w-full overflow-hidden">
      <Header panelTitle="Glamtica Control Panel" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export function SuperadminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar 
          menuConfig={superadminNavigationConfig} 
          homeUrl="/superadmin"
          title="Glamtica"
          subtitle="Super Admin"
        />
        <MainContent />
      </div>
    </SidebarProvider>
  );
}
