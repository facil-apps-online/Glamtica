import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import RegisterTvDialog from '@/components/RegisterTvDialog';
import MediaPlaylistDialog from '@/components/MediaPlaylistDialog';
import AssignPlaylistDialog from '@/components/AssignPlaylistDialog';

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
}

interface MediaPlaylist {
  id: string;
  name: string;
  description: string;
}

const TvManagementPage: React.FC = () => {
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

  const fetchTvDisplays = useCallback(async () => {
    setLoadingTv(true);
    setErrorTv(null);
    try {
      const { data, error } = await supabase
        .from('tv_displays')
        .select('*');

      if (error) {
        throw error;
      }
      setTvDisplays(data as TvDisplay[]);
    } catch (err: any) {
      setErrorTv(err.message);
    } finally {
      setLoadingTv(false);
    }
  }, []);

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
  }, [fetchTvDisplays, fetchMediaPlaylists]);

  const handleEditPlaylist = (playlist: MediaPlaylist) => {
    setSelectedPlaylist(playlist);
    setIsMediaPlaylistDialogOpen(true);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta playlist y todos sus ítems?')) {
      try {
        const { error } = await supabase
          .from('media_playlists')
          .delete()
          .eq('id', playlistId);

        if (error) throw error;
        fetchMediaPlaylists();
      } catch (err: any) {
        alert('Error al eliminar playlist: ' + err.message);
      }
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
            {tvDisplays.map((tv) => (
              <li key={tv.id} className="mb-2 p-2 border rounded flex justify-between items-center">
                <div>
                  <strong>Código de Registro:</strong> {tv.registration_code} - 
                  <strong>Registrada:</strong> {tv.is_registered ? 'Sí' : 'No'} - 
                  <strong>Sucursal:</strong> {tv.branch_id || 'N/A'}
                </div>
                <div>
                  <Button variant="outline" size="sm" onClick={() => handleAssignPlaylist(tv)}>Asignar Playlist</Button>
                </div>
              </li>
            ))}
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
                <div>
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditPlaylist(playlist)}>Editar</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeletePlaylist(playlist.id)}>Eliminar</Button>
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
    </div>
  );
};

export default TvManagementPage;
