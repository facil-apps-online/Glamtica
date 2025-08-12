import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export interface ClientDocumentInstance {
  id: string;
  client_id: string;
  template_id: string;
  data: any; // El JSON con los datos del formulario
  created_at: string;
  template?: { // Datos de la plantilla, si se hace join
    name: string;
    description?: string;
    version: number;
  };
}

// Hook para obtener las instancias de documentos de un cliente
export const useClientDocumentInstances = (clientId: string) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  const fetchInstances = async () => {
    if (!tenantId || !clientId) return [];

    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: { action: 'get_client_document_instances', payload: { client_id: clientId } },
    });

    if (error) {
      console.error("Error fetching client document instances:", error);
      throw new Error(error.message);
    }
    
    return data as ClientDocumentInstance[];
  };

  return useQuery<ClientDocumentInstance[]>({
    queryKey: ['clientDocumentInstances', tenantId, clientId],
    queryFn: fetchInstances,
    enabled: !!tenantId && !!clientId,
  });
};

// Hook para guardar una instancia de documento de un cliente
export const useSaveClientDocumentInstance = () => {
  const queryClient = useQueryClient();
  const { currentAssignment } = useAuth();

  const saveInstance = async (instanceData: { client_id: string; template_id: string; data: any }) => {
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
      queryClient.invalidateQueries({ queryKey: ['clientDocumentInstances', currentAssignment?.tenant_id, variables.client_id] });
    }
  });
};