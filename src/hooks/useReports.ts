
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

export interface GeneralReport {
  totalRevenue: number;
  completedAttentions: number;
  averageTicket: number;
}

export interface ServiceReportItem {
  name: string;
  count: number;
  revenue: number;
}

export interface UserPerformanceReportItem {
  user_name: string;
  attentions_count: number;
  services_revenue: number;
  products_revenue: number;
}

export interface StockReportItem {
  branch_name: string;
  product_name: string;
  quantity: number;
  cost: number;
  stock_value: number;
}

export const useGeneralReport = (dateFrom: string, dateTo: string) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<GeneralReport, Error>({
    queryKey: ['general-report', tenantId, dateFrom, dateTo],
    queryFn: async () => {
      if (!tenantId || !dateFrom || !dateTo) throw new Error("Parámetros inválidos");

      const { data, error } = await supabase.rpc('get_general_report', { 
        p_tenant_id: tenantId,
        p_date_from: dateFrom,
        p_date_to: dateTo
      });

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  });
};

export const useServiceReport = (dateFrom: string, dateTo: string) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<ServiceReportItem[], Error>({
    queryKey: ['service-report', tenantId, dateFrom, dateTo],
    queryFn: async () => {
      if (!tenantId || !dateFrom || !dateTo) throw new Error("Parámetros inválidos");

      const { data, error } = await supabase.rpc('get_service_report', { 
        p_tenant_id: tenantId,
        p_date_from: dateFrom,
        p_date_to: dateTo
      });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  });
};

export const useUserPerformanceReport = (dateFrom: string, dateTo: string) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<UserPerformanceReportItem[], Error>({
    queryKey: ['user-performance-report', tenantId, dateFrom, dateTo],
    queryFn: async () => {
      if (!tenantId || !dateFrom || !dateTo) throw new Error("Parámetros inválidos");

      const { data, error } = await supabase.rpc('get_user_performance_report', { 
        p_tenant_id: tenantId,
        p_date_from: dateFrom,
        p_date_to: dateTo
      });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  });
};

export const useStockReport = (dateFrom: string, dateTo: string) => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<StockReportItem[], Error>({
    queryKey: ['stock-report', tenantId, dateFrom, dateTo],
    queryFn: async () => {
      if (!tenantId) throw new Error("Parámetros inválidos");

      const { data, error } = await supabase.rpc('get_stock_report', { 
        p_tenant_id: tenantId,
        p_date_from: '2000-01-01',
        p_date_to: dateTo
      });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  });
};
