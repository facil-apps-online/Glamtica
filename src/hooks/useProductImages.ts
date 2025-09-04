import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTenantAction } from "@/lib/fetchTenantAction";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

export interface ProductImage {
  id: string;
  product_id: string;
  tenant_id: string;
  image_url: string;
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

// Hook to add an image to a product (desde URL, puede ser útil mantenerlo)
export const useAddProductImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ProductImage, Error, { productId: string; imageUrl: string }>({
    mutationFn: (variables) => fetchTenantAction("add_product_image", variables),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["productImages", data.product_id] });
      toast({ title: "Éxito", description: "Imagen añadida correctamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo añadir la imagen: ${error.message}`, variant: "destructive" });
    },
  });
};

// Hook to delete an image from a product
export const useDeleteProductImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, { imageId: string; productId: string }>({
    mutationFn: ({ imageId }) => fetchTenantAction("delete_product_image", { imageId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["productImages", variables.productId] });
      toast({ title: "Éxito", description: "Imagen eliminada correctamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo eliminar la imagen: ${error.message}`, variant: "destructive" });
    },
  });
};

// Hook to set an image as the primary one for a product
export const useSetPrimaryProductImage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, { productId: string; imageId: string }>({
    mutationFn: (variables) => fetchTenantAction("set_primary_product_image", variables),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["productImages", variables.productId] });
      toast({ title: "Éxito", description: "Imagen principal actualizada.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `No se pudo actualizar la imagen principal: ${error.message}`, variant: "destructive" });
    },
  });
};

// Hook to upload an image file to Google Drive and associate it with a product
export const useUploadProductImage = () => {
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

  return useMutation<any, Error, { productId: string; file: File }>({
    mutationFn: async ({ productId, file }) => {
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
          uploadContext: "Products",
          contextId: productId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["productImages", variables.productId] });
      toast({ title: "Éxito", description: "Imagen subida y asociada correctamente.", variant: "success" });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Error al subir la imagen: ${error.message}`, variant: "destructive" });
    },
  });
};