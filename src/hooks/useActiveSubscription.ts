import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';

export type SubscriptionStatus = 'activo' | 'gracia' | 'suspendido' | 'cancelado';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  end_date: string | null;
  plan_name: string | null;
}

const fetchSubscriptionStatus = async (): Promise<SubscriptionInfo | null> => {

  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action: 'GET_SUBSCRIPTION_STATUS' },
  });

  if (error) {
    console.error('[Hook] Error fetching subscription status from Edge Function:', error);
    throw new Error(error.message);
  }
  
  // The Edge Function now handles the 'no data' case and returns a default object
  return data as SubscriptionInfo;
};

export const useSubscriptionStatus = (tenantId: string | null | undefined) => {
  const queryResult = useQuery<SubscriptionInfo | null, Error>({
    queryKey: ['subscription_status', tenantId],
    queryFn: () => fetchSubscriptionStatus(),
    enabled: !!tenantId,
    // Configuración para revalidación agresiva
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return queryResult;
};
