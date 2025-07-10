
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export interface AppointmentEvidence {
  id: string;
  appointment_id?: string;
  attention_id?: string;
  service_session_id?: string;
  session_id?: string;
  extra_service_session_id?: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export const useAppointmentEvidence = (appointmentId?: string, attentionId?: string, extraServiceId?: string, serviceSessionId?: string) => {
  return useQuery({
    queryKey: ['appointment-evidence', appointmentId, attentionId, extraServiceId, serviceSessionId],
    queryFn: async () => {
      // Determinar qué tabla usar basado en los parámetros
      if (attentionId) {
        // Nueva estructura - service_evidence
        let query = supabase
          .from('service_evidence')
          .select('*')
          .eq('attention_id', attentionId);

        // Si se especifica un serviceSessionId, filtrar por él
        if (serviceSessionId) {
          // Primero obtener el service_session_id real si se pasa attention_service_id
          const { data: sessionData } = await supabase
            .from('service_sessions')
            .select('id')
            .eq('attention_service_id', serviceSessionId)
            .maybeSingle();
          
          if (sessionData) {
            query = query.eq('service_session_id', sessionData.id);
          } else {
            // Si no existe sesión, no hay evidencias para este servicio
            return [];
          }
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data as AppointmentEvidence[];
      } else if (appointmentId) {
        // Estructura antigua - appointment_evidence
        let query = supabase
          .from('appointment_evidence')
          .select('*')
          .eq('appointment_id', appointmentId);

        if (extraServiceId) {
          query = query.eq('extra_service_session_id', extraServiceId);
        } else {
          query = query.is('extra_service_session_id', null);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data as AppointmentEvidence[];
      }

      return [];
    },
    enabled: !!(appointmentId || attentionId),
  });
};

export const useUploadEvidence = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      file, 
      appointmentId,
      attentionId, 
      sessionId,
      serviceSessionId, 
      stylistId,
      extraServiceSessionId
    }: { 
      file: File; 
      appointmentId?: string;
      attentionId?: string; 
      sessionId?: string;
      serviceSessionId?: string;
      stylistId?: string;
      extraServiceSessionId?: string;
    }) => {
      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const baseId = appointmentId || attentionId;
      const fileName = `${baseId}-${Date.now()}.${fileExt}`;
      const filePath = `${baseId}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('appointment-evidence')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Determinar en qué tabla guardar basado en los parámetros
      if (attentionId && serviceSessionId) {
        // Nueva estructura - service_evidence
        // serviceSessionId puede ser attention_service_id, necesitamos obtener el service_session_id real
        let actualServiceSessionId = serviceSessionId;
        
        // Si no es un UUID de service_session, buscar en service_sessions
        const { data: sessionData } = await supabase
          .from('service_sessions')
          .select('id')
          .eq('attention_service_id', serviceSessionId)
          .maybeSingle();
        
        if (sessionData) {
          actualServiceSessionId = sessionData.id;
        } else {
          // Si no existe una sesión de servicio, crear una temporal solo para evidencia
          const { data: newSession, error: sessionError } = await supabase
            .from('service_sessions')
            .insert({
              attention_service_id: serviceSessionId,
              notes: 'Sesión creada para evidencia'
            })
            .select()
            .single();
          
          if (sessionError) throw sessionError;
          actualServiceSessionId = newSession.id;
        }

        const evidenceData = {
          service_session_id: actualServiceSessionId,
          attention_id: attentionId,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: stylistId,
        };

        const { data, error } = await supabase
          .from('service_evidence')
          .insert(evidenceData)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else if (appointmentId) {
        // Estructura antigua - appointment_evidence
        const evidenceData: TablesInsert<'appointment_evidence'> = {
          appointment_id: appointmentId,
          session_id: sessionId,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: stylistId,
        };

        if (extraServiceSessionId) {
          evidenceData.extra_service_session_id = extraServiceSessionId;
        }

        const { data, error } = await supabase
          .from('appointment_evidence')
          .insert(evidenceData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      throw new Error('Invalid parameters for evidence upload');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointment-evidence'] });
      toast({
        title: "Evidencia cargada",
        description: "La foto ha sido subida exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo cargar la evidencia. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error('Error uploading evidence:', error);
    },
  });
};

export const getEvidenceUrl = (filePath: string) => {
  const { data } = supabase.storage
    .from('appointment-evidence')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};
