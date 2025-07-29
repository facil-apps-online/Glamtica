import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// Valores del formulario para crear o vincular un usuario
export interface CreateUserFormValues {
  email: string;
  firstName: string;
  lastName: string;
}

interface CreateUserVariables {
  values: CreateUserFormValues;
  tenantId: string;
}

const createUser = async (variables: CreateUserVariables) => {
  const { values, tenantId } = variables;

  const { data, error } = await supabase.functions.invoke('create-user', {
    body: {
      email: values.email,
      tenantId: tenantId,
      firstName: values.firstName,
      lastName: values.lastName,
    },
  });

  if (error) {
    throw new Error(`Error al invocar la función: ${error.message}`);
  }

  if (!data.success) {
    throw new Error(data.message || 'Ocurrió un error en la Edge Function.');
  }

  return data;
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: (_, variables) => {
      // Refrescar la lista de usuarios del tenant para que aparezca el nuevo
      queryClient.invalidateQueries({ queryKey: ['tenantUsers', variables.tenantId] });
    },
  });
};