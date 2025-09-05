import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

export interface AttentionServiceEvidence {
  id: string;
  attention_service_id: string;
  google_drive_file_id: string;
  file_name: string;
  mime_type?: string;
  created_at: string;
  user_id?: string;
}

// Hook to get evidence for a specific attention service
export const useAppointmentEvidence = (attentionServiceId?: string) => {
  return useQuery({
    queryKey: ['attention-service-evidence', attentionServiceId],
    queryFn: async (): Promise<AttentionServiceEvidence[]> => {
      if (!attentionServiceId) return [];

      const { data: rpcData, error: rpcError } = await supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'get_attention_service_evidences',
          payload: { attentionServiceId },
        },
      });

      if (rpcError) throw new Error(rpcError.message);
      const data = rpcData; // Changed from rpcData.data
      return data;
    },
    enabled: !!attentionServiceId,
  });
};

// Hook to upload evidence via the centralized Google Drive edge function
export const useUploadEvidence = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({
      file,
      attentionServiceId,
      tenantId,
      branchId,
    }: {
      file: File;
      attentionServiceId: string;
      tenantId: string;
      branchId: string;
    }) => {
      if (!session) throw new Error("User is not authenticated.");

      const fileBase64 = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke('google-drive-upload', {
        body: {
          tenantId,
          branchId,
          userId: session.user.id,
          fileBase64,
          mimeType: file.type,
          fileName: file.name,
          uploadContext: 'ServiceEvidence',
          contextId: attentionServiceId,
        },
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['attention-service-evidence', variables.attentionServiceId] 
      });
      toast({
        title: "Evidencia cargada",
        description: "La foto ha sido subida a Google Drive exitosamente.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al subir evidencia",
        description: error.message,
        variant: "destructive",
      });
      console.error('Error uploading evidence via Edge Function:', error);
    },
  });
};

// Function to get the proxied Google Drive image URL
export const getEvidenceUrl = (googleDriveFile_fileId: string) => {
  const functionUrl = `${supabase.functions.getURL('proxy-google-drive-image')}?fileId=${googleDriveFile_fileId}`;
  return functionUrl;
};