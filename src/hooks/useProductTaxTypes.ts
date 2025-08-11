import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTenantAction } from "@/lib/fetchTenantAction";

interface ProductTaxType {
  id: string;
  product_id: string;
  tax_type_id: string;
  tax_types: { // Relación con la tabla tax_types
    name: string;
    rate: number | null;
    is_percentage: boolean;
  };
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

interface AddProductTaxTypePayload {
  product_id: string;
  tax_type_id: string;
}

interface RemoveProductTaxTypePayload {
  id: string;
}

export const useProductTaxTypes = (productId: string) => {
  return useQuery<ProductTaxType[], Error>({
    queryKey: ['productTaxTypes', productId],
    queryFn: async () => {
      const data = await fetchTenantAction('get_product_tax_types', { product_id: productId });
      return data as ProductTaxType[];
    },
    enabled: !!productId,
  });
};

export const useAddProductTaxType = () => {
  const queryClient = useQueryClient();
  return useMutation<ProductTaxType, Error, AddProductTaxTypePayload>({
    mutationFn: async (payload) => {
      const data = await fetchTenantAction('add_product_tax_type', payload);
      return data as ProductTaxType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTaxTypes'] });
    },
  });
};

export const useRemoveProductTaxType = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, RemoveProductTaxTypePayload>({
    mutationFn: async (payload) => {
      await fetchTenantAction('remove_product_tax_type', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTaxTypes'] });
    },
    onError: (error) => {
      console.error("Error removing product tax type:", error);
    },
  });
};
