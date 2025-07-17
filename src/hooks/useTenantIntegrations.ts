import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface TenantIntegration {
  id: string;
  tenant_id: string | null;
  provider: string;
  access_token: string;
  encrypted_refresh_token: any; 
  account_email: string;
  created_at: string;
  updated_at: string;
}

export const useTenantIntegrations = (tenantId: string) => {
  const { user } = useAuth();
  return useQuery<TenantIntegration[], Error>({
    queryKey: ['tenantIntegrations', tenantId, user?.role],
    queryFn: async () => {
      if (!tenantId || !user?.role) {
        throw new Error('Tenant ID and user role are required to fetch integrations.');
      }

      const { data, error } = await supabase.rpc('get_tenant_integrations', {
        p_tenant_id: tenantId,
        p_user_role: user.role,
      });

      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    },
    enabled: !!tenantId && !!user?.role, // Only run the query if tenantId and user role are available
  });
};

export const useDeleteIntegration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<any, Error, { tenantId: string; provider: string }>({
    mutationFn: async ({ tenantId, provider }) => {
      console.log('[useDeleteIntegration] Initiating mutation with:', { tenantId, provider });

      if (!user?.id) {
        console.error('[useDeleteIntegration] Error: User ID is missing.');
        throw new Error('User is not authenticated.');
      }

      console.log('[useDeleteIntegration] Calling RPC "disconnect_google_provider" with params:', {
        p_tenant_id: tenantId,
        p_provider: provider,
        p_requesting_user_id: user.id,
      });

      const { data, error } = await supabase.rpc('disconnect_google_provider', {
        p_tenant_id: tenantId,
        p_provider: provider,
        p_requesting_user_id: user.id,
      });

      if (error) {
        console.error('[useDeleteIntegration] RPC Error:', error);
        throw error;
      }
      
      console.log('[useDeleteIntegration] RPC Success Data:', data);
      if (!data || !data.success) {
        console.error('[useDeleteIntegration] RPC returned non-success:', data);
        throw new Error(data?.message || "Error al eliminar la integración.");
      }
      
      return data;
    },
    onSuccess: (data, variables) => {
      console.log('[useDeleteIntegration] onSuccess callback triggered.', { data, variables });
      const queryKey = ['tenantIntegrations', variables.tenantId, user?.role];
      
      queryClient.setQueryData(queryKey, (oldData: any[] | undefined) => {
        const newData = oldData ? oldData.filter(integration => integration.provider !== variables.provider) : [];
        console.log('[useDeleteIntegration] Manually updating cache.', { oldData, newData });
        return newData;
      });

      queryClient.invalidateQueries({ queryKey: ['tenantIntegrations', variables.tenantId] });
    },
    onError: (error, variables) => {
      console.error('[useDeleteIntegration] onError callback triggered.', { error, variables });
    }
  });
};