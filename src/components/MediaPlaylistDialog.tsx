import React, { useState, useEffect } from 'react';

const formatDuration = (seconds: number | null | undefined) => {
  if (seconds === null || seconds === undefined) {
    return '--:--';
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

interface PlaylistItem {
  id: string;
  playlist_id: string;
  media_url: string;
  media_type: 'youtube';
  item_order: number;
  video_title?: string;
  duration_seconds?: number;
}

interface MediaPlaylist {
  id?: string;
  name: string;
  description: string;
  items?: PlaylistItem[];
}

interface MediaPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  playlist?: MediaPlaylist | null;
}

// --- Sortable Item Component ---
function SortableItem({ item, onEdit, onDelete }: { item: PlaylistItem, onEdit: (item: PlaylistItem) => void, onDelete: (item: PlaylistItem) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className="flex items-center justify-between p-2 border rounded-md gap-2 bg-white shadow-sm">
      <div className="flex items-center gap-2 flex-grow overflow-hidden">
        <span {...attributes} {...listeners} className="cursor-grab touch-none p-1">
          <GripVertical className="h-5 w-5 text-gray-400" />
        </span>
        <div className="flex-grow overflow-hidden">
          <p className="text-sm font-medium truncate" title={item.video_title || item.media_url}>{item.video_title || item.media_url}</p>
          <p className="text-xs text-gray-500">
            Duración: {formatDuration(item.duration_seconds)} | Orden: {item.item_order}
          </p>
        </div>
      </div>
      <div className="flex items-center flex-shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="mr-2" onClick={() => onEdit(item)}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar Ítem</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Editar Ítem</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="destructive" size="icon" onClick={() => onDelete(item)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Eliminar Ítem</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Eliminar Ítem</p></TooltipContent>
        </Tooltip>
      </div>
    </li>
  );
}

const MediaPlaylistDialog: React.FC<MediaPlaylistDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  playlist,
}) => {
  const [name, setName] = useState(playlist?.name || '');
  const [description, setDescription] = useState(playlist?.description || '');
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<PlaylistItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [isItemDeleteDialogOpen, setIsItemDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PlaylistItem | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [videosToImport, setVideosToImport] = useState<any[]>([]);
  const { toast } = useToast();
  const { tenantId } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setDescription(playlist.description);
      fetchPlaylistItems();
    } else {
      setName('');
      setDescription('');
      setItems([]);
    }
  }, [playlist, isOpen]);

  const fetchPlaylistItems = async () => {
    if (!playlist?.id) return;
    const { data, error } = await supabase.rpc('get_playlist_items', { p_playlist_id: playlist.id });
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los ítems de la playlist.", variant: "destructive" });
    } else {
      setItems(data || []);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!tenantId) throw new Error("No se pudo determinar el Tenant ID.");
      if (playlist?.id) {
        const { error } = await supabase.from('media_playlists').update({ name, description }).eq('id', playlist.id);
        if (error) throw error;
        toast({ title: "Playlist Actualizada", variant: "success" });
      } else {
        const { error } = await supabase.from('media_playlists').insert({ name, description, tenant_id: tenantId });
        if (error) throw error;
        toast({ title: "Playlist Creada", variant: "success" });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = async () => {
    if (!videosToImport || videosToImport.length === 0 || !playlist?.id) return;
    setLoading(true);
    try {
      const { data: maxOrderData, error: maxOrderError } = await supabase.from('playlist_items').select('item_order').eq('playlist_id', playlist.id).order('item_order', { ascending: false }).limit(1).single();
      if (maxOrderError && maxOrderError.code !== 'PGRST116') throw maxOrderError;
      const startingOrder = maxOrderData ? maxOrderData.item_order + 1 : 1;
      const newItems = videosToImport.map((video: any, index: number) => ({ playlist_id: playlist.id, media_url: video.videoUrl, media_type: 'youtube', item_order: startingOrder + index, video_title: video.title, duration_seconds: video.durationSeconds }));
      const { error: insertError } = await supabase.from('playlist_items').insert(newItems);
      if (insertError) throw insertError;
      await fetchPlaylistItems();
      toast({ title: "Playlist Importada", description: `${videosToImport.length} videos añadidos.`, variant: "success" });
    } catch (err: any) {
      toast({ title: "Error al importar playlist", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setIsImportDialogOpen(false);
      setVideosToImport([]);
      setIsItemFormOpen(false);
      setCurrentItem(null);
    }
  };

  const handleSaveItem = async () => {
    if (!playlist?.id || !currentItem?.media_url) {
      toast({ title: "Error", description: "Faltan datos para guardar.", variant: "destructive" });
      return;
    }
    if (currentItem.id) {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('playlist_items').update({ media_url: currentItem.media_url }).eq('id', currentItem.id).select();
        if (error) throw error;
        setItems(prevItems => prevItems.map(item => item.id === currentItem.id ? data[0] : item));
        toast({ title: "Ítem Actualizado", variant: "success" });
        setIsItemFormOpen(false);
        setCurrentItem(null);
      } catch (err: any) {
        toast({ title: "Error al actualizar", description: err.message, variant: "destructive" });
      } finally { setLoading(false); }
      return;
    }
    setLoading(true);
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('resolve-youtube-playlist', { body: { videoUrl: currentItem.media_url } });
      if (functionError) throw functionError;
      const { videos } = functionData;
      if (!videos || videos.length === 0) {
        toast({ title: "Video no encontrado", description: "No se pudieron obtener detalles.", variant: "warning" });
        setLoading(false);
        return;
      }
      if (videos.length > 1) {
        setVideosToImport(videos);
        setIsImportDialogOpen(true);
        return;
      }
      const video = videos[0];
      const { data: maxOrderData, error: maxOrderError } = await supabase.from('playlist_items').select('item_order').eq('playlist_id', playlist.id).order('item_order', { ascending: false }).limit(1).single();
      if (maxOrderError && maxOrderError.code !== 'PGRST116') throw maxOrderError;
      const newItemOrder = maxOrderData ? maxOrderData.item_order + 1 : 1;
      const { error: insertError } = await supabase.from('playlist_items').insert({ playlist_id: playlist.id, media_url: video.videoUrl, media_type: 'youtube', item_order: newItemOrder, video_title: video.title, duration_seconds: video.durationSeconds });
      if (insertError) throw insertError;
      await fetchPlaylistItems();
      toast({ title: "Video Añadido", variant: "success" });
      setIsItemFormOpen(false);
      setCurrentItem(null);
    } catch (err: any) {
      toast({ title: "Error al procesar URL", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const handleEditItem = (item: PlaylistItem) => {
    setCurrentItem(item);
    setIsItemFormOpen(true);
  };

  const openDeleteItemDialog = (item: PlaylistItem) => {
    setItemToDelete(item);
    setIsItemDeleteDialogOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('playlist_items').delete().eq('id', itemToDelete.id);
      if (error) throw error;
      setItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id));
      toast({ title: "Ítem Eliminado", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error al eliminar ítem", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setIsItemDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newSortedItems = arrayMove(items, oldIndex, newIndex);
      setItems(newSortedItems);

      const itemsToUpdate = newSortedItems.map((item, index) => ({ id: item.id, item_order: index + 1 }));
      const { error } = await supabase.rpc('update_playlist_items_order', { items_to_update: itemsToUpdate });

      if (error) {
        toast({ title: "Error al reordenar", description: "No se pudo guardar el nuevo orden.", variant: "destructive" });
        setItems(items); // Revert to original order on error
      } else {
        toast({ title: "Orden actualizado", variant: "success" });
        await fetchPlaylistItems(); // Refetch to get the definitive state from DB
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <TooltipProvider>
          <DialogHeader>
            <DialogTitle>{playlist ? 'Editar Playlist' : 'Crear Nueva Playlist'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la playlist" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción (opcional)" />
            </div>
          </div>

          <div className="grid gap-4 py-4">
            <h3 className="text-lg font-medium">Elementos de la Playlist</h3>
            {items.length === 0 ? (
              <p className="text-sm text-gray-500">No hay elementos en esta playlist.</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-4">
                    {items.map((item) => (
                      <SortableItem key={item.id} item={item} onEdit={handleEditItem} onDelete={openDeleteItemDialog} />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
            <Button onClick={() => { setCurrentItem({ media_url: '', media_type: 'youtube' }); setIsItemFormOpen(true); }} className="mt-4">Añadir Nuevo Ítem</Button>
          </div>

          <DialogFooter>
            <Button onClick={onClose} variant="outline">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={loading || !name}>{loading ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </TooltipProvider>
      </DialogContent>

      <Dialog open={isItemFormOpen} onOpenChange={setIsItemFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentItem?.id ? 'Editar Ítem' : 'Añadir Ítem'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="media_url">URL del Medio</Label>
              <Input id="media_url" value={currentItem?.media_url || ''} onChange={(e) => setCurrentItem(prev => ({ ...prev!, media_url: e.target.value }))} placeholder="URL de video o playlist de YouTube" disabled={!!currentItem?.id} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="media_type">Tipo de Medio</Label>
              <Select value={currentItem?.media_type || 'youtube'} onValueChange={(value) => setCurrentItem(prev => ({ ...prev!, media_type: value as 'youtube' }))} disabled={!!currentItem?.id}>
                <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                <SelectContent><SelectItem value="youtube">YouTube</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsItemFormOpen(false)} variant="outline">Cancelar</Button>
            <Button onClick={handleSaveItem} disabled={loading || !currentItem?.media_url}>{loading ? 'Procesando...' : 'Guardar Ítem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Importación</AlertDialogTitle>
            <AlertDialogDescription>Hemos detectado una playlist con {videosToImport.length} videos. ¿Quieres importarlos todos (hasta 50)?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLoading(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isItemDeleteDialogOpen} onOpenChange={setIsItemDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el ítem: <span className="font-bold">{itemToDelete?.video_title || itemToDelete?.media_url}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Dialog>
  );
};

export default MediaPlaylistDialog;
