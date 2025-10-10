import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { callTenantAction } from '@/lib/tenantActions';

export interface NotificationSetting {
  template_type: string;
  is_active: boolean;
}

// Hook to get notification settings
export const useGetNotificationSettings = () => {
  return useQuery<NotificationSetting[], Error>({
    queryKey: ['notification-settings'],
    queryFn: () => callTenantAction('get_notification_settings', {}),
  });
};

// Hook to update notification settings
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, NotificationSetting[]>({
    mutationFn: (settings: NotificationSetting[]) => callTenantAction('update_notification_settings', { settings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast({
        title: 'Configuración Actualizada',
        description: 'Tus preferencias de notificación han sido guardadas.',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `No se pudo guardar la configuración: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
