import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface TenantSettingsData {
  logo_url?: string | null;
  // primary_color?: string | null; // Eliminado
  // secondary_color?: string | null; // Eliminado
}

// GET tenant-specific settings
const fetchTenantSettings = async (supabaseClient: any, tenantId: string): Promise<TenantSettingsData> => {
  console.log('fetchTenantSettings: Attempting to fetch for tenantId:', tenantId);
  const { data, error } = await supabaseClient
    .from('tenants')
    .select('logo_url') // Solo seleccionar logo_url
    .eq('id', tenantId)
    .single();

  if (error) {
    console.log('fetchTenantSettings: Error fetching for tenantId:', tenantId, 'Error:', error);
    // If no row found, return default empty object instead of throwing
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
    enabled: !!tenantId, // Only run query if tenantId is available
  });

  console.log('useTenantSettings: queryResult data:', queryResult.data, 'isLoading:', queryResult.isLoading, 'isFetching:', queryResult.isFetching);
  return queryResult;
};

// UPDATE tenant-specific settings
const updateTenantSettings = async (supabaseClient: any, tenantId: string, settings: Partial<TenantSettingsData>): Promise<TenantSettingsData> => {
  console.log('updateTenantSettings: Attempting to update for tenantId:', tenantId, 'Settings:', settings);
  const { data, error } = await supabaseClient
    .from('tenants')
    .update(settings) // settings solo contendrá logo_url
    .eq('id', tenantId)
    .select('logo_url') // Solo seleccionar logo_url
    .single();

  if (error) {
    console.log('updateTenantSettings: Error updating for tenantId:', tenantId, 'Error:', error);
    throw new Error(error.message);
  }
  console.log('updateTenantSettings: Successfully updated for tenantId:', tenantId, 'Data:', data);
  return data;
};

export const useUpdateTenantSettings = () => {
  const queryClient = useQueryClient();
  const { tenantId, supabaseClient } = useAuth();

  return useMutation<TenantSettingsData, Error, Partial<TenantSettingsData>>({
    mutationFn: (settings) => {
      if (!tenantId) throw new Error("Tenant ID is required to update tenant settings.");
      return updateTenantSettings(supabaseClient, tenantId, settings);
    },
    onSuccess: () => {
      console.log('useUpdateTenantSettings: Invalidate queries for tenantId:', tenantId);
      queryClient.invalidateQueries({ queryKey: ['tenant_settings', tenantId] });
    },
  });
};
