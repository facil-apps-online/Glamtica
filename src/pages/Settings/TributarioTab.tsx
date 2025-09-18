import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantInvoicingSettings, useUpdateTenantInvoicingSettings } from "@/hooks/useTenantInvoicingSettings";
import { useToast } from "@/hooks/use-toast";
import { TaxTypesManagement } from "@/components/TaxTypesManagement";

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

    const newSettings = {
      ...tenantSettings?.settings_data,
      [settingKey]: checked,
    };

    updateSettings({ tenantId, newSettings }, {
      onSuccess: () => {
        toast({ title: "Éxito", description: "Configuración de facturación actualizada.", variant: "success" });
      },
      onError: (error) => {
        toast({ title: "Error", description: `Error al actualizar configuración: ${error.message}`, variant: "destructive" });
      },
    });
  };

  if (isLoadingSettings) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            Configuración Tributaria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Cargando configuración tributaria...</p>
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
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="invoice-products" className="text-base">
              Facturar Productos
            </Label>
            <Switch
              id="invoice-products"
              checked={tenantSettings?.settings_data?.invoice_products_enabled || false}
              onCheckedChange={(checked) => handleToggle('invoice_products_enabled', checked)}
              disabled={isUpdatingSettings}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="invoice-services" className="text-base">
              Facturar Servicios
            </Label>
            <Switch
              id="invoice-services"
              checked={tenantSettings?.settings_data?.invoice_services_enabled || false}
              onCheckedChange={(checked) => handleToggle('invoice_services_enabled', checked)}
              disabled={isUpdatingSettings}
            />
          </div>
          {(tenantSettings?.settings_data?.invoice_products_enabled || tenantSettings?.settings_data?.invoice_services_enabled) && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <Label htmlFor="automatic-invoicing" className="text-base">
                Facturación Automática
              </Label>
              <Switch
                id="automatic-invoicing"
                checked={tenantSettings?.settings_data?.automatic_invoicing_enabled || false}
                onCheckedChange={(checked) => handleToggle('automatic_invoicing_enabled', checked)}
                disabled={isUpdatingSettings}
              />
            </div>
          )}
        </div>
        <TaxTypesManagement />
      </CardContent>
    </Card>
  );
}
