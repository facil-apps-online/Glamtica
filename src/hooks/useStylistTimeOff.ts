
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export const useStylistTimeOff = (stylistId?: string) => {
  return useQuery({
    queryKey: ['stylist-time-off', stylistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stylist_time_off')
        .select('*')
        .eq('stylist_id', stylistId!)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!stylistId,
  });
};

export const useCreateTimeOffRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: {
      stylist_id: string;
      start_date: string;
      end_date: string;
      start_time?: string;
      end_time?: string;
      type: string;
      reason?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('stylist_time_off')
        .insert(request)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stylist-time-off', variables.stylist_id] });
    },
  });
};

export const useUpdateTimeOffRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, approved_by }: {
      id: string;
      status: string;
      approved_by?: string;
    }) => {
      const { data, error } = await supabase
        .from('stylist_time_off')
        .update({
          status,
          approved_by,
          approved_at: status === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stylist-time-off'] });
    },
  });
};
