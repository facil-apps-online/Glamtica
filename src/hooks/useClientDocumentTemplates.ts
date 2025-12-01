import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// Tipo para las plantillas de documentos
export interface ClientDocumentTemplate {
  id: string;
  name: string;
  description?: string;
  schema: any; // O un tipo más específico si tienes la estructura del schema
  is_active: boolean;
  version: number;
  fill_on_attention?: boolean;
}

// Hook para OBTENER las plantillas de documentos
export const useClientDocumentTemplates = () => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  const fetchTemplates = async () => {
    if (!tenantId) return [];

    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: { action: 'get_document_templates' },
    });

    if (error) throw new Error(error.message);
    
    return data as ClientDocumentTemplate[];
  };

  return useQuery<ClientDocumentTemplate[]>({
    queryKey: ['clientDocumentTemplates', tenantId],
    queryFn: fetchTemplates,
    enabled: !!tenantId,
  });
};

// Hook para CREAR una plantilla de documento
export const useCreateDocumentTemplate = () => {
  const queryClient = useQueryClient();
  const { currentAssignment } = useAuth();

  const createTemplate = async (templateData: Pick<ClientDocumentTemplate, 'name' | 'description' | 'schema'>) => {
    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: { 
        action: 'create_document_template',
        payload: templateData
      },
    });

    if (error) throw new Error(error.message);
    return data;
  };

  return useMutation({ 
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientDocumentTemplates', currentAssignment?.tenant_id] });
    }
  });
};

// Hook para ACTUALIZAR una plantilla de documento
export const useUpdateDocumentTemplate = () => {
  const queryClient = useQueryClient();
  const { currentAssignment } = useAuth();

  const updateTemplate = async ({ id, updates }: { id: string, updates: Partial<ClientDocumentTemplate> }) => {
    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: { 
        action: 'update_document_template',
        payload: { id, updates }
      },
    });

    if (error) throw new Error(error.message);
    return data;
  };

  return useMutation({ 
    mutationFn: updateTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientDocumentTemplates', currentAssignment?.tenant_id] });
    }
  });
};

// Hook para CAMBIAR EL ESTADO (activar/desactivar) de una plantilla
export const useToggleDocumentTemplateStatus = () => {
  const queryClient = useQueryClient();
  const { currentAssignment } = useAuth();

  const toggleStatus = async ({ id, is_active }: { id: string, is_active: boolean }) => {
    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: { 
        action: 'toggle_document_template_status',
        payload: { id, is_active }
      },
    });

    if (error) throw new Error(error.message);
    return data;
  };

  return useMutation({ 
    mutationFn: toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientDocumentTemplates', currentAssignment?.tenant_id] });
    }
  });
};

export interface ClientDocumentInstance {
  id: string;
  client_id: string;
  template_id: string;
  attention_id?: string;
  data: any;
  created_at: string;
  template: {
    name: string;
    description?: string;
    version: number;
    schema: any;
  }
}

// Hook to GET document instances for a client or attention
export const useGetClientDocumentInstances = ({ clientId, attentionId }: { clientId?: string, attentionId?: string }) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  const fetchInstances = async () => {
    if (!tenantId || (!clientId && !attentionId)) return [];

    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: { 
        action: 'get_client_document_instances',
        payload: { client_id: clientId, attention_id: attentionId }
      },
    });

    if (error) throw new Error(error.message);
    return data as ClientDocumentInstance[];
  };

  return useQuery<ClientDocumentInstance[]>({
    queryKey: ['clientDocumentInstances', { tenantId, clientId, attentionId }],
    queryFn: fetchInstances,
    enabled: !!tenantId && (!!clientId || !!attentionId),
  });
};

// Hook to SAVE a document instance
export const useSaveClientDocumentInstance = () => {
  const queryClient = useQueryClient();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  const saveInstance = async (instanceData: { client_id: string, template_id: string, attention_id?: string, data: any }) => {
    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: { 
        action: 'save_client_document_instance',
        payload: instanceData
      },
    });

    if (error) throw new Error(error.message);
    return data;
  };

  return useMutation({
    mutationFn: saveInstance,
    onSuccess: (data, variables) => {
      // Invalidate queries for both the client and the attention to refresh the list
      queryClient.invalidateQueries({ queryKey: ['clientDocumentInstances', { tenantId, clientId: variables.client_id }] });
      if (variables.attention_id) {
        queryClient.invalidateQueries({ queryKey: ['clientDocumentInstances', { tenantId, attentionId: variables.attention_id }] });
      }
    }
  });
};