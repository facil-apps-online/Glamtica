
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
  const { data: settings } = useSettings();

  return useMutation({
    mutationFn: async (purchaseData: {
      supplier_id: string;
      supplier_name: string;
      purchase_date: string;
      invoice_number?: string;
      notes?: string;
      items: Array<{
        product_id: string;
        quantity: number;
        unit_cost: number;
      }>;
    }) => {
      const total_amount = purchaseData.items.reduce(
        (sum, item) => sum + (item.quantity * item.unit_cost), 
        0
      );

      // Crear la compra
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([{
          supplier_id: purchaseData.supplier_id,
          supplier_name: purchaseData.supplier_name,
          purchase_date: purchaseData.purchase_date,
          invoice_number: purchaseData.invoice_number,
          notes: purchaseData.notes,
          total_amount,
        }])
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Crear los items de la compra con total_cost calculado
      const items = purchaseData.items.map(item => ({
        purchase_id: purchase.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.quantity * item.unit_cost,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(items);

      if (itemsError) throw itemsError;

      // Actualizar costos de productos según método configurado
      const costingMethod = settings?.find(s => s.key === 'costing_method')?.value || 'average';
      
      for (const item of purchaseData.items) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('cost_price, stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (productError) continue;

        let newCostPrice = item.unit_cost;
        
        if (costingMethod === 'average' && product.cost_price > 0) {
          // Método promedio: (costo_anterior + costo_nuevo) / 2
          newCostPrice = (product.cost_price + item.unit_cost) / 2;
        }
        
        // Actualizar producto con nuevo costo y stock
        await supabase
          .from('products')
          .update({
            cost_price: newCostPrice,
            last_purchase_cost: item.unit_cost,
            average_cost: newCostPrice,
            stock_quantity: (product.stock_quantity || 0) + item.quantity,
          })
          .eq('id', item.product_id);
      }

      return purchase;
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
