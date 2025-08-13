import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

const callTenantAction = async (action: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) throw error;
  return data;
};

export const usePurchases = () => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<any[], Error>({
    queryKey: ['purchases', tenantId],
    queryFn: () => callTenantAction('get_purchases', { tenantId }),
    enabled: !!tenantId,
  });
};