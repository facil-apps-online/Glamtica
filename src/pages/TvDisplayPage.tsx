import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

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

interface Turn {
  id: string;
  branch_id: string;
  client_id: string;
  stylist_id: string;
  status: 'waiting' | 'called' | 'in_service' | 'completed';
  called_at: string | null;
  created_at: string;
  updated_at: string;
  clients: { name: string } | null; // Assuming clients table is joined
  users: { first_name: string; last_name: string } | null; // Assuming users table is joined
}

interface PlaylistItem {
  id: string;
  playlist_id: string;
  media_url: string;
  media_type: 'youtube' | 'spotify';
  item_order: number;
  created_at: string;
}

const TvDisplayPage: React.FC = () => {
  const { registrationCode } = useParams<{ registrationCode: string }>();
  const [tvDisplay, setTvDisplay] = useState<TvDisplay | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevTurnsRef = useRef<Turn[]>([]);

  const fetchTvDisplay = useCallback(async () => {
    if (!registrationCode) {
      setError("Código de registro no proporcionado en la URL.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_tv_display_by_code', { p_registration_code: registrationCode });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setTvDisplay(data[0] as TvDisplay);
      } else {
        setError("TV no encontrada con el código proporcionado.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [registrationCode]);

  const fetchTurns = useCallback(async (branchId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_current_turns_for_branch', { p_branch_id: branchId });
      if (error) {
        throw error;
      }
      setTurns(data as Turn[]);
    } catch (err: any) {
      console.error("Error fetching turns:", err.message);
    }
  }, []);

  const fetchPlaylistItems = useCallback(async (playlistId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_playlist_items', { p_playlist_id: playlistId });
      if (error) {
        throw error;
      }
      setPlaylistItems(data as PlaylistItem[]);
    } catch (err: any) {
      console.error("Error fetching playlist items:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchTvDisplay();
  }, [fetchTvDisplay]);

  useEffect(() => {
    if (tvDisplay && tvDisplay.is_registered && tvDisplay.branch_id) {
      fetchTurns(tvDisplay.branch_id);

      const turnsSubscription = supabase
        .channel('public:turns')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'turns', filter: `branch_id=eq.${tvDisplay.branch_id}` },
          (payload) => {
            console.log('Change received!', payload);
            fetchTurns(tvDisplay.branch_id!); 
          }
        )
        .subscribe();

      // Fetch playlist items if media_playlist_id is set
      if (tvDisplay.media_playlist_id) {
        fetchPlaylistItems(tvDisplay.media_playlist_id);
      }

      return () => {
        supabase.removeChannel(turnsSubscription);
      };
    }
  }, [tvDisplay, fetchTurns, fetchPlaylistItems]);

  // Media rotation logic
  useEffect(() => {
    if (playlistItems.length > 0) {
      const timer = setInterval(() => {
        setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % playlistItems.length);
      }, 15000); // Change media every 15 seconds
      return () => clearInterval(timer);
    }
  }, [playlistItems]);

  // Audio playback logic for 'called' turns
  useEffect(() => {
    if (audioRef.current) {
      const prevTurns = prevTurnsRef.current;
      const calledTurns = turns.filter(turn => turn.status === 'called');
      const previouslyCalledTurns = prevTurns.filter(turn => turn.status === 'called');

      // Check if a new turn has been called
      const newCalledTurn = calledTurns.find(calledTurn => 
        !previouslyCalledTurns.some(prevCalledTurn => prevCalledTurn.id === calledTurn.id)
      );

      if (newCalledTurn) {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }

      prevTurnsRef.current = turns; // Update ref for next render
    }
  }, [turns]);

  const renderMedia = () => {
    if (playlistItems.length === 0) {
      return <div className="text-center text-gray-400">No hay contenido multimedia asignado.</div>;
    }

    const currentMedia = playlistItems[currentMediaIndex];
    if (!currentMedia) return null;

    if (currentMedia.media_type === 'youtube') {
      const videoId = currentMedia.media_url.split('v=')[1]?.split('&')[0];
      return (
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      );
    } else if (currentMedia.media_type === 'spotify') {
      // Spotify embed requires a specific URL format for tracks/albums/playlists
      // Example: https://open.spotify.com/embed/track/TRACK_ID
      const spotifyId = currentMedia.media_url.split('/').pop();
      const embedType = currentMedia.media_url.includes('track') ? 'track' : currentMedia.media_url.includes('album') ? 'album' : 'playlist';
      return (
        <iframe
          src={`https://open.spotify.com/embed/${embedType}/${spotifyId}`}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      );
    }
    return null;
  };

  if (loading) {
    return <div>Cargando configuración de TV...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!tvDisplay) {
    return <div>No se pudo cargar la información de la TV.</div>;
  }

  if (!tvDisplay.is_registered) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-8">
        <h1 className="text-4xl font-bold mb-4">Registra tu Pantalla</h1>
        <p className="text-lg mb-8 text-center">Para activar esta pantalla, introduce el siguiente código en la sección de administración de TVs de tu aplicación Glamtica:</p>
        <div className="bg-white text-gray-900 p-6 rounded-lg shadow-lg text-6xl font-extrabold tracking-widest">
          {tvDisplay.registration_code}
        </div>
        <p className="text-md mt-8 text-center">Una vez registrada, esta pantalla mostrará automáticamente los turnos y el contenido multimedia asignado.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-800 text-white">
      {/* Sección de Turnos */}
      <div className="w-1/2 p-8 flex flex-col justify-center items-center">
        <h1 className="text-5xl font-bold mb-8">Turnos Actuales</h1>
        {turns.length === 0 ? (
          <p className="text-2xl">No hay turnos en espera o siendo atendidos.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 w-full max-w-2xl">
            {turns.map((turn) => (
              <div key={turn.id} className={`bg-gray-700 p-6 rounded-lg shadow-lg flex justify-between items-center ${turn.status === 'called' ? 'animate-pulse border-4 border-yellow-500' : ''}`}>
                <div>
                  <p className="text-3xl font-semibold">Cliente: {turn.clients?.name || 'N/A'}</p>
                  <p className="text-xl text-gray-300">Estilista: {turn.users?.first_name} {turn.users?.last_name || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${turn.status === 'called' ? 'text-yellow-400' : 'text-blue-400'}`}>
                    {turn.status === 'waiting' ? 'En Espera' : 'Llamado'}
                  </p>
                  {turn.called_at && (
                    <p className="text-sm text-gray-400">Llamado a: {new Date(turn.called_at).toLocaleTimeString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección de Medios */}
      <div className="w-1/2 p-8 bg-gray-900 flex items-center justify-center">
        {renderMedia()}
      </div>
      <audio ref={audioRef} src="/notification-sound.mp3" preload="auto" />
    </div>
  );
};

export default TvDisplayPage;
