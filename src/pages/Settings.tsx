import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { GeneralSettingsTab } from "./Settings/GeneralSettingsTab";

import { UsersTab } from "./Settings/UsersTab";
import { TributarioTab } from "./Settings/TributarioTab";
import { SalesTab } from "./Settings/SalesTab";
import { InventorySettingsTab } from "./Settings/InventorySettingsTab";
import { SubscriptionTab } from "./Settings/SubscriptionTab";
import { ClientsTab } from "./Settings/ClientsTab";
import { IdentitySettingsTab } from "./Settings/IdentitySettingsTab";
import { Building, Users, Store, CreditCard, FileText, Box, Users2, Loader2, Palette, Hash, Tv } from 'lucide-react';
import NumberingSequencesPage from "./Settings/NumberingSequencesPage";
import TvManagementPage from "./TvManagementPage";

export default function Settings() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "general";

  const { currentAssignment, loading } = useAuth();
  const userRole = currentAssignment?.role_name;

  const isSuperAdmin = userRole === 'tenant_super_admin';
  const isAdmin = userRole === 'tenant_admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Cargando configuración...</p>
      </div>
    );
  }

  const renderTrigger = (value: string, icon: React.ReactNode, label: string) => (
    <TabsTrigger value={value} className="flex items-center gap-2">
      {icon}
      {label}
    </TabsTrigger>
  );

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
          {renderTrigger("general", <Building className="h-4 w-4" />, "General")}
          {(isSuperAdmin || isAdmin) && renderTrigger("identity", <Palette className="h-4 w-4" />, "Identidad")}
          {(isSuperAdmin || isAdmin) && renderTrigger("users", <Users className="h-4 w-4" />, "Usuarios")}
          {(isSuperAdmin || isAdmin) && renderTrigger("clients", <Users2 className="h-4 w-4" />, "Clientes")}
          {(isSuperAdmin || isAdmin) && renderTrigger("inventory", <Box className="h-4 w-4" />, "Inventario")}
          {(isSuperAdmin || isAdmin) && renderTrigger("sales", <CreditCard className="h-4 w-4" />, "Ventas")}
          {(isSuperAdmin || isAdmin) && renderTrigger("numbering", <Hash className="h-4 w-4" />, "Numeración")}
          {(isSuperAdmin || isAdmin) && renderTrigger("tv", <Tv className="h-4 w-4" />, "TV y Playlist")}
          {isSuperAdmin && renderTrigger("tributario", <FileText className="h-4 w-4" />, "Tributario")}
          {isSuperAdmin && renderTrigger("subscription", <CreditCard className="h-4 w-4" />, "Suscripción")}
        </TabsList>
        
        <TabsContent value="general">
          <GeneralSettingsTab />
        </TabsContent>

        {(isSuperAdmin || isAdmin) && (
          <TabsContent value="identity">
            <IdentitySettingsTab />
          </TabsContent>
        )}

        {(isSuperAdmin || isAdmin) && (
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
        )}

        {(isSuperAdmin || isAdmin) && (
          <TabsContent value="clients">
            <ClientsTab />
          </TabsContent>
        )}

        {(isSuperAdmin || isAdmin) && (
          <TabsContent value="inventory">
            <InventorySettingsTab />
          </TabsContent>
        )}

        {(isSuperAdmin || isAdmin) && (
          <TabsContent value="sales">
            <SalesTab />
          </TabsContent>
        )}

        {(isSuperAdmin || isAdmin) && (
          <TabsContent value="numbering">
            <NumberingSequencesPage />
          </TabsContent>
        )}

        {(isSuperAdmin || isAdmin) && (
          <TabsContent value="tv">
            <TvManagementPage />
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