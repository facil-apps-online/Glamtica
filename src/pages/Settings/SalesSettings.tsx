import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeTenantAction } from '@/hooks/useTenantUsers';
import { useRoles } from '@/hooks/useRoles';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SalesSettings = ({ tenantId }) => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    allow_price_modification: false,
    price_modification_role_ids: [],
    enforce_minimum_price: false,
  });

  const { data: roles, isLoading: isLoadingRoles } = useRoles();

  const { data: fetchedData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['salesSettings', tenantId],
    queryFn: () => invokeTenantAction('get_sales_settings', { tenantId }),
    enabled: !!tenantId,
  });

  // Synchronize query data with local state
  useEffect(() => {
    if (fetchedData) {
      const fetchedSettings = fetchedData || {};
      if (!Array.isArray(fetchedSettings.price_modification_role_ids)) {
        fetchedSettings.price_modification_role_ids = [];
      }
      setSettings(fetchedSettings);
    }
  }, [fetchedData]);

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings) => invokeTenantAction('update_sales_settings', { settings: newSettings }),
    onSuccess: () => {
      toast.success('Configuración guardada con éxito.');
      queryClient.invalidateQueries({ queryKey: ['salesSettings', tenantId] });
    },
    onError: (error) => {
      toast.error('Error al guardar la configuración.');
      console.error('Error saving sales settings:', error);
    },
  });

  const roleOptions = useMemo(() => {
    if (!roles) return [];
    return roles
      .filter(role => role.name.startsWith('tenant'))
      .map(role => ({
        value: role.name,
        label: role.display_name,
      }));
  }, [roles]);

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleSwitchChange = (id) => (checked) => {
    setSettings(prev => ({ ...prev, [id]: checked }));
  };

  const handleRolesChange = (selectedRoleNames) => {
    setSettings(prev => ({ ...prev, price_modification_role_ids: selectedRoleNames }));
  };

  if (isLoadingSettings) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-2/5" />
                <Skeleton className="h-6 w-12" />
            </div>
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-3/5" />
                <Skeleton className="h-6 w-12" />
            </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Precios en Atenciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="allow_price_modification">Permitir modificar precios en la atención</Label>
            <Switch
              id="allow_price_modification"
              checked={settings.allow_price_modification}
              onCheckedChange={handleSwitchChange('allow_price_modification')}
            />
          </div>

          {settings.allow_price_modification && (
              <div className="flex items-center justify-between">
                  <Label htmlFor="price_modification_role_ids">Roles con permiso para modificar precios</Label>
                  {isLoadingRoles ? <Skeleton className="h-10 w-1/2" /> : (
                                          <MultiSelect
                                              id="price_modification_role_ids"
                                              options={roleOptions}
                                              selected={settings.price_modification_role_ids}
                                              onSelectedChange={handleRolesChange}
                                              className="w-1/2"
                                              placeholder="Seleccionar roles..."
                                          />                  )}
              </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="enforce_minimum_price">El precio modificado no puede ser menor al original</Label>
            <Switch
              id="enforce_minimum_price"
              checked={settings.enforce_minimum_price}
              onCheckedChange={handleSwitchChange('enforce_minimum_price')}
              disabled={!settings.allow_price_modification}
            />
          </div>
        </div>
        <div className="mt-6 text-right">
          <Button onClick={handleSave} disabled={updateSettingsMutation.isPending}>
            {updateSettingsMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesSettings;
