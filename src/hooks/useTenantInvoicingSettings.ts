import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

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
  platformId: string; // Add platformId here
  newSettings: {
    invoice_products_enabled?: boolean;
    invoice_services_enabled?: boolean;
    automatic_invoicing_enabled?: boolean;
    [key: string]: any;
  };
}

export const useTenantInvoicingSettings = (tenantId: string) => {
  const { currentAssignment } = useAuth(); // Get current assignment
  const platformId = currentAssignment?.platform_id; // Get platformId

  return useQuery<TenantSettings, Error>({
    queryKey: ['tenantSettings', tenantId, platformId], // Add platformId to queryKey
    queryFn: async () => {
      // Pass platformId to the action
      const data = await fetchTenantAction('get_tenant_settings', { tenantId, platformId });
      return data as TenantSettings;
    },
    enabled: !!tenantId && !!platformId, // Enable only if platformId is available
  });
};

export const useUpdateTenantInvoicingSettings = () => {
  const queryClient = useQueryClient();
  // We need platformId here from the mutation payload
  return useMutation<TenantSettings, Error, UpdateTenantSettingsPayload>({
    mutationFn: async (payload) => {
      // payload will already contain tenantId and platformId if the calling component is updated
      const data = await fetchTenantAction('update_tenant_settings', payload);
      return data as TenantSettings;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenantSettings', variables.tenantId, variables.platformId] }); // Invalidate with platformId
    },
  });
};
