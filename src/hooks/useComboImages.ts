import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { ComboImage } from "@/types/combos"; // Import ComboImage

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

// Hook to delete an image from a combo
export const useDeleteComboImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, { imageId: string; comboId: string }>({
    mutationFn: ({ imageId }) => fetchTenantAction("delete_combo_image", { imageId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comboImages", variables.comboId] });
      queryClient.invalidateQueries({ queryKey: ['master_combos'] }); // Invalidate master_combos list
      toast({ title: "Éxito", description: "Imagen eliminada correctamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo eliminar la imagen: ${error.message}`, variant: "destructive" });
    },
  });
};

// Hook to set an image as the primary one for a combo
export const useSetPrimaryComboImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, { comboId: string; imageId: string }>({
    mutationFn: (variables) => fetchTenantAction("set_primary_combo_image", variables),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comboImages", variables.comboId] });
      queryClient.invalidateQueries({ queryKey: ['master_combos'] }); // Invalidate master_combos list
      toast({ title: "Éxito", description: "Imagen principal actualizada.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo actualizar la imagen principal: ${error.message}`, variant: "destructive" });
    },
  });
};

// Hook to upload an image file to Google Drive and associate it with a combo
export const useUploadComboImage = () => {
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

  return useMutation<any, Error, { comboId: string; file: File }>({
    mutationFn: async ({ comboId, file }) => {
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
          uploadContext: "Combos", // <--- Important: Upload context for Combos
          contextId: comboId, // contextId is the comboId
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comboImages", variables.comboId] });
      queryClient.invalidateQueries({ queryKey: ['master_combos'] }); // Invalidate master_combos list
      toast({ title: "Éxito", description: "Imagen subida y asociada correctamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Error al subir la imagen: ${error.message}`, variant: "destructive" });
    },
  });
};
