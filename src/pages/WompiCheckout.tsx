import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { coreSupabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const WompiCheckout = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Estado para almacenar los datos recibidos del backend
  const [checkoutData, setCheckoutData] = useState<Record<string, any> | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user?.tenant_id) {
      setError('No se pudo identificar al tenant. Por favor, inicia sesión de nuevo.');
      setIsLoading(false);
      return;
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountInCents) || amountInCents <= 0) {
      setError('Por favor, introduce un monto válido.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: functionError } = await coreSupabase.functions.invoke('core-actions', {
        body: {
          action: 'generate_wompi_checkout',
          payload: {
            tenantId: user.tenant_id,
            amountInCents,
            currency: 'COP',
            redirectUrl: `${window.location.origin}/payment-success`,
          },
        },
      });

      if (functionError) throw new Error(functionError.message);
      if (!data.success) throw new Error(data.error);

      setCheckoutData(data.checkoutData);

    } catch (e: any) {
      setError(`Error al preparar el pago: ${e.message}`);
      setIsLoading(false);
    }
  };

  // Efecto que se dispara cuando checkoutData se actualiza
  useEffect(() => {
    if (checkoutData && formRef.current) {
      // Si tenemos los datos, enviamos el formulario dinámico
      formRef.current.submit();
    }
  }, [checkoutData]);

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Realizar Pago con Wompi</CardTitle>
          <CardDescription>Introduce el monto a pagar y serás redirigido a la pasarela de pagos segura.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto a Pagar (COP)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ej: 50000"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Procesando...' : 'Pagar con Wompi'}
            </Button>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {/* Formulario oculto que se enviará a Wompi */}
      {checkoutData && (
        <form ref={formRef} action="https://checkout.wompi.co/p/" method="GET" style={{ display: 'none' }}>
          {Object.entries(checkoutData).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={String(value)} />
          ))}
        </form>
      )}
    </div>
  );
};

export default WompiCheckout;
