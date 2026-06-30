import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export interface TenantSettingsData {
  logo_url?: string | null;
}

// GET tenant-specific settings
const fetchTenantSettings = async (tenantId: string): Promise<TenantSettingsData> => {
  const response = await fetch('/functions/v1/tenant-actions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({
      action: 'get-tenant-details',
      // The payload is not needed as tenantId is extracted from the JWT in the function
    }),
  });

  const { data, error } = await response.json();

  if (error) {
    throw new Error(error.message);
  }

  // The hook expects an object with just logo_url
  return { logo_url: data.tenant.logo_url };
};

export const useTenantSettings = () => {
  const { tenantId, supabaseClient } = useAuth();

  const queryResult = useQuery<TenantSettingsData, Error>({
    queryKey: ['tenant_settings', tenantId],
    queryFn: () => {
      if (!tenantId) throw new Error("Tenant ID is required to fetch tenant settings.");
      return fetchTenantSettings(supabaseClient, tenantId);
    },
    enabled: !!tenantId,
  });

  return queryResult;
};

// UPDATE tenant-specific settings
export const useUpdateTenantSettings = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();

  return useMutation<any, Error, Partial<TenantSettingsData>>({
    mutationFn: async (settings) => {
      if (!tenantId) throw new Error("Tenant ID is required to update tenant settings.");
      
      const { data: invokeData, error: invokeError } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'update_tenant',
          payload: { id: tenantId, values: settings }
        }
      });

      if (invokeError) throw invokeError;
      if (!invokeData.success) throw new Error(invokeData.message || 'Failed to update tenant settings.');

      // If an old logo was replaced, delete it from Google Drive
      if (invokeData.deletedFileId) {
        const { error: deleteError } = await supabase.functions.invoke('google-drive-delete', {
          body: { 
            fileId: invokeData.deletedFileId, 
            tenantId: tenantId,
          }
        });
        if (deleteError) {
          console.error('Error deleting old logo from Google Drive:', deleteError.message);
        }
      }
      
      return invokeData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant_settings', tenantId] });
    },
  });
};
