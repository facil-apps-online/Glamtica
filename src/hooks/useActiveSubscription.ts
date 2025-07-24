import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';

export type SubscriptionStatus = 'activo' | 'gracia' | 'suspendido' | 'cancelado';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  end_date: string | null;
  plan_name: string | null;
}

const fetchSubscriptionStatus = async (tenantId: string): Promise<SubscriptionInfo | null> => {
  console.log(`[Hook] Fetching status for tenantId: ${tenantId}`);
  if (!tenantId) {
    console.log("[Hook] No tenantId provided, returning null.");
    return null;
  }

  const { data, error } = await supabase
    .rpc('get_tenant_subscription_status', { p_tenant_id: tenantId });

  console.log("[Hook] Raw response from RPC:", { data, error });

  if (error) {
    console.error('[Hook] Error fetching subscription status:', error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    console.log("[Hook] No data returned from RPC, resolving to 'cancelado'.");
    return { status: 'cancelado', end_date: null };
  }

  const result = data[0] as SubscriptionInfo;
  console.log("[Hook] Successfully processed data, returning:", result);
  return result;
};

export const useSubscriptionStatus = (tenantId: string | null | undefined) => {
  return useQuery<SubscriptionInfo | null, Error>({
    queryKey: ['subscription_status', tenantId],
    queryFn: () => fetchSubscriptionStatus(tenantId as string),
    enabled: !!tenantId,
    // Configuración para revalidación agresiva
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};
