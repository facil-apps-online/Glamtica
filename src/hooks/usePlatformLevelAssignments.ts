import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// --- Interfaces ---
// Esta interfaz define la estructura de datos que el componente espera.
export interface PlatformAssignment {
  user_id: string;
  full_name: string | null;
  email: string;
  platform_roles: {
    app_super_admin?: { platform_id: string; platform_name: string; }[];
    investor?: { platform_id: string; platform_name: string; stake_percentage: number; }[];
  };
}

interface AssignRolePayload {
  userId: string;
  role: 'investor' | 'app_super_admin';
  assignments: any[]; // El payload puede variar dependiendo del rol
}

interface RemoveAssignmentPayload {
  userId: string;
  role: 'investor' | 'app_super_admin';
  platformId: string;
}

// --- Helper Function ---
const invokeSuperadminAction = async (action: string, payload?: any) => {
  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: { action, payload },
  });
  if (error) throw new Error(error.message);
  if (data.success === false) {
    throw new Error(data.message);
  }
  return data;
};

// --- GET Assignments ---
const fetchPlatformLevelAssignments = async (): Promise<PlatformAssignment[]> => {
  return invokeSuperadminAction('get_platform_level_assignments');
};

export const usePlatformLevelAssignments = () => {
  return useQuery<PlatformAssignment[], Error>({
    queryKey: ['platformLevelAssignments'],
    queryFn: fetchPlatformLevelAssignments,
  });
};

// --- ASSIGN Role ---
const assignPlatformRole = async (payload: AssignRolePayload): Promise<any> => {
  return invokeSuperadminAction('assign_platform_role', payload);
};

export const useAssignPlatformRole = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, AssignRolePayload>({
    mutationFn: assignPlatformRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformLevelAssignments'] });
    },
  });
};

// --- REMOVE Assignment ---
const removePlatformAssignment = async (payload: RemoveAssignmentPayload): Promise<any> => {
  return invokeSuperadminAction('remove_platform_assignment', payload);
};

export const useRemovePlatformAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, RemoveAssignmentPayload>({
    mutationFn: removePlatformAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformLevelAssignments'] });
    },
  });
};