
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface PerformanceMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  timestamp: string;
  tenant_id: string | null;
  created_at: string;
}

const fetchPerformanceMetrics = async (): Promise<PerformanceMetric[]> => {
  const { data, error } = await supabase
    .from('performance_metrics')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const usePerformanceMetrics = () => {
  return useQuery<PerformanceMetric[], Error>({
    queryKey: ['performance_metrics'],
    queryFn: fetchPerformanceMetrics,
  });
};
