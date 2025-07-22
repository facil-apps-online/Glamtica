import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';

export interface ActiveSubscription {
  id: string;
  is_trial: boolean;
  status: string; // Este es el status del tenant, no de la suscripción
  end_date: string | null;
}

const fetchActiveSubscription = async (tenantId: string): Promise<ActiveSubscription | null> => {
  if (!tenantId) return null;

  const { data, error } = await supabase
    .from('tenant_subscriptions')
    .select(`
      id,
      is_trial,
      end_date,
      tenant:tenants(subscription_status)
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // Si no se encuentra una fila, .single() devuelve un error. Lo manejamos como un null.
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    id: data.id,
    is_trial: data.is_trial,
    status: data.tenant.subscription_status,
    end_date: data.end_date,
  };
};

export const useActiveSubscription = () => {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery<ActiveSubscription | null, Error>({
    queryKey: ['active_subscription', tenantId],
    queryFn: () => fetchActiveSubscription(tenantId as string),
    enabled: !!tenantId,
  });
};
