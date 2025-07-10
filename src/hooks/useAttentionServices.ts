import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export interface AttentionService {
  id: string;
  attention_id: string;
  service_id: string;
  stylist_id: string;
  service_price: number;
  service_order: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  services: {
    name: string;
    description?: string;
    duration_minutes: number;
  };
  stylists: {
    name: string;
  };
}

export const useAttentionServices = (attentionId: string) => {
  return useQuery({
    queryKey: ['attention-services', attentionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attention_services')
        .select(`
          *,
          services(name, description, duration_minutes),
          stylists(name)
        `)
        .eq('attention_id', attentionId)
        .order('service_order', { ascending: true });

      if (error) {
        throw error;
      }

      return data as AttentionService[];
    },
  });
};

export const useAddAttentionService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (serviceData: {
      attention_id: string;
      service_id: string;
      stylist_id: string;
      service_price: number;
      notes?: string;
    }) => {
      // Obtener el próximo order para este attention
      const { data: existingServices } = await supabase
        .from('attention_services')
        .select('service_order')
        .eq('attention_id', serviceData.attention_id)
        .order('service_order', { ascending: false })
        .limit(1);

      const nextOrder = existingServices && existingServices.length > 0 
        ? existingServices[0].service_order + 1 
        : 1;

      const { data, error } = await supabase
        .from('attention_services')
        .insert([{
          ...serviceData,
          service_order: nextOrder
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attention-services', data.attention_id] });
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      toast({
        title: "Servicio agregado",
        description: "El servicio ha sido agregado a la atención.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo agregar el servicio. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error adding attention service:', error);
    },
  });
};

export const useUpdateAttentionService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<AttentionService> 
    }) => {
      const { data, error } = await supabase
        .from('attention_services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attention-services', data.attention_id] });
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      toast({
        title: "Servicio actualizado",
        description: "El servicio ha sido actualizado exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error updating attention service:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el servicio. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};

export const useRemoveAttentionService = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('attention_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      return serviceId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attention-services'] });
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      toast({
        title: "Servicio eliminado",
        description: "El servicio ha sido eliminado de la atención.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error removing attention service:', error);
    },
  });
};