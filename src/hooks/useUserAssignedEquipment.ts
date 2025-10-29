import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

export interface UserAssignedEquipment {
  assignment_id: string;
  equipment_id: string;
  equipment_name: string;
}

export const useUserAssignedEquipment = (userId: string | null) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<UserAssignedEquipment[], Error>({
    queryKey: ['userAssignedEquipment', tenantId, userId],
    queryFn: async () => {
      if (!tenantId || !userId) return [];
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'get_user_assigned_equipment',
          payload: { p_user_id: userId },
        },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId && !!userId,
  });
};