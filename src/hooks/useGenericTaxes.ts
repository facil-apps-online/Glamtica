
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface GenericTax {
  id: string;
  name: string;
  rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const fetchGenericTaxes = async (): Promise<GenericTax[]> => {
  const { data, error } = await supabase
    .from('generic_taxes')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const createGenericTax = async (tax: Omit<GenericTax, 'id' | 'created_at' | 'updated_at'>): Promise<GenericTax> => {
  const { data, error } = await supabase
    .from('generic_taxes')
    .insert([tax])
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const updateGenericTax = async (tax: Partial<GenericTax> & { id: string }): Promise<GenericTax> => {
  const { data, error } = await supabase
    .from('generic_taxes')
    .update(tax)
    .eq('id', tax.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const deleteGenericTax = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('generic_taxes')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

export const useGenericTaxes = () => {
  return useQuery<GenericTax[], Error>({
    queryKey: ['generic_taxes'],
    queryFn: fetchGenericTaxes,
  });
};

export const useCreateGenericTax = () => {
  const queryClient = useQueryClient();
  return useMutation<GenericTax, Error, Omit<GenericTax, 'id' | 'created_at' | 'updated_at'>>({
    mutationFn: createGenericTax,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generic_taxes'] });
    },
  });
};

export const useUpdateGenericTax = () => {
  const queryClient = useQueryClient();
  return useMutation<GenericTax, Error, Partial<GenericTax> & { id: string }>({
    mutationFn: updateGenericTax,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generic_taxes'] });
    },
  });
};

export const useDeleteGenericTax = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteGenericTax,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generic_taxes'] });
    },
  });
};
