import React from 'react';
import { useApiHealthStats } from '@/hooks/useApiHealthStats';
import { useServerHealthStats } from '@/hooks/useServerHealthStats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Activity, AlertCircle, BarChart, HardDrive, MemoryStick, Cpu } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const StatCard = ({ title, value, unit, description, icon, isLoading }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-3/4" />
      ) : (
        <div className="text-2xl font-bold">{value} <span className="text-base font-normal text-muted-foreground">{unit}</span></div>
      )}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

const ChartCard = ({ title, description, children, isLoading }) => (
    <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
            {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    {children}
                </ResponsiveContainer>
            )}
        </CardContent>
    </Card>
);

export default function PerformanceMetrics() {
  const { data: apiStats, isLoading: isLoadingApi, isError: isErrorApi, error: errorApi } = useApiHealthStats();
  const { data: serverStats, isLoading: isLoadingServer, isError: isErrorServer, error: errorServer } = useServerHealthStats();

  const formattedRpmData = React.useMemo(() => {
    return apiStats?.requests_per_minute.map(d => ({
      ...d,
      time_bucket: format(new Date(d.time_bucket), 'HH:mm'),
    })) || [];
  }, [apiStats]);

  const isError = isErrorApi || isErrorServer;
  const error = errorApi || errorServer;

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 p-4 border border-red-500 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Error al cargar las métricas: {error?.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:p-6">
      {/* API Health Section */}
      <div>
        <h2 className="text-xl font-bold">Salud de la Base de Datos</h2>
        <p className="text-muted-foreground">Datos de los últimos 60 minutos. Se actualiza automáticamente.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Latencia Promedio"
          value={apiStats?.avg_latency_ms.toFixed(0) ?? '...'}
          unit="ms"
          description="Tiempo de respuesta de la API."
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingApi}
        />
        <StatCard
          title="Tasa de Errores (5xx)"
          value={apiStats?.error_rate_percentage.toFixed(2) ?? '...'}
          unit="%"
          description="Porcentaje de peticiones fallidas."
          icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingApi}
        />
        <StatCard
          title="Peticiones Totales"
          value={apiStats?.requests_per_minute.reduce((acc, curr) => acc + curr.request_count, 0) ?? '...'}
          unit="reqs"
          description="En la última hora."
          icon={<BarChart className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingApi}
        />
      </div>

      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
            title="Peticiones por Minuto (RPM)"
            description="Volumen de tráfico que maneja el Backend."
            isLoading={isLoadingApi}
        >
            <LineChart data={formattedRpmData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time_bucket" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))"
                    }}
                />
                <Line type="monotone" dataKey="request_count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
        </ChartCard>
      </div>

      {/* Server Health Section */}
      <div className="pt-4">
        <h2 className="text-xl font-bold">Salud de la Infraestructura (Servidor)</h2>
        <p className="text-muted-foreground">Monitor en tiempo real (Se actualiza automáticamente).</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Carga de CPU (1 min)"
          value={serverStats?.cpu_load_1m.toFixed(2) ?? '...'}
          unit="load"
          description="Promedio de carga del sistema."
          icon={<Cpu className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingServer}
        />
        <StatCard
          title="Uso de Memoria (RAM)"
          value={serverStats?.memory.usage_percent.toFixed(2) ?? '...'}
          unit="%"
          description={`${serverStats?.memory.used_gb.toFixed(2) ?? '...'} GB de ${serverStats?.memory.total_gb.toFixed(2) ?? '...'} GB`}
          icon={<MemoryStick className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingServer}
        />
        <StatCard
          title="Uso de Disco"
          value={serverStats?.disk.usage_percent.toFixed(2) ?? '...'}
          unit="%"
          description={`${serverStats?.disk.used_gb.toFixed(2) ?? '...'} GB de ${serverStats?.disk.total_gb.toFixed(2) ?? '...'} GB`}
          icon={<HardDrive className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingServer}
        />
      </div>


    </div>
  );
}

