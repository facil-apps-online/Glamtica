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
  const { user, logout } = useAuth();

  return useMutation<any, Error, { currentPassword, newPassword }>({
    mutationFn: async ({ currentPassword, newPassword }) => {
      if (!user?.id) throw new Error("Usuario no autenticado.");

      const { data, error } = await supabase.rpc('change_password', {
        p_user_id: user.id,
        p_current_password: currentPassword,
        p_new_password: newPassword,
      });

      if (error) throw error;

      // La RPC devuelve un array, incluso con una sola fila.
      const rpcData = data && data[0] ? data[0] : null;
      if (!rpcData || !rpcData.success) {
        throw new Error(rpcData?.message || "Error al cambiar la contraseña.");
      }
      
      return rpcData;
    },
    onSuccess: () => {
      // Forzar cierre de sesión para que el usuario inicie sesión con la nueva contraseña.
      logout();
    },
  });
};

// Hook para actualizar la configuración regional del usuario
export const useUpdateRegionalSettings = () => {
  const { user, updateUserFromToken } = useAuth();

  return useMutation<any, Error, { countryId?: string | null; languageId?: string | null; currencyId?: string | null; timezoneId?: string | null; }>({
    mutationFn: async ({ countryId, languageId, currencyId, timezoneId }) => {
      if (!user?.id) throw new Error("Usuario no autenticado.");

      const { data, error } = await supabase.rpc('update_user_regional_settings', {
        p_user_id: user.id,
        p_country_id: countryId,
        p_language_id: languageId,
        p_currency_id: currencyId,
        p_timezone_id: timezoneId,
      });

      if (error) throw error;
      return { countryId, languageId, currencyId, timezoneId };
    },
    onSuccess: async (data) => {
      if (!user) return;

      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-jwt', {
        body: {
          user_id: user.id,
          email: user.email,
          role: user.role,
          tenant_id: user.tenant_id,
          branch_id: user.branch_id,
          first_name: user.firstName,
          last_name: user.lastName,
          avatar_url: user.avatarUrl,
          country_id: data.countryId,
          language_id: data.languageId,
          currency_id: data.currencyId,
          timezone_id: data.timezoneId,
          jwt_secret: import.meta.env.VITE_SUPABASE_JWT_SECRET,
        },
      });

      if (functionError) throw functionError;

      const { token } = functionData;
      localStorage.setItem('supabase.auth.token', token);
      updateUserFromToken(token);
    },
  });
};
