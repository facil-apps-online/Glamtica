import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export interface Branch {
  id: string;
  name: string;
}

export const useBranches = (tenantId: string) => {
  const { user } = useAuth();

  return useQuery<Branch[], Error>({
    queryKey: ['branches', tenantId],
    queryFn: async () => {
      if (!tenantId || !user?.role) return [];

      const { data, error } = await supabase.rpc('get_tenant_branches', {
        p_tenant_id: tenantId,
        p_requesting_user_role: user.role,
      });

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!tenantId && !!user?.role,
  });
};
