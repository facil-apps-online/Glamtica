import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface ApiHealthStats {
  avg_latency_ms: number;
  error_rate_percentage: number;
  requests_per_minute: {
    time_bucket: string;
    request_count: number;
  }[];
}

const fetchApiHealthStats = async (): Promise<ApiHealthStats> => {
  const { data, error } = await supabase.rpc('get_api_health_stats');

  if (error) {
    throw new Error(`Error fetching API health stats: ${error.message}`);
  }

  return data as ApiHealthStats;
};

export const useApiHealthStats = () => {
  return useQuery<ApiHealthStats, Error>({
    queryKey: ['apiHealthStats'],
    queryFn: fetchApiHealthStats,
    refetchInterval: 5000, // Refresca cada 5 segundos
  });
};
