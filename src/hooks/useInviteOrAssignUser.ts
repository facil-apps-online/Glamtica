import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient'; // Asumo una importación directa del cliente Supabase
import { useAuth } from '@/contexts/AuthContext';
import { UserAssignment } from '@/contexts/AuthContext';

// La estructura de los valores que vienen del formulario
export interface InviteUserFormValues {
  email: string;
  firstName?: string;
  lastName?: string;
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

  if (!invokingUser || !currentAssignment || !currentAssignment.platform_id) {
    throw new Error('No se pudo obtener la información del usuario autenticado o el ID de la plataforma.');
  }

  const platformId = currentAssignment.platform_id;

  const response = await fetch('/api/user-actions', { // Asumiendo /api/user-actions es el endpoint para la Edge Function
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${invokingUser.token}`, // Pasar el token JWT del usuario
    },
    body: JSON.stringify({
      action: 'invite_or_assign_user_to_tenant',
      payload: {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password,
        tenantId: tenantId,
        roleId: values.roleId,
        branchId: values.branchId,
        platformId: platformId,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al invitar o asignar usuario.');
  }

  return data;
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
