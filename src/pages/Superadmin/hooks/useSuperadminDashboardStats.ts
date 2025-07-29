import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface SuperadminDashboardStats {
  total_tenants: number;
  total_active_users: number;
  new_tenants_last_30_days: number;
  active_subscriptions: number;
}

const fetchSuperadminDashboardStats = async (): Promise<SuperadminDashboardStats> => {
  const { data, error } = await supabase.rpc('get_superadmin_dashboard_stats');

  if (error) {
    throw new Error(error.message);
  }

  // La función RPC devuelve un array con un solo objeto, lo extraemos.
  return data[0];
};

export const useSuperadminDashboardStats = () => {
  return useQuery<SuperadminDashboardStats, Error>({
    queryKey: ['superadmin_dashboard_stats'],
    queryFn: fetchSuperadminDashboardStats,
  });
};