import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { callTenantAction } from '@/lib/tenantActions';
import { Tables } from '@/integrations/supabase/types';

// Define the type for the returned data
export type ProductMovement = Tables<'product_movements'> & {
  products: { // Assuming the join in the RPC returns this nested object
    name: string;
    sku: string;
  }
};

export const useProductKardex = (branchId: string | null, productId: string | null) => {
  const { tenantId } = useAuth();

  return useQuery<ProductMovement[], Error>({
    queryKey: ['product_kardex', tenantId, branchId, productId],
    queryFn: async () => {
      if (!tenantId || !branchId || !productId) return [];
      
      const data = await callTenantAction('get_product_kardex', {
        branchId,
        productId,
      });
      return data;
    },
    enabled: !!tenantId && !!branchId && !!productId,
  });
};
