import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface SubscriptionUsage {
  plan_name: string;
  billing_period_start: string;
  billing_period_end: string;
  usage: Array<{
    asset_name: string;
    asset_key: string;
    asset_description: string;
    used: number;
    limit: number;
  }>;
}

const fetchSubscriptionUsage = async (): Promise<SubscriptionUsage | null> => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action: 'get_my_subscription_usage' },
  });

  if (error) {
    console.error('[Hook] Error fetching subscription usage from Edge Function:', error);
    throw new Error(error.message);
  }
  
  return data as SubscriptionUsage;
};

export const useSubscriptionUsage = (tenantId: string | null | undefined) => {
  return useQuery<SubscriptionUsage | null, Error>({
    queryKey: ['subscription_usage', tenantId],
    queryFn: () => fetchSubscriptionUsage(),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
