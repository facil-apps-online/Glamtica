import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { callTenantAction } from "@/lib/tenantActions";

interface UpdateAttentionItemsParams {
  p_attention_id: string;
  p_branch_id: string;
  p_services_to_upsert: any[];
  p_products_to_upsert: any[];
  p_combos_to_upsert: any[];
  p_service_ids_to_delete: string[];
  p_product_ids_to_delete: string[];
  p_combo_ids_to_delete: string[];
}

export const useUpdateAttentionItems = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();

  return useMutation({
    mutationFn: async (params: UpdateAttentionItemsParams) => {
      if (!currentAssignment) {
        throw new Error("No se encontró asignación de tenant.");
      }

      const tenantId = currentAssignment.tenant_id;

      if (!tenantId || !params.p_branch_id) {
        throw new Error("Tenant ID o Branch ID no disponibles.");
      }

      // The entire params object is now the payload, and we add the tenant_id to it.
      const response = await callTenantAction('update_attention_items', {
        p_payload: { ...params, p_tenant_id: tenantId }
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      queryClient.invalidateQueries({ queryKey: ['attention-dates'] });
      toast({ title: "Atención actualizada", description: "Los ítems de la atención han sido actualizados exitosamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
};