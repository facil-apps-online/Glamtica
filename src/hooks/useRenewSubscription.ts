import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

interface RenewSubscriptionParams {
  planId: string;
}

const renewSubscription = async ({ planId, tenantId }: RenewSubscriptionParams & { tenantId: string }): Promise<string> => {
  if (!planId || !tenantId) {
    throw new Error('El ID del plan y del tenant son requeridos.');
  }

  const { data, error } = await supabase.rpc('renew_subscription', {
    p_tenant_id: tenantId,
    p_plan_id: planId,
  });

  if (error) {
    throw new Error(`Error al renovar la suscripción: ${error.message}`);
  }

  return data; // El ID de la nueva suscripción
};

export const useRenewSubscription = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: RenewSubscriptionParams) => {
      if (!user?.tenant_id) {
        throw new Error('No se pudo identificar al tenant del usuario.');
      }
      return renewSubscription({ ...params, tenantId: user.tenant_id });
    },
    onSuccess: () => {
      toast({
        title: '¡Suscripción Activada!',
        description: 'Tu cuenta ha sido reactivada. ¡Bienvenido de nuevo!',
        variant: 'success',
      });
      // Invalidar queries para refrescar el estado de la suscripción y los datos del usuario.
      queryClient.invalidateQueries({ queryKey: ['active_subscription', user?.tenant_id] });
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] }); // Asumiendo que la info del tenant está en el usuario.
      // Forzar un reload para asegurar que la redirección y el estado se apliquen correctamente.
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error en la Renovación',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
