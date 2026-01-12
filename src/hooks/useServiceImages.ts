import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { useToast } from "@/hooks/use-toast";
import { useGoogleDriveStorage } from "./useGoogleDriveStorage";
import { useAuth } from "@/contexts/AuthContext"; // Re-add useAuth

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

// Hook to associate a file uploaded to GDrive with a service
export const useAssociateServiceImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, { serviceId: string; google_drive_file_id: string }>({
    mutationFn: (variables) => fetchTenantAction("associate_service_image", variables),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["serviceImages", variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['master_services'] });
      // The toast is handled by the uploader hook, so we might not need one here.
      // toast({ title: "Éxito", description: "Imagen asociada correctamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error de Asociación", description: `La imagen se subió pero no se pudo asociar al servicio: ${error.message}`, variant: "destructive" });
    },
  });
};

// Hook to delete an image from a service (refactored using useGoogleDriveStorage)
export const useDeleteServiceImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { deleteFile: deleteFromDrive } = useGoogleDriveStorage();

  const { mutate, isPending: isDeleting } = useMutation<void, Error, { imageId: string; serviceId: string; google_drive_file_id: string }>({
    mutationFn: async ({ imageId, serviceId, google_drive_file_id }) => {
      // 1. Delete from our database first
      await fetchTenantAction("delete_service_image", { imageId });

      // 2. Immediately invalidate queries to update the UI instantly
      queryClient.invalidateQueries({ queryKey: ["serviceImages", serviceId] });
      queryClient.invalidateQueries({ queryKey: ['master_services'] });
      
      // 3. Then, delete from Google Drive in the background
      try {
        await deleteFromDrive(google_drive_file_id);
      } catch (error) {
        // Log the error but do not re-throw. The DB record is gone, and the orphan cleanup will handle the GDrive file.
        console.error(`DB record deleted. Error deleting file from Google Drive: ${(error as Error).message}.`);
      }
    },
    onSuccess: () => {
      // The UI has already updated. Just show a confirmation toast.
      toast({ title: "Éxito", description: "Imagen eliminada.", variant: "success" });
    },
    onError: (error) => {
      // This error is for the DB deletion part. Invalidate to refetch and bring the item back to the UI.
      toast({ title: "Error", description: `No se pudo eliminar el registro de la imagen: ${error.message}`, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["serviceImages"] }); // Refetch all service images on error
      queryClient.invalidateQueries({ queryKey: ['master_services'] });
    },
  });

  return { mutate, isDeleting };
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