
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export const useStylistSchedules = (stylistId?: string) => {
  return useQuery({
    queryKey: ['stylist-schedules', stylistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stylist_schedules')
        .select(`
          *,
          template:schedule_templates(name, description)
        `)
        .eq('stylist_id', stylistId!)
        .order('day_of_week');

      if (error) throw error;
      return data;
    },
    enabled: !!stylistId,
  });
};

export const useUpdateStylistSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedule: {
      id?: string;
      stylist_id: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_active: boolean;
    }) => {
      if (schedule.id) {
        const { data, error } = await supabase
          .from('stylist_schedules')
          .update({
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            is_active: schedule.is_active,
          })
          .eq('id', schedule.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('stylist_schedules')
          .insert(schedule)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stylist-schedules', variables.stylist_id] });
    },
  });
};
