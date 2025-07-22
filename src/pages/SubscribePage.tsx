import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useUserSubscriptionPlans } from '@/hooks/useUserSubscriptionPlans';
import { useAuth } from '@/contexts/AuthContext';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Logo from '@/assets/images/glamtica.app.png';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
};

export default function SubscribePage() {
  const { user } = useAuth();
  const { data: plans, isLoading } = useUserSubscriptionPlans();
  const { formatPrice } = usePriceFormat();
  
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<Record<string, any> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSelectPlan = async (planId: string) => {
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
          planId,
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando planes...</div>;
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen w-full bg-brand-primary lg:grid lg:grid-cols-2"
    >
      {/* Columna Izquierda - Panel de Marca */}
      <div className="hidden lg:flex flex-col items-center justify-center p-10 text-white">
        <img src={Logo} alt="Glamtica.app Logo" className="w-48 h-48 mb-6" />
        <h1 className="text-4xl font-bold text-center">Activa tu Cuenta</h1>
        <p className="mt-4 text-lg text-center text-gray-300">Elige un plan para desbloquear todo el potencial de Glamtica.</p>
      </div>

      {/* Columna Derecha - Planes de Suscripción */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 lg:bg-background">
        <div className="w-full max-w-5xl">
          {/* Logo para la vista móvil */}
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <img src={Logo} alt="Glamtica.app Logo" className="w-36 h-36" />
            <h1 className="text-3xl font-bold text-white mt-4">Tu Suscripción Requiere Atención</h1>
            <p className="text-lg text-gray-300 mt-2">
              Elige un plan para continuar.
            </p>
          </div>
          {/* Títulos para la vista de escritorio */}
          <div className="hidden lg:block text-center mb-8">
            <h1 className="text-3xl font-bold">Tu Suscripción Requiere Atención</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Elige un plan para continuar disfrutando de todas las funcionalidades.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans?.map(plan => (
              <Card key={plan.plan_id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">{plan.plan_name}</CardTitle>
                  <CardDescription>{plan.plan_description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                  <div className="mb-4">
                    <span className="text-4xl font-bold">
                      {formatPrice(plan.calculated_price)}
                    </span>
                    <div className="text-xs text-muted-foreground mt-1">
                      <p>Sucursal extra: {formatPrice(plan.calculated_extra_branch_price)}</p>
                      {plan.billing_frequency_months > 1 ? (
                        <p>Equivalente a {formatPrice(plan.calculated_price / plan.billing_frequency_months)}/mes</p>
                      ) : (
                        <p>&nbsp;</p>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm flex-grow">
                    {plan.plan_features?.map((feature, index) => (
                      <li key={index} className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> {feature}</li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleSelectPlan(plan.plan_id)}
                    disabled={isRedirecting}
                  >
                    {isRedirecting ? 'Procesando...' : 'Seleccionar Plan'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          {error && <p className="text-sm text-red-500 text-center mt-4">{error}</p>}
        </div>
      </div>

      {/* Formulario oculto para redirigir a Wompi */}
      {checkoutData && (
        <form ref={formRef} action="https://checkout.wompi.co/p/" method="GET" style={{ display: 'none' }}>
          {Object.entries(checkoutData).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={String(value)} />
          ))}
        </form>
      )}
    </motion.div>
  );
}