import { useState } from "react";
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
import { DocumentTypesSettingsTab } from "./Settings/DocumentTypesSettingsTab";
import { NotificationSettingsTab } from "./Settings/NotificationSettingsTab";
import { IdentitySettingsTab } from "./Settings/IdentitySettingsTab";
import { ImageSettingsTab } from "./Settings/ImageSettingsTab"; // <-- IMPORT
import { Building, Users, Store, CreditCard, FileText, Box, Users2, Palette, Hash, Tv, FileDigit, Bell, Image } from 'lucide-react'; // <-- IMPORT Image
import NumberingSequencesPage from "./Settings/NumberingSequencesPage";
import TvManagementPage from "./TvManagementPage";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

const SettingsPageSkeleton = () => (
  <div>
    {/* PageHeader Skeleton */}
    <div>
      <Skeleton className="h-9 w-1/3" />
      <Skeleton className="h-5 w-1/2 mt-2" />
    </div>
    {/* Tabs Skeleton */}
    <div className="mt-6">
      <div className="w-full overflow-x-auto border-b">
        <div className="inline-flex h-auto p-1 gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
      {/* Content Skeleton */}
      <div className="mt-6">
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  </div>
);

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "general");

  const { currentAssignment, loading } = useAuth();
  const userRole = currentAssignment?.role_name;


  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const tabs = [
    { value: "general", label: "General", icon: <Building className="h-4 w-4" />, component: <GeneralSettingsTab />, roles: ['tenant_super_admin', 'tenant_admin', 'tenant_user'] },
    { value: "identity", label: "Identidad", icon: <Palette className="h-4 w-4" />, component: <IdentitySettingsTab />, roles: ['tenant_super_admin', 'tenant_admin'] },
    { value: "images", label: "Imágenes", icon: <Image className="h-4 w-4" />, component: <ImageSettingsTab />, roles: ['tenant_super_admin', 'tenant_admin'] },
    { value: "users", label: "Usuarios", icon: <Users className="h-4 w-4" />, component: <UsersTab />, roles: ['tenant_super_admin', 'tenant_admin'] },
    { value: "clients", label: "Clientes", icon: <Users2 className="h-4 w-4" />, component: <ClientsTab />, roles: ['tenant_super_admin', 'tenant_admin'] },
    { value: "document_types", label: "Parametrización", icon: <FileText className="h-4 w-4" />, component: <DocumentTypesSettingsTab />, roles: ['tenant_super_admin'] },
    { value: "notifications", label: "Notificaciones", icon: <Bell className="h-4 w-4" />, component: <NotificationSettingsTab />, roles: ['tenant_super_admin', 'tenant_admin'] },
    { value: "inventory", label: "Inventario", icon: <Box className="h-4 w-4" />, component: <InventorySettingsTab />, roles: ['tenant_super_admin', 'tenant_admin'] },
    { value: "sales", label: "Ventas", icon: <CreditCard className="h-4 w-4" />, component: <SalesTab />, roles: ['tenant_super_admin', 'tenant_admin'] },
    { value: "numbering", label: "Numeración", icon: <FileDigit className="h-4 w-4" />, component: <NumberingSequencesPage />, roles: ['tenant_super_admin', 'tenant_admin'] },
    { value: "tv", label: "TV y Playlist", icon: <Tv className="h-4 w-4" />, component: <TvManagementPage />, roles: ['tenant_super_admin', 'tenant_admin'] },
    { value: "tributario", label: "Tributario", icon: <FileText className="h-4 w-4" />, component: <TributarioTab />, roles: ['tenant_super_admin'] },
    { value: "subscription", label: "Suscripción", icon: <CreditCard className="h-4 w-4" />, component: <SubscriptionTab />, roles: ['tenant_super_admin'] },
  ];

  const availableTabs = tabs.filter(tab => userRole && tab.roles.includes(userRole));

  if (loading) {
    return <SettingsPageSkeleton />;
  }

  const activeTabContent = availableTabs.find(tab => tab.value === activeTab)?.component || null;

  return (
    <div>
      <PageHeader 
        title="Configuración"
        subtitle="Gestiona la configuración de tu negocio y sucursales"
      />

      <div className="mt-6">
        <div className="md:hidden space-y-4">            <Select onValueChange={handleTabChange} value={activeTab}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar una sección..." />
              </SelectTrigger>
              <SelectContent>
                {availableTabs.map(tab => (
                  <SelectItem key={tab.value} value={tab.value}>{tab.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              {activeTabContent}
            </div>
          </div>

        <div className="hidden md:block">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="w-full overflow-x-auto border-b">
              <TabsList className="inline-flex h-auto p-1">
                {availableTabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                    {tab.icon}{tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {availableTabs.map(tab => (
              <TabsContent key={tab.value} value={tab.value}>
                {tab.component}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}