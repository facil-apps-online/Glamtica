import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface TenantInvoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  status: string;
  currency_code: string;
}

const fetchInvoicesByTenant = async (tenantId: string): Promise<TenantInvoice[]> => {
  if (!tenantId) return [];

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      issue_date,
      due_date,
      total_amount,
      status,
      currency:currencies(code)
    `)
    .eq('billed_to_tenant_id', tenantId)
    .order('issue_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(invoice => ({
    ...invoice,
    currency_code: invoice.currency.code,
  }));
};

export const useInvoicesByTenant = (tenantId: string) => {
  return useQuery<TenantInvoice[], Error>({
    queryKey: ['invoices', tenantId],
    queryFn: () => fetchInvoicesByTenant(tenantId),
    enabled: !!tenantId,
  });
};
