import { useProductImages, useAssociateProductImage, useDeleteProductImage, useSetPrimaryProductImage } from "@/hooks/useProductImages";
import { UploadResult } from "@/hooks/useUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash, Star, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileUploader } from "./FileUploader";
import { ImagePreviewDialog } from './ImagePreviewDialog';
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useUploader } from "@/hooks/useUploader";
import { ProductImage } from "./ProductImage";

interface ProductImageGalleryProps {
  productId: string;
}

export const ProductImageGallery = ({ productId }: ProductImageGalleryProps) => {
  const { data: images, isLoading, isError, refetch: refetchImages } = useProductImages(productId);
  const { mutate: deleteImage, isDeleting } = useDeleteProductImage();
  const { mutate: setPrimaryImage } = useSetPrimaryProductImage();
  const { mutate: associateImage, isPending: isAssociating } = useAssociateProductImage();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const { deleteFile } = useUploader();
  
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const handleOpenPreview = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setPreviewOpen(true);
  };

  const handleUploadComplete = (result: UploadResult) => {
    associateImage({
      productId,
      google_drive_file_id: result.fileId
    }, {
      onSuccess: () => {
        refetchImages();
      },
      onError: (error) => {
        console.error("Error al asociar la imagen en la base de datos, eliminando de Google Drive:", error);
        deleteFile(result.fileId);
      }
    });
  };

  const handleDeleteClick = (imageToDeleteId: string, productId: string, google_drive_file_id: string) => {
    setDeletingImageId(imageToDeleteId);
    deleteImage(
      { imageId: imageToDeleteId, productId, google_drive_file_id },
      {
        onSuccess: () => {
          setDeletingImageId(null);
          refetchImages();
        },
        onError: () => {
          setDeletingImageId(null);
        },
      }
    );
  };

  if (isLoading) return <div>Cargando imágenes...</div>;
  if (isError) return <div>Error al cargar las imágenes.</div>;

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-4 p-4 border rounded-lg">
          <FileUploader
            onUploadComplete={handleUploadComplete}
            path_components={['tenant', tenantId, 'Products', productId].filter(Boolean) as string[]}
            imageType="catalogo"
            label="Subir nueva imagen"
            disabled={isAssociating || !tenantId}
          />
        </div>
        {images && images.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h3 className="font-medium">Imágenes existentes:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((image) => (
                <Card key={image.id} className="relative group overflow-hidden">
                  <CardContent
                    className={`p-0 ${deletingImageId === image.id ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => {
                      if (deletingImageId !== image.id) {
                        handleOpenPreview(image.google_drive_file_id);
                      }
                    }}
                  >
                    <ProductImage imageUrl={image.google_drive_file_id} altText={`Imagen de producto ${image.id}`} className="object-cover w-full h-32" />
                    {image.is_primary && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-white p-1 rounded-full">
                        <Star className="w-4 h-4" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center gap-2">
                      {!image.is_primary && deletingImageId !== image.id && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); setPrimaryImage({ productId, imageId: image.id }); }}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <div onClick={(e) => e.stopPropagation()}>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100"
                              disabled={deletingImageId === image.id}
                            >
                              {deletingImageId === image.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. La imagen se eliminará permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={deletingImageId === image.id}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => {
                                  if (deletingImageId === image.id) return; 
                                  handleDeleteClick(image.id, productId, image.google_drive_file_id);
                                }}
                                disabled={deletingImageId === image.id}
                              >
                                {deletingImageId === image.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Eliminando...
                                  </>
                                ) : (
                                  "Eliminar"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      <ImagePreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setPreviewOpen(false)}
        imageUrls={selectedImageUrl ? [selectedImageUrl] : []}
      />
    </>
  );
};
