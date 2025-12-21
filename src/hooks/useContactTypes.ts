
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface ContactType {
  id: string;
  tenant_id: string;
  name: string;
  is_for_supplier: boolean;
  is_for_client: boolean;
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

export const useGetContactTypes = (applies_to?: 'client' | 'supplier') => {
  return useQuery<ContactType[], Error>({
    queryKey: ['contact_types', applies_to],
    queryFn: () => callTenantAction('get_contact_types', { applies_to }),
  });
};

export const useCreateContactType = () => {
  const queryClient = useQueryClient();
  return useMutation<ContactType, Error, Omit<ContactType, 'id' | 'tenant_id' | 'created_at'>>({
    mutationFn: (newType) => callTenantAction('create_contact_type', newType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact_types'] });
    },
  });
};

export const useUpdateContactType = () => {
  const queryClient = useQueryClient();
  return useMutation<ContactType, Error, Partial<ContactType> & { id: string }>({
    mutationFn: (updates) => callTenantAction('update_contact_type', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact_types'] });
    },
  });
};

export const useDeleteContactType = () => {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => callTenantAction('delete_contact_type', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact_types'] });
    },
  });
};
