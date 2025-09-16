import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import RegisterTvDialog from '@/components/RegisterTvDialog';
import MediaPlaylistDialog from '@/components/MediaPlaylistDialog';
import AssignPlaylistDialog from '@/components/AssignPlaylistDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Pencil, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
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

interface TvDisplay {
  id: string;
  branch_id: string | null;
  registration_code: string;
  is_registered: boolean;
  registered_at: string | null;
  last_heartbeat: string | null;
  media_playlist_id: string | null;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
  branch_name?: string | null; // Añadido para el nombre de la sucursal
}

interface MediaPlaylist {
  id: string;
  name: string;
  description: string;
}

const TvManagementPage: React.FC = () => {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const [tvDisplays, setTvDisplays] = useState<TvDisplay[]>([]);
  const [mediaPlaylists, setMediaPlaylists] = useState<MediaPlaylist[]>([]);
  const [loadingTv, setLoadingTv] = useState<boolean>(true);
  const [loadingPlaylists, setLoadingPlaylists] = useState<boolean>(true);
  const [errorTv, setErrorTv] = useState<string | null>(null);
  const [errorPlaylists, setErrorPlaylists] = useState<string | null>(null);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState<boolean>(false);
  const [isMediaPlaylistDialogOpen, setIsMediaPlaylistDialogOpen] = useState<boolean>(false);
  const [isAssignPlaylistDialogOpen, setIsAssignPlaylistDialogOpen] = useState<boolean>(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<MediaPlaylist | null>(null);
  const [selectedTvDisplay, setSelectedTvDisplay] = useState<TvDisplay | null>(null);
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<MediaPlaylist | null>(null);

  const fetchTvDisplays = useCallback(async () => {
    if (!tenantId) return; // Asegurarse de que tenemos un tenantId

    setLoadingTv(true);
    setErrorTv(null);
    try {
      const { data, error } = await supabase.rpc('get_managed_tvs', { p_tenant_id: tenantId });

      if (error) {
        throw error;
      }
      setTvDisplays(data as TvDisplay[]);
    } catch (err: any) {
      setErrorTv(err.message);
    } finally {
      setLoadingTv(false);
    }
  }, [tenantId]);

  const fetchMediaPlaylists = useCallback(async () => {
    setLoadingPlaylists(true);
    setErrorPlaylists(null);
    try {
      const { data, error } = await supabase
        .from('media_playlists')
        .select('*');

      if (error) {
        throw error;
      }
      setMediaPlaylists(data as MediaPlaylist[]);
    } catch (err: any) {
      setErrorPlaylists(err.message);
    } finally {
      setLoadingPlaylists(false);
    }
  }, []);

  useEffect(() => {
    fetchTvDisplays();
    fetchMediaPlaylists();
  }, [fetchTvDisplays, fetchMediaPlaylists, tenantId]);

  const handleEditPlaylist = (playlist: MediaPlaylist) => {
    setSelectedPlaylist(playlist);
    setIsMediaPlaylistDialogOpen(true);
  };

  const openDeleteDialog = (playlist: MediaPlaylist) => {
    setPlaylistToDelete(playlist);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePlaylist = async () => {
    if (!playlistToDelete) return;
    try {
      const { error } = await supabase
        .from('media_playlists')
        .delete()
        .eq('id', playlistToDelete.id);

      if (error) {
        throw error;
      }
      
      toast({
        title: 'Playlist Eliminada',
        description: `La playlist "${playlistToDelete.name}" ha sido eliminada.`,
        variant: 'success',
      });
      fetchMediaPlaylists();
    } catch (err: any) {
      toast({
        title: 'Error al eliminar',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setPlaylistToDelete(null);
    }
  };

  const handleAssignPlaylist = (tvDisplay: TvDisplay) => {
    setSelectedTvDisplay(tvDisplay);
    setIsAssignPlaylistDialogOpen(true);
  };

  if (loadingTv || loadingPlaylists) {
    return <div>Cargando...</div>;
  }

  if (errorTv) {
    return <div>Error al cargar TVs: {errorTv}</div>;
  }

  if (errorPlaylists) {
    return <div>Error al cargar Playlists: {errorPlaylists}</div>;
  }

  return (
    <TooltipProvider>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1>Administración de TVs</h1>
          <Button onClick={() => setIsRegisterDialogOpen(true)}>Registrar/Autorizar TV</Button>
        </div>
        
        {tvDisplays.length === 0 ? (
          <p>No hay TVs registradas.</p>
        ) : (
          <div>
            <h2>TVs Registradas</h2>
            <ul>
              {tvDisplays.map((tv) => {
                console.log("TvManagementPage - TV media_playlist_id:", tv.media_playlist_id);
                return (
                <li key={tv.id} className="mb-2 p-2 border rounded flex justify-between items-center">
                  <div>
                    <strong>Código de Registro:</strong> {tv.registration_code} - 
                    <strong>Registrada:</strong> {tv.is_registered ? 'Sí' : 'No'} - 
                    <strong>Sucursal:</strong> {tv.branch_name || 'N/A'}
                  </div>
                  <div>
                    <Button variant="outline" size="sm" onClick={() => handleAssignPlaylist(tv)}>Asignar Playlist</Button>
                  </div>
                </li>
              );})}
            </ul>
          </div>
        )}

        <div className="flex justify-between items-center mb-4 mt-8">
          <h1>Gestión de Playlists de Medios</h1>
          <Button onClick={() => { setSelectedPlaylist(null); setIsMediaPlaylistDialogOpen(true); }}>Crear Nueva Playlist</Button>
        </div>

        {mediaPlaylists.length === 0 ? (
          <p>No hay playlists de medios creadas.</p>
        ) : (
          <div>
            <h2>Playlists Existentes</h2>
            <ul>
              {mediaPlaylists.map((playlist) => (
                <li key={playlist.id} className="mb-2 p-2 border rounded flex justify-between items-center">
                  <div>
                    <strong>{playlist.name}</strong>
                    <p className="text-sm text-gray-600">{playlist.description}</p>
                  </div>
                  <div className="flex items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="mr-2" onClick={() => handleEditPlaylist(playlist)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar Playlist</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar Playlist</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(playlist)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar Playlist</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Eliminar Playlist</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <RegisterTvDialog
          isOpen={isRegisterDialogOpen}
          onClose={() => setIsRegisterDialogOpen(false)}
          onSuccess={() => {
            setIsRegisterDialogOpen(false);
            fetchTvDisplays();
          }}
        />

        <MediaPlaylistDialog
          isOpen={isMediaPlaylistDialogOpen}
          onClose={() => {
            setIsMediaPlaylistDialogOpen(false);
            setSelectedPlaylist(null);
          }}
          onSuccess={() => {
            setIsMediaPlaylistDialogOpen(false);
            setSelectedPlaylist(null);
            fetchMediaPlaylists();
          }}
          playlist={selectedPlaylist}
        />

        {selectedTvDisplay && (
          <AssignPlaylistDialog
            isOpen={isAssignPlaylistDialogOpen}
            onClose={() => {
              setIsAssignPlaylistDialogOpen(false);
              setSelectedTvDisplay(null);
            }}
            onSuccess={() => {
              setIsAssignPlaylistDialogOpen(false);
              setSelectedTvDisplay(null);
              fetchTvDisplays();
            }}
            tvDisplayId={selectedTvDisplay.id}
            currentPlaylistId={selectedTvDisplay.media_playlist_id}
          />
        )}

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente la playlist
                <span className="font-bold"> {playlistToDelete?.name} </span>
                y todos sus elementos asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeletePlaylist}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </TooltipProvider>
  );
};

export default TvManagementPage;