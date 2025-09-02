import { useQueryClient } from '@tanstack/react-query';
import { useTenantAction } from './useTenantAction';

const useServiceAction = (action: string, successMessage: string, errorMessage: string) => {
  const queryClient = useQueryClient();
  
  const actionMutation = useTenantAction({
    successMessage,
    errorMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      queryClient.invalidateQueries({ queryKey: ['attention'] });
    },
  });

  return {
    mutate: (serviceId: string) => actionMutation.mutate({
      action,
      payload: { serviceId },
    }),
    isPending: actionMutation.isPending,
  };
};

export const useStartService = () => {
  return useServiceAction(
    'start_attention_service',
    'El servicio ha sido marcado como "En Proceso".',
    'Error al iniciar el servicio'
  );
};

export const useFinishService = () => {
  return useServiceAction(
    'finish_attention_service',
    'El servicio ha sido marcado como "Finalizado".',
    'Error al finalizar el servicio'
  );
};

export const useCallClient = () => {
  return useServiceAction(
    'call_client_for_service',
    'Se ha notificado al cliente.',
    'Error al enviar el llamado'
  );
};
