
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface UsageStatistics {
  total_logins: number;
  total_appointments_created: number;
  total_products_sold: number;
  total_services_rendered: number;
}

const fetchUsageStatistics = async (): Promise<UsageStatistics> => {
  const { data, error } = await supabase.rpc('get_usage_statistics');

  if (error) {
    throw new Error(error.message);
  }

  return data[0]; // RPC returns an array, we expect a single object
};

export const useUsageStatistics = () => {
  return useQuery<UsageStatistics, Error>({
    queryKey: ['usage_statistics'],
    queryFn: fetchUsageStatistics,
  });
};
