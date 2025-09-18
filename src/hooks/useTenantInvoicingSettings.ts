import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTenantAction } from "@/lib/fetchTenantAction";

interface TenantSettings {
  settings_data: {
    invoice_products_enabled?: boolean;
    invoice_services_enabled?: boolean;
    automatic_invoicing_enabled?: boolean;
    [key: string]: any; // Para permitir otras propiedades existentes
  };
}

interface UpdateTenantSettingsPayload {
  tenantId: string;
  newSettings: {
    invoice_products_enabled?: boolean;
    invoice_services_enabled?: boolean;
    automatic_invoicing_enabled?: boolean;
    [key: string]: any;
  };
}

export const useTenantInvoicingSettings = (tenantId: string) => {
  return useQuery<TenantSettings, Error>({
    queryKey: ['tenantSettings', tenantId],
    queryFn: async () => {
      const data = await fetchTenantAction('get_tenant_settings', { tenantId });
      return data as TenantSettings;
    },
    enabled: !!tenantId, // Solo ejecutar la query si tenantId está disponible
  });
};

export const useUpdateTenantInvoicingSettings = () => {
  const queryClient = useQueryClient();
  return useMutation<TenantSettings, Error, UpdateTenantSettingsPayload>({
    mutationFn: async (payload) => {
      const data = await fetchTenantAction('update_tenant_settings', payload);
      return data as TenantSettings;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenantSettings', variables.tenantId] });
    },
  });
};
