import React, { useState, useEffect } from 'react';
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
import { TreatmentImage, useTreatmentImages, useDeleteTreatmentImage, useSetPrimaryTreatmentImage, useUpdateTreatmentImagesOrder } from '@/hooks/useTreatments'; // Updated imports
import { GripVertical, Star, Trash2, ShieldCheck } from 'lucide-react';
import { useGoogleDriveImage } from '@/hooks/useGoogleDriveImage';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface SortableImageItemProps {
  image: TreatmentImage; // Updated interface
  onSetPrimary: () => void;
  onDelete: () => void;
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
          <img src={displayUrl || ''} alt="Treatment image" className="h-16 w-16 object-cover rounded-md" />
        )}
        <p className="text-sm font-medium truncate text-foreground" title={'Imagen'}>
          {'Imagen'}
        </p>
      </div>
      <div className="flex items-center flex-shrink-0">
        {image.is_primary ? (
          <ShieldCheck className="h-5 w-5 text-green-500 mr-4" />
        ) : (
          <Button variant="ghost" size="icon" onClick={onSetPrimary} title="Marcar como principal">
            <Star className="h-5 w-5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onDelete} title="Eliminar imagen">
          <Trash2 className="h-5 w-5 text-red-500" />
        </Button>
      </div>
    </li>
  );
}

interface ManageTreatmentImagesDialogProps { // Updated interface name
  treatmentId: string; // Updated prop name
  treatmentName: string; // Updated prop name
  trigger: React.ReactNode;
}

export const ManageTreatmentImagesDialog: React.FC<ManageTreatmentImagesDialogProps> = ({ treatmentId, treatmentName, trigger }) => { // Updated component name and props
  const [isOpen, setIsOpen] = useState(false);
  const [localImages, setLocalImages] = useState<TreatmentImage[]>([]); // Updated type
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  
  const { data: images, isLoading } = useTreatmentImages(treatmentId); // Updated hook
  const { mutate: setPrimaryImage } = useSetPrimaryTreatmentImage(); // Updated hook
  const { mutate: deleteImage } = useDeleteTreatmentImage(); // Updated hook
  const { mutate: updateOrder } = useUpdateTreatmentImagesOrder(); // Updated hook

  useEffect(() => {
    if (images) {
      setLocalImages(images);
    }
  }, [images]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localImages.findIndex((img) => img.id === active.id);
      const newIndex = localImages.findIndex((img) => img.id === over.id);
      const newSortedImages = arrayMove(localImages, oldIndex, newIndex);
      setLocalImages(newSortedImages);

      const imagesToUpdate = newSortedImages.map((image, index) => ({
        id: image.id,
        sort_order: index,
      }));
      
      updateOrder({ treatmentId, images_data: imagesToUpdate }); // Updated prop name
    }
  };

  const handleSetPrimary = (imageId: string) => {
    setPrimaryImage({ treatmentId, imageId }); // Updated prop name
  };

  const handleDelete = () => {
    if (!imageToDelete) return;
    deleteImage({ imageId: imageToDelete, treatmentId }); // Updated prop name
    setImageToDelete(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gestionar Imágenes de: {treatmentName}</DialogTitle> {/* Updated prop name */}
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : localImages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay imágenes para este tratamiento.</p> // Updated message
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={localImages} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2 max-h-[50vh] overflow-y-auto pr-4">
                  {localImages.map((image) => (
                    <SortableImageItem
                      key={image.id}
                      image={image}
                      onSetPrimary={() => handleSetPrimary(image.id)}
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
              Esta acción no se puede deshacer. Se eliminará permanentemente la imagen.
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