import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

const generateInvoice = async (subscriptionId: string): Promise<string> => {
  if (!subscriptionId) {
    throw new Error('El ID de la suscripción es requerido.');
  }

  const { data, error } = await supabase.rpc('generate_invoice_for_subscription', {
    p_subscription_id: subscriptionId,
  });

  if (error) {
    throw new Error(`Error al generar la factura: ${error.message}`);
  }

  return data; // El ID de la nueva factura
};

export const useGenerateInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: generateInvoice,
    onSuccess: (newInvoiceId, subscriptionId) => {
      toast({
        title: 'Éxito',
        description: `Factura ${newInvoiceId} generada correctamente.`,
        variant: 'success',
      });
      // Invalidar las queries de facturas para refrescar la lista
      const tenantId = queryClient.getQueryData(['subscription', subscriptionId])?.tenant_id;
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: ['invoices', tenantId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
