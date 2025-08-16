
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Users, Clock, TrendingUp, Scissors } from "lucide-react";
import { useDashboardStats, useTodayAttentions, useTopServices, TodayAttention, TopService } from "@/hooks/useDashboardStats";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, subMonths } from "date-fns";
import { es } from "date-fns/locale";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: todayAttentions, isLoading: attentionsLoading } = useTodayAttentions();
  const { data: topServices, isLoading: servicesLoading } = useTopServices();
  const { formatPrice } = usePriceFormat();

  // La lógica del gráfico de comparación mensual se ha movido a la función RPC
  // por lo que ya no es necesario calcularla aquí.

  if (statsLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-600 mt-2">
            Resumen de actividad del salón
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-slate-600">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmada':
        return 'bg-blue-100 text-blue-700';
      case 'En Proceso':
        return 'bg-yellow-100 text-yellow-700';
      case 'Completada':
        return 'bg-green-100 text-green-700';
      case 'Pagada':
        return 'bg-emerald-100 text-emerald-700';
      case 'Cancelada':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean, payload?: Array<{ name: string, value: number, color: string }>, label?: string | number }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="text-sm font-medium">{`Día ${label}`}</p>
          {payload.map((entry: { name: string, value: number, color: string }, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${formatPrice(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">
          Dashboard
        </h1>
        <p className="text-slate-600 mt-2">
          Resumen de actividad del salón
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Ventas del Día"
          value={formatPrice(stats?.todayRevenue || 0)}
          change={`${stats?.revenueChange?.toFixed(1) || 0}% vs ayer`}
          icon={DollarSign}
          trend={(stats?.revenueChange || 0) >= 0 ? "up" : "down"}
        />
        <StatsCard
          title="Ventas del Mes"
          value={formatPrice(stats?.monthlyRevenue || 0)}
          change={`${stats?.monthlyRevenueChange?.toFixed(1) || 0}% vs mes anterior`}
          icon={TrendingUp}
          trend={(stats?.monthlyRevenueChange || 0) >= 0 ? "up" : "down"}
        />
        <StatsCard
          title="Atenciones de Hoy"
          value={(stats?.todayAppointments || 0).toString()}
          change={`${stats?.appointmentsChange?.toFixed(1) || 0}% vs ayer`}
          icon={Calendar}
          trend={(stats?.appointmentsChange || 0) >= 0 ? "up" : "down"}
        />
        <StatsCard
          title="Estilistas Activos"
          value={(stats?.activeStylists || 0).toString()}
          change="Disponibles hoy"
          icon={Users}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Calendar className="w-5 h-5 text-blue-600" />
              Atenciones de Hoy ({todayAttentions?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attentionsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-slate-600">Cargando atenciones...</p>
              </div>
            ) : todayAttentions?.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">No hay atenciones programadas para hoy</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {todayAttentions?.map((attention: TodayAttention) => (
                  <div key={attention.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">{attention.attention_time}</p>
                        <p className="text-sm text-slate-600 truncate">{attention.client_name}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-medium truncate max-w-24">{attention.service_name}</p>
                      <p className="text-xs text-slate-500 truncate max-w-24">{attention.stylist_name}</p>
                      <p className="text-sm font-bold text-green-600 mt-1">
                        {formatPrice(attention.total_price)}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attention.status)}`}>
                        {attention.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Servicios Más Populares (30 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {servicesLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-slate-600">Cargando servicios...</p>
              </div>
            ) : topServices?.length === 0 ? (
              <div className="text-center py-8">
                <Scissors className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">No hay datos de servicios disponibles</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topServices?.map((service: TopService, index: number) => (
                  <div key={service.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-purple-600">#{index + 1}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">{service.name}</p>
                        <p className="text-sm text-slate-600">{service.count} servicios</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-bold text-green-600">{formatPrice(service.revenue)}</p>
                      <p className="text-xs text-slate-500">
                        {formatPrice(service.revenue / service.count)} promedio
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
