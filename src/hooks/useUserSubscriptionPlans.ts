import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// Interface remains the same as the returned data structure is unchanged
export interface UserSubscriptionPlan {
  plan_id: string;
  plan_name: string;
  plan_description: string;
  plan_features: string[];
  billing_frequency_months: number;
  price_id: string;
  calculated_price: number;
  calculated_extra_branch_price: number;
  calculated_promotional_price: number; // New field
  currency_code: string;
  currency_symbol: string;
  base_price: number;
  active_branches_count: number;
}

const fetchTenantSubscriptionPlans = async (tenantId: string, platformId: string): Promise<UserSubscriptionPlan[]> => {
  if (!tenantId || !platformId) return [];

  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action: 'GET_SUBSCRIPTION_PLANS', payload: { tenantId, platformId } },
  });

  if (error) {
    throw new Error(`Error fetching tenant subscription plans: ${error.message}`);
  }

  // The backend action for GET_SUBSCRIPTION_PLANS returns the data directly
  return data || [];
};

export const useTenantSubscriptionPlans = () => {
  const { currentAssignment, loading: isAuthLoading } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const platformId = currentAssignment?.platform_id;

  return useQuery<UserSubscriptionPlan[], Error>({
    queryKey: ['tenant_subscription_plans', tenantId, platformId],
    queryFn: () => fetchTenantSubscriptionPlans(tenantId!, platformId!),
    // Enable the query only when auth is loaded and we have a tenantId and platformId
    enabled: !isAuthLoading && !!tenantId && !!platformId,
  });
};