import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface SupplierContactType {
  id: string;
  tenant_id: string;
  name: string;
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

export const useGetSupplierContactTypes = () => {
  return useQuery<SupplierContactType[], Error>({
    queryKey: ['supplier_contact_types'],
    queryFn: () => callTenantAction('get_contact_types', { applies_to: 'supplier' }),
  });
};

export const useCreateSupplierContactType = () => {
  const queryClient = useQueryClient();
  return useMutation<SupplierContactType, Error, { name: string }>({
    mutationFn: (newType) => callTenantAction('create_contact_type', { name: newType.name, is_for_supplier: true, is_for_client: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier_contact_types'] });
    },
  });
};

export const useUpdateSupplierContactType = () => {
  const queryClient = useQueryClient();
  return useMutation<SupplierContactType, Error, Partial<SupplierContactType> & { id: string }>({
    mutationFn: (updates) => callTenantAction('update_contact_type', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier_contact_types'] });
    },
  });
};

export const useDeleteSupplierContactType = () => {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => callTenantAction('delete_contact_type', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier_contact_types'] });
    },
  });
};
