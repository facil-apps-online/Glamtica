
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface DocumentType {
  id: string;
  tenant_id: string;
  name: string;
  abbreviation: string;
  applies_to: string[];
  is_active: boolean;
  created_at: string;
}

const callTenantAction = async (action: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) throw error;
  return data;
};

export const useGetDocumentTypes = (applies_to: string) => {
  return useQuery<DocumentType[], Error>({
    queryKey: ['document_types', applies_to],
    queryFn: () => callTenantAction('get_document_types', { applies_to }),
  });
};

export const useCreateDocumentType = () => {
  const queryClient = useQueryClient();
  return useMutation<DocumentType, Error, Omit<DocumentType, 'id' | 'tenant_id' | 'created_at'>>({
    mutationFn: (newType) => callTenantAction('create_document_type', newType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_types'] });
    },
  });
};

export const useUpdateDocumentType = () => {
  const queryClient = useQueryClient();
  return useMutation<DocumentType, Error, Partial<DocumentType> & { id: string }>({
    mutationFn: (updates) => callTenantAction('update_document_type', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_types'] });
    },
  });
};

export const useDeleteDocumentType = () => {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => callTenantAction('delete_document_type', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document_types'] });
    },
  });
};
