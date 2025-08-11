import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/lib/supabaseClient";
import { fetchTenantAction } from "@/lib/fetchTenantAction"; // Asumiendo que esta función existe

interface TaxType {
  id: string;
  name: string;
  rate: number | null;
  is_percentage: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateTaxTypePayload {
  name: string;
  rate: number | null;
  is_percentage: boolean;
  is_active: boolean;
}

interface UpdateTaxTypePayload {
  id: string;
  name?: string;
  rate?: number | null;
  is_percentage?: boolean;
  is_active?: boolean;
}

interface DeleteTaxTypePayload {
  id: string;
}

export const useTaxTypes = () => {
  return useQuery<TaxType[], Error>({
    queryKey: ['taxTypes'],
    queryFn: async () => {
      const data = await fetchTenantAction('get_tax_types', {});
      return data as TaxType[];
    },
  });
};

export const useCreateTaxType = () => {
  const queryClient = useQueryClient();
  return useMutation<TaxType, Error, CreateTaxTypePayload>({
    mutationFn: async (newTaxType) => {
      const data = await fetchTenantAction('create_tax_type', newTaxType);
      return data as TaxType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxTypes'] });
    },
  });
};

export const useUpdateTaxType = () => {
  const queryClient = useQueryClient();
  return useMutation<TaxType, Error, UpdateTaxTypePayload>({
    mutationFn: async (updatedTaxType) => {
      const data = await fetchTenantAction('update_tax_type', updatedTaxType);
      return data as TaxType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxTypes'] });
    },
  });
};

export const useDeleteTaxType = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, DeleteTaxTypePayload>({
    mutationFn: async (taxTypeToDelete) => {
      await fetchTenantAction('delete_tax_type', taxTypeToDelete);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxTypes'] });
    },
  });
};
