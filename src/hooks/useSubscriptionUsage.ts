import { useQuery } from '@tanstack/react-query';
import { coreSupabase } from '@/lib/supabaseClient';

export interface SubscriptionUsage {
  plan_name: string;
  billing_period_start: string;
  billing_period_end: string;
  usage: Array<{
    asset_name: string;
    asset_key: string;
    asset_description: string;
    asset_purpose_key?: string;
    used: number;
    limit: number;
  }>;
}

const fetchSubscriptionUsage = async (tenantId: string, platformId: string): Promise<SubscriptionUsage | null> => {
  const { data, error } = await coreSupabase.functions.invoke('core-actions', {
    body: { action: 'get_subscription_usage', payload: { tenantId, platformId } },
  });

  if (error) {
    console.error('[useSubscriptionUsage] Error:', error);
    throw new Error(error.message);
  }

  return data as SubscriptionUsage;
};

export const useSubscriptionUsage = (tenantId: string | null | undefined, platformId: string | null | undefined) => {
  return useQuery<SubscriptionUsage | null, Error>({
    queryKey: ['subscription_usage', tenantId, platformId],
    queryFn: () => fetchSubscriptionUsage(tenantId!, platformId!),
    enabled: !!tenantId && !!platformId,
    staleTime: 1000 * 60 * 5,
  });
};
