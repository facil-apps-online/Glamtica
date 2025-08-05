import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// Hook para actualizar el perfil (nombre, apellido, avatar)
// Usado por PersonalInfoTab y AvatarUploader, pero como mutaciones separadas.
export const useUpdateProfile = () => {
  const { user, refreshUser, currentAssignment } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<any, Error, { first_name: string; last_name: string; avatar_url?: string | null }>({
    mutationFn: async (profileData) => {
      if (!user?.id) throw new Error("Usuario no autenticado.");
      
      const { data, error } = await supabase.functions.invoke('user-actions', {
        body: {
          action: 'update-user-settings',
          payload: { userId: user.id, metadata: profileData },
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);
      return data.user;
    },
    onSuccess: async () => {
      // 1. Refrescar los datos del usuario actual (para su propia UI)
      await refreshUser();
      
      // 2. Invalidar la lista de usuarios del tenant (para la vista del admin)
      if (currentAssignment?.tenant_id) {
        queryClient.invalidateQueries({ queryKey: ['tenantUsers', currentAssignment.tenant_id] });
      }
    },
  });
};

// Hook para actualizar la configuración regional
export const useUpdateRegionalSettings = () => {
  const { user, refreshUser } = useAuth();

  return useMutation<any, Error, { [key: string]: any }>({
    mutationFn: async (regionalData) => {
      if (!user?.id) throw new Error("Usuario no autenticado.");

      const { data, error } = await supabase.functions.invoke('user-actions', {
        body: {
          action: 'update-user-settings',
          payload: { userId: user.id, metadata: regionalData },
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);
      return data.user;
    },
    onSuccess: async () => {
      await refreshUser();
    },
  });
};

// Hook para actualizar la contraseña
export const useUpdatePassword = () => {
  const { user } = useAuth();

  return useMutation<any, Error, { newPassword: string }>({
    mutationFn: async ({ newPassword }) => {
      if (!user?.id) throw new Error("Usuario no autenticado.");

      const { data, error } = await supabase.functions.invoke('user-actions', {
        body: {
          action: 'update-password',
          payload: { userId: user.id, newPassword: newPassword },
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);
      return data;
    },
  });
};
