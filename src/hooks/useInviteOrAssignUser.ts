import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient'; // Asumo una importación directa del cliente Supabase
import { useAuth } from '@/contexts/AuthContext';
import { UserAssignment } from '@/contexts/AuthContext';

// La estructura de los valores que vienen del formulario
export interface InviteUserFormValues {
  email: string;
  firstName: string;
  lastName: string;
  password?: string; // Opcional, solo para usuarios nuevos
  roleId: string;
  branchId: string;
}

interface InviteUserVariables {
  values: InviteUserFormValues;
  tenantId: string;
}

const inviteOrAssignUser = async (
  invokingUser: any, // El objeto 'profile' del AuthContext
  currentAssignment: UserAssignment | null, // El objeto 'currentAssignment' del AuthContext
  variables: InviteUserVariables
) => {
  const { values, tenantId } = variables;

  if (!invokingUser || !currentAssignment) {
    throw new Error('No se pudo obtener la información del usuario autenticado.');
  }

  const { data, error } = await supabase.rpc('invite_or_assign_user', {
    p_invoking_user_id: invokingUser.id,
    p_invoking_user_role: currentAssignment.role_name,
    p_tenant_id: tenantId,
    p_target_branch_id: values.branchId,
    p_email: values.email,
    p_first_name: values.firstName,
    p_last_name: values.lastName,
    p_password: values.password,
    p_role_id: values.roleId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const response = data as { success: boolean; message: string };
  if (!response.success) {
    throw new Error(response.message);
  }

  return response;
};

export const useInviteOrAssignUser = () => {
  const { profile, currentAssignment } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: InviteUserVariables) =>
      inviteOrAssignUser(profile, currentAssignment, variables),
    onSuccess: (_, variables) => {
      // Invalidar la query de usuarios para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['tenantUsers', variables.tenantId] });
    },
  });
};
