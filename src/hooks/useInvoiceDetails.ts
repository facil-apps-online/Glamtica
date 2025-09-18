
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

const fetchInvoiceDetails = async (attentionId: string) => {
  if (!attentionId) {
    throw new Error('Attention ID is required to fetch invoice details.');
  }

  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: {
      action: 'get_invoice_details_for_attention',
      payload: { attention_id: attentionId },
    },
  });

  if (error) {
    throw new Error(`Error fetching invoice details: ${error.message}`);
  }

  return data;
};

export const useInvoiceDetails = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: fetchInvoiceDetails,
    onError: (error: Error) => {
      toast({
        title: 'Error al Cargar Recibo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
