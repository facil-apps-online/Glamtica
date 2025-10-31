import { useQuery } from '@tanstack/react-query';
import { invokeTenantAction } from './useTenantUsers'; // Re-using invokeTenantAction

export interface TenantStorageUsage {
  totalSize: number; // Size in bytes
  storageLimit: number; // Limit in bytes
}

const fetchTenantStorageUsage = async (tenantId: string): Promise<TenantStorageUsage> => {
  if (!tenantId) return { totalSize: 0 };
  const response = await invokeTenantAction('get_tenant_storage_usage', { tenantId });
  return response;
};

export const useTenantStorageUsage = (tenantId: string) => {
  return useQuery<TenantStorageUsage, Error>({
    queryKey: ['tenantStorageUsage', tenantId],
    queryFn: () => fetchTenantStorageUsage(tenantId),
    enabled: !!tenantId,
  });
};
