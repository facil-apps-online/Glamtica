import { useQuery } from '@tanstack/react-query';
import { coreSupabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivePlan {
  plan_id: string;
  plan_name: string;
  plan_description: string;
  plan_features: string[];
  billing_frequency_months: number;
  price_id: string;
  calculated_price: number;
  calculated_extra_branch_price: number;
  calculated_promotional_price: number;
  currency_code: string;
  currency_symbol: string;
  base_price: number;
  active_branches_count: number;
  country_id: string;
}

const fetchActivePlans = async (tenantId: string, platformId: string): Promise<ActivePlan[]> => {
  if (!tenantId || !platformId) return [];

  const { data, error } = await coreSupabase.functions.invoke('core-actions', {
    body: { action: 'get_tenant_subscription_plans', payload: { tenantId, platformId } },
  });

  if (error) {
    console.error('Error fetching subscription plans:', error);
    throw new Error(error.message);
  }

  return data || [];
};

export const useActiveSubscriptionPlans = () => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const platformId = currentAssignment?.platform_id;

  return useQuery<ActivePlan[], Error>({
    queryKey: ['active_subscription_plans', tenantId, platformId],
    queryFn: () => fetchActivePlans(tenantId!, platformId!),
    enabled: !!tenantId && !!platformId,
  });
};
