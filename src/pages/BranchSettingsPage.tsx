import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches } from '@/hooks/useBranches';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { BranchForm } from '@/components/BranchForm';
import BranchProductsTabContent from '@/components/BranchProductsTabContent';
import BranchServicesTabContent from '@/components/BranchServicesTabContent';
import BranchCommissionsTabContent from '@/components/BranchCommissionsTabContent';
import BranchCombosTabContent from '@/components/BranchCombosTabContent';
import { useScreenSize } from '@/hooks/useScreenSize';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, Package, Wrench, Boxes, Percent } from 'lucide-react';

const BranchSettingsPageSkeleton = () => (
  <div>
    {/* PageHeader Skeleton */}
    <div className="flex items-center space-x-4">
      <Skeleton className="h-10 w-10" />
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>
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


export default function BranchSettingsPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const [activeTab, setActiveTab] = useState("general");

  const queryClient = useQueryClient();
  const { data: branches, isLoading, error } = useBranches(tenantId);
  const screenSize = useScreenSize();
  const isMobileOrTablet = screenSize === 'sm' || screenSize === 'md';

  const branchToEdit = branches?.find(b => b.id === branchId);

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (isLoading) {
    return <BranchSettingsPageSkeleton />;
  }

  if (error) {
    return <p className="text-red-500">Error al cargar la sucursal: {error.message}</p>;
  }

  if (!branchToEdit) {
    return <p className="text-red-500">Sucursal no encontrada.</p>;
  }

  const tabs = [
    { value: "general", label: "General", icon: <Building className="h-4 w-4" />, component: tenantId ? <BranchForm branchToEdit={branchToEdit} onSuccess={handleSuccess} tenantId={tenantId} /> : null },
    { value: "products", label: "Productos", icon: <Package className="h-4 w-4" />, component: branchId ? <BranchProductsTabContent branchId={branchId} /> : null },
    { value: "services", label: "Servicios", icon: <Wrench className="h-4 w-4" />, component: branchId ? <BranchServicesTabContent branchId={branchId} /> : null },
    { value: "combos", label: "Combos", icon: <Boxes className="h-4 w-4" />, component: branchId ? <BranchCombosTabContent branchId={branchId} /> : null },
    { value: "commissions", label: "Comisiones", icon: <Percent className="h-4 w-4" />, component: branchId ? <BranchCommissionsTabContent branchId={branchId} /> : null },
  ];

  const activeTabContent = tabs.find(tab => tab.value === activeTab)?.component || null;

  return (
    <div>
      <PageHeader 
        title={branchToEdit.name}
        subtitle="Gestiona la configuración de tu sucursal."
        backButton={
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
        }
      />
      
      <div className="mt-6">
        {isMobileOrTablet ? (
          <div className="space-y-4">
            <Select onValueChange={handleTabChange} value={activeTab}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar una sección..." />
              </SelectTrigger>
              <SelectContent>
                {tabs.map(tab => (
                  <SelectItem key={tab.value} value={tab.value}>{tab.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              {activeTabContent}
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="w-full overflow-x-auto border-b">
              <TabsList className="inline-flex h-auto p-1">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                    {tab.icon}{tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {tabs.map(tab => (
              <TabsContent key={tab.value} value={tab.value} className="mt-6">
                {tab.component}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}