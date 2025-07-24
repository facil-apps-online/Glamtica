import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { GeneralSettingsTab } from "./settings/GeneralSettingsTab";
import { BranchesTab } from "./settings/BranchesTab";
import { UsersTab } from "./settings/UsersTab";
import { TributarioTab } from "./settings/TributarioTab";
import { InventorySettingsTab } from "./settings/InventorySettingsTab";
import { SubscriptionTab } from "./settings/SubscriptionTab"; // Import new tab

export default function Settings() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "general";

  const { currentAssignment } = useAuth();
  const userRole = currentAssignment?.role_name;

  const isSuperAdmin = userRole === 'tenant_super_admin';
  const isAdmin = userRole === 'tenant_admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">
          Configuración
        </h1>
        <p className="text-slate-600 mt-2">
          Gestiona la configuración de tu negocio y sucursales
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full flex-nowrap overflow-x-auto justify-start">
          <TabsTrigger value="general">General</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="branches">Sucursales</TabsTrigger>}
          {(isSuperAdmin || isAdmin) && <TabsTrigger value="users">Usuarios</TabsTrigger>}
          {(isSuperAdmin || isAdmin) && <TabsTrigger value="inventory">Inventario</TabsTrigger>}
          {isSuperAdmin && <TabsTrigger value="tributario">Tributario</TabsTrigger>}
          {isSuperAdmin && <TabsTrigger value="subscription">Suscripción</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="general">
          <GeneralSettingsTab />
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="branches">
            <BranchesTab />
          </TabsContent>
        )}

        {(isSuperAdmin || isAdmin) && (
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
        )}

        {(isSuperAdmin || isAdmin) && (
          <TabsContent value="inventory">
            <InventorySettingsTab />
          </TabsContent>
        )}

        {isSuperAdmin && (
          <TabsContent value="tributario">
            <TributarioTab />
          </TabsContent>
        )}

        {isSuperAdmin && (
          <TabsContent value="subscription">
            <SubscriptionTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
