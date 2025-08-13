import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { UserAssignment } from "@/contexts/AuthContext"; // Reutilizar la interfaz existente

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
 * Hook para obtener las asignaciones de un usuario específico dentro del tenant actual.
 * @param userId - El ID del usuario cuyas asignaciones se desean obtener.
 * @param tenantId - El ID del tenant actual.
 */
export const useUserAssignments = (userId?: string, tenantId?: string) => {
  return useQuery<UserAssignment[], Error>({
    queryKey: ['user_assignments', userId, tenantId],
    queryFn: async () => {
      // get_tenant_users devuelve todas las asignaciones para el tenant,
      // necesitamos filtrarlas por el userId específico.
      const allTenantUsers = await callTenantAction('get_users_for_tenant', { tenantId });
      return allTenantUsers.filter((assignment: UserAssignment) => assignment.user_id === userId);
    },
    enabled: !!userId && !!tenantId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
};