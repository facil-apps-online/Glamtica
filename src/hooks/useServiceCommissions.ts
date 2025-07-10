
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface ServiceCommission {
  id: string;
  service_id: string;
  stylist_id: string;
  commission_rate: number;
  can_perform: boolean;
  created_at: string;
  updated_at: string;
  services?: {
    id: string;
    name: string;
    price: number;
  };
  stylists?: {
    id: string;
    name: string;
  };
}

interface CreateServiceCommissionData {
  service_id: string;
  stylist_id: string;
  commission_rate: number;
  can_perform?: boolean;
}

export const useServiceCommissions = (serviceId?: string) => {
  return useQuery({
    queryKey: ['service-commissions', serviceId],
    queryFn: async () => {
      let query = supabase
        .from('service_stylist_commissions')
        .select(`
          *,
          services (id, name, price),
          stylists (id, name)
        `)
        .order('created_at', { ascending: false });

      if (serviceId) {
        query = query.eq('service_id', serviceId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ServiceCommission[];
    },
    enabled: !serviceId || !!serviceId,
  });
};

export const useStylistServiceCommissions = (stylistId: string) => {
  return useQuery({
    queryKey: ['service-commissions', 'stylist', stylistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_stylist_commissions')
        .select(`
          *,
          services (id, name, price, duration_minutes)
        `)
        .eq('stylist_id', stylistId)
        .eq('can_perform', true)
        .order('services(name)');

      if (error) throw error;
      return data as ServiceCommission[];
    },
    enabled: !!stylistId,
  });
};

export const useCreateServiceCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateServiceCommissionData) => {
      const { data: result, error } = await supabase
        .from('service_stylist_commissions')
        .insert({
          ...data,
          can_perform: data.can_perform ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-commissions'] });
      toast({
        title: "Comisión agregada",
        description: "La comisión del servicio se ha configurado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo agregar la comisión del servicio.",
        variant: "destructive",
      });
      console.error('Error creating service commission:', error);
    },
  });
};

export const useUpdateServiceCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<CreateServiceCommissionData> 
    }) => {
      const { data, error } = await supabase
        .from('service_stylist_commissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-commissions'] });
      toast({
        title: "Comisión actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la comisión del servicio.",
        variant: "destructive",
      });
      console.error('Error updating service commission:', error);
    },
  });
};

export const useDeleteServiceCommission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_stylist_commissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-commissions'] });
      toast({
        title: "Comisión eliminada",
        description: "La comisión del servicio se ha eliminado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la comisión del servicio.",
        variant: "destructive",
      });
      console.error('Error deleting service commission:', error);
    },
  });
};
