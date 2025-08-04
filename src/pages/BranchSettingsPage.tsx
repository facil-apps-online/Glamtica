import React from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches } from '@/hooks/useBranches';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { BranchForm } from '@/components/BranchForm';

export default function BranchSettingsPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  const queryClient = useQueryClient();
  const { data: branches, isLoading, error } = useBranches(tenantId);

  const branchToEdit = branches?.find(b => b.id === branchId);

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['branches', tenantId] });
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error) {
    return <p className="text-red-500">Error al cargar la sucursal: {error.message}</p>;
  }

  if (!branchToEdit) {
    return <p className="text-red-500">Sucursal no encontrada.</p>;
  }

  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Configuración de Sucursal</CardTitle>
          <CardDescription>Administra los detalles y configuraciones de la sucursal.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              {/* Agrega más TabsTrigger aquí para futuras configuraciones */}
            </TabsList>
            <TabsContent value="general">
              {tenantId && <BranchForm branchToEdit={branchToEdit} onSuccess={handleSuccess} tenantId={tenantId} />}
            </TabsContent>
            {/* Agrega más TabsContent aquí para futuras configuraciones */}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
