import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { SuperadminSidebar } from "@/components/SuperadminSidebar";
import { SuperadminHeader } from "@/components/SuperadminHeader";
import { motion, AnimatePresence } from "framer-motion";

function MainContent() {
  const { open } = useSidebar();
  const sidebarWidth = open ? '16rem' : '3rem'; 
  const location = useLocation(); // Hook para obtener la ubicación actual

  return (
    <div 
      className="flex-1 flex flex-col"
      style={{ width: `calc(100% - ${sidebarWidth})` }}
    >
      <SuperadminHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait"> {/* Espera a que la salida termine antes de montar la nueva entrada */}
          <motion.div
            key={location.pathname} // Clave única para cada ruta para que AnimatePresence detecte el cambio
            initial={{ opacity: 0, y: 10 }} // Estado inicial (invisible, ligeramente abajo)
            animate={{ opacity: 1, y: 0 }} // Estado animado (visible, posición original)
            exit={{ opacity: 0, y: -10 }} // Estado de salida (invisible, ligeramente arriba)
            transition={{ duration: 0.2 }} // Duración de la transición
            className="h-full w-full" // Asegura que ocupe el espacio para la animación
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
        <SuperadminSidebar />
        <MainContent />
      </div>
    </SidebarProvider>
  );
}
