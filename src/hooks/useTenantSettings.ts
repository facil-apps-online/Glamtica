import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export interface TenantSettingsData {
  logo_url?: string | null;
}

// GET tenant-specific settings
const fetchTenantSettings = async (supabaseClient: any, tenantId: string): Promise<TenantSettingsData> => {
  console.log('fetchTenantSettings: Attempting to fetch for tenantId:', tenantId);
  const { data, error } = await supabaseClient
    .from('tenants')
    .select('logo_url')
    .eq('id', tenantId)
    .single();

  if (error) {
    console.log('fetchTenantSettings: Error fetching for tenantId:', tenantId, 'Error:', error);
    if (error.code === 'PGRST116') return {}; 
    throw new Error(error.message);
  }
  console.log('fetchTenantSettings: Successfully fetched for tenantId:', tenantId, 'Data:', data);
  return data;
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

  console.log('useTenantSettings: queryResult data:', queryResult.data, 'isLoading:', queryResult.isLoading, 'isFetching:', queryResult.isFetching);
  return queryResult;
};

// UPDATE tenant-specific settings
export const useUpdateTenantSettings = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();

  return useMutation<any, Error, Partial<TenantSettingsData>>({
    mutationFn: async (settings) => {
      if (!tenantId) throw new Error("Tenant ID is required to update tenant settings.");
      
      console.log("useUpdateTenantSettings: mutationFn called with settings:", settings);

      const { data: invokeData, error: invokeError } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'update_tenant',
          payload: { id: tenantId, values: settings }
        }
      });

      console.log("useUpdateTenantSettings: invoke response data:", invokeData);
      console.log("useUpdateTenantSettings: invoke response error:", invokeError);

      if (invokeError) throw invokeError;
      if (!invokeData.success) throw new Error(invokeData.message || 'Failed to update tenant settings.');

      // If an old logo was replaced, delete it from Google Drive
      if (invokeData.deletedFileId) {
        console.log(`Deleting old logo file: ${invokeData.deletedFileId}`);
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
      console.log('useUpdateTenantSettings: Invalidate queries for tenantId:', tenantId);
      queryClient.invalidateQueries({ queryKey: ['tenant_settings', tenantId] });
    },
  });
};
