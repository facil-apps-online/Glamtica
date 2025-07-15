import React from 'react';
import { useParams } from 'react-router-dom';
import { useTenantById } from '@/hooks/useTenants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TenantUsersManager } from './TenantUsersManager';
import { TenantIntegrationManager } from './TenantIntegrationManager'; // Importar

export default function TenantDetails() {
  const { tenantId } = useParams<{ tenantId: string }>();

  if (!tenantId) {
    return <div className="p-4">ID de Tenant no encontrado.</div>;
  }

  const { data: tenant, isLoading, isError, error } = useTenantById(tenantId);

  if (isLoading) {
    return <div className="p-4">Cargando detalles del tenant...</div>;
  }

  if (isError) {
    return <div className="p-4">Error al cargar los datos: {error.message}</div>;
  }

  const detailsContent = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
      <div>
        <div className="font-semibold text-muted-foreground">ID</div>
        <div className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded w-full truncate">{tenant?.id}</div>
      </div>
      <div>
        <div className="font-semibold text-muted-foreground">País</div>
        <div>{tenant?.countries?.name || 'No especificado'}</div>
      </div>
      <div>
        <div className="font-semibold text-muted-foreground">Estado de Suscripción</div>
        <div>{tenant?.subscription_status}</div>
      </div>
      <div>
        <div className="font-semibold text-muted-foreground">Email Comercial</div>
        <div>{tenant?.commercial_email || 'No especificado'}</div>
      </div>
      <div>
        <div className="font-semibold text-muted-foreground">Nombre Legal</div>
        <div>{tenant?.legal_name || 'No especificado'}</div>
      </div>
      <div>
        <div className="font-semibold text-muted-foreground">ID de Impuestos</div>
        <div>{tenant?.tax_id || 'No especificado'}</div>
      </div>
    </div>
  );

  return (
    <div className="w-full py-4 md:p-6 space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold px-4 md:px-0">Detalles del Tenant</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>{tenant?.name}</CardTitle>
          <CardDescription>Información general del tenant</CardDescription>
        </CardHeader>
        <CardContent>
          {detailsContent}
        </CardContent>
      </Card>

      <TenantIntegrationManager tenantId={tenantId} />
      
      <TenantUsersManager tenantId={tenantId} />
    </div>
  );
}
