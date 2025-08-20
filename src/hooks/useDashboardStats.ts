import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

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

export interface TodayAttention {
  id: string;
  attention_time: string;
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

export const useDashboardStats = () => {
  const { currentAssignment, user } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const roleName = currentAssignment?.role_name;
  const branchId = currentAssignment?.branch_id;
  const userId = user?.id;

  return useQuery<DashboardStats, Error>({
    queryKey: ['dashboard-stats', tenantId, roleName, branchId, userId],
    queryFn: async () => {
      if (!tenantId) throw new Error("Tenant ID not available.");

      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'get-dashboard-stats',
          payload: {
            p_tenant_id: tenantId,
            p_branch_id: roleName === 'tenant_super_admin' ? null : branchId,
            p_user_id: roleName === 'tenant_user' ? userId : null,
          }
        }
      });

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!tenantId && !!roleName && (roleName !== 'tenant_user' || !!userId),
    refetchInterval: 5 * 60 * 1000, // Refrescar cada 5 minutos
  });
};

export const useTodayAttentions = () => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<TodayAttention[], Error>({
    queryKey: ['today-attentions', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error("Tenant ID not available.");

      const { data, error } = await supabase.rpc('get_today_attentions', { p_tenant_id: tenantId });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!tenantId,
    refetchInterval: 2 * 60 * 1000, // Refrescar cada 2 minutos
  });
};

export const useTopServices = (days: number = 30) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<TopService[], Error>({
    queryKey: ['top-services', tenantId, days],
    queryFn: async () => {
      if (!tenantId) throw new Error("Tenant ID not available.");

      const { data, error } = await supabase.rpc('get_top_services', { p_tenant_id: tenantId, p_days: days });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!tenantId,
    refetchInterval: 10 * 60 * 1000, // Refrescar cada 10 minutos
  });
};