import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// Esta interfaz refleja la estructura de datos devuelta por la función RPC
export interface ActivePlan {
  plan_id: string;
  plan_name: string;
  description: string; // Asumiendo que la RPC devolverá estos campos
  features: string[]; // Asumiendo que la RPC devolverá estos campos
  price_id: string; // El ID del registro de precio
  calculated_price: number;
  currency_code: string;
  currency_symbol: string;
}

// La función que llama a la RPC de la base de datos
const fetchActivePlans = async (): Promise<ActivePlan[]> => {
  const { data, error } = await supabase.rpc('get_calculated_plan_prices');

  if (error) {
    console.error('Error fetching calculated plan prices:', error);
    throw new Error(error.message);
  }
  
  // Aquí se podría hacer un mapeo si la estructura de la RPC no coincide 100%
  // Por ahora, asumimos que coincide con la interfaz ActivePlan
  return data || [];
};

export const useActiveSubscriptionPlans = () => {
  return useQuery<ActivePlan[], Error>({
    queryKey: ['active_subscription_plans'],
    queryFn: fetchActivePlans,
  });
};
