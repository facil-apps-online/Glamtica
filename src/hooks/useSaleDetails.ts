import { useQuery } from '@tanstack/react-query';
import { callTenantAction } from '@/lib/tenantActions';
import { Tables } from '@/integrations/supabase/types';

// Define the complex type for the returned sale details
type SaleItem = Tables<'sales_items'>;
type Client = Tables<'clients'>;
type Branch = Tables<'branches'>;

export type SaleDetails = Tables<'sales'> & {
  client: Client;
  branch: Branch;
  tenant?: { name?: string | null };
  items: SaleItem[];
  payments: Tables<'attention_payments'>[];
};

export const useSaleDetails = (saleId: string | null) => {
  return useQuery<SaleDetails, Error>({
    queryKey: ['sale_details', saleId],
    queryFn: async () => {
      if (!saleId) throw new Error("Sale ID is required");
      
      const data = await callTenantAction('get_sale_details', { saleId });
      return data;
    },
    enabled: !!saleId,
  });
};
