import React, { useRef } from 'react';
import { useTenantSubscriptionPlans } from '@/hooks/useUserSubscriptionPlans';
import { useAuth } from '@/contexts/AuthContext';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { useWompiCheckout } from '@/hooks/useWompiCheckout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Info, CreditCard, FileText, Users, Archive } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSubscriptionUsage } from '@/hooks/useSubscriptionUsage';
import { StatsCard } from "@/components/StatsCard";

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const AssetIcon = ({ assetKey }: { assetKey: string }) => {
  switch (assetKey) {
    case 'electronic_invoices':
      return FileText;
    case 'users':
      return Users;
    default:
      return Archive;
  }
};

const CurrentSubscriptionStatus = () => {
  const { currentAssignment } = useAuth();
  const { data: subscription, isLoading } = useSubscriptionUsage(currentAssignment?.tenant_id);

  if (isLoading) {
    return <Skeleton className="h-40 w-full mb-8" />;
  }

  if (!subscription || !subscription.plan_name) {
    return (
      <Card className="mb-8 bg-yellow-50 border-yellow-200">
        <CardHeader className="flex flex-row items-center gap-4">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <div>
            <CardTitle className="text-yellow-800">Sin Suscripción Activa</CardTitle>
            <CardDescription className="text-yellow-700">
              Por favor, elige uno de los siguientes planes para activar tu cuenta.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const daysRemaining = subscription.billing_period_end ? differenceInDays(new Date(subscription.billing_period_end), new Date()) : null;

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center gap-4 bg-slate-50 rounded-t-lg">
        <Info className="h-8 w-8 text-slate-500" />
        <div>
          <CardTitle className="text-slate-800">Tu Plan Actual: {subscription.plan_name}</CardTitle>
          <CardDescription className="text-slate-700">
            {daysRemaining !== null 
              ? `Tu ciclo de facturación termina en ${daysRemaining} días, el ${format(new Date(subscription.billing_period_end!), "d 'de' MMMM 'de' yyyy", { locale: es })}.`
              : 'Esta suscripción no tiene fecha de vencimiento.'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-700">Consumo del Periodo Actual</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscription.usage.map(item => {
            const isStorage = item.asset_purpose_key === 'storage';
            const displayValue = isStorage
              ? `${formatBytes(item.used)} / ${formatBytes(item.limit)}`
              : `${item.used} / ${item.limit === -1 ? '∞' : item.limit}`;

            return (
              <StatsCard
                key={item.asset_key}
                title={item.asset_name}
                value={displayValue}
                change={item.asset_description}
                icon={AssetIcon({ assetKey: item.asset_key })}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};


export function SubscriptionTab() {
  const { profile, currentAssignment, loading: isAuthLoading } = useAuth();
  const { data: plans, isLoading: arePlansLoading } = useTenantSubscriptionPlans();
  
  const { formatPrice } = usePriceFormat();
  const { toast } = useToast();
  
  const wompiCheckoutMutation = useWompiCheckout();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSelectPlan = async (plan: any) => {
    if (!currentAssignment?.tenant_id || !profile?.id) {
      toast({
        title: 'Error de Contexto',
        description: 'No se pudo obtener la información del usuario o del negocio. Por favor, recargue la página.',
        variant: 'destructive',
      });
      return;
    }

    const checkoutRequest = {
      tenantId: currentAssignment.tenant_id,
      redirectUrl: `${window.location.origin}/app/settings?tab=subscription&payment_status=success`,
      userId: profile.id,
      amountInCents: Math.round(plan.calculated_price * 100),
      currency: 'COP',
      actions_on_success: [
        {
          action_type: 'ACTIVATE_SUBSCRIPTION',
          payload: { 
            plan_id: plan.plan_id,
          },
        },
      ],
    };

    wompiCheckoutMutation.mutate(checkoutRequest, {
      onSuccess: (checkoutData) => {
        if (formRef.current) {
          while (formRef.current.firstChild) {
            formRef.current.removeChild(formRef.current.firstChild);
          }
          Object.keys(checkoutData).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = checkoutData[key];
            formRef.current?.appendChild(input);
          });
          formRef.current.submit();
        }
      },
      onError: (error) => {
        toast({
          title: 'Error al Iniciar Pago',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const isLoading = isAuthLoading || arePlansLoading;

  if (isLoading) {
    
    // Skeleton loading state...
    return (
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-10 w-1/3 mb-4" /></CardContent><CardFooter><Skeleton className="h-10 w-full" /></CardFooter></Card>
        ))}
      </div>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <CreditCard className="h-5 w-5" />
          Suscripción
        </CardTitle>
        <CardDescription>
          Gestiona tu plan actual y explora otras opciones para tu negocio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CurrentSubscriptionStatus />

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-primary">Planes Disponibles</h2>
          <p className="text-slate-600">
            Actualiza o cambia tu plan para acceder a nuevas funcionalidades.
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
                  {plan.calculated_promotional_price > plan.calculated_price && plan.calculated_promotional_price > 0 && (
                    <span className="text-xl text-muted-foreground line-through mr-2">
                      {formatPrice(plan.calculated_promotional_price)}
                    </span>
                  )}
                  <span className="text-4xl font-bold">
                    {formatPrice(plan.calculated_price)}
                  </span>
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Plan Base</span>
                      <span>{formatPrice(plan.base_price)}</span>
                    </div>
                    {plan.active_branches_count > 0 && (
                      <div className="flex justify-between">
                        <span>Sucursales ({plan.active_branches_count})</span>
                        <span>{formatPrice(plan.active_branches_count * plan.calculated_extra_branch_price)}</span>
                      </div>
                    )}
                    <hr className="my-1" />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatPrice(plan.calculated_price)}</span>
                    </div>
                  </div>
                </div>
                <ul className="space-y-2 text-sm flex-grow mt-4">
                  {plan.plan_features?.map((feature, index) => (
                    <li key={index} className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> {feature}</li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleSelectPlan(plan)}
                  disabled={wompiCheckoutMutation.isPending}
                >
                  {wompiCheckoutMutation.isPending ? 'Procesando...' : 'Seleccionar Plan'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {wompiCheckoutMutation.error && <p className="text-sm text-red-500 text-center mt-4">{wompiCheckoutMutation.error.message}</p>}

        <form ref={formRef} action="https://checkout.wompi.co/p/" method="GET" style={{ display: 'none' }}></form>
      </CardContent>
    </Card>
  );
}