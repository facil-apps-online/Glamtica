import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { UserAssignment } from '@/contexts/AuthContext';
import { invokeUserAction } from '@/hooks/useUserActions'; // Importar invokeUserAction

export type DetailedUserAssignment = Omit<UserAssignment, 'tenant_name'> & {
  role_display_name: string;
  branch_name: string;
};

// --- Tipos para el formulario ---
export interface AssignmentFormValue {
  branch_id: string | null;
  role_id: string | null;
  status: 'active' | 'inactive';
}

const fetchUserAssignments = async (userId: string, tenantId: string): Promise<DetailedUserAssignment[]> => {
  if (!userId || !tenantId) return [];

  // 1. Obtener la metadata del usuario a través de la Edge Function
  const { metadata, success, message } = await invokeUserAction('get-user-metadata', { userId });

  if (!success) {
    throw new Error(`Error fetching user metadata: ${message}`);
  }

  const tenantAssignments = (metadata?.tenant_assignments || []).filter(a => a.tenant_id === tenantId);

  // 2. Obtener roles y sucursales para los nombres a mostrar
  const [{ data: roles, error: rolesError }, { data: branches, error: branchesError }] = await Promise.all([
    supabase.from('roles').select('id, display_name'),
    supabase.from('branches').select('id, name').eq('tenant_id', tenantId),
  ]);

  if (rolesError) throw new Error(`Error fetching roles: ${rolesError.message}`);
  if (branchesError) throw new Error(`Error fetching branches: ${branchesError.message}`);

  // 3. Mapear las asignaciones con los nombres a mostrar
  const detailedAssignments: DetailedUserAssignment[] = tenantAssignments.map((assignment: any) => ({
    branch_id: assignment.branch_id,
    role_id: assignment.role_id,
    status: assignment.status,
    role_display_name: roles?.find(r => r.id === assignment.role_id)?.display_name || 'N/A',
    branch_name: branches?.find(b => b.id === assignment.branch_id)?.name || 'N/A',
  }));

  return detailedAssignments;
};

export const useUserAssignments = (userId: string, tenantId: string) => {
  return useQuery<DetailedUserAssignment[], Error>({
    queryKey: ['userAssignments', userId, tenantId],
    queryFn: () => fetchUserAssignments(userId, tenantId),
    enabled: !!userId && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
};


