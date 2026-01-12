import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export interface CompressionSettings {
  maxSizeMB: number;
  maxWidthOrHeight: number;
}

export interface ImageSettings {
  catalogo: CompressionSettings;
  evidencias: CompressionSettings;
  firmas: CompressionSettings;
}

const defaultSettings: ImageSettings = {
  catalogo: { maxSizeMB: 1.0, maxWidthOrHeight: 1920 },
  evidencias: { maxSizeMB: 2.0, maxWidthOrHeight: 2048 },
  firmas: { maxSizeMB: 0.5, maxWidthOrHeight: 1024 }
};

export const useImageCompressionSettings = () => {
  const { tenantId, currentAssignment } = useAuth();
  const platformId = currentAssignment?.platform_id;

  const { data, isLoading, error } = useQuery<ImageSettings, Error>({
    queryKey: ['tenant-image-compression-settings', tenantId, platformId],
    queryFn: async () => {
      if (!tenantId || !platformId) {
        // This case should ideally not happen if query is enabled only when tenantId/platformId are present
        return defaultSettings;
      }

      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'get_tenant_settings',
          payload: { tenantId: tenantId, platformId: platformId }
        }
      });

      if (error) {
        console.error('Error fetching image compression settings:', error);
        // Fallback to defaults on error
        return defaultSettings;
      }
      // The backend should ensure this structure is filled with defaults if not present
      return data.settings_data.image_compression_settings as ImageSettings;
    },
    enabled: !!tenantId && !!platformId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    initialData: defaultSettings, // Provide initial data to prevent undefined
  });

  const getSettingsForType = (type: keyof ImageSettings): CompressionSettings => {
    return data?.[type] || defaultSettings[type];
  };

  return { settings: data, isLoading, error, getSettingsForType };
};
