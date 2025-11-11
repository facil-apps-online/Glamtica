import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/stores/notificationStore';

export const useNotifications = () => {
  const { currentAssignment } = useAuth();
  const enabled = !!currentAssignment;

  return useQuery<Notification[], Error>({
    queryKey: ['notifications', currentAssignment?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: { 
          action: 'GET_NOTIFICATIONS', 
          payload: { page: 1, pageSize: 100 }
        }
      });

      if (error) throw error;
      
      // The action returns { data: Notification[] }, so we extract it.
      return data.data || [];
    },
    enabled: enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
