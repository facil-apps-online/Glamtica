import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// Los valores del formulario ahora son más simples
export interface LinkUserFormValues {
  email: string;
  firstName: string;
  lastName: string;
  password?: string; // Opcional, solo para usuarios nuevos
}

interface LinkUserVariables {
  values: LinkUserFormValues;
  tenantId: string;
}

const linkUserToTenant = async (
  invokingUserRole: string | undefined,
  variables: LinkUserVariables
) => {
  const { values, tenantId } = variables;

  if (!invokingUserRole) {
    throw new Error('No se pudo obtener el rol del usuario autenticado.');
  }

  const { data, error } = await supabase.rpc('link_user_to_tenant', {
    p_invoking_user_role: invokingUserRole,
    p_tenant_id: tenantId,
    p_email: values.email,
    p_first_name: values.firstName,
    p_last_name: values.lastName,
    p_password: values.password,
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

export const useLinkUserToTenant = () => {
  const { currentAssignment } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: LinkUserVariables) =>
      linkUserToTenant(currentAssignment?.role_name, variables),
    onSuccess: (_, variables) => {
      // Refrescar la lista de usuarios del tenant
      queryClient.invalidateQueries({ queryKey: ['tenantUsers', variables.tenantId] });
    },
  });
};
