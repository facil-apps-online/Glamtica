import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// Extender la interfaz para incluir todos los campos de una sucursal
export interface Branch {
  id: string;
  name: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country_id?: string;
  is_main_branch?: boolean;
  created_at?: string;
}

// Hook para OBTENER sucursales
export const useBranches = (tenantId: string) => {
  const { user } = useAuth();

  return useQuery<Branch[], Error>({
    queryKey: ['branches', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!tenantId,
  });
};

// Hook para CREAR una sucursal
export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (newBranch: Omit<Branch, 'id' | 'created_at' | 'tenant_id'>) => {
      if (!user?.tenant_id) throw new Error('Usuario no autenticado.');
      
      const { data, error } = await supabase
        .from('branches')
        .insert([{ ...newBranch, tenant_id: user.tenant_id }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['branches', data.tenant_id] });
    },
  });
};

// Hook para ACTUALIZAR una sucursal
export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Branch> & { id: string }) => {
      const { data, error } = await supabase
        .from('branches')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['branches', data.tenant_id] });
    },
  });
};

// Hook para ELIMINAR una sucursal
export const useDeleteBranch = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('branches').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', user?.tenant_id] });
    },
  });
};