import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// Interface for Time Off Request
export interface TimeOffRequest {
  id?: string;
  user_id: string;
  start_date: string;
  end_date: string;
  start_time?: string | null;
  end_time?: string | null;
  reason?: string;
  status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string | null;
  created_at?: string;
}

// Hook to fetch time off requests for a user
export const useUserTimeOff = (userId?: string) => {
  return useQuery({
    queryKey: ['user-time-off', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_time_off')
        .select('*')
        .eq('user_id', userId!)
        .order('start_date', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!userId,
  });
};

// Hook to create a new time off request
export const useCreateTimeOffRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestData: Omit<TimeOffRequest, 'id' | 'created_at' | 'status'>) => {
      const { data, error } = await supabase
        .from('user_time_off')
        .insert([{ ...requestData, status: 'pending' }])
        .select();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-time-off', variables.user_id] });
    },
  });
};

// Hook to update (approve/reject) a time off request
export const useUpdateTimeOffRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updateData: { id: string; status: 'approved' | 'rejected'; approved_by: string }) => {
      const { data, error } = await supabase
        .from('user_time_off')
        .update({ status: updateData.status, approved_by: updateData.approved_by })
        .eq('id', updateData.id)
        .select();
        
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      // Invalidate all time off queries as we don't know the user_id here
      queryClient.invalidateQueries({ queryKey: ['user-time-off'] });
    },
  });
};
