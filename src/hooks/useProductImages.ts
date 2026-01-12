import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { useToast } from "@/hooks/use-toast";
import { useGoogleDriveStorage } from "./useGoogleDriveStorage";
import { useAuth } from "@/contexts/AuthContext";

export interface ProductImage {
  id: string;
  product_id: string;
  tenant_id: string;
  image_url: string | null;
  google_drive_file_id: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Hook to get images for a specific product
export const useProductImages = (productId: string) => {
  return useQuery<ProductImage[], Error>({
    queryKey: ["productImages", productId],
    queryFn: async () => {
      if (!productId) return [];
      return fetchTenantAction("get_product_images", { productId });
    },
    enabled: !!productId,
  });
};

// Hook to associate a file uploaded to GDrive with a product
export const useAssociateProductImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, { productId: string; google_drive_file_id: string }>({
    mutationFn: (variables) => fetchTenantAction("associate_product_image", variables),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["productImages", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['master_products'] });
    },
    onError: (error) => {
      toast({ title: "Error de Asociación", description: `La imagen se subió pero no se pudo asociar al producto: ${error.message}`, variant: "destructive" });
    },
  });
};

// Hook to delete an image from a product
export const useDeleteProductImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { deleteFile: deleteFromDrive } = useGoogleDriveStorage();

  const { mutate, isPending: isDeleting } = useMutation<void, Error, { imageId: string; productId: string; google_drive_file_id: string }>({
    mutationFn: async ({ imageId, productId, google_drive_file_id }) => {
      // 1. Delete from our database first
      await fetchTenantAction("delete_product_image", { imageId });

      // 2. Immediately invalidate queries to update the UI instantly
      queryClient.invalidateQueries({ queryKey: ["productImages", productId] });
      queryClient.invalidateQueries({ queryKey: ['master_products'] });
      
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
      queryClient.invalidateQueries({ queryKey: ["productImages"] });
      queryClient.invalidateQueries({ queryKey: ['master_products'] });
    },
  });

  return { mutate, isDeleting };
};

// Hook to set an image as the primary one for a product
export const useSetPrimaryProductImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, { productId: string; imageId: string }>({
    mutationFn: (variables) => fetchTenantAction("set_primary_product_image", variables),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["productImages", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['master_products'] });
      toast({ title: "Éxito", description: "Imagen principal actualizada.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo actualizar la imagen principal: ${error.message}`, variant: "destructive" });
    },
  });
};
