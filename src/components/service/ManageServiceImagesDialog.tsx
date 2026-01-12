import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MasterServiceImage } from '@/hooks/useServices'; // Assuming this will be created
import { fetchTenantAction } from '@/lib/fetchTenantAction'; // Generic fetch action
import { GripVertical, Star, Trash2, ShieldCheck } from 'lucide-react';
import { useGoogleDriveImage } from '@/hooks/useGoogleDriveImage';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface SortableImageItemProps {
  image: MasterServiceImage;
  onSetPrimary: (imageId: string) => void;
  onDelete: (imageId: string) => void;
}

function SortableImageItem({ image, onSetPrimary, onDelete }: SortableImageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.id });
  const { displayUrl, isLoading } = useGoogleDriveImage(image.image_url);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className="flex items-center justify-between p-2 border rounded-md gap-2 bg-background shadow-sm">
      <div className="flex items-center gap-3 flex-grow overflow-hidden">
        <span {...attributes} {...listeners} className="cursor-grab touch-none p-1">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </span>
        {isLoading ? (
          <Skeleton className="h-16 w-16 rounded-md" />
        ) : (
          <img src={displayUrl} alt="Service image" className="h-16 w-16 object-cover rounded-md" />
        )}
        <p className="text-sm font-medium truncate text-foreground" title={image.file_name || 'Imagen'}>
          {image.file_name || 'Imagen'}
        </p>
      </div>
      <div className="flex items-center flex-shrink-0">
        {image.is_primary ? (
          <ShieldCheck className="h-5 w-5 text-green-500 mr-4" />
        ) : (
          <Button variant="ghost" size="icon" onClick={() => onSetPrimary(image.id)} title="Marcar como principal">
            <Star className="h-5 w-5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => onDelete(image.id)} title="Eliminar imagen">
          <Trash2 className="h-5 w-5 text-red-500" />
        </Button>
      </div>
    </li>
  );
}

interface ManageServiceImagesDialogProps {
  serviceId: string;
  serviceName: string;
  trigger: React.ReactNode;
}

export const ManageServiceImagesDialog: React.FC<ManageServiceImagesDialogProps> = ({ serviceId, serviceName, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<MasterServiceImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchImages = useCallback(async () => {
    if (!serviceId) return;
    setIsLoading(true);
    try {
      const fetchedImages = await fetchTenantAction('get_service_images', { serviceId });
      setImages(fetchedImages || []);
    } catch (error: any) {
      toast({ title: "Error", description: "No se pudieron cargar las imágenes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [serviceId, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen, fetchImages]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      const newSortedImages = arrayMove(images, oldIndex, newIndex);
      setImages(newSortedImages);

      const imagesToUpdate = newSortedImages.map((image, index) => ({
        id: image.id,
        sort_order: index,
      }));

      try {
        await fetchTenantAction('update_service_images_order', { images_data: imagesToUpdate });
        toast({ title: "Orden actualizado", description: "El nuevo orden de las imágenes ha sido guardado.", variant: "success" });
        fetchImages(); // Refetch to confirm order from DB
      } catch (error: any) {
        toast({ title: "Error al reordenar", description: error.message, variant: "destructive" });
        setImages(images); // Revert on error
      }
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await fetchTenantAction('set_primary_service_image', { serviceId, imageId });
      toast({ title: "Imagen Principal Actualizada", variant: "success" });
      fetchImages();
    } catch (error: any) {
      toast({ title: "Error", description: "No se pudo establecer la imagen como principal.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!imageToDelete) return;
    try {
      await fetchTenantAction('delete_service_image', { imageId: imageToDelete });
      toast({ title: "Imagen Eliminada", variant: "success" });
      fetchImages();
    } catch (error: any) {
      toast({ title: "Error", description: "No se pudo eliminar la imagen.", variant: "destructive" });
    } finally {
      setImageToDelete(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gestionar Imágenes de: {serviceName}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : images.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay imágenes para este servicio.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={images} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2 max-h-[50vh] overflow-y-auto pr-4">
                  {images.map((image) => (
                    <SortableImageItem
                      key={image.id}
                      image={image}
                      onSetPrimary={handleSetPrimary}
                      onDelete={() => setImageToDelete(image.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)} variant="outline">Cerrar</Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={!!imageToDelete} onOpenChange={(open) => !open && setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la imagen del servicio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
