import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import * as z from 'zod';

// --- INTERFACES ---
export interface TenantUser {
  id: string;
  email: string;
  role_name: 'super_admin' | 'tenant_super_admin' | 'tenant_admin' | 'tenant_user';
  is_active: boolean;
  created_at: string;
  tenant_id: string;
}

export interface Role {
  id: string;
  name: string;
}

const addUserFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  roleId: z.string().uuid(),
  branchId: z.string().uuid(),
});

// --- HOOKS ---

export const useRoles = () => {
  return useQuery<Role[], Error>({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('roles').select('id, name');
      if (error) throw new Error(error.message);
      return data.filter(role => role.name !== 'super_admin');
    },
  });
};

export const useTenantUsers = (tenantId: string) => {
  const { user } = useAuth();
  return useQuery<TenantUser[], Error>({
    queryKey: ['tenantUsers', tenantId],
    queryFn: async () => {
      if (!tenantId || !user?.role) return [];
      const { data, error } = await supabase.rpc('get_tenant_users', {
        target_tenant_id: tenantId,
        p_user_role: user.role,
      });
      if (error) throw new Error(`Error al obtener usuarios del tenant: ${error.message}`);
      return data as TenantUser[];
    },
    enabled: !!tenantId && !!user?.role,
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation<any, Error, { userId: string; newStatus: boolean; tenantId: string }>({
    mutationFn: async ({ userId, newStatus }) => {
      if (!user?.role) throw new Error("No se pudo verificar el rol del usuario actual.");
      const { data, error } = await supabase.rpc('update_user_active_status', {
        target_user_id: userId,
        p_is_active: newStatus,
        p_user_role: user.role,
      });
      if (error) throw new Error(`Error al actualizar el estado del usuario: ${error.message}`);
      if (!data.success) throw new Error(data.message || "Ocurrió un error en el servidor.");
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenantUsers', variables.tenantId] });
    },
  });
};

export const useCreateTenantUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation<any, Error, { values: z.infer<typeof addUserFormSchema>; tenantId: string }>({
    mutationFn: async ({ values, tenantId }) => {
      if (!user?.role) throw new Error("No se pudo verificar el rol del usuario actual.");
      const { data, error } = await supabase.rpc('create_tenant_user', {
        p_email: values.email,
        p_password: values.password,
        p_role_id: values.roleId,
        p_tenant_id: tenantId,
        p_branch_id: values.branchId,
        p_requesting_user_role: user.role,
      });
      if (error) throw new Error(`Error al crear el usuario: ${error.message}`);
      if (!data.success) throw new Error(data.message || "Ocurrió un error en el servidor.");
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenantUsers', variables.tenantId] });
    },
  });
};

// Hook para generar un token de reseteo de contraseña
export const useCreatePasswordResetToken = () => {
  const { user } = useAuth();
  return useMutation<{ success: boolean; token: string }, Error, { userId: string }>({
    mutationFn: async ({ userId }) => {
      if (!user?.role) throw new Error("No se pudo verificar el rol del usuario actual.");
      
      const { data, error } = await supabase.rpc('create_password_reset_token', {
        p_user_id: userId,
        p_requesting_user_role: user.role,
      });

      if (error) throw new Error(`Error al generar el token: ${error.message}`);
      if (!data.success) throw new Error("Falló la generación del token en el servidor.");
      
      return data;
    },
  });
};
