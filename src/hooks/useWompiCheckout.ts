import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

interface CheckoutRequest {
  tenantId: string;
  redirectUrl: string;
  userId: string;
  amountInCents: number;
  currency?: string;
  actions_on_success: any[];
}

const generateWompiCheckout = async (request: CheckoutRequest) => {
  const { data, error } = await supabase.functions.invoke('wompi-generate-checkout', {
    body: request,
  });

  if (error) {
    throw new Error(`Error al generar el checkout de Wompi: ${error.message}`);
  }
  
  if (!data.success) {
    throw new Error(data.error || 'Ocurrió un error desconocido en el servidor.');
  }

  return data.checkoutData;
};

export const useWompiCheckout = () => {
  return useMutation({
    mutationFn: generateWompiCheckout,
  });
};
