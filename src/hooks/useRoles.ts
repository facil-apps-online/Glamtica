import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { invokeTenantAction } from '@/hooks/useTenantUsers'; // Assuming invokeTenantAction is available here

export interface Role {
  id: string;
  name: string;
  display_name: string;
}

const fetchRoles = async (tenantId: string): Promise<Role[]> => {
  if (!tenantId) return [];
  const response = await invokeTenantAction('get_tenant_roles', { tenantId });
  return response; 
};

export const useRoles = () => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id || '';

  return useQuery<Role[], Error>({
    queryKey: ['roles', tenantId],
    queryFn: () => fetchRoles(tenantId),
    enabled: !!tenantId,
  });
};
