import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import * as z from 'zod';

// --- INTERFACES ---
export interface TenantUserAssignment {
  assignment_id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_name: string;
  role_display_name: string; // <-- CAMPO AÑADIDO
  branch_name: string | null;
  status: 'active' | 'inactive' | 'pending_configuration';
}

export interface Role {
  id: string;
  name: string;
  display_name: string; // <-- CAMPO AÑADIDO
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
      const { data, error } = await supabase.from('roles').select('id, name, display_name'); // <-- CAMPO AÑADIDO
      if (error) throw new Error(error.message);
      return data.filter(role => role.name !== 'super_admin');
    },
  });
};

export const useTenantUsers = (tenantId: string) => {
  const { currentAssignment } = useAuth();
  
  return useQuery<TenantUserAssignment[], Error>({
    queryKey: ['tenantUsers', tenantId],
    queryFn: async () => {
      if (!tenantId || !currentAssignment?.role_name) return [];
      
      const { data, error } = await supabase.rpc('get_tenant_users', {
        target_tenant_id: tenantId,
        p_user_role: currentAssignment.role_name,
      });

      if (error) throw new Error(`Error al obtener usuarios del tenant: ${error.message}`);
      return (data as TenantUserAssignment[]) || [];
    },
    enabled: !!tenantId && !!currentAssignment?.role_name,
  });
};

export const useUpdateUserAssignmentStatus = () => {
  const queryClient = useQueryClient();
  const { currentAssignment } = useAuth();

  return useMutation<any, Error, { assignmentId: string; newStatus: 'active' | 'inactive'; tenantId: string }>({
    mutationFn: async ({ assignmentId, newStatus }) => {
      const { error } = await supabase.rpc('update_user_assignment_status', {
        p_assignment_id: assignmentId,
        p_new_status: newStatus,
      });
      if (error) throw new Error(`Error al actualizar el estado de la asignación: ${error.message}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenantUsers', variables.tenantId] });
    },
  });
};

export const useCreateTenantUser = () => {
  const queryClient = useQueryClient();
  const { currentAssignment } = useAuth();
  return useMutation<any, Error, { values: z.infer<typeof addUserFormSchema>; tenantId: string }>({
    mutationFn: async ({ values, tenantId }) => {
      if (!currentAssignment?.role_name) throw new Error("No se pudo verificar el rol del usuario actual.");
      const { data, error } = await supabase.rpc('create_tenant_user', {
        p_email: values.email,
        p_password: values.password,
        p_role_id: values.roleId,
        p_tenant_id: tenantId,
        p_branch_id: values.branchId,
        p_requesting_user_role: currentAssignment.role_name,
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
  const { currentAssignment } = useAuth();
  return useMutation<{ success: boolean; token: string }, Error, { userId: string }>({
    mutationFn: async ({ userId }) => {
      if (!currentAssignment?.role_name) throw new Error("No se pudo verificar el rol del usuario actual.");
      
      const { data, error } = await supabase.rpc('create_password_reset_token', {
        p_user_id: userId,
        p_requesting_user_role: currentAssignment.role_name,
      });

      if (error) throw new Error(`Error al generar el token: ${error.message}`);
      if (!data.success) throw new Error("Falló la generación del token en el servidor.");
      
      return data;
    },
  });
};