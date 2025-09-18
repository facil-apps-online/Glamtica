import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { callTenantAction } from '@/lib/tenantActions';

// Define the type for the returned data based on the RPC function's RETURNS TABLE
export interface StockSnapshot {
  product_id: string;
  product_name: string;
  product_sku: string;
  stock_at_date: number;
  cost_at_date: number;
  last_movement_date: string;
}

export const useStockByDate = (branchId: string | null, reportDate: Date | null) => {
  const { tenantId } = useAuth();

  return useQuery<StockSnapshot[], Error>({
    queryKey: ['stock_by_date', tenantId, branchId, reportDate],
    queryFn: async () => {
      if (!tenantId || !branchId || !reportDate) return [];
      
      const data = await callTenantAction('get_stock_by_date', {
        branchId,
        reportDate: reportDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      });
      return data;
    },
    enabled: !!tenantId && !!branchId && !!reportDate,
  });
};
