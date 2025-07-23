import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchFilterStore } from "@/stores/branchFilterStore";

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export const useClients = () => {
  const { currentAssignment } = useAuth();
  const { selectedBranchId } = useBranchFilterStore();
  const tenantId = currentAssignment?.tenant_id;

  return useQuery({
    // El queryKey ahora incluye el tenant y la sucursal para que se actualice automáticamente
    queryKey: ['clients', tenantId, selectedBranchId],
    queryFn: async () => {
      if (!tenantId) return [];

      let query = supabase
        .from('clients')
        .select('*')
        .eq('tenant_id', tenantId);

      // Si hay una sucursal seleccionada (y no es 'todas'), añadir el filtro
      if (selectedBranchId !== 'all') {
        query = query.eq('branch_id', selectedBranchId);
      }

      const { data, error } = await query.order('name');

      if (error) {
        throw error;
      }

      return data as Client[];
    },
    // La consulta solo se ejecuta si hay un tenantId
    enabled: !!tenantId,
  });
};

// --- MUTACIONES (Crear, Actualizar, Eliminar) ---
// Estas no necesitan grandes cambios, pero es buena práctica asegurar que
// invaliden la query correcta.

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidar todas las queries de clientes para este tenant
      queryClient.invalidateQueries({ queryKey: ['clients', tenantId] });
      toast({
        title: "Cliente creado",
        description: "El cliente ha sido agregado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el cliente. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error creating client:', error);
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Client> 
    }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', tenantId] });
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente han sido actualizados.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente.",
        variant: "destructive",
      });
      console.error('Error updating client:', error);
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', tenantId] });
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado del sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente.",
        variant: "destructive",
      });
      console.error('Error deleting client:', error);
    },
  });
};