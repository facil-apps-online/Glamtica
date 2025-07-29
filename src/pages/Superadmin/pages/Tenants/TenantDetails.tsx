import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenantById } from '../../hooks/useSuperadminTenants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TenantUsersManager } from '../../../../components/TenantUsersManager';
import { TenantIntegrationManager } from './TenantIntegrationManager';
import { TenantSubscriptionsManager } from '../../components/TenantSubscriptionsManager';
import { TenantInvoicesList } from '../../components/TenantInvoicesList';
import { BranchesTab } from '../Settings/BranchesTab';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TenantDetails() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();

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

  const getStatusVariant = (status: string | undefined) => {
    if (!status) return 'outline';
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'warning';
      case 'trial_ended': return 'destructive';
      case 'inactive': return 'secondary';
      default: return 'outline';
    }
  };

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
        <div>
          <Badge variant={getStatusVariant(tenant?.subscription_status)}>{tenant?.subscription_status || 'N/A'}</Badge>
        </div>
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
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/superadmin/tenants')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Detalles del Tenant</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{tenant?.name}</CardTitle>
          <CardDescription>Información general del tenant</CardDescription>
        </CardHeader>
        <CardContent>
          {detailsContent}
        </CardContent>
      </Card>

      <TenantSubscriptionsManager tenantId={tenantId} />

      <TenantInvoicesList tenantId={tenantId} />

      <TenantIntegrationManager tenantId={tenantId} />
      
      <TenantUsersManager tenantId={tenantId} />

      {/* <BranchesTab tenantId={tenantId} /> */}
    </div>
  );
}