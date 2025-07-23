import React from 'react';
import { useFinancialStats } from '@/hooks/useFinancialStats';
import { StatsCard } from '@/components/StatsCard';
import { DollarSign, TrendingUp, CalendarClock, Users, PieChart, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { usePriceFormat } from '@/hooks/usePriceFormat'; // Importar el hook

export default function SuperadminStats() {
  const { data: stats, isLoading, isError, error } = useFinancialStats();
  const { formatPrice } = usePriceFormat(); // Usar el hook

  const planDistributionData = [
    { name: 'Mensual', value: stats?.active_monthly_plans ?? 0 },
    { name: 'Semestral', value: stats?.active_semestral_plans ?? 0 },
    { name: 'Anual', value: stats?.active_annual_plans ?? 0 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center h-full text-muted-foreground"
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
          className="text-red-500 p-4 border border-red-500 rounded-md"
        >
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-5 w-5" />
            Error al Cargar el Dashboard
          </div>
          <p className="mt-2 text-sm">{error.message}</p>
          <p className="mt-2 text-xs text-gray-500">
            Esto puede ocurrir si la función de la base de datos `get_superadmin_financial_stats` no existe o tiene un error.
            Asegúrate de que la última migración se haya aplicado correctamente.
          </p>
        </motion.div>
      )}

      {!isLoading && !isError && stats && (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-8"
        >
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold">Dashboard Financiero</h1>
            <p className="text-muted-foreground">Métricas clave del rendimiento económico de la plataforma.</p>
          </div>

          {/* KPIs Principales */}
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Ingresos Mensuales (MRR)" value={formatPrice(stats?.mrr ?? 0)} icon={DollarSign} />
            <StatsCard title="Ingresos Anuales (ARR)" value={formatPrice(stats?.arr ?? 0)} icon={TrendingUp} />
            <StatsCard title="Nuevos Tenants (30 días)" value={stats?.new_tenants_last_30_days ?? 0} icon={Users} />
          </div>

          {/* Proyecciones y Rendimiento */}
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <StatsCard title="Proyectado (7 días)" value={formatPrice(stats?.projected_revenue_next_7_days ?? 0)} icon={CalendarClock} />
            <StatsCard title="Proyectado (30 días)" value={formatPrice(stats?.projected_revenue_next_30_days ?? 0)} icon={CalendarClock} />
            <StatsCard title="Renovado (Últimos 30 días)" value={formatPrice(stats?.renewed_revenue_last_30_days ?? 0)} icon={CalendarClock} />
          </div>

          {/* Gráficos */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Planes Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={planDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {planDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} planes`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Métricas Adicionales (Próximamente)</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">Más gráficos y métricas vendrán aquí.</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
