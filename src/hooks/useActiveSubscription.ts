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
  
  // The RPC returns an array, so we extract the first element.
  return (data && data.length > 0 ? data[0] : null) as SubscriptionInfo | null;
};

export const useSubscriptionStatus = (tenantId: string | null | undefined) => {
  const queryResult = useQuery<SubscriptionInfo | null, Error>({
    queryKey: ['subscription_status', tenantId],
    queryFn: () => fetchSubscriptionStatus(),
    enabled: !!tenantId,
    // La configuración se hace más agresiva para detectar cambios de suscripción rápidamente.
    staleTime: 0, // Los datos se consideran "stale" (viejos) inmediatamente.
    refetchOnWindowFocus: true, // Se recarga si el usuario vuelve a la ventana.
    refetchOnMount: true, // Se recarga siempre que el componente se monta.
  });

  return queryResult;
};
