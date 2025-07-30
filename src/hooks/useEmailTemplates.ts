import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// Interfaz (sin cambios)
export interface EmailTemplate {
  id: string;
  tenant_id: string | null;
  platform_id: string | null;
  template_type: string;
  name: string;
  subject: string;
  body_html: string;
  language_id: string;
  is_active: boolean;
  is_customizable: boolean;
  is_disableable: boolean;
  created_at: string;
  updated_at: string;
}

// --- Hook para obtener las plantillas de una plataforma ---
export const usePlatformEmailTemplates = (platformId: string) => {
  return useQuery<EmailTemplate[], Error>({
    queryKey: ['emailTemplates', 'platform', platformId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'get_platform_email_templates', payload: { platformId } },
      });
      if (error) throw error;
      if (data.success === false) throw new Error(data.message);
      return data;
    },
    enabled: !!platformId,
  });
};

// --- Hooks de Acción para Superadmin ---
export const useSuperadminCreateEmailTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { templateData: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>, ownerTenantId: string }) => {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'create_platform_email_template', payload },
      });
      if (error) throw error;
      if (data.success === false) throw new Error(data.message);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates', 'platform', variables.templateData.platform_id] });
    },
  });
};

export const useSuperadminUpdateEmailTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { templateId: string, templateData: Partial<EmailTemplate> }) => {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'update_platform_email_template', payload },
      });
      if (error) throw error;
      if (data.success === false) throw new Error(data.message);
      return data;
    },
    onSuccess: (data) => {
      if (data?.platform_id) {
        queryClient.invalidateQueries({ queryKey: ['emailTemplates', 'platform', data.platform_id] });
      }
    },
  });
};

export const useDeleteEmailTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { templateId: string, platformId: string }) => {
      const { data, error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'delete_platform_email_template', payload },
      });
      if (error) throw error;
      if (data.success === false) throw new Error(data.message);
      return payload; // Devolver el payload para usar platformId en onSuccess
    },
    onSuccess: (payload) => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates', 'platform', payload.platformId] });
    },
  });
};
