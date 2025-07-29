import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { UserAssignment } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';

export type DetailedUserAssignment = Omit<UserAssignment, 'tenant_name'> & {
  role_display_name: string;
};

// --- Tipos para el formulario ---
export interface AssignmentFormValue {
  branch_id: string | null;
  role_id: string | null;
  status: 'active' | 'inactive';
}

const fetchUserAssignments = async (userId: string, tenantId: string): Promise<DetailedUserAssignment[]> => {
  if (!userId || !tenantId) return [];

  const { data, error } = await supabase.rpc('get_user_assignments', {
    p_user_id: userId,
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Error fetching user assignments: ${error.message}`);
  return data as DetailedUserAssignment[];
};

export const useUserAssignments = (userId: string, tenantId: string) => {
  return useQuery<DetailedUserAssignment[], Error>({
    queryKey: ['userAssignments', userId, tenantId],
    queryFn: () => fetchUserAssignments(userId, tenantId),
    enabled: !!userId && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
};

// --- Mutación para actualizar asignaciones ---
export const useUpdateUserAssignments = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message: string },
    Error,
    { userId: string; tenantId: string; assignments: AssignmentFormValue[] }
  >({
    mutationFn: async ({ userId, tenantId, assignments }) => {
      const { data, error } = await supabase.rpc('update_user_assignments', {
        p_user_id: userId,
        p_tenant_id: tenantId,
        p_assignments: assignments,
      });

      if (error) throw new Error(`Error al actualizar asignaciones: ${error.message}`);
      if (!data.success) throw new Error(data.message || 'Ocurrió un error en el servidor.');
      
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar la query para refrescar los datos en la UI
      queryClient.invalidateQueries({ 
        queryKey: ['userAssignments', variables.userId, variables.tenantId] 
      });
      // Opcional: invalidar también la lista general de usuarios del tenant si es necesario
      queryClient.invalidateQueries({
        queryKey: ['tenantUsers', variables.tenantId]
      });
    },
  });
};
