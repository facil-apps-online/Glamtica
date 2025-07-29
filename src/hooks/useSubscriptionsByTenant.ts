import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface TenantSubscription {
  id: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  is_trial: boolean | null;
  plan_name: string;
  branch_name: string | null;
}

// Helper function to invoke the superadmin-actions Edge Function
const invokeSuperadminAction = async (action: string, payload?: any) => {
  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: { action, payload },
  });
  if (error) throw new Error(error.message);
  // The Edge Function now returns the final mapped data, so we just return it.
  // We also need to check for a potential error message from the function itself.
  if (data.success === false) {
    throw new Error(data.message);
  }
  return data;
};


const fetchSubscriptionsByTenant = async (tenantId: string): Promise<TenantSubscription[]> => {
  if (!tenantId) return [];
  return invokeSuperadminAction('get_subscriptions_by_tenant', { tenantId });
};

export const useSubscriptionsByTenant = (tenantId: string) => {
  return useQuery<TenantSubscription[], Error>({
    queryKey: ['subscriptions', tenantId],
    queryFn: () => fetchSubscriptionsByTenant(tenantId),
    enabled: !!tenantId,
  });
};