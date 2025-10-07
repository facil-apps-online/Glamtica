import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantInvoicingSettings, useUpdateTenantInvoicingSettings } from "@/hooks/useTenantInvoicingSettings";
import { useToast } from "@/hooks/use-toast";
import { TaxTypesManagement } from "@/components/TaxTypesManagement";
import { Skeleton } from "@/components/ui/skeleton";

const TributarioTabSkeleton = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  </div>
);

export function TributarioTab() {
  const { tenantId } = useAuth();
  const { toast } = useToast();
  const { data: tenantSettings, isLoading: isLoadingSettings } = useTenantInvoicingSettings(tenantId || '');
  const { mutate: updateSettings, isPending: isUpdatingSettings } = useUpdateTenantInvoicingSettings();

  const handleToggle = (settingKey: 'invoice_products_enabled' | 'invoice_services_enabled' | 'automatic_invoicing_enabled', checked: boolean) => {
    if (!tenantId) {
      toast({ title: "Error", description: "Tenant ID no disponible.", variant: "destructive" });
      return;
    }
    const newSettings = { ...tenantSettings?.settings_data, [settingKey]: checked };
    updateSettings({ tenantId, newSettings }, {
      onSuccess: () => { toast({ title: "Éxito", description: "Configuración de facturación actualizada.", variant: "success" }); },
      onError: (error) => { toast({ title: "Error", description: `Error al actualizar configuración: ${error.message}`, variant: "destructive" }); },
    });
  };

  if (isLoadingSettings) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary"><FileText className="h-5 w-5" />Configuración Tributaria</CardTitle>
          <CardDescription>Define las reglas de facturación y los impuestos para tu negocio.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <TributarioTabSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <FileText className="h-5 w-5" />
          Configuración Tributaria
        </CardTitle>
        <CardDescription>Define las reglas de facturación y los impuestos para tu negocio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Opciones de Facturación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="invoice-products" className="text-base font-normal">Facturar Productos</Label>
              <Switch
                id="invoice-products"
                checked={tenantSettings?.settings_data?.invoice_products_enabled || false}
                onCheckedChange={(checked) => handleToggle('invoice_products_enabled', checked)}
                disabled={isUpdatingSettings}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="invoice-services" className="text-base font-normal">Facturar Servicios</Label>
              <Switch
                id="invoice-services"
                checked={tenantSettings?.settings_data?.invoice_services_enabled || false}
                onCheckedChange={(checked) => handleToggle('invoice_services_enabled', checked)}
                disabled={isUpdatingSettings}
              />
            </div>
            {(tenantSettings?.settings_data?.invoice_products_enabled || tenantSettings?.settings_data?.invoice_services_enabled) && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <Label htmlFor="automatic-invoicing" className="text-base font-normal">Facturación Automática al Pagar</Label>
                <Switch
                  id="automatic-invoicing"
                  checked={tenantSettings?.settings_data?.automatic_invoicing_enabled || false}
                  onCheckedChange={(checked) => handleToggle('automatic_invoicing_enabled', checked)}
                  disabled={isUpdatingSettings}
                />
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipos de Impuesto</CardTitle>
            <CardDescription>Crea y administra los diferentes tipos de impuestos aplicables en tu negocio.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <TaxTypesManagement />
          </CardContent>
        </Card>

      </CardContent>
    </Card>
  );
}