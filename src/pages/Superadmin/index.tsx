import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFinancialStats } from '@/hooks/useFinancialStats';
import { usePlatforms } from './hooks/usePlatforms';
import { StatsCard } from '@/components/StatsCard';
import { DollarSign, TrendingUp, Users, CreditCard, AlertTriangle, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { usePriceFormat } from '@/hooks/usePriceFormat';
import { SearchableSelect } from '@/components/ui/searchable-select';

export default function SuperadminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const platformId = searchParams.get('platformId');

  const { data: stats, isLoading, isError, error, isSuccess } = useFinancialStats(platformId);
  const { data: platforms, isLoading: isLoadingPlatforms } = usePlatforms();
  const { formatPrice } = usePriceFormat();

  const platformOptions = useMemo(() => {
    const options = platforms?.map(p => ({ value: p.id, label: p.name })) || [];
    options.unshift({ value: 'all', label: 'Todas las Plataformas' });
    return options;
  }, [platforms]);

  const handlePlatformChange = (option: { value: string; label: string } | null) => {
    if (option && option.value !== 'all') {
      setSearchParams({ platformId: option.value });
    } else {
      setSearchParams({});
    }
  };
  
  const selectedPlatform = platformOptions.find(p => p.value === (platformId || 'all'));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Financiero</h1>
          <p className="text-muted-foreground">
            Métricas clave del rendimiento económico de la(s) plataforma(s).
          </p>
        </div>
        <div className="w-full md:w-64">
          <SearchableSelect
            options={platformOptions}
            value={selectedPlatform}
            onChange={handlePlatformChange}
            placeholder="Selecciona una plataforma"
            loading={isLoadingPlatforms}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center h-48 text-muted-foreground"
          >
            Cargando datos...
          </motion.div>
        )}

        {isError && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-red-500 p-4 border border-red-500 rounded-md bg-red-50"
          >
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-5 w-5" />
              Error al Cargar el Dashboard
            </div>
            <p className="mt-2 text-sm">{error?.message}</p>
          </motion.div>
        )}

        {isSuccess && stats && (
          <motion.div
            key={platformId || 'all'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            {/* KPIs Principales */}
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <StatsCard title="Ingresos Mensuales (MRR)" value={formatPrice(stats.mrr ?? 0)} icon={DollarSign} tooltip="Ingresos recurrentes del último mes completo." />
              <StatsCard title="Ingresos Anuales (ARR)" value={formatPrice(stats.arr ?? 0)} icon={TrendingUp} tooltip="Proyección anual basada en el MRR (MRR * 12)." />
              <StatsCard title="Ingresos (Últimos 30 días)" value={formatPrice(stats.total_revenue_last_30_days ?? 0)} icon={CreditCard} tooltip="Suma de todos los pagos completados en los últimos 30 días." />
              <StatsCard title="Nuevos Tenants (Últimos 30 días)" value={stats.new_tenants_last_30_days ?? 0} icon={Users} tooltip="Tenants que realizaron su primer pago en los últimos 30 días." />
            </div>
            
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
                <StatsCard title="Suscripciones Activas" value={stats.active_subscriptions ?? 0} icon={Building} tooltip="Número total de suscripciones actualmente activas." />
                <StatsCard title="Pagos (Últimos 30 días)" value={stats.payments_last_30_days ?? 0} icon={CreditCard} tooltip="Número total de pagos completados en los últimos 30 días." />
            </div>

            {/* Gráficos (Próximamente) */}
            <Card>
                <CardHeader>
                    <CardTitle>Gráficos y Visualizaciones</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">Más gráficos y métricas vendrán aquí.</p>
                </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
