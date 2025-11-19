
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
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<GeneralReport, Error>({
    queryKey: ['general-report', tenantId, dateFrom, dateTo],
    queryFn: async () => {
      if (!tenantId || !dateFrom || !dateTo) throw new Error("Parámetros inválidos");
      if (!session) throw new Error("Session not available");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'get_general_report',
          payload: {
            p_tenant_id: tenantId,
            p_date_from: dateFrom,
            p_date_to: dateTo
          },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error?.message || json.error || 'Failed to fetch general report');
      }
      return json.data?.[0] || { totalRevenue: 0, completedAttentions: 0, averageTicket: 0 };
    },
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  });
};

export const useServiceReport = (dateFrom: string, dateTo: string) => {
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<ServiceReportItem[], Error>({
    queryKey: ['service-report', tenantId, dateFrom, dateTo],
    queryFn: async () => {
      if (!tenantId || !dateFrom || !dateTo) throw new Error("Parámetros inválidos");
      if (!session) throw new Error("Session not available");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'get_service_report',
          payload: {
            p_tenant_id: tenantId,
            p_date_from: dateFrom,
            p_date_to: dateTo
          },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error?.message || json.error || 'Failed to fetch service report');
      }
      return json.data || [];
    },
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  });
};

export const useUserPerformanceReport = (dateFrom: string, dateTo: string) => {
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<UserPerformanceReportItem[], Error>({
    queryKey: ['user-performance-report', tenantId, dateFrom, dateTo],
    queryFn: async () => {
      if (!tenantId || !dateFrom || !dateTo) throw new Error("Parámetros inválidos");
      if (!session) throw new Error("Session not available");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'get_user_performance_report',
          payload: {
            p_tenant_id: tenantId,
            p_date_from: dateFrom,
            p_date_to: dateTo
          },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error?.message || json.error || 'Failed to fetch user performance report');
      }
      return json.data || [];
    },
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  });
};

export const useStockReport = (dateFrom: string, dateTo: string) => {
  const { session, currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery<StockReportItem[], Error>({
    queryKey: ['stock-report', tenantId, dateFrom, dateTo],
    queryFn: async () => {
      if (!tenantId) throw new Error("Parámetros inválidos");
      if (!session) throw new Error("Session not available");

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'get_stock_report',
          payload: {
            p_tenant_id: tenantId,
            p_date_from: dateFrom,
            p_date_to: dateTo
          },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error?.message || json.error || 'Failed to fetch stock report');
      }
      return json.data || [];
    },
    enabled: !!tenantId && !!dateFrom && !!dateTo,
  });
};
