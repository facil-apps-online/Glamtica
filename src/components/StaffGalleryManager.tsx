import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Loader2, GripVertical, PlusCircle, XCircle, Expand } from "lucide-react";
import { useStaffGallery, StaffGalleryItem } from '@/hooks/useStaffGallery';
import { useUpdateStaffGallery } from '@/hooks/useUpdateStaffGallery';
import { useGoogleDriveImage } from '@/hooks/useGoogleDriveImage';
import { Card, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useScreenSize } from '@/hooks/useScreenSize';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface StaffGalleryManagerProps {
  staffId: string;
  staffName: string;
  trigger: React.ReactNode;
}

// --- Reusable Image Preview Dialog ---
const ImagePreview = ({ imageUrl, imageName }: { imageUrl: string, imageName: string }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 bg-black/50 text-white hover:bg-black/75">
          <Expand className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <img src={imageUrl} alt={imageName} className="max-w-full max-h-[80vh] object-contain mx-auto" />
      </DialogContent>
    </Dialog>
  );
};


// --- Sortable Item for the selected images list ---
function SortableImageItem({ item, onDeselect }: { item: StaffGalleryItem, onDeselect: (item: StaffGalleryItem) => void }) {
  const { displayUrl, isLoading: isImageLoading } = useGoogleDriveImage(item.google_drive_file_id);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="flex items-center p-2 border rounded-md gap-2 bg-muted shadow-sm">
        <span {...attributes} {...listeners} className="cursor-grab touch-none p-1">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </span>
        <div className="w-24 h-24 bg-muted-foreground/20 rounded-md flex items-center justify-center">
            {isImageLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : displayUrl ? (
                <img src={displayUrl} alt={item.file_name} className="w-full h-full object-cover rounded-md"/>
            ) : <ImageIcon className="h-8 w-8 text-muted-foreground"/> }
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onDeselect(item)} className="absolute top-0 right-0 h-6 w-6 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <XCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}

export const StaffGalleryManager: React.FC<StaffGalleryManagerProps> = ({ staffId, staffName, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: allImages, isLoading } = useStaffGallery(staffId);
  const updateGalleryMutation = useUpdateStaffGallery();
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';

  const [selectedItems, setSelectedItems] = useState<StaffGalleryItem[]>([]);
  const [availableItems, setAvailableItems] = useState<StaffGalleryItem[]>([]);

  useEffect(() => {
    if (allImages) {
      const selected = allImages.filter(item => item.is_favorite).sort((a, b) => a.display_order - b.display_order);
      const available = allImages.filter(item => !allImages.find(sel => sel.id === item.id && sel.is_favorite));
      setSelectedItems(selected);
      setAvailableItems(available);
    }
  }, [allImages, isOpen]);

  const handleSelectItem = (item: StaffGalleryItem) => {
    if (selectedItems.length >= 10) {
      toast({
        title: "Límite Alcanzado",
        description: "Solo puedes seleccionar un máximo de 10 imágenes para la galería.",
        variant: "destructive",
      });
      return;
    }
    setAvailableItems(prev => prev.filter(i => i.id !== item.id));
    setSelectedItems(prev => [...prev, item]);
  };

  const handleDeselectItem = (item: StaffGalleryItem) => {
    setSelectedItems(prev => prev.filter(i => i.id !== item.id));
    if (!availableItems.some(avail => avail.id === item.id)) {
        setAvailableItems(prev => [item, ...prev]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = selectedItems.findIndex((item) => item.id === active.id);
      const newIndex = selectedItems.findIndex((item) => item.id === over.id);
      setSelectedItems(arrayMove(selectedItems, oldIndex, newIndex));
    }
  };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleSave = () => {
    const itemsToSave = selectedItems.map((item, index) => ({
      ...item,
      display_order: index,
      is_favorite: true,
    }));

    updateGalleryMutation.mutate(
      { staffId, items: itemsToSave },
      {
        onSuccess: () => {
          toast({ title: "Galería Actualizada", description: "La galería del profesional se ha guardado correctamente.", variant: "success" });
          setIsOpen(false);
        },
        onError: (error) => {
          toast({ title: "Error al Guardar Galería", description: error.message || "Ocurrió un error al intentar guardar la galería.", variant: "destructive" });
        },
      }
    );
  };
  
  const AvailableImageCard = ({ item }: { item: StaffGalleryItem }) => {
    const { displayUrl, isLoading: isImageLoading } = useGoogleDriveImage(item.google_drive_file_id);
    return (
        <Card className="relative group overflow-hidden">
            <div className="w-full h-32 bg-muted flex items-center justify-center">
            {isImageLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : displayUrl ? (
                <img src={displayUrl} alt={item.file_name} className="w-full h-full object-cover"/>
            ) : <ImageIcon className="h-8 w-8 text-muted-foreground"/> }
            </div>
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity p-2">
                <p className="text-xs text-center mb-2 truncate w-full" title={item.file_name}>{item.file_name}</p>
                <Button size="sm" onClick={() => handleSelectItem(item)}>
                    <PlusCircle className="h-4 w-4 mr-1"/> Añadir
                </Button>
            </div>
            {displayUrl && <ImagePreview imageUrl={displayUrl} imageName={item.file_name} />}
        </Card>
    )
  }

  const availableImagesContent = (
    <div className="flex-grow overflow-y-auto border rounded-md p-2">
      {availableItems.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay más imágenes disponibles.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-full">
          {availableItems.map(item => <AvailableImageCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );

  const selectedImagesContent = (
    <div className="flex-grow overflow-y-auto border rounded-md p-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={selectedItems} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-2 gap-2">
              {selectedItems.length > 0 ? (
                selectedItems.map((item) => (
                  <SortableImageItem key={item.id} item={item} onDeselect={handleDeselectItem} />
                ))
              ) : (
                  <div className="col-span-2 flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                      <ImageIcon className="h-12 w-12 mb-4"/>
                      <p>Añade hasta 10 imágenes desde la columna de la izquierda.</p>
                  </div>
              )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
  
  const renderContent = () => {
    if (isMobile) {
      return (
        <Tabs defaultValue="available" className="w-full h-full flex flex-col flex-grow overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">Disponibles</TabsTrigger>
            <TabsTrigger value="selected">Galería ({selectedItems.length}/10)</TabsTrigger>
          </TabsList>
          <TabsContent value="available" className="flex-grow overflow-y-auto mt-2">
            {availableImagesContent}
          </TabsContent>
          <TabsContent value="selected" className="flex-grow overflow-y-auto mt-2">
            {selectedImagesContent}
          </TabsContent>
        </Tabs>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-6 flex-grow overflow-hidden">
        <div className="flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-4 text-center">Imágenes Disponibles</h3>
          {availableImagesContent}
        </div>
        <div className="flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-4 text-center">Galería Seleccionada (Máx. 10)</h3>
          {selectedImagesContent}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gestionar Galería de {staffName}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          renderContent()
        )}
        <DialogFooter className="pt-4">
          <Button onClick={() => setIsOpen(false)} variant="outline">Cancelar</Button>
          <Button onClick={handleSave} disabled={updateGalleryMutation.isPending || isLoading}>
            {updateGalleryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Galería
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
