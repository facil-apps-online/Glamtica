import { useQuery } from "@tanstack/react-query";
import { callTenantAction } from "@/lib/tenantActions";
import { useAuth } from "@/contexts/AuthContext";

export const useProductTransfers = (branchFilter: string | null, statusFilter: string | null) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<any[], Error>({
    queryKey: ['product_transfers', tenantId, branchFilter, statusFilter],
    queryFn: () => callTenantAction('get_product_transfers', { tenantId, branchFilter, statusFilter }),
    enabled: !!tenantId,
  });
};