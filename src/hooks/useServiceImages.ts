import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

export interface ServiceImage {
  id: string;
  service_id: string;
  tenant_id: string;
  image_url: string | null;
  google_drive_file_id: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Hook to get images for a specific service
export const useServiceImages = (serviceId: string) => {
  return useQuery<ServiceImage[], Error>({
    queryKey: ["serviceImages", serviceId],
    queryFn: async () => {
      if (!serviceId) return [];
      return fetchTenantAction("get_service_images", { serviceId });
    },
    enabled: !!serviceId,
  });
};

// Hook to add an image to a service (desde URL, puede ser útil mantenerlo)
export const useAddServiceImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ServiceImage, Error, { serviceId: string; imageUrl: string }>({
    mutationFn: (variables) => fetchTenantAction("add_service_image", variables),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["serviceImages", data.service_id] });
      toast({ title: "Éxito", description: "Imagen añadida correctamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo añadir la imagen: ${error.message}`, variant: "destructive" });
    },
  });
};

// Hook to delete an image from a service
export const useDeleteServiceImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, { imageId: string; serviceId: string }>({
    mutationFn: ({ imageId }) => fetchTenantAction("delete_service_image", { imageId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["serviceImages", variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['master_services'] });
      toast({ title: "Éxito", description: "Imagen eliminada correctamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo eliminar la imagen: ${error.message}`, variant: "destructive" });
    },
  });
};

// Hook to set an image as the primary one for a service
export const useSetPrimaryServiceImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, { serviceId: string; imageId: string }>({
    mutationFn: (variables) => fetchTenantAction("set_primary_service_image", variables),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["serviceImages", variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['master_services'] });
      toast({ title: "Éxito", description: "Imagen principal actualizada.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo actualizar la imagen principal: ${error.message}`, variant: "destructive" });
    },
  });
};

// Hook to upload an image file to Google Drive and associate it with a service
export const useUploadServiceImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth();

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  return useMutation<any, Error, { serviceId: string; file: File }>({
    mutationFn: async ({ serviceId, file }) => {
      if (!currentAssignment?.tenant_id) {
        throw new Error("No se pudo determinar el tenant actual.");
      }

      const fileBase64 = await convertFileToBase64(file);

      const { data, error } = await supabase.functions.invoke("google-drive-upload", {
        body: {
          tenantId: currentAssignment.tenant_id,
          fileBase64,
          mimeType: file.type,
          fileName: file.name,
          uploadContext: "Services",
          contextId: serviceId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["serviceImages", variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['master_services'] });
      toast({ title: "Éxito", description: "Imagen subida y asociada correctamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Error al subir la imagen: ${error.message}`, variant: "destructive" });
    },
  });
};
