
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface FinancialStats {
  mrr: number;
  arr: number;
  total_revenue_last_30_days: number;
  new_tenants_last_30_days: number;
  active_subscriptions: number;
  payments_last_30_days: number;
}

const fetchFinancialStats = async (platformId: string | null): Promise<FinancialStats> => {
  const { data, error } = await supabase.rpc('get_platform_financial_stats', {
    p_platform_id: platformId,
  });

  if (error) {
    throw new Error(`Error al obtener estadísticas financieras: ${error.message}`);
  }

  // La función RPC devuelve un array con un solo objeto, lo extraemos.
  if (!data || data.length === 0) {
    throw new Error("La función de la base de datos no devolvió datos.");
  }
  
  return data[0];
};

export const useFinancialStats = (platformId: string | null = null) => {
  return useQuery<FinancialStats, Error>({
    queryKey: ['financial_stats', platformId],
    queryFn: () => fetchFinancialStats(platformId),
  });
};
