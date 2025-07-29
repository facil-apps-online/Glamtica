import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// Hook to fetch user schedules
export const useUserSchedules = (userId?: string) => {
  return useQuery({
    queryKey: ['user-schedules', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_schedules')
        .select('*')
        .eq('user_id', userId!);
      
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!userId,
  });
};

// Hook to update a user's schedule
export const useUpdateUserSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scheduleData: {
      user_id: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_active: boolean;
    }) => {
      const { data, error } = await supabase
        .from('user_schedules')
        .upsert(scheduleData, { onConflict: 'user_id,day_of_week' })
        .select();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-schedules', variables.user_id] });
    },
  });
};
