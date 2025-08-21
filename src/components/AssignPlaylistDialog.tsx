import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface MediaPlaylist {
  id: string;
  name: string;
}

interface AssignPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tvDisplayId: string;
  currentPlaylistId: string | null;
}

const AssignPlaylistDialog: React.FC<AssignPlaylistDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tvDisplayId,
  currentPlaylistId,
}) => {
  const [playlists, setPlaylists] = useState<MediaPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(currentPlaylistId);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlaylists = async () => {
      const { data, error } = await supabase
        .from('media_playlists')
        .select('id, name');
      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las playlists.",
          variant: "destructive",
        });
      } else {
        setPlaylists(data as MediaPlaylist[]);
      }
    };
    if (isOpen) {
      fetchPlaylists();
    }
  }, [isOpen, toast]);

  useEffect(() => {
    setSelectedPlaylistId(currentPlaylistId);
  }, [currentPlaylistId]);

  const handleAssign = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tv_displays')
        .update({ media_playlist_id: selectedPlaylistId })
        .eq('id', tvDisplayId);

      if (error) throw error;

      toast({
        title: "Playlist Asignada",
        description: "La playlist ha sido asignada a la TV exitosamente.",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: "Error al asignar playlist",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Playlist a TV</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="playlist">Seleccionar Playlist</Label>
            <Select
              value={selectedPlaylistId || ''}
              onValueChange={(value) => setSelectedPlaylistId(value === '' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una playlist" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ninguna</SelectItem>
                {playlists.map((playlist) => (
                  <SelectItem key={playlist.id} value={playlist.id}>
                    {playlist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cancelar</Button>
          <Button onClick={handleAssign} disabled={loading}>
            {loading ? 'Asignando...' : 'Asignar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignPlaylistDialog;
