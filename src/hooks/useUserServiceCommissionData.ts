import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

// --- INTERFACES ---
export interface UserServiceCommissionData {
  service_id: string;
  service_name: string;
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
 * Hook para obtener la matriz de comisiones de servicios para un usuario específico.
 * @param userId - El ID del usuario.
 */
export const useUserServiceCommissionData = (userId?: string) => {
  return useQuery<UserServiceCommissionData[], Error>({
    queryKey: ['user_service_commission_data', userId],
    queryFn: () => callTenantAction('get_user_service_commission_matrix', { userId }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
};
