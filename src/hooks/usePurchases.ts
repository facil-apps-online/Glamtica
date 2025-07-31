
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";

export interface Purchase {
  id: string;
  supplier_name: string;
  purchase_date: string;
  invoice_number?: string;
  total_amount: number;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    name: string;
  };
}

export interface PurchaseWithItems extends Purchase {
  purchase_items: PurchaseItem[];
}

export const usePurchases = () => {
  return useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          purchase_items (
            *,
            products (
              id,
              name
            )
          )
        `)
        .order('purchase_date', { ascending: false });

      if (error) {
        throw error;
      }

      return data as PurchaseWithItems[];
    },
  });
};

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (purchaseData: any) => {
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'create_purchase',
          payload: purchaseData,
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Compra registrada",
        description: "La compra ha sido registrada y los costos de productos actualizados.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar la compra. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error creating purchase:', error);
    },
  });
};

export const useUpdatePurchase = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Purchase> 
    }) => {
      const { data, error } = await supabase
        .from('purchases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast({
        title: "Compra actualizada",
        description: "La compra ha sido actualizada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la compra. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error updating purchase:', error);
    },
  });
};
