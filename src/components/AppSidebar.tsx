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
import { Building2, Scissors, HardDrive } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBranches } from "@/hooks/useBranches";
import { Button } from "@/components/ui/button";
import { useGoogleDriveImage } from "@/hooks/useGoogleDriveImage";
import { Skeleton } from "./ui/skeleton";
import { useTenantStorageUsage } from "@/hooks/useTenantStorageUsage";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { StorageUsageChart } from "./StorageUsageChart";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Helper function to format bytes (re-used from sidebar.tsx)
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

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

// --- COMPONENTE FOOTER (para mostrar la sucursal y el uso de almacenamiento) ---
const TenantInfoFooter: React.FC = () => {
  const { open } = useSidebar();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const userRole = currentAssignment?.role_name;

  const { data: branches, isLoading: isLoadingBranches } = useBranches(tenantId || '');
  const { data: storageUsage, isLoading: isLoadingStorage } = useTenantStorageUsage(tenantId || '');

  const currentBranch = branches?.find(b => b.id === currentAssignment?.branch_id);
  
  const usagePercentage = storageUsage && storageUsage.storageLimit > 0
    ? (storageUsage.totalSize / storageUsage.storageLimit) * 100
    : 0;

  return (
    <SidebarFooter>
      {tenantId && (
        <div className="relative flex flex-col gap-2 z-30">
          {/* Branch Info (only for tenant_admin or tenant_user) */}
          {(userRole === 'tenant_admin' || userRole === 'tenant_user') && !isLoadingBranches && currentBranch && (
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
          )}

          {/* Storage Usage (for all tenant roles) */}
          {!isLoadingStorage && storageUsage && (
            open ? (
              <Sheet>
                <SheetTrigger asChild>
                  <div 
                    className="text-xs text-muted-foreground p-2 border rounded-md cursor-pointer hover:bg-accent"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <HardDrive className="h-4 w-4" />
                      <p className="font-semibold">Almacenamiento</p>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary mb-1">
                      <div 
                        className="h-full w-full flex-1 bg-primary transition-all" 
                        style={{ transform: `translateX(-${100 - (usagePercentage || 0)}%)` }}
                      />
                    </div>
                    <p className="font-medium text-center">{formatBytes(storageUsage.totalSize)} / {formatBytes(storageUsage.storageLimit)}</p>
                  </div>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-auto">
                  <SheetHeader>
                    <SheetTitle>Desglose de Almacenamiento</SheetTitle>
                    <SheetDescription>
                      Uso de almacenamiento para todas las sucursales.
                    </SheetDescription>
                  </SheetHeader>
                  {storageUsage.breakdown && <StorageUsageChart data={storageUsage.breakdown} />}
                </SheetContent>
              </Sheet>
            ) : (
              <Sheet>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="p-2 border rounded-md h-auto w-auto">
                          <HardDrive className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-semibold">Almacenamiento</p>
                      <p>{formatBytes(storageUsage.totalSize)} / {formatBytes(storageUsage.storageLimit)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <SheetContent side="bottom" className="h-auto">
                  <SheetHeader>
                    <SheetTitle>Desglose de Almacenamiento</SheetTitle>
                    <SheetDescription>
                      Uso de almacenamiento para todas las sucursales.
                    </SheetDescription>
                  </SheetHeader>
                  {storageUsage.breakdown && <StorageUsageChart data={storageUsage.breakdown} />}
                </SheetContent>
              </Sheet>
            )
          )}
        </div>
      )}
    </SidebarFooter>
  );
};

// --- COMPONENTE PRINCIPAL (Corregido y Unificado) ---
export function AppSidebar({ menuConfig, homeUrl = "/", title = "Glamtica.app", subtitle = "Panel", ...props }: AppSidebarProps) {
  const { setOpenMobile, open } = useSidebar();
  const { user, tenant, currentAssignment } = useAuth();
  const userRole = currentAssignment?.role_name;

  const { displayUrl: tenantLogoUrl } = useGoogleDriveImage(tenant?.logo_url);

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to={homeUrl} onClick={handleLinkClick}>
                {tenantLogoUrl ? (
                  <img 
                    src={tenantLogoUrl} 
                    alt="Logo del Tenant" 
                    className="aspect-square size-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Scissors className="size-4" />
                  </div>
                )}
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

      <TenantInfoFooter />
    </Sidebar>
  );
}
