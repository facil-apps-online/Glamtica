import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import YouTube from 'react-youtube';
import type { YouTubeProps } from 'react-youtube';
import { Button } from '@/components/ui/button';
import { useGoogleDriveImage } from '@/hooks/useGoogleDriveImage';

interface Tenant {
  id: string;
  logo_url: string | null;
}

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

const TvDisplayPage: React.FC = () => {
  const { registrationCode } = useParams<{ registrationCode: string }>();
  const navigate = useNavigate();
  const [tvDisplay, setTvDisplay] = useState<TvDisplay | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSoundActivated, setIsSoundActivated] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevTurnsRef = useRef<Turn[]>([]);
  const playerRef = useRef<any>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { displayUrl: tenantLogoUrl } = useGoogleDriveImage(tenant?.logo_url);
  const finalLogoUrl = tenantLogoUrl || '/glamtica.app.png';

  useEffect(() => {
    const initializeTv = async () => {
      try {
        let tvData: TvDisplay | null = null;
        if (registrationCode) {
          const { data, error } = await supabase.rpc('get_tv_display_by_code', { p_registration_code: registrationCode });
          if (error) throw error;
          if (data && data.length > 0) {
            tvData = data[0] as TvDisplay;
            setTvDisplay(tvData);
          } else {
            // Si no se encuentra el código, podría ser un código antiguo o inválido.
            // Opcionalmente, podríamos redirigir a la página de creación.
            navigate('/tv');
          }
        } else {
          // No hay código de registro, así que creamos uno nuevo.
          const { data, error } = await supabase.rpc('create_unregistered_tv');
          if (error) throw error;
          
          const newTv = data as TvDisplay;
          if (newTv && newTv.registration_code) {
            navigate(`/tv/${newTv.registration_code}`, { replace: true });
          } else {
            throw new Error('No se pudo crear un nuevo registro de TV.');
          }
        }
      } catch (err: any) {
        setError("Error al inicializar la TV: " + err.message);
      } finally {
        // Solo dejamos de cargar si no estamos redirigiendo
        if (registrationCode) {
          setLoading(false);
        }
      }
    };

    initializeTv();
  }, [registrationCode, navigate]);

  useEffect(() => {
    if (tvDisplay?.tenant_id) {
      const fetchTenant = async () => {
        const { data, error } = await supabase
          .from('tenants')
          .select('id, logo_url')
          .eq('id', tvDisplay.tenant_id)
          .single();
        if (error) {
          console.error('Error fetching tenant:', error);
        } else {
          setTenant(data);
        }
      };
      fetchTenant();
    }
  }, [tvDisplay]);

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
    try {
      const { data, error } = await supabase.rpc('get_playlist_items', { p_playlist_id: playlistId });
      if (error) throw error;
      setPlaylistItems(data as PlaylistItem[]);
    } catch (err: any) {
      console.error("Error fetching playlist items:", err.message);
    }
  }, []);

  useEffect(() => {
    if (tvDisplay && tvDisplay.is_registered && tvDisplay.branch_id) {
      const turnsSubscription = supabase
        .channel('public:turns')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'turns', filter: `branch_id=eq.${tvDisplay.branch_id}` },
          () => {
            setLastUpdate(new Date());
          }
        )
        .subscribe();

      if (tvDisplay.media_playlist_id) {
        fetchPlaylistItems(tvDisplay.media_playlist_id);
      }

      return () => {
        supabase.removeChannel(turnsSubscription);
      };
    }
  }, [tvDisplay, fetchPlaylistItems]);

  useEffect(() => {
    if (tvDisplay && tvDisplay.is_registered && tvDisplay.branch_id) {
      fetchTurns(tvDisplay.branch_id);
    }
  }, [lastUpdate, tvDisplay]);

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

  const [isHovering, setIsHovering] = useState(false);

  const handleNextVideo = () => {
    setCurrentMediaIndex(prevIndex => (prevIndex + 1) % playlistItems.length);
  };

  const handlePrevVideo = () => {
    setCurrentMediaIndex(prevIndex => (prevIndex - 1 + playlistItems.length) % playlistItems.length);
  };

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    if (!isSoundActivated) {
      event.target.mute();
    } else {
      event.target.unMute();
    }
    event.target.playVideo();
  }

  const handleActivateSound = () => {
    if (playerRef.current) {
      playerRef.current.unMute();
      setIsSoundActivated(true);
    }
  };

  const renderMedia = () => {
    if (playlistItems.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img src={finalLogoUrl} alt="Logo" className="w-1/2 max-w-xs opacity-80" />
        </div>
      );
    }

    const currentMedia = playlistItems[currentMediaIndex];
    if (!currentMedia) return null;

    const mediaContainer = (
      <div 
        className="w-full aspect-video relative shadow-2xl rounded-lg overflow-hidden group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {tenantLogoUrl && (
          <img 
            src={tenantLogoUrl} 
            alt="Salon Logo" 
            className="absolute top-4 right-4 w-24 h-auto z-10 bg-black/20 p-2 rounded-md"
          />
        )}
        {/* Media content goes here */}
        {currentMedia.media_type === 'youtube' ? (
          <YouTube
            videoId={new URL(currentMedia.media_url).searchParams.get('v') || ''}
            opts={{
              height: '100%',
              width: '100%',
              playerVars: {
                autoplay: 1,
                controls: 1,
                rel: 0,
                showinfo: 0,
                modestbranding: 1,
                loop: playlistItems.length === 1 ? 1 : 0,
                playlist: playlistItems.length === 1 ? new URL(currentMedia.media_url).searchParams.get('v') || '' : undefined,
              },
            }}
            className="w-full h-full"
            onReady={onPlayerReady}
            onEnd={handleNextVideo}
          />
        ) : currentMedia.media_type === 'spotify' ? (
          <iframe
            src={`https://open.spotify.com/embed/${currentMedia.media_url.includes('track') ? 'track' : currentMedia.media_url.includes('album') ? 'album' : 'playlist'}/${currentMedia.media_url.split('/').pop()}`}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          ></iframe>
        ) : null}

        {playlistItems.length > 1 && (
        <div className={`absolute inset-0 flex items-center justify-between px-4 transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
            <Button onClick={handlePrevVideo} className="bg-black/30 hover:bg-black/50 text-white rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Button>
            <Button onClick={handleNextVideo} className="bg-black/30 hover:bg-black/50 text-white rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Button>
          </div>
        )}
      </div>
    );

    return mediaContainer;
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
      <div className="w-2/3 p-8 flex flex-col items-center bg-black/10">
        <img src={finalLogoUrl} alt="Logo" className="w-40 mb-8" />
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

      <div className="w-1/3 bg-black/20 flex items-center justify-center relative">
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