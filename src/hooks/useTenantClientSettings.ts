import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// Tipo para la configuración de cliente del tenant
export interface TenantClientSettings {
  id?: string;
  tenant_id: string;
  default_intake_form_id?: string | null;
  require_general_signature: boolean;
  require_image_consent: boolean;
  created_at?: string;
  updated_at?: string;
}

// Hook para obtener la configuración a través de la Edge Function
export const useTenantClientSettings = () => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  const fetchSettings = async () => {
    if (!tenantId) return null;

    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: { action: 'get_client_settings' },
    });

    if (error) throw new Error(error.message);
    return data;
  };

  return useQuery<TenantClientSettings | null>({
    queryKey: ['tenantClientSettings', tenantId],
    queryFn: fetchSettings,
    enabled: !!tenantId,
  });
};

// Hook para actualizar la configuración a través de la Edge Function
export const useUpdateTenantClientSettings = () => {
  const queryClient = useQueryClient();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  const updateSettings = async (settings: Partial<Omit<TenantClientSettings, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!tenantId) throw new Error('Tenant no identificado.');

    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: {
        action: 'update_client_settings',
        payload: { settings },
      },
    });

    if (error) throw new Error(error.message);
    return data;
  };

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenantClientSettings', tenantId] });
      // Actualizamos el cache directamente para una respuesta de UI más rápida
      queryClient.setQueryData(['tenantClientSettings', tenantId], data);
    },
  });
};