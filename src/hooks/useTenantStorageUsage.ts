import { useQuery } from '@tanstack/react-query';
import { invokeTenantAction } from './useTenantUsers';

export interface BreakdownData {
  category: string;
  table_name: string;
  size: number;
  branch_id: string;
}

export interface TenantStorageUsage {
  totalSize: number;
  storageLimit: number;
  breakdown: BreakdownData[];
}

const fetchTenantStorageUsage = async (tenantId: string): Promise<TenantStorageUsage> => {
  if (!tenantId) return { totalSize: 0, storageLimit: 0, breakdown: [] };
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
