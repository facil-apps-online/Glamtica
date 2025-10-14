import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

// --- INTERFACES ---
// Estructura de datos que el hook devolverá
export interface ServiceCommissionData {
  user_id: string;
  first_name: string;
  last_name: string;
  branches: {
    branch_id: string;
    branch_name: string;
    commission_rate: number | null;
    can_perform: boolean | null;
    commission_id: string | null;
  }[];
}

// --- HELPERS ---
const callTenantAction = async (action: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke('tenant-actions', {
    body: { action, payload },
  });
  if (error) throw error;
  return data;
};

// --- HOOK ---
/**
 * Hook para obtener la matriz de comisiones de un servicio específico.
 * Devuelve, para un servicio dado, todos los usuarios que pueden realizarlo
 * y la comisión que tienen en cada sucursal donde el servicio está disponible.
 * @param serviceId - El ID del servicio maestro.
 */
export const useServiceCommissionData = (serviceId?: string) => {
  return useQuery<ServiceCommissionData[], Error>({
    queryKey: ['service_commission_data', serviceId],
    queryFn: () => callTenantAction('get_service_commission_matrix', { serviceId }),
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
};
