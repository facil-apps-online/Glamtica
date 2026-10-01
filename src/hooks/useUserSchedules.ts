import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTenantAction } from '@/lib/fetchTenantAction';

// Hook to fetch user schedules (tenant y plataforma salen del JWT en el backend)
export const useUserSchedules = (userId?: string, tenantId?: string) => {
  return useQuery({
    queryKey: ['user-schedules', userId, tenantId],
    queryFn: async () => {
      if (!userId || !tenantId) return [];
      return fetchTenantAction('get_user_schedules', { userId });
    },
    enabled: !!userId && !!tenantId,
  });
};

// Hook to update a user's schedule
export const useUpdateUserSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scheduleData: {
      user_id: string;
      tenant_id: string;
      branch_id: string | null;
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_active: boolean;
    }) => {
      const { tenant_id: _tenantId, ...payload } = scheduleData; // el tenant lo toma el backend del JWT
      return fetchTenantAction('upsert_user_schedule', payload);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-schedules', variables.user_id, variables.tenant_id] });
    },
  });
};
