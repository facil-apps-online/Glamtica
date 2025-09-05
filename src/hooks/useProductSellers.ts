
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { callTenantAction } from '@/lib/tenantActions';

export const useProductSellers = (
  productId?: string,
  branchId?: string,
  searchTerm?: string
) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery({
    queryKey: ['product-sellers', productId, branchId, searchTerm],
    queryFn: () => callTenantAction('get_product_sellers', { 
      productId, 
      branchId, 
      tenantId,
      searchTerm
    }),
    enabled: !!productId && !!branchId,
  });
};
