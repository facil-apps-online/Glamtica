import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// Hook para actualizar el perfil del usuario
export const useUpdateProfile = () => {
  const { user, updateUserFromToken } = useAuth();

  return useMutation<any, Error, { firstName: string; lastName: string; avatarUrl?: string }>({
    mutationFn: async ({ firstName, lastName, avatarUrl }) => {
      if (!user?.id) throw new Error("Usuario no autenticado.");

      console.log('[useUpdateProfile] Calling RPC update_user_profile with:', {
        p_user_id: user.id,
        p_first_name: firstName,
        p_last_name: lastName,
        p_avatar_url: avatarUrl || user.avatarUrl,
      });

      const { data, error } = await supabase.rpc('update_user_profile', {
        p_user_id: user.id,
        p_first_name: firstName,
        p_last_name: lastName,
        p_avatar_url: avatarUrl || user.avatarUrl,
      });
      if (error) throw error;
      return { ...data, newFirstName: firstName, newLastName: lastName, newAvatarUrl: avatarUrl };
    },
    onSuccess: async (data) => {
      if (!user) return;
      
      console.log('[useUpdateProfile] Profile updated successfully. Generating new token...');
      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-jwt', {
        body: {
          user_id: user.id,
          email: user.email,
          role: user.role,
          tenant_id: user.tenant_id,
          branch_id: user.branch_id,
          first_name: data.newFirstName,
          last_name: data.newLastName,
          avatar_url: data.newAvatarUrl || user.avatarUrl,
          jwt_secret: import.meta.env.VITE_SUPABASE_JWT_SECRET,
        },
      });

      if (functionError) throw functionError;

      const { token } = functionData;
      console.log('[useUpdateProfile] New token generated. Updating context...');
      localStorage.setItem('supabase.auth.token', token);
      updateUserFromToken(token);
    },
  });
};

// Hook para actualizar la contraseña del usuario
export const useUpdatePassword = () => {
  return useMutation<any, Error, { oldPassword, newPassword }>({
    mutationFn: async ({ oldPassword, newPassword }) => {
      const { data, error } = await supabase.rpc('update_user_password', {
        p_old_password: oldPassword,
        p_new_password: newPassword,
      });
      if (error) throw error;
      return data;
    },
  });
};