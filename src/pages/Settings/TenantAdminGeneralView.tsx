import React from 'react';
import { useTenantById } from '@/hooks/useTenants';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapDisplay } from '@/components/MapDisplay';
import { ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="font-semibold text-muted-foreground">{label}</div>
    <div>{value || 'No especificado'}</div>
  </div>
);

const TenantAdminViewSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-12 w-full" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-5 w-2/3" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-5 w-2/3" /></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="lg:col-span-1">
        <Card>
          <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-5 w-2/3" /></div>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export function TenantAdminGeneralView() {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  if (!tenantId) {
    return <div className="p-4">ID de Tenant no encontrado.</div>;
  }
  
  return <TenantAdminGeneralViewContent tenantId={tenantId} />;
}

const TenantAdminGeneralViewContent = ({ tenantId }: { tenantId: string }) => {
  const { data: tenant, isLoading, isError, error } = useTenantById(tenantId);

  if (isLoading) {
    return <TenantAdminViewSkeleton />;
  }

  if (isError) {
    return <div className="p-4">Error al cargar los datos: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-yellow-700" />
        <p className="text-sm text-yellow-800">
          Esta sección es de solo lectura. Solo el administrador principal del negocio puede realizar cambios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">{tenant?.name}</CardTitle>
              <CardDescription>Información Principal y Regional</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <DetailItem label="Nombre Comercial" value={tenant?.name} />
              <DetailItem label="País" value={tenant?.countries?.name} />
              <DetailItem label="Idioma por Defecto" value={tenant?.localizations?.name} />
              <DetailItem label="Moneda por Defecto" value={tenant?.currencies?.name} />
              <DetailItem label="Zona Horaria" value={tenant?.default_timezone} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <DetailItem label="Teléfono de Contacto" value={tenant?.contact_phone} />
              <DetailItem label="WhatsApp" value={tenant?.whatsapp_phone} />
              <DetailItem label="Email Comercial" value={tenant?.commercial_email} />
              <DetailItem label="Sitio Web" value={tenant?.website} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Información Fiscal</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <DetailItem label="Razón Social / Nombre Legal" value={tenant?.legal_name} />
              <DetailItem label="ID Fiscal (NIT, CUIT, etc.)" value={tenant?.tax_id} />
              <DetailItem label="Dirección de Facturación" value={tenant?.billing_address} />
              <DetailItem label="Email para Facturación Electrónica" value={tenant?.einvoicing_email} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Dirección Física</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <DetailItem label="Dirección" value={`${tenant?.physical_address_line1 || ''} ${tenant?.physical_address_line2 || ''}`} />
              <DetailItem label="Ciudad" value={tenant?.physical_city} />
              <DetailItem label="Estado / Provincia" value={tenant?.physical_state} />
              <DetailItem label="Código Postal" value={tenant?.physical_postal_code} />
              {tenant?.latitude && tenant.longitude && (
                <div className="w-full h-64 rounded-lg overflow-hidden mt-4">
                  <MapDisplay latitude={tenant.latitude} longitude={tenant.longitude} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};