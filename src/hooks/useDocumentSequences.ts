import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { callTenantAction } from '@/lib/tenantActions';
import { Tables } from '@/integrations/supabase/types';

// Define the type based on the table schema we created
export type DocumentSequence = Tables<'document_sequences'>;

export const useDocumentSequences = () => {
  const { tenantId } = useAuth();

  return useQuery<DocumentSequence[], Error>({
    queryKey: ['document_sequences', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      // The payload is empty as tenantId is extracted from the JWT in the edge function
      const data = await callTenantAction('get_document_sequences', {});
      return data;
    },
    enabled: !!tenantId,
  });
};
