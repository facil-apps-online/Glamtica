import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

const callTenantAction = async (action: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) throw error;
  return data;
};

interface PurchaseReceptionItem {
  purchase_item_id: string;
  product_id: string;
  product_name: string;
  quantity_expected: number;
  quantity_received: number;
  cost_price: number;
}

export const usePurchaseReceptionDetails = (purchaseId: string) => {
  return useQuery<PurchaseReceptionItem[], Error>({
    queryKey: ['purchase_reception_details', purchaseId],
    queryFn: () => callTenantAction('get_purchase_reception_details', { purchase_id: purchaseId }),
    enabled: !!purchaseId,
  });
};
