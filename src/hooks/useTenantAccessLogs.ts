
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface AccessLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  ip_address: string;
  created_at: string;
}

const fetchTenantAccessLogs = async (tenantId: string): Promise<AccessLog[]> => {
  const { data, error } = await supabase.rpc('get_tenant_access_logs', { p_tenant_id: tenantId });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useTenantAccessLogs = (tenantId: string) => {
  return useQuery<AccessLog[], Error>({
    queryKey: ['tenant_access_logs', tenantId],
    queryFn: () => fetchTenantAccessLogs(tenantId),
    enabled: !!tenantId,
  });
};
