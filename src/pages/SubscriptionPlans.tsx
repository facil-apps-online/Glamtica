import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useActiveSubscriptionPlans } from '@/hooks/useActiveSubscriptionPlans'; // Hook corregido
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check } from 'lucide-react';

const SubscriptionPlans = () => {
  const { data: allPlans, isLoading: isLoadingPlans } = useActiveSubscriptionPlans();
  const { user } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<Record<string, any> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Agrupar precios por plan y filtrar por el país del usuario
  const plansForUserCountry = useMemo(() => {
    if (!allPrices || !user?.country_id) return [];
    
    // La RPC devuelve una fila por cada combinación de plan y país,
    // así que solo necesitamos filtrar por el país del usuario.
    return allPrices.filter(price => price.country_id === user.country_id);
  }, [allPrices, user?.country_id]);

  const handleSelectPlan = async (planPriceId: string) => {
    setIsRedirecting(true);
    setError(null);

    if (!user?.tenant_id) {
      setError('No se pudo identificar al tenant. Por favor, inicia sesión de nuevo.');
      setIsRedirecting(false);
      return;
    }

    try {
      const { data, error: functionError } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          tenantId: user.tenant_id,
          planPriceId,
          redirectUrl: `${window.location.origin}/payment-success`,
        },
      });

      if (functionError) throw new Error(functionError.message);
      if (!data.success) throw new Error(data.error);

      setCheckoutData(data.checkoutData);

    } catch (e: any) {
      setError(`Error al preparar el pago: ${e.message}`);
      setIsRedirecting(false);
    }
  };

  useEffect(() => {
    if (checkoutData && formRef.current) {
      formRef.current.submit();
    }
  }, [checkoutData]);

  if (isLoadingPlans) {
    return <div className="p-4 text-center">Cargando planes de suscripción...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold">Elige tu Plan</h1>
        <p className="text-lg text-muted-foreground mt-2">Selecciona el plan que mejor se adapte a las necesidades de tu negocio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plansForUserCountry.map((plan) => (
          <Card key={plan.plan_id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{plan.plan_name}</CardTitle>
              <CardDescription>{plan.plan_description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.currency_symbol}{plan.calculated_price}</span>
                <span className="text-muted-foreground"> / mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.plan_features?.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Button
                  className="w-full"
                  onClick={() => handleSelectPlan(plan.price_id)}
                  disabled={isRedirecting}
                >
                  {isRedirecting ? 'Procesando...' : 'Seleccionar Plan'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {error && <p className="text-sm text-red-500 text-center mt-8">{error}</p>}

      {/* Formulario oculto para redirigir a Wompi */}
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

export default SubscriptionPlans;
