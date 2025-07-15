import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  Users,
  DollarSign,
  Globe,
  Settings,
  AlertTriangle,
  Bug,
  Activity,
  Building,
  Puzzle,
} from "lucide-react";

export function SuperadminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  useEffect(() => {
    console.log("SuperadminSidebar: Current path:", location.pathname);
  }, [location.pathname]);

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="dashboard" relative="path" onClick={handleLinkClick}>
                <img 
                  src="/favicon-32x32.png" 
                  alt="Glamtica Logo" 
                  className="size-8"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Superadmin</span>
                  <span className="truncate text-xs">Glamtica.app</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Estadísticas">
                <Link to="dashboard" relative="path" onClick={handleLinkClick}>
                  <BarChart3 />
                  <span>Estadísticas</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestión de Tenants</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Listar Tenants">
                <Link to="tenants" relative="path" onClick={handleLinkClick}>
                  <Users />
                  <span>Listar Tenants</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Crear Tenant">
                <Link to="create-tenant" relative="path" onClick={handleLinkClick}>
                  <Building />
                  <span>Crear Tenant</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configuración</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Planes de Suscripción">
                <Link to="subscription-plans" relative="path" onClick={handleLinkClick}>
                  <DollarSign />
                  <span>Planes de Suscripción</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Precios de Planes">
                <Link to="plan-pricing" relative="path" onClick={handleLinkClick}>
                  <Globe />
                  <span>Precios de Planes</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Configuración Global">
                <Link to="global-settings" relative="path" onClick={handleLinkClick}>
                  <Settings />
                  <span>Configuración Global</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Monitoreo</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Alertas del Sistema">
                <Link to="system-alerts" relative="path" onClick={handleLinkClick}>
                  <AlertTriangle />
                  <span>Alertas del Sistema</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Reportes de Errores">
                <Link to="error-reports" relative="path" onClick={handleLinkClick}>
                  <Bug />
                  <span>Reportes de Errores</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Métricas de Rendimiento">
                <Link to="performance-metrics" relative="path" onClick={handleLinkClick}>
                  <Activity />
                  <span>Métricas de Rendimiento</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Avanzado</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Integraciones">
                <Link to="integrations" relative="path" onClick={handleLinkClick}>
                  <Puzzle />
                  <span>Integraciones</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Users />
              <span>Superadmin</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
