import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

// Función auxiliar para verificar y actualizar el estado de la atención
export const checkAndUpdateAttentionStatus = async (attentionId: string) => {
  // Obtener todos los servicios de la atención
  const { data: allServices } = await supabase
    .from('attention_services')
    .select('status')
    .eq('attention_id', attentionId);

  if (!allServices || allServices.length === 0) return;

  // Verificar si todos los servicios están completados
  const allCompleted = allServices.every(service => service.status === 'Completado');
  
  if (allCompleted) {
    // Actualizar la atención a estado "Completada"
    await supabase
      .from('attentions')
      .update({ status: 'Completada' })
      .eq('id', attentionId);
    
    console.log(`Atención ${attentionId} actualizada a "Completada" - todos los servicios completados`);
  }
};

export interface ServiceSession {
  id: string;
  attention_service_id: string;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useServiceSession = (attentionServiceId: string) => {
  return useQuery({
    queryKey: ['service-session', attentionServiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_sessions')
        .select('*')
        .eq('attention_service_id', attentionServiceId)
        .maybeSingle();

      if (error) throw error;
      return data as ServiceSession | null;
    },
    enabled: !!attentionServiceId,
  });
};

export const useStartServiceSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ attentionServiceId }: { attentionServiceId: string }) => {
      // Primero obtener la atención ID
      const { data: serviceData } = await supabase
        .from('attention_services')
        .select('attention_id')
        .eq('id', attentionServiceId)
        .single();

      const { data, error } = await supabase
        .from('service_sessions')
        .insert([{
          attention_service_id: attentionServiceId,
          started_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      // Actualizar el estado del servicio a "En Proceso"
      await supabase
        .from('attention_services')
        .update({ status: 'En Proceso' })
        .eq('id', attentionServiceId);

      // Actualizar la atención a "En Proceso" si no lo está ya
      if (serviceData?.attention_id) {
        await supabase
          .from('attentions')
          .update({ status: 'En Proceso' })
          .eq('id', serviceData.attention_id)
          .eq('status', 'Confirmada'); // Solo actualizar si está confirmada
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-session', data.attention_service_id] });
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      toast({
        title: "Servicio iniciado",
        description: "El cronómetro del servicio ha comenzado.",
      });
    },
    onError: (error) => {
      console.error('Error starting service session:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el servicio. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};

export const useEndServiceSession = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ attentionServiceId }: { attentionServiceId: string }) => {
      // Primero obtener la atención ID para verificar después
      const { data: serviceData } = await supabase
        .from('attention_services')
        .select('attention_id')
        .eq('id', attentionServiceId)
        .single();

      const { data, error } = await supabase
        .from('service_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('attention_service_id', attentionServiceId)
        .select()
        .single();

      if (error) throw error;

      // Actualizar el estado del servicio a "Completado"
      await supabase
        .from('attention_services')
        .update({ status: 'Completado' })
        .eq('id', attentionServiceId);

      // Verificar y actualizar el estado de la atención si todos los servicios están completados
      if (serviceData?.attention_id) {
        await checkAndUpdateAttentionStatus(serviceData.attention_id);
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-session', data.attention_service_id] });
      queryClient.invalidateQueries({ queryKey: ['attentions'] });
      toast({
        title: "Servicio finalizado",
        description: "El servicio ha sido completado exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error ending service session:', error);
      toast({
        title: "Error",
        description: "No se pudo finalizar el servicio. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
};