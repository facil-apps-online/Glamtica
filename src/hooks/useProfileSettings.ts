import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// Hook para actualizar el perfil del usuario
export const useUpdateProfile = () => {
  const { profile, updateCurrentProfile } = useAuth();

  return useMutation<any, Error, { firstName: string; lastName: string; avatarUrl?: string }>({
    mutationFn: async ({ firstName, lastName, avatarUrl }) => {
      if (!profile?.id) throw new Error("Usuario no autenticado.");

      const newAvatar = avatarUrl === undefined ? profile.avatarUrl : avatarUrl;

      const { data, error } = await supabase.rpc('update_user_profile', {
        p_user_id: profile.id,
        p_first_name: firstName,
        p_last_name: lastName,
        p_avatar_url: newAvatar,
      });

      if (error) throw error;
      
      return { ...profile, firstName, lastName, avatarUrl: newAvatar };
    },
    onSuccess: (updatedProfileData) => {
      // Sincronizar el estado del AuthContext con los nuevos datos
      // Esto regenerará el token y actualizará el localStorage
      if (updateCurrentProfile) {
        updateCurrentProfile(updatedProfileData);
      }
    },
  });
};

// Hook para actualizar la contraseña del usuario
export const useUpdatePassword = () => {
  const { profile, logout } = useAuth();

  return useMutation<any, Error, { currentPassword, newPassword }>({
    mutationFn: async ({ currentPassword, newPassword }) => {
      if (!profile?.id) throw new Error("Usuario no autenticado.");

      const { data, error } = await supabase.rpc('change_password', {
        p_user_id: profile.id,
        p_current_password: currentPassword,
        p_new_password: newPassword,
      });

      if (error) throw error;

      const rpcData = data && data[0] ? data[0] : null;
      if (!rpcData || !rpcData.success) {
        throw new Error(rpcData?.message || "Error al cambiar la contraseña.");
      }
      
      return rpcData;
    },
    onSuccess: () => {
      logout();
    },
  });
};

// Hook para actualizar la configuración regional del usuario
export const useUpdateRegionalSettings = () => {
  const { profile, updateCurrentProfile } = useAuth();

  return useMutation<any, Error, { countryId?: string | null; languageId?: string | null; currencyId?: string | null; timezoneId?: string | null; }>({
    mutationFn: async (settings) => {
      if (!profile?.id) throw new Error("Usuario no autenticado.");

      const { data, error } = await supabase.rpc('update_user_regional_settings', {
        p_user_id: profile.id,
        p_country_id: settings.countryId,
        p_language_id: settings.languageId,
        p_currency_id: settings.currencyId,
        p_timezone_id: settings.timezoneId,
      });

      if (error) throw error;
      return settings;
    },
    onSuccess: (newSettings) => {
      if (!profile || !updateCurrentProfile) return;
      
      const updatedProfile = {
        ...profile,
        country_id: newSettings.countryId ?? profile.country_id,
        language_id: newSettings.languageId ?? profile.language_id,
        currency_id: newSettings.currencyId ?? profile.currency_id,
        timezone_id: newSettings.timezoneId ?? profile.timezone_id,
      };
      updateCurrentProfile(updatedProfile);
    },
  });
};