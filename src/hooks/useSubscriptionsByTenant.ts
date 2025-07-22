import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface TenantSubscription {
  id: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  plan_name: string;
  branch_name: string | null;
}

const fetchSubscriptionsByTenant = async (tenantId: string): Promise<TenantSubscription[]> => {
  if (!tenantId) return [];

  const { data, error } = await supabase
    .from('tenant_subscriptions')
    .select('id, start_date, end_date, is_active, subscription_plans(name), branches(name)')
    .eq('tenant_id', tenantId)
    .order('start_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(sub => ({
    ...sub,
    plan_name: sub.subscription_plans.name,
    branch_name: sub.branches ? sub.branches.name : 'General',
  }));
};

export const useSubscriptionsByTenant = (tenantId: string) => {
  return useQuery<TenantSubscription[], Error>({
    queryKey: ['subscriptions', tenantId],
    queryFn: () => fetchSubscriptionsByTenant(tenantId),
    enabled: !!tenantId,
  });
};
