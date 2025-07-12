import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Users, Clock, TrendingUp, Scissors } from "lucide-react";
import { useDashboardStats, useTodayAppointments, useTopServices, AppointmentProduct, AppointmentExtraService, AppointmentWithRelations } from "@/hooks/useDashboardStats";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAppointments } from "@/hooks/useAppointments";
import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, subMonths } from "date-fns";
import { es } from "date-fns/locale";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: todayAppointments, isLoading: appointmentsLoading } = useTodayAppointments();
  const { data: topServices, isLoading: servicesLoading } = useTopServices();
  const { formatPrice } = usePriceFormat();

  // Obtener todas las citas para el gráfico comparativo
  const currentMonth = useMemo(() => new Date(), []);
  const previousMonth = useMemo(() => subMonths(currentMonth, 1), [currentMonth]);
  const { data: allAppointments } = useAppointments(null, null, startOfMonth(previousMonth));

  // Generar datos para el gráfico de ventas mensuales comparativo
  const monthlyComparisonData = useMemo(() => {
    if (!allAppointments) return [];

    const currentMonthStart = startOfMonth(currentMonth);
    const currentMonthEnd = endOfMonth(currentMonth);
    const previousMonthStart = startOfMonth(previousMonth);
    const previousMonthEnd = endOfMonth(previousMonth);

    const daysInCurrentMonth = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });
    const daysInPreviousMonth = eachDayOfInterval({ start: previousMonthStart, end: previousMonthEnd });

    // Filtrar citas del mes actual
    const currentMonthAppointments = allAppointments.filter((apt: AppointmentWithRelations) => {
      const aptDate = parseISO(apt.appointment_date);
      return aptDate >= currentMonthStart && 
             aptDate <= currentMonthEnd && 
             (apt.status === 'Completada' || apt.status === 'Pagada');
    });

    // Filtrar citas del mes anterior
    const previousMonthAppointments = allAppointments.filter((apt: AppointmentWithRelations) => {
      const aptDate = parseISO(apt.appointment_date);
      return aptDate >= previousMonthStart && 
             aptDate <= previousMonthEnd && 
             (apt.status === 'Completada' || apt.status === 'Pagada');
    });

    // Agrupar ventas por día para el mes actual
    const currentMonthSalesByDay = currentMonthAppointments.reduce((acc, apt: AppointmentWithRelations) => {
      const dayKey = format(parseISO(apt.appointment_date), 'yyyy-MM-dd');
      const revenue = apt.grand_total || apt.total_price;
      
      if (!acc[dayKey]) {
        acc[dayKey] = 0;
      }
      acc[dayKey] += revenue;
      return acc;
    }, {} as Record<string, number>);

    // Agrupar ventas por día para el mes anterior
    const previousMonthSalesByDay = previousMonthAppointments.reduce((acc, apt: AppointmentWithRelations) => {
      const dayKey = format(parseISO(apt.appointment_date), 'yyyy-MM-dd');
      const revenue = apt.grand_total || apt.total_price;
      
      if (!acc[dayKey]) {
        acc[dayKey] = 0;
      }
      acc[dayKey] += revenue;
      return acc;
    }, {} as Record<string, number>);

    // Crear datos para el gráfico - usar el máximo de días entre ambos meses
    const maxDays = Math.max(daysInCurrentMonth.length, daysInPreviousMonth.length);
    
    return Array.from({ length: maxDays }, (_, index) => {
      const currentDay = daysInCurrentMonth[index];
      const previousDay = daysInPreviousMonth[index];
      
      const currentDayKey = currentDay ? format(currentDay, 'yyyy-MM-dd') : null;
      const previousDayKey = previousDay ? format(previousDay, 'yyyy-MM-dd') : null;
      
      return {
        day: index + 1,
        mesActual: currentDayKey ? (currentMonthSalesByDay[currentDayKey] || 0) : 0,
        mesAnterior: previousDayKey ? (previousMonthSalesByDay[previousDayKey] || 0) : 0,
        fecha: currentDayKey || previousDayKey
      };
    });
  }, [allAppointments, currentMonth, previousMonth]);

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

  // Calcular totales para mostrar en el resumen
  const currentMonthTotal = monthlyComparisonData.reduce((sum, day) => sum + day.mesActual, 0);
  const previousMonthTotal = monthlyComparisonData.reduce((sum, day) => sum + day.mesAnterior, 0);
  const monthlyDifference = currentMonthTotal - previousMonthTotal;
  const monthlyPercentageChange = previousMonthTotal > 0 ? ((monthlyDifference / previousMonthTotal) * 100) : 0;

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

      {/* Primera fila: Ventas del día y del mes (2 columnas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-600">Ventas del Día</p>
                <p className="text-3xl font-bold text-slate-900 mt-2 break-words">
                  {formatPrice(stats?.todayRevenue || 0)}
                </p>
                <p className={`text-sm mt-2 ${(stats?.revenueChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats?.revenueChange 
                    ? `${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange.toFixed(1)}% vs ayer`
                    : "Sin datos de ayer"
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 ml-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-600">Ventas del Mes</p>
                <p className="text-3xl font-bold text-slate-900 mt-2 break-words">
                  {formatPrice(stats?.monthlyRevenue || 0)}
                </p>
                <p className={`text-sm mt-2 ${(stats?.monthlyRevenueChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats?.monthlyRevenueChange 
                    ? `${stats.monthlyRevenueChange > 0 ? '+' : ''}${stats.monthlyRevenueChange.toFixed(1)}% vs mes anterior`
                    : "Sin datos del mes anterior"
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0 ml-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda fila: Citas, Estilistas y Duración (3 columnas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Citas de Hoy"
          value={(stats?.todayAppointments || 0).toString()}
          change={stats?.appointmentsChange 
            ? `${stats.appointmentsChange > 0 ? '+' : ''}${stats.appointmentsChange.toFixed(1)}% vs ayer`
            : "Sin datos de ayer"
          }
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
        
        <StatsCard
          title="Duración Promedio"
          value={`${stats?.averageDuration}min`}
          change="Por servicio"
          icon={Clock}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Citas de Hoy ({todayAppointments?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-slate-600">Cargando citas...</p>
              </div>
            ) : todayAppointments?.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">No hay citas programadas para hoy</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {todayAppointments?.map((appointment: TodayAppointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">{appointment.time}</p>
                        <p className="text-sm text-slate-600 truncate">{appointment.client_name}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-medium truncate max-w-24">{appointment.service_name}</p>
                      <p className="text-xs text-slate-500 truncate max-w-24">{appointment.stylist_name}</p>
                      <p className="text-sm font-bold text-green-600 mt-1">
                        {formatPrice(appointment.total_price)}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
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
            <CardTitle className="flex items-center gap-2">
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

      {/* Gráfico de ventas mensuales comparativo */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Comparación de Ventas Mensuales
          </CardTitle>
          <div className="text-sm text-slate-600">
            {format(currentMonth, 'MMMM yyyy', { locale: es })} vs {format(previousMonth, 'MMMM yyyy', { locale: es })}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#64748b' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#64748b' }}
                  tickFormatter={(value) => formatPrice(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="mesActual" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  name={format(currentMonth, 'MMM yyyy', { locale: es })}
                />
                <Line 
                  type="monotone" 
                  dataKey="mesAnterior" 
                  stroke="#6b7280" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#6b7280', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: '#6b7280', strokeWidth: 2 }}
                  name={format(previousMonth, 'MMM yyyy', { locale: es })}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 font-medium">Mes Actual</p>
              <p className="text-lg font-bold text-green-600">
                {formatPrice(currentMonthTotal)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 font-medium">Mes Anterior</p>
              <p className="text-lg font-bold text-gray-600">
                {formatPrice(previousMonthTotal)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${monthlyDifference >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
              <p className={`text-sm font-medium ${monthlyDifference >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                Diferencia
              </p>
              <p className={`text-lg font-bold ${monthlyDifference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {monthlyDifference >= 0 ? '+' : ''}{formatPrice(monthlyDifference)}
              </p>
              <p className={`text-xs ${monthlyDifference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {monthlyPercentageChange >= 0 ? '+' : ''}{monthlyPercentageChange.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-700 font-medium">Próxima Cita</p>
            <p className="text-lg font-bold text-blue-800">
              {todayAppointments?.find(apt => apt.status === 'Confirmada')?.time || 'Sin citas'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-green-700 font-medium">Ingresos del Mes</p>
            <p className="text-lg font-bold text-green-800">
              {formatPrice(stats?.monthlyRevenue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-purple-700 font-medium">Clientes Atendidos</p>
            <p className="text-lg font-bold text-purple-800">
              {todayAppointments?.filter(apt => apt.status === 'Completada' || apt.status === 'Pagada').length || 0}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
