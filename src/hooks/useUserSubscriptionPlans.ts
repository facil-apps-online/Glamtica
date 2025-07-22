import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// Interfaz que coincide con los datos devueltos por la nueva función RPC
export interface UserSubscriptionPlan {
  plan_id: string;
  plan_name: string;
  plan_description: string;
  plan_features: string[];
  billing_frequency_months: number;
  price_id: string;
  calculated_price: number;
  calculated_extra_branch_price: number;
  currency_code: string;
  currency_symbol: string;
}

const fetchUserSubscriptionPlans = async (userId: string): Promise<UserSubscriptionPlan[]> => {
  if (!userId) return [];

  const { data, error } = await supabase.rpc('get_subscription_plans_for_user', {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Error fetching user subscription plans: ${error.message}`);
  }
  return data || [];
};

export const useUserSubscriptionPlans = () => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<UserSubscriptionPlan[], Error>({
    queryKey: ['user_subscription_plans', userId],
    queryFn: () => fetchUserSubscriptionPlans(userId!),
    enabled: !!userId, // Solo ejecutar la query si tenemos un userId
  });
};
