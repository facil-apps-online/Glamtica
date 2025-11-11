import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
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
  console.log("AssignPlaylistDialog - currentPlaylistId received:", currentPlaylistId);
  const [playlists, setPlaylists] = useState<MediaPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(currentPlaylistId);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!session) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'get_media_playlists',
          }),
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error || 'Failed to fetch media playlists');
        }
        setPlaylists(json as MediaPlaylist[]);
      } catch (err: any) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las playlists.",
          variant: "destructive",
        });
      }
    };

    if (isOpen) {
      fetchPlaylists();
    }
  }, [isOpen, session, toast]);

  useEffect(() => {
    setSelectedPlaylistId(currentPlaylistId);
  }, [currentPlaylistId]);

  const handleAssign = async () => {
    if (!session) {
      toast({
        title: "Error de autenticación",
        description: "No se pudo verificar la sesión. Por favor, inicie sesión de nuevo.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/tenant-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'assign_playlist_to_tv',
          payload: {
            tv_display_id: tvDisplayId,
            playlist_id: selectedPlaylistId,
          },
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to assign playlist');
      }

      toast({
        title: "Playlist Asignada",
        description: "La playlist ha sido asignada a la TV exitosamente.",
        variant: "success",
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
      <DialogContent aria-describedby="assign-playlist-description">
        <DialogHeader>
          <DialogTitle>Asignar Playlist a TV</DialogTitle>
        </DialogHeader>
        <p id="assign-playlist-description" className="sr-only">Selecciona una playlist de la lista para asignarla al televisor.</p>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="playlist">Seleccionar Playlist</Label>
            <Select
              value={selectedPlaylistId || ''}
              onValueChange={(value) => setSelectedPlaylistId(value === 'none' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una playlist" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {playlists.map((playlist) => {
                    console.log("AssignPlaylistDialog - Renderizando SelectItem para:", playlist.id, playlist.name);
                    return (
                      <SelectItem key={playlist.id} value={playlist.id}>
                        {playlist.name}
                      </SelectItem>
                    );
                  })}
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
