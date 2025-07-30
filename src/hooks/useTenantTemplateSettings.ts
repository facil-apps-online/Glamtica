import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// Interfaz para la configuración de plantillas del tenant
export interface TenantTemplateSetting {
  id: string;
  tenant_id: string;
  template_type: string;
  template_id: string | null; // ID de la plantilla personalizada, o null para usar la de la plataforma
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Hook para obtener la configuración de plantillas de un tenant
export const useTenantTemplateSettings = () => {
  const { session } = useAuth();
  const tenantId = session?.user?.app_metadata?.tenant_id;

  return useQuery<TenantTemplateSetting[], Error>({
    queryKey: ['tenantTemplateSettings', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('tenant_template_settings')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw new Error(error.message);
      return data as TenantTemplateSetting[];
    },
    enabled: !!tenantId,
  });
};

// Hook para crear o actualizar (upsert) la configuración de una plantilla para un tenant
export const useUpsertTenantTemplateSetting = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const tenantId = session?.user?.app_metadata?.tenant_id;

  return useMutation({
    mutationFn: async (setting: { template_type: string; template_id: string | null; is_active: boolean }) => {
      if (!tenantId) throw new Error('Tenant ID not available');

      const { data, error } = await supabase
        .from('tenant_template_settings')
        .upsert(
          {
            tenant_id: tenantId,
            template_type: setting.template_type,
            template_id: setting.template_id,
            is_active: setting.is_active,
          },
          { onConflict: 'tenant_id, template_type' } // La clave única para el upsert
        );

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantTemplateSettings', tenantId] });
    },
  });
};
