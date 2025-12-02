import { useRef, useState } from "react";
import imageCompression from 'browser-image-compression';
import { ServiceImage } from './ServiceImage';
import { useServiceImages, useDeleteServiceImage, useSetPrimaryServiceImage, useUploadServiceImage } from "@/hooks/useServiceImages";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash, Star, Upload, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ImagePreviewDialog } from './ImagePreviewDialog';

interface ServiceImageGalleryProps {
  serviceId: string;
}

export const ServiceImageGallery = ({ serviceId }: ServiceImageGalleryProps) => {
  const { data: images, isLoading, isError, refetch: refetchImages } = useServiceImages(serviceId);
  const { mutate: deleteImage } = useDeleteServiceImage();
  const { mutate: setPrimaryImage } = useSetPrimaryServiceImage();
  const { mutate: uploadImage, isPending: isUploading } = useUploadServiceImage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const handleOpenPreview = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setPreviewOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setSelectedFiles(prev => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const compressedFile = await imageCompression(file, options);
        return new Promise<void>((resolve, reject) => {
          uploadImage({ serviceId, file: compressedFile }, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        });
      });

      await Promise.all(uploadPromises);
      
      toast({ title: "Éxito", description: "Todas las imágenes han sido subidas.", variant: "success" });
      setSelectedFiles([]); // Limpiar aquí, después del éxito
      refetchImages(); // Refrescar la lista de imágenes existentes

    } catch (error) {
      console.error('Error uploading files:', error);
      toast({ title: "Error", description: "Ocurrió un error al subir una o más imágenes.", variant: "destructive" });
    }
  };

  if (isLoading) return <div>Cargando imágenes...</div>;
  if (isError) return <div>Error al cargar las imágenes.</div>;

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-4 p-4 border rounded-lg">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full gap-2"
          >
            <Upload className="w-4 h-4" />
            Seleccionar Fotos
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
          />

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Nuevas para subir:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {selectedFiles.map((file, index) => (
                  <Card key={index} className="relative group overflow-hidden">
                    <CardContent className="p-1">
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-24 object-cover rounded"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => removeFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {selectedFiles.length > 0 && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => setSelectedFiles([])}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? "Subiendo..." : `Confirmar y Subir ${selectedFiles.length} archivo(s)`}
              </Button>
            </div>
          )}
        </div>

        {images && images.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h3 className="font-medium">Imágenes existentes:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((image) => (
                <Card key={image.id} className="relative group overflow-hidden">
                  <CardContent className="p-0 cursor-pointer" onClick={() => handleOpenPreview(image.google_drive_file_id)}>
                    <ServiceImage imageUrl={image.google_drive_file_id} altText={`Imagen de servicio ${image.id}`} className="object-cover w-full h-32" />
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
                          onClick={(e) => { e.stopPropagation(); setPrimaryImage({ serviceId, imageId: image.id }); }}
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
                              <AlertDialogAction onClick={() => deleteImage({ imageId: image.id, serviceId })}>
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
          </div>
        )}
      </div>
      <ImagePreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setPreviewOpen(false)}
        imageUrl={selectedImageUrl}
      />
    </>
  );
};