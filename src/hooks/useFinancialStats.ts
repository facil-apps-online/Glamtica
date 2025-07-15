
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface FinancialStats {
  mrr: number;
  arr: number;
  projected_revenue_next_7_days: number;
  projected_revenue_next_30_days: number;
  renewed_revenue_last_30_days: number;
  active_monthly_plans: number;
  active_semestral_plans: number;
  active_annual_plans: number;
  new_tenants_last_30_days: number;
}

const fetchFinancialStats = async (): Promise<FinancialStats> => {
  const { data, error } = await supabase.rpc('get_superadmin_financial_stats');

  if (error) {
    throw new Error(error.message);
  }

  // La función RPC devuelve un array con un solo objeto, lo extraemos.
  return data[0];
};

export const useFinancialStats = () => {
  return useQuery<FinancialStats, Error>({
    queryKey: ['financial_stats'],
    queryFn: fetchFinancialStats,
  });
};
