import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface CompletePurchaseData {
  purchase_id: string;
}

export const useCompletePurchase = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session, currentAssignment } = useAuth();

  const invokeCompletePurchase = async (payload: CompletePurchaseData) => {
    if (!session) throw new Error("No hay sesión activa.");

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action: 'complete_purchase', payload }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `Error al completar la compra.`);
    }
    return result;
  };

  return useMutation({
    mutationFn: invokeCompletePurchase,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchases', currentAssignment?.tenant_id] });
      // También invalidar las consultas de productos de la sucursal para reflejar los cambios de stock/costo
      queryClient.invalidateQueries({ queryKey: ['branch_products'] }); 
      toast({
        title: "Compra Finalizada",
        description: "La compra ha sido marcada como completada y el inventario actualizado.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({ title: "Error al completar la compra", description: error.message, variant: "destructive" });
    },
  });
};
