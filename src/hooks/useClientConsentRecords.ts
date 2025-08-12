import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export interface ClientConsentRecord {
  id: string;
  client_id: string;
  consent_type: string; // Ej. 'general_signature', 'image_use'
  signature_data?: string; // Para firmas en Base64 u otro formato
  metadata?: any; // Para info adicional como IP, User Agent, etc.
  created_at: string;
}

// Hook para obtener los registros de consentimiento de un cliente
export const useClientConsentRecords = (clientId: string) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  const fetchRecords = async () => {
    if (!tenantId || !clientId) return [];

    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: { action: 'get_client_consent_records', payload: { client_id: clientId } },
    });

    if (error) {
      console.error("Error fetching client consent records:", error);
      throw new Error(error.message);
    }
    
    return data as ClientConsentRecord[];
  };

  return useQuery<ClientConsentRecord[]>({
    queryKey: ['clientConsentRecords', tenantId, clientId],
    queryFn: fetchRecords,
    enabled: !!tenantId && !!clientId,
  });
};

// Hook para guardar un registro de consentimiento de un cliente
export const useSaveClientConsentRecord = () => {
  const queryClient = useQueryClient();
  const { currentAssignment } = useAuth();

  const saveRecord = async (recordData: Pick<ClientConsentRecord, 'client_id' | 'consent_type' | 'signature_data' | 'metadata'>) => {
    const { data, error } = await supabase.functions.invoke('tenant-actions', {
      body: { 
        action: 'save_client_consent_record',
        payload: recordData
      },
    });

    if (error) throw new Error(error.message);
    return data;
  };

  return useMutation({ 
    mutationFn: saveRecord,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientConsentRecords', currentAssignment?.tenant_id, variables.client_id] });
    }
  });
};