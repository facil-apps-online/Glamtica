import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const attentionId = searchParams.get('attention_id');

    if (attentionId) {
      const updateStatus = async () => {
        try {
          const { error } = await supabase.functions.invoke('tenant-actions', {
            body: {
              action: 'update-attention-payment-status',
              payload: { attention_id: attentionId },
            },
          });

          if (error) {
            throw new Error(error.message);
          }
          setStatus('success');
        } catch (err: any) {
          setErrorMessage(err.message || 'Ocurrió un error al actualizar el estado del pago.');
          setStatus('error');
        }
      };

      updateStatus();
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-4 max-w-md flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg text-muted-foreground">Actualizando estado del pago...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto p-4 max-w-md flex items-center justify-center min-h-[60vh]">
        <Card className="w-full text-center">
          <CardHeader>
            <div className="mx-auto bg-red-100 rounded-full h-16 w-16 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="mt-4">Error en la Actualización</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              {errorMessage}
            </p>
            <Link to="/attentions" className="text-blue-600 hover:underline">
              Volver a Atenciones
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-md flex items-center justify-center min-h-[60vh]">
      <Card className="w-full text-center">
        <CardHeader>
          <div className="mx-auto bg-green-100 rounded-full h-16 w-16 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="mt-4">¡Pago Exitoso!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Tu transacción ha sido procesada y el estado de la atención ha sido actualizado.
          </p>
          <Link to="/attentions" className="text-blue-600 hover:underline">
            Volver a Atenciones
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
