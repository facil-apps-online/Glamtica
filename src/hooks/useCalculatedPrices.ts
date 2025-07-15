
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface CalculatedPrice {
    plan_id: string;
    plan_name: string;
    base_price_cop: number;
    extra_branch_price_cop: number;
    country_id: string;
    country_name: string;
    calculated_price: number;
    calculated_extra_branch_price: number;
    currency_code: string;
    currency_symbol: string;
}

const fetchCalculatedPrices = async (): Promise<CalculatedPrice[]> => {
  const { data, error } = await supabase.rpc('get_calculated_plan_prices');

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const useCalculatedPrices = () => {
  return useQuery<CalculatedPrice[], Error>({
    queryKey: ['calculated_prices'],
    queryFn: fetchCalculatedPrices,
  });
};
