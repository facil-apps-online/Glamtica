import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { useToast } from "@/hooks/use-toast";
import { useGoogleDriveStorage } from "./useGoogleDriveStorage";
import { useAuth } from "@/contexts/AuthContext";

export interface ComboImage {
  id: string;
  combo_id: string;
  tenant_id: string;
  image_url: string | null;
  google_drive_file_id: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Hook to get images for a specific combo
export const useComboImages = (comboId: string) => {
  return useQuery<ComboImage[], Error>({
    queryKey: ["comboImages", comboId],
    queryFn: async () => {
      if (!comboId) return [];
      return fetchTenantAction("get_combo_images", { comboId });
    },
    enabled: !!comboId,
  });
};

// Hook to associate a file uploaded to GDrive with a combo
export const useAssociateComboImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, { comboId: string; google_drive_file_id: string }>({
    mutationFn: (variables) => fetchTenantAction("associate_combo_image", variables),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comboImages", variables.comboId] });
      queryClient.invalidateQueries({ queryKey: ['master_combos'] });
    },
    onError: (error) => {
      toast({ title: "Error de Asociación", description: `La imagen se subió pero no se pudo asociar al combo: ${error.message}`, variant: "destructive" });
    },
  });
};

// Hook to delete an image from a combo
export const useDeleteComboImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { deleteFile: deleteFromDrive } = useGoogleDriveStorage();

  const { mutate, isPending: isDeleting } = useMutation<void, Error, { imageId: string; comboId: string; google_drive_file_id: string }>({
    mutationFn: async ({ imageId, comboId, google_drive_file_id }) => {
      // 1. Delete from our database first
      await fetchTenantAction("delete_combo_image", { imageId });

      // 2. Immediately invalidate queries to update the UI instantly
      queryClient.invalidateQueries({ queryKey: ["comboImages", comboId] });
      queryClient.invalidateQueries({ queryKey: ['master_combos'] });
      
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
      queryClient.invalidateQueries({ queryKey: ["comboImages"] });
      queryClient.invalidateQueries({ queryKey: ['master_combos'] });
    },
  });

  return { mutate, isDeleting };
};

// Hook to set an image as the primary one for a combo
export const useSetPrimaryComboImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, { comboId: string; imageId: string }>({
    mutationFn: (variables) => fetchTenantAction("set_primary_combo_image", variables),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comboImages", variables.comboId] });
      queryClient.invalidateQueries({ queryKey: ['master_combos'] });
      toast({ title: "Éxito", description: "Imagen principal actualizada.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo actualizar la imagen principal: ${error.message}`, variant: "destructive" });
    },
  });
};