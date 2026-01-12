import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { useToast } from "@/hooks/use-toast";
import { useGoogleDriveStorage } from "./useGoogleDriveStorage";
import { useAuth } from "@/contexts/AuthContext";

export interface TreatmentImage {
  id: string;
  treatment_id: string;
  tenant_id: string;
  image_url: string | null;
  google_drive_file_id: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Hook to get images for a specific treatment
export const useTreatmentImages = (treatmentId: string) => {
  return useQuery<TreatmentImage[], Error>({
    queryKey: ["treatmentImages", treatmentId],
    queryFn: async () => {
      if (!treatmentId) return [];
      return fetchTenantAction("get_treatment_images", { treatmentId });
    },
    enabled: !!treatmentId,
  });
};

// Hook to associate a file uploaded to GDrive with a treatment
export const useAssociateTreatmentImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, { treatmentId: string; google_drive_file_id: string }>({
    mutationFn: (variables) => fetchTenantAction("associate_treatment_image", variables),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["treatmentImages", variables.treatmentId] });
      queryClient.invalidateQueries({ queryKey: ['master_treatments'] });
    },
    onError: (error) => {
      toast({ title: "Error de Asociación", description: `La imagen se subió pero no se pudo asociar al tratamiento: ${error.message}`, variant: "destructive" });
    },
  });
};

// Hook to delete an image from a treatment
export const useDeleteTreatmentImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { deleteFile: deleteFromDrive } = useGoogleDriveStorage();

  const { mutate, isPending: isDeleting } = useMutation<void, Error, { imageId: string; treatmentId: string; google_drive_file_id: string }>({
    mutationFn: async ({ imageId, treatmentId, google_drive_file_id }) => {
      // 1. Delete from our database first
      await fetchTenantAction("delete_treatment_image", { imageId });

      // 2. Immediately invalidate queries to update the UI instantly
      queryClient.invalidateQueries({ queryKey: ["treatmentImages", treatmentId] });
      queryClient.invalidateQueries({ queryKey: ['master_treatments'] });
      
      // 3. Then, delete from Google Drive in the background
      try {
        await deleteFromDrive(google_drive_file_id);
      } catch (error) {
        console.error(`DB record deleted. Error deleting file from Google Drive: ${(error as Error).message}.`);
      }
    },
    onSuccess: () => {
      toast({ title: "Éxito", description: "Imagen eliminada.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo eliminar el registro de la imagen: ${error.message}`, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["treatmentImages"] });
      queryClient.invalidateQueries({ queryKey: ['master_treatments'] });
    },
  });

  return { mutate, isDeleting };
};

// Hook to set an image as the primary one for a treatment
export const useSetPrimaryTreatmentImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, { treatmentId: string; imageId: string }>({
    mutationFn: (variables) => fetchTenantAction("set_primary_treatment_image", variables),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["treatmentImages", variables.treatmentId] });
      queryClient.invalidateQueries({ queryKey: ['master_treatments'] });
      toast({ title: "Éxito", description: "Imagen principal actualizada.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo actualizar la imagen principal: ${error.message}`, variant: "destructive" });
    },
  });
};
