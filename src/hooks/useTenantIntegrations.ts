import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

interface TenantIntegration {
  id: string;
  tenant_id: string;
  provider: string;
  account_email: string;
  created_at: string;
  updated_at: string;
  environment: string;
  is_active: boolean;
}

// Helper function to invoke the superadmin-actions Edge Function
const invokeSuperadminAction = async (action: string, payload?: any) => {
  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: { action, payload },
  });
  if (error) throw new Error(error.message);
  if (data.success === false) {
    throw new Error(data.message);
  }
  return data;
};

// --- GET Integrations (Superadmin View) ---
const fetchTenantIntegrations = async (tenantId: string): Promise<TenantIntegration[]> => {
  if (!tenantId) return [];
  // No environment is passed, so the backend returns all integrations for the tenant
  return invokeSuperadminAction('get_tenant_integrations', { tenantId });
};

export const useTenantIntegrations = (tenantId: string) => {
  return useQuery<TenantIntegration[], Error>({
    // The queryKey no longer includes environment
    queryKey: ['tenantIntegrations', tenantId],
    queryFn: () => fetchTenantIntegrations(tenantId),
    enabled: !!tenantId,
  });
};

// --- DELETE Integration (Superadmin View) ---
const deleteTenantIntegration = async (integrationId: string): Promise<any> => {
  return invokeSuperadminAction('delete_tenant_integration', { integrationId });
};

export const useDeleteIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { integrationId: string; tenantId: string }>({
    mutationFn: ({ integrationId }) => deleteTenantIntegration(integrationId),
    onSuccess: (data, variables) => {
      // Invalidate the query to refetch the list of integrations
      queryClient.invalidateQueries({ 
        queryKey: ['tenantIntegrations', variables.tenantId] 
      });
    },
  });
};
