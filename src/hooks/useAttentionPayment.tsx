import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface AttentionData {
  id: string;
  total_amount: number;
}

interface PaymentOptions {
  payment_methods: { method: string; amount: number; method_id: string }[];
  discount: number;
}

// La lógica principal ahora vive en la Edge Function.
// Esta función solo invoca la Edge Function.
const processPaymentInBackend = async (
  attention: AttentionData,
  paymentOptions: PaymentOptions,
) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: {
      action: 'process_attention_payment',
      payload: { attention, paymentOptions },
    },
  });

  if (error) {
    throw new Error(`Error al procesar el pago: ${error.message}`);
  }

  // La Edge Function ahora devuelve un objeto con el resultado.
  // Si hay un checkout de Wompi, lo manejamos en el frontend.
  if (data.wompiCheckout) {
    const { checkoutData } = data;
    const form = document.createElement('form');
    form.action = 'https://checkout.wompi.co/p/';
    form.method = 'GET';
    form.style.display = 'none';

    for (const key in checkoutData) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = checkoutData[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }

  // Devolvemos el objeto de datos completo que la Edge Function nos pasó.
  return data;
};

export const useAttentionPayment = () => {
  const { toast } = useToast();
  const { currentAssignment, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attention, paymentOptions }: { attention: AttentionData; paymentOptions: PaymentOptions }) => {
      if (!currentAssignment || !user) {
        // Esta validación se mantiene como una primera barrera.
        throw new Error('Usuario o tenant no autenticado.');
      }
      // No necesitamos pasar tenantId o userId, la Edge Function los obtiene del token.
      return processPaymentInBackend(attention, paymentOptions);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      
      // La lógica de Wompi ya no se decide aquí, sino por la respuesta de la función.
      // Si no hay Wompi, la función termina y podemos mostrar el toast.
      // Si hay Wompi, el navegador redirigirá, por lo que el toast no se mostrará (lo cual es correcto).
      if (!variables.paymentOptions.payment_methods.some(p => p.method.toLowerCase() === 'wompi')) {
        toast({
          title: 'Pago Registrado',
          description: 'El pago se ha registrado correctamente.',
        });
      }
      
      // Devolvemos el objeto de datos completo para el onSuccess del componente.
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: 'Error en el Pago',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
