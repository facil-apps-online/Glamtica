import { useRef, useState } from "react";
import { useProductImages, useDeleteProductImage, useSetPrimaryProductImage, useUploadProductImage } from "@/hooks/useProductImages";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash, Star, Upload } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ProductImage } from './ProductImage';
import { useToast } from "@/hooks/use-toast";
import { ImagePreviewDialog } from './ImagePreviewDialog';
import { ProductImageEditorDialog } from './ProductImageEditorDialog';

interface ProductImageGalleryProps {
  productId: string;
}

export const ProductImageGallery = ({ productId }: ProductImageGalleryProps) => {
  const { data: images, isLoading, isError } = useProductImages(productId);
  const { mutate: deleteImage } = useDeleteProductImage();
  const { mutate: setPrimaryImage } = useSetPrimaryProductImage();
  const { mutate: uploadImage, isPending: isUploading } = useUploadProductImage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  
  const [sourceImageForEdit, setSourceImageForEdit] = useState<string | null>(null);
  const [isEditorOpen, setEditorOpen] = useState(false);

  const handleOpenPreview = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setPreviewOpen(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Archivo no válido",
          description: "Por favor, selecciona un archivo de imagen.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImageForEdit(reader.result as string);
        setEditorOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditComplete = (processedBlob: Blob) => {
    const processedFile = new File([processedBlob], "edited_product_image.png", { type: "image/png" });
    uploadImage({ productId, file: processedFile });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) return <div>Cargando imágenes...</div>;
  if (isError) return <div>Error al cargar las imágenes.</div>;

  return (
    <>
      <div className="relative min-h-[200px] space-y-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
        />

        {images && images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-16">
            {images.map((image) => (
              <Card key={image.id} className="relative group overflow-hidden">
                <CardContent className="p-0 cursor-pointer" onClick={() => handleOpenPreview(image.image_url)}>
                  <ProductImage imageUrl={image.image_url} altText={`Imagen de producto ${image.id}`} className="object-cover w-full h-32" />
                  {image.is_primary && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-white p-1 rounded-full">
                      <Star className="w-4 h-4" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center gap-2">
                    {!image.is_primary && (
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
                          >
                            <Trash className="w-4 h-4" />
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
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteImage({ imageId: image.id, productId })}>
                              Eliminar
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
        ) : (
          <div className="flex items-center justify-center min-h-[150px]">
            <p className="text-center text-gray-500">No hay imágenes para este producto.</p>
          </div>
        )}

        <Button 
          onClick={handleUploadClick} 
          disabled={isUploading}
          className="absolute bottom-4 right-4 rounded-full h-12 w-12 z-10"
          size="icon"
        >
          <Upload className="w-6 h-6" />
        </Button>
      </div>
      <ImagePreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setPreviewOpen(false)}
        imageUrl={selectedImageUrl}
      />
      <ProductImageEditorDialog
        isOpen={isEditorOpen}
        onClose={() => setEditorOpen(false)}
        imageSrc={sourceImageForEdit}
        onEditComplete={handleEditComplete}
      />
    </>
  );
};
