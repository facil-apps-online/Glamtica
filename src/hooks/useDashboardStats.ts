import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from "date-fns";

interface AppointmentProduct {
  total_price: number;
}

interface AppointmentExtraService {
  price: number;
}

interface AppointmentWithRelations {
  total_price: number;
  appointment_products?: AppointmentProduct[];
  appointment_extra_services?: AppointmentExtraService[];
  status?: string | null;
  appointment_date: string;
  appointment_time: string;
  client_id: string;
  service_id: string;
  stylist_id: string;
  id: string;
}

export interface DashboardStats {
  todayRevenue: number;
  monthlyRevenue: number;
  todayAppointments: number;
  activeStylists: number;
  averageDuration: number;
  revenueChange: number;
  appointmentsChange: number;
  monthlyRevenueChange: number;
}

export interface TodayAppointment {
  id: string;
  time: string;
  client_name: string;
  service_name: string;
  stylist_name: string;
  status: string;
  total_price: number;
}

export interface TopService {
  name: string;
  count: number;
  revenue: number;
}

import { useUserTenantInfo } from "@/hooks/useUserTenantInfo";

export const useDashboardStats = () => {
  const { tenant_id } = useUserTenantInfo();

  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', tenant_id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!tenant_id) throw new Error("Tenant ID not available.");
      const today = new Date();
      const yesterday = subDays(today, 1);
      const currentMonth = new Date();
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      
      const todayStart = format(startOfDay(today), 'yyyy-MM-dd');
      const yesterdayStart = format(startOfDay(yesterday), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const lastMonthStart = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
      const lastMonthEnd = format(endOfMonth(lastMonth), 'yyyy-MM-dd');

      // Obtener citas de hoy
      const { data: todayAppointments, error: todayError } = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_products(total_price),
          appointment_extra_services(price)
        `)
        .eq('appointment_date', todayStart)
        .eq('tenant_id', tenant_id);

      if (todayError) throw todayError;

      // Obtener citas de ayer para comparación
      const { data: yesterdayAppointments, error: yesterdayError } = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_products(total_price),
          appointment_extra_services(price)
        `)
        .eq('appointment_date', yesterdayStart)
        .eq('tenant_id', tenant_id);

      if (yesterdayError) throw yesterdayError;

      // Obtener citas del mes actual
      const { data: monthlyAppointments, error: monthlyError } = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_products(total_price),
          appointment_extra_services(price),
          services(duration_minutes)
        `)
        .gte('appointment_date', monthStart)
        .lte('appointment_date', monthEnd)
        .in('status', ['Completada', 'Pagada'])
        .eq('tenant_id', tenant_id);

      if (monthlyError) throw monthlyError;

      // Obtener citas del mes pasado para comparación
      const { data: lastMonthAppointments, error: lastMonthError } = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_products(total_price),
          appointment_extra_services(price)
        `)
        .gte('appointment_date', lastMonthStart)
        .lte('appointment_date', lastMonthEnd)
        .in('status', ['Completada', 'Pagada'])
        .eq('tenant_id', tenant_id);

      if (lastMonthError) throw lastMonthError;

      // Obtener estilistas activos
      const { data: stylists, error: stylistsError } = await supabase
        .from('stylists')
        .select('*')
        .eq('is_active', true)
        .eq('tenant_id', tenant_id);

      if (stylistsError) throw stylistsError;

      // Función para calcular ingresos totales
      const calculateRevenue = (appointments: AppointmentWithRelations[]) => {
        return appointments?.reduce((sum, apt) => {
          const productsTotal = apt.appointment_products?.reduce((pSum: number, p: AppointmentProduct) => pSum + Number(p.total_price), 0) || 0;
          const servicesTotal = apt.appointment_extra_services?.reduce((sSum: number, s: AppointmentExtraService) => sSum + Number(s.price), 0) || 0;
          return sum + Number(apt.total_price) + productsTotal + servicesTotal;
        }, 0) || 0;
      };

      // Calcular ingresos
      const todayRevenue = calculateRevenue(todayAppointments?.filter(apt => apt.status === 'Completada' || apt.status === 'Pagada'));
      const yesterdayRevenue = calculateRevenue(yesterdayAppointments?.filter(apt => apt.status === 'Completada' || apt.status === 'Pagada'));
      const monthlyRevenue = calculateRevenue(monthlyAppointments);
      const lastMonthRevenue = calculateRevenue(lastMonthAppointments);

      // Calcular cambios porcentuales
      const revenueChange = yesterdayRevenue > 0 
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
        : todayRevenue > 0 ? 100 : 0;

      const monthlyRevenueChange = lastMonthRevenue > 0
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : monthlyRevenue > 0 ? 100 : 0;

      // Calcular cambio en número de citas
      const todayCount = todayAppointments?.length || 0;
      const yesterdayCount = yesterdayAppointments?.length || 0;
      const appointmentsChange = yesterdayCount > 0 
        ? ((todayCount - yesterdayCount) / yesterdayCount) * 100 
        : todayCount > 0 ? 100 : 0;

      // Calcular duración promedio (usando duración estimada del servicio)
      const completedAppointments = lastMonthAppointments?.filter(apt => apt.status === 'Completada' || apt.status === 'Pagada');
      const totalDuration = completedAppointments?.reduce((sum, apt) => sum + (apt.services?.duration_minutes || 0), 0) || 0;
      const averageDuration = completedAppointments?.length > 0 ? totalDuration / completedAppointments.length : 0;

      return {
        todayRevenue,
        monthlyRevenue,
        todayAppointments: todayCount,
        activeStylists: stylists?.length || 0,
        averageDuration: Math.round(averageDuration),
        revenueChange,
        appointmentsChange,
        monthlyRevenueChange,
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refrescar cada 5 minutos
  });
};

export const useTodayAppointments = () => {
  const { tenant_id } = useUserTenantInfo();

  return useQuery({
    queryKey: ['today-appointments', tenant_id],
    queryFn: async (): Promise<TodayAppointment[]> => {
      if (!tenant_id) throw new Error("Tenant ID not available.");

      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_time,
          status,
          total_price,
          clients(name),
          services(name),
          stylists(name),
          appointment_products(total_price),
          appointment_extra_services(price)
        `)
        .eq('appointment_date', today)
        .eq('tenant_id', tenant_id)
        .order('appointment_time', { ascending: true });

      if (error) throw error;

      return data?.map(apt => {
        const productsTotal = apt.appointment_products?.reduce((sum, p) => sum + Number(p.total_price), 0) || 0;
        const servicesTotal = apt.appointment_extra_services?.reduce((sum, s) => sum + Number(s.price), 0) || 0;
        const grandTotal = Number(apt.total_price) + productsTotal + servicesTotal;

        return {
          id: apt.id,
          time: apt.appointment_time.slice(0, 5),
          client_name: apt.clients?.name || 'Cliente',
          service_name: apt.services?.name || 'Servicio',
          stylist_name: apt.stylists?.name || 'Estilista',
          status: apt.status || 'Confirmada',
          total_price: grandTotal,
        };
      }) || [];
    },
    refetchInterval: 2 * 60 * 1000, // Refrescar cada 2 minutos
  });
};

export const useTopServices = () => {
  const { tenant_id } = useUserTenantInfo();

  return useQuery({
    queryKey: ['top-services', tenant_id],
    queryFn: async (): Promise<TopService[]> => {
      if (!tenant_id) throw new Error("Tenant ID not available.");

      // Obtener citas de los últimos 30 días
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          services(name),
          total_price,
          appointment_products(total_price),
          appointment_extra_services(price)
        `)
        .gte('appointment_date', thirtyDaysAgo)
        .in('status', ['Completada', 'Pagada'])
        .eq('tenant_id', tenant_id);

      if (error) throw error;

      // Agrupar por servicio
      const serviceStats = data?.reduce((acc, apt) => {
        const serviceName = apt.services?.name || 'Servicio Desconocido';
        const productsTotal = apt.appointment_products?.reduce((sum, p) => sum + Number(p.total_price), 0) || 0;
        const servicesTotal = apt.appointment_extra_services?.reduce((sum, s) => sum + Number(s.price), 0) || 0;
        const grandTotal = Number(apt.total_price) + productsTotal + servicesTotal;

        if (!acc[serviceName]) {
          acc[serviceName] = { count: 0, revenue: 0 };
        }
        acc[serviceName].count++;
        acc[serviceName].revenue += grandTotal;
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>) || {};

      // Convertir a array y ordenar por popularidad
      return Object.entries(serviceStats)
        .map(([name, stats]) => ({
          name,
          count: stats.count,
          revenue: stats.revenue,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
    },
    refetchInterval: 10 * 60 * 1000, // Refrescar cada 10 minutos
  });
};