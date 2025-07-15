import { useQuery } from '@tanstack/react-query';
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