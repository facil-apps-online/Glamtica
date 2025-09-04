import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

// --- INTERFACES ---
interface UpdateCommissionPayload {
  item_id: string;
  user_id: string;
  branch_id: string;
  item_type: 'product' | 'service';
  commission_rate: number;
  can_perform?: boolean; // Only for services
}

// --- HELPERS ---
const callTenantAction = async (action: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) throw error;
  return data;
};

// --- HOOK ---
export const useUpdateCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, UpdateCommissionPayload>({
    mutationFn: (payload) => callTenantAction('update_commission', payload),
    onSuccess: (data, variables) => {
      // Invalidate all related queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['product_commission_data', variables.item_id] });
      queryClient.invalidateQueries({ queryKey: ['service_commission_data', variables.item_id] });
      queryClient.invalidateQueries({ queryKey: ['user_product_commission_data', variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ['user_service_commission_data', variables.user_id] });
      
      toast({
        title: "Comisión Actualizada",
        description: "La comisión se ha guardado correctamente.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
