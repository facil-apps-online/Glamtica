
import React from 'react';
import { useCalculatedPrices } from '@/hooks/useCalculatedPrices';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useAllPlanPriceHistory } from '@/hooks/usePlanPriceHistory';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { NewPriceScheduler } from '@/components/superadmin/NewPriceScheduler';
import { CurrentPricesTable } from '@/components/superadmin/CurrentPricesTable';
import { PriceHistory } from '@/components/superadmin/PriceHistory';
import { ScheduledPrices } from '@/components/superadmin/ScheduledPrices';

export default function PlanPricingManager() {
  const { data: calculatedPrices, isLoading: isLoadingCalculated, isError: isErrorCalculated, error: errorCalculated } = useCalculatedPrices();
  const { data: plans, isLoading: isLoadingPlans, isError: isErrorPlans, error: errorPlans } = useSubscriptionPlans();
  const { data: priceHistory, isLoading: isLoadingHistory, isError: isErrorHistory, error: errorHistory } = useAllPlanPriceHistory();

  console.log('Datos de calculatedPrices:', calculatedPrices);
  console.log('Datos de plans:', plans);
  console.log('Datos de priceHistory:', priceHistory);
  
  const isLoading = isLoadingCalculated || isLoadingPlans || isLoadingHistory;
  const isError = isErrorCalculated || isErrorPlans || isErrorHistory;
  const error = errorCalculated || errorPlans || errorHistory;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500 p-4 border border-red-500 rounded-md">
        <div className="flex items-center gap-2 font-bold">
          <AlertTriangle className="h-5 w-5" />
          Error al Cargar los Datos
        </div>
        <p className="mt-2 text-sm">{error?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Gestión de Precios</h1>
        <p className="text-muted-foreground">
          Programe futuros cambios de precios. El sistema aplicará automáticamente el precio vigente según la fecha.
        </p>
      </div>
      <NewPriceScheduler plans={plans} isLoading={isLoading} />
      <CurrentPricesTable plans={plans} calculatedPrices={calculatedPrices} isLoading={isLoading} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PriceHistory history={priceHistory} isLoading={isLoading} />
        <ScheduledPrices history={priceHistory} isLoading={isLoading} />
      </div>
    </div>
  );
}
