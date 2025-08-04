import React from "react";
import { Link } from "react-router-dom";
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
import { Building2, Scissors, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBranches } from "@/hooks/useBranches";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

// --- TIPOS (sin cambios) ---
interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: string[];
}
interface NavGroup {
  group: string;
  items: NavItem[];
}
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  menuConfig: NavGroup[];
  homeUrl?: string;
  title?: string;
  subtitle?: string;
}

// --- COMPONENTE FOOTER (para mostrar la sucursal) ---
const BranchFooter: React.FC = () => {
  const { currentAssignment } = useAuth();
  const { data: branches, isLoading } = useBranches(currentAssignment?.tenant_id || '');

  if (isLoading) {
    return (
      <SidebarFooter>
        <div className="p-2">
          <Skeleton className="h-8 w-full" />
        </div>
      </SidebarFooter>
    );
  }

  const currentBranch = branches?.find(b => b.id === currentAssignment?.branch_id);

  if (!currentBranch) {
    return null;
  }

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton className="cursor-default hover:bg-transparent">
            <Building2 />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate text-xs text-muted-foreground">Sucursal</span>
              <span className="truncate font-semibold">{currentBranch.name}</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};

// --- COMPONENTE PRINCIPAL (Corregido y Unificado) ---
export function AppSidebar({ menuConfig, homeUrl = "/", title = "Glamtica.app", subtitle = "Panel", ...props }: AppSidebarProps) {
  const { setOpenMobile } = useSidebar();
  const { user, logout, currentAssignment } = useAuth();
  const userRole = currentAssignment?.role_name;
  const { toast } = useToast();
  const [isRepairing, setIsRepairing] = React.useState(false);

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  const handleRepairAssignments = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'No se pudo encontrar el usuario para la reparación.', variant: 'destructive' });
      return;
    }

    setIsRepairing(true);
    try {
      const { data, error } = await supabase.functions.invoke('user-actions', {
        body: { action: 'repair-user-assignments', payload: { userId: user.id } },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      toast({
        title: 'Reparación Exitosa',
        description: 'Tus asignaciones han sido corregidas. Por favor, inicia sesión de nuevo.',
      });

      // Forzar logout para que el usuario inicie sesión con los datos nuevos
      setTimeout(() => {
        logout();
      }, 2000);

    } catch (e: any) {
      toast({ title: 'Error en la Reparación', description: e.message, variant: 'destructive' });
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to={homeUrl} onClick={handleLinkClick}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Scissors className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{title}</span>
                  <span className="truncate text-xs">{subtitle}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {menuConfig.map((group) => {
          const filteredItems = group.items.filter(item => userRole && item.roles.includes(userRole));
          if (filteredItems.length === 0) return null;

          return (
            <SidebarGroup key={group.group}>
              <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
              <SidebarMenu>
                {filteredItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link to={item.url} onClick={handleLinkClick}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}

        
      </SidebarContent>

      { (userRole === 'tenant_admin' || userRole === 'tenant_user') && <BranchFooter />}
    </Sidebar>
  );
}