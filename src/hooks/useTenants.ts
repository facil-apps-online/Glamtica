import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface Tenant {
  id: string;
  name: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

export const useTenants = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all tenants
  const fetchTenants = () => {
    return useQuery({
      queryKey: ['tenants'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .order('name');

        if (error) {
          throw error;
        }
        return data as Tenant[];
      },
    });
  };

  // Add a new tenant
  const addTenant = useMutation({
    mutationFn: async (newTenant: Omit<Tenant, 'id' | 'created_at' | 'updated_at' | 'subscription_status'>) => {
      const { data, error } = await supabase
        .from('tenants')
        .insert({ ...newTenant, subscription_status: 'trial' }) // Default to 'trial'
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({
        title: "Tenant añadido",
        description: "El nuevo tenant se ha guardado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo añadir el tenant.",
        variant: "destructive",
      });
      console.error('Error adding tenant:', error);
    },
  });

  // Update an existing tenant
  const updateTenant = useMutation({
    mutationFn: async (updatedTenant: Partial<Tenant> & { id: string }) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(updatedTenant)
        .eq('id', updatedTenant.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({
        title: "Tenant actualizado",
        description: "Los cambios en el tenant se han guardado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el tenant.",
        variant: "destructive",
      });
      console.error('Error updating tenant:', error);
    },
  });

  // Delete a tenant
  const deleteTenant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({
        title: "Tenant eliminado",
        description: "El tenant se ha eliminado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el tenant.",
        variant: "destructive",
      });
      console.error('Error deleting tenant:', error);
    },
  });

  return {
    fetchTenants,
    addTenant,
    updateTenant,
    deleteTenant,
  };
};