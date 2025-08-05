import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface InviteOrAssignUserFormValues {
  email: string;
  password?: string;
  roleId: string;
  branchId?: string;
  platformId: string;
}

interface InviteOrAssignUserPayload extends InviteOrAssignUserFormValues {
  tenantId: string;
}

const inviteOrAssignUser = async (payload: InviteOrAssignUserPayload) => {
  const { data, error } = await supabase.functions.invoke('user-actions', {
    body: {
      action: 'invite_or_assign_user_to_tenant',
      payload: payload,
    },
  });

  if (error) {
    throw new Error(`Error al invocar la función: ${error.message}`);
  }

  // La Edge Function ahora devuelve un objeto con `success` y `message`
  if (!data.success) {
    throw new Error(data.message || 'Ocurrió un error en el servidor.');
  }

  return data;
};

export const useInviteOrAssignUser = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, InviteOrAssignUserPayload>({
    mutationFn: inviteOrAssignUser,
    onSuccess: (_, variables) => {
      // Invalida la query de usuarios del tenant para forzar la recarga de datos.
      queryClient.invalidateQueries({ queryKey: ['tenantUsers', variables.tenantId] });
    },
  });
};