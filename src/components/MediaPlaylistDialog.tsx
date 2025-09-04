import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface MediaPlaylist {
  id?: string;
  name: string;
  description: string;
}

interface MediaPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  playlist?: MediaPlaylist | null;
}

const MediaPlaylistDialog: React.FC<MediaPlaylistDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  playlist,
}) => {
  const [name, setName] = useState(playlist?.name || '');
  const [description, setDescription] = useState(playlist?.description || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setDescription(playlist.description);
    } else {
      setName('');
      setDescription('');
    }
  }, [playlist]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: userSession } = await supabase.auth.getSession();
      const tenantId = userSession?.session?.user?.app_metadata?.tenant_id || 'YOUR_DEFAULT_TENANT_ID'; // Replace with actual logic

      if (playlist?.id) {
        // Update existing playlist
        const { error } = await supabase
          .from('media_playlists')
          .update({ name, description })
          .eq('id', playlist.id);

        if (error) throw error;
        toast({
          title: "Playlist Actualizada",
          description: "La playlist ha sido actualizada exitosamente.",
          variant: "success",
        });
      } else {
        // Create new playlist
        const { error } = await supabase
          .from('media_playlists')
          .insert({ name, description, tenant_id: tenantId });

        if (error) throw error;
        toast({
          title: "Playlist Creada",
          description: "La playlist ha sido creada exitosamente.",
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: "Error",
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
          <DialogTitle>{playlist ? 'Editar Playlist' : 'Crear Nueva Playlist'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la playlist"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción de la playlist (opcional)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !name}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPlaylistDialog;
