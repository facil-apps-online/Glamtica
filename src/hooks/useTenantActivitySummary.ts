
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface TenantActivitySummary {
  tenant_id: string;
  tenant_name: string;
  total_users: number;
  total_clients: number;
  total_appointments: number;
  total_services: number;
  total_products: number;
}

const fetchTenantActivitySummary = async (): Promise<TenantActivitySummary[]> => {
  const { data, error } = await supabase.rpc('get_tenant_activity_summary');

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useTenantActivitySummary = () => {
  return useQuery<TenantActivitySummary[], Error>({
    queryKey: ['tenant_activity_summary'],
    queryFn: fetchTenantActivitySummary,
  });
};
