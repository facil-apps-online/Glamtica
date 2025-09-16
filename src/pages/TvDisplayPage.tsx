import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import YouTube from 'react-youtube';
import type { YouTubeProps } from 'react-youtube';
import { Button } from '@/components/ui/button'; // Import Button component

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
  clients: { name: string } | null;
  users: { first_name: string; last_name: string } | null;
}

interface PlaylistItem {
  id: string;
  playlist_id: string;
  media_url: string;
  media_type: 'youtube' | 'spotify';
  item_order: number;
  created_at: string;
  video_title?: string;
  duration_seconds?: number;
}

interface BranchPlaybackState {
  branch_id: string;
  current_playlist_item_id: string | null;
  video_started_at: string;
  updated_at: string;
}

const TvDisplayPage: React.FC = () => {
  const { registrationCode } = useParams<{ registrationCode: string }>();
  const navigate = useNavigate();
  const [tvDisplay, setTvDisplay] = useState<TvDisplay | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSoundActivated, setIsSoundActivated] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevTurnsRef = useRef<Turn[]>([]);
  const playerRef = useRef<any>(null);
  const isSeekingRef = useRef(false); // To prevent onStateChange from triggering sync during seek

  useEffect(() => {
    const initializeTv = async () => {
      try {
        let tvData: TvDisplay | null = null;
        if (registrationCode) {
          const { data, error } = await supabase.rpc('get_tv_display_by_code', { p_registration_code: registrationCode });
          if (error) throw error;
          if (data && data.length > 0) {
            tvData = data[0] as TvDisplay;
          }
        }
        setTvDisplay(tvData);
      } catch (err: any) {
        setError("Error al inicializar la TV: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeTv();
  }, [registrationCode, navigate]);

  const fetchTurns = useCallback(async (branchId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_current_turns_for_branch', { p_branch_id: branchId });
      if (error) throw error;
      setTurns(data as Turn[]);
    } catch (err: any) {
      console.error("Error fetching turns:", err.message);
    }
  }, []);

  const fetchPlaylistItems = useCallback(async (playlistId: string) => {
    console.log('fetchPlaylistItems called with playlistId:', playlistId);
    try {
      const { data, error } = await supabase.rpc('get_playlist_items', { p_playlist_id: playlistId });
      console.log('fetchPlaylistItems RPC result:', data, error);
      if (error) throw error;
      setPlaylistItems(data as PlaylistItem[]);
    } catch (err: any) {
      console.error("Error fetching playlist items:", err.message);
    }
  }, []);

  // Main useEffect for tvDisplay and initial fetches
  useEffect(() => {
    if (tvDisplay && tvDisplay.is_registered && tvDisplay.branch_id) {
      fetchTurns(tvDisplay.branch_id);

      const turnsSubscription = supabase
        .channel('public:turns')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'turns', filter: `branch_id=eq.${tvDisplay.branch_id}` },
          () => { fetchTurns(tvDisplay.branch_id!); }
        )
        .subscribe();

      if (tvDisplay.media_playlist_id) {
        console.log('Attempting to fetch playlist items for media_playlist_id:', tvDisplay.media_playlist_id);
        fetchPlaylistItems(tvDisplay.media_playlist_id);
      }

      return () => {
        supabase.removeChannel(turnsSubscription);
      };
    }
  }, [tvDisplay, fetchTurns, fetchPlaylistItems]);





  useEffect(() => {
    if (tvDisplay && tvDisplay.is_registered && tvDisplay.branch_id) {
      fetchTurns(tvDisplay.branch_id);

      const turnsSubscription = supabase
        .channel('public:turns')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'turns', filter: `branch_id=eq.${tvDisplay.branch_id}` },
          () => { fetchTurns(tvDisplay.branch_id!); }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(turnsSubscription);
      };
    }
  }, [tvDisplay, fetchTurns]);

  useEffect(() => {
    if (audioRef.current) {
      const prevTurns = prevTurnsRef.current;
      const calledTurns = turns.filter(turn => turn.status === 'called');
      const previouslyCalledTurns = prevTurns.filter(turn => turn.status === 'called');
      const newCalledTurn = calledTurns.find(calledTurn => !previouslyCalledTurns.some(prevCalledTurn => prevCalledTurn.id === calledTurn.id));

      if (newCalledTurn) {
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
      }

      prevTurnsRef.current = turns;
    }
  }, [turns]);

  const handleNextVideo = () => {
    console.log('handleNextVideo (local): Advancing to next video.');
    setCurrentMediaIndex(prevIndex => (prevIndex + 1) % playlistItems.length);
  };

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    if (!isSoundActivated) {
      event.target.mute();
    } else {
      event.target.unMute();
    }
    event.target.playVideo(); // Force autoplay
  }

  const handleActivateSound = () => {
    if (playerRef.current) {
      playerRef.current.unMute();
      setIsSoundActivated(true);
    }
  };

  const renderMedia = () => {
    console.log('renderMedia called. Items available:', playlistItems.length, playlistItems);
    if (playlistItems.length === 0) {
      return <div className="text-center text-gray-400">No hay contenido multimedia asignado.</div>;
    }

    const currentMedia = playlistItems[currentMediaIndex];
    if (!currentMedia) return null;

    if (currentMedia.media_type === 'youtube') {
      let videoId = '';
      let playlistId = '';
      try {
        const url = new URL(currentMedia.media_url);
        videoId = url.searchParams.get('v') || '';
        playlistId = url.searchParams.get('list') || '';
      } catch (e) {
        console.error('Invalid media URL:', currentMedia.media_url);
        return <div className="text-center text-red-400">URL de video inválida.</div>;
      }

      const opts: YouTubeProps['opts'] = {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          loop: playlistItems.length === 1 ? 1 : 0,
          playlist: playlistItems.length === 1 ? videoId : undefined,
        },
      };

      return (
        <YouTube
          videoId={videoId}
          opts={opts}
          className="w-full aspect-video shadow-2xl rounded-lg overflow-hidden"
          onReady={onPlayerReady}
          onEnd={handleNextVideo}
        />
      );
    } else if (currentMedia.media_type === 'spotify') {
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
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-600 to-purple-600 text-white p-8">
        <img src="/glamtica.app.png" alt="Glamtica Logo" className="w-48 mb-8 animate-pulse" />
        <h1 className="text-2xl font-bold">Cargando configuración de TV...</h1>
      </div>
    );
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">Error: {error}</div>;
  }

  if (!tvDisplay) {
    return <div className="flex items-center justify-center h-screen">No se pudo cargar la información de la TV.</div>;
  }

  if (!tvDisplay.is_registered) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-600 to-purple-600 text-white p-8">
        <img src="/glamtica.app.png" alt="Glamtica Logo" className="w-48 mb-8" />
        <h1 className="text-4xl font-bold mb-4">Registra tu Pantalla</h1>
        <p className="text-lg mb-8 text-center max-w-2xl">Escanea el código QR o introduce el código en la app.</p>
        
        <div className="flex flex-col md:flex-row items-center gap-8 bg-white/10 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
          <div className="bg-white text-gray-900 p-6 rounded-lg shadow-lg text-6xl font-extrabold tracking-widest">
            {tvDisplay.registration_code}
          </div>
          {tvDisplay.registration_code && (
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={`${window.location.origin}/register-tv/${tvDisplay.registration_code}`} size={192} />
            </div>
          )}
        </div>

        <p className="text-md mt-8 text-center">Una vez registrada, la pantalla mostrará los turnos y el contenido asignado.</p>
      </div>
    );
  }

  return (
      <div className="flex h-screen bg-gradient-to-br from-blue-700 to-purple-700 text-white">
      {/* Sección de Turnos */}
      <div className="w-1/2 p-8 flex flex-col items-center bg-black/10">
        <img src="/glamtica.app.png" alt="Glamtica Logo" className="w-40 mb-8" />
        <h1 className="text-5xl font-bold mb-8">Turnos</h1>
        {turns.length === 0 ? (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-2xl text-white/70">No hay turnos en espera.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 w-full max-w-2xl">
            {turns.map((turn) => (
              <div key={turn.id} className={`bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-lg flex justify-between items-center transition-all duration-300 ${turn.status === 'called' ? 'border-4 border-pink-500 animate-pulse' : 'border-4 border-transparent'}`}>
                <div>
                  <p className="text-3xl font-semibold">{turn.clients?.name || 'N/A'}</p>
                  <p className="text-xl text-white/80">con {turn.users?.first_name} {turn.users?.last_name || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${turn.status === 'called' ? 'text-pink-400' : 'text-blue-300'}`}>
                    {turn.status === 'waiting' ? 'En Espera' : 'Llamado'}
                  </p>
                  {turn.called_at && (
                    <p className="text-sm text-white/60">Llamado a las {new Date(turn.called_at).toLocaleTimeString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección de Medios */}
      <div className="w-1/2 bg-black/20 flex items-center justify-center relative">
        {renderMedia()}
        {!isSoundActivated && playlistItems.length > 0 && (
          <Button 
            onClick={handleActivateSound} 
            className="absolute bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            Activar Sonido
          </Button>
        )}
      </div>
      <audio ref={audioRef} src="/notification-sound.mp3" preload="auto" />
    </div>
  );
};

export default TvDisplayPage;
