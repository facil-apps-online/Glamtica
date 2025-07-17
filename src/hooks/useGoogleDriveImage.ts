import { useState, useEffect } from 'react';
import { useImageStore } from '@/lib/imageStore';

export const useGoogleDriveImage = (src?: string) => {
  const [displayUrl, setDisplayUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const { imageUrls, addUrl } = useImageStore();

  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchAndSetUrl = async () => {
      if (!src) {
        setDisplayUrl(undefined);
        return;
      }

      // 1. Revisar la caché primero
      if (imageUrls[src]) {
        setDisplayUrl(imageUrls[src]);
        return;
      }

      if (src.startsWith('blob:')) {
        setDisplayUrl(src);
        return;
      }

      if (src.includes('drive.google.com')) {
        setIsLoading(true);
        try {
          const url = new URL(src);
          const fileId = url.searchParams.get('id');

          if (!fileId) {
            setDisplayUrl(undefined);
            return;
          }

          const proxyUrl = `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/proxy-google-drive-image?fileId=${fileId}`;
          
          const token = localStorage.getItem('supabase.auth.token');
          const headers: HeadersInit = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(proxyUrl, { headers });

          if (!response.ok) {
            throw new Error(`Proxy fetch failed with status ${response.status}`);
          }
          
          const blob = await response.blob();
          if (blob.size === 0) {
            setDisplayUrl(undefined);
            return;
          }

          objectUrl = URL.createObjectURL(blob);
          // 2. Guardar en la caché y actualizar el estado
          addUrl(src, objectUrl);
          setDisplayUrl(objectUrl);
        } catch (error) {
          console.error('Error fetching Google Drive image via proxy:', error);
          setDisplayUrl(undefined);
        } finally {
          setIsLoading(false);
        }
      } else {
        setDisplayUrl(src);
      }
    };

    fetchAndSetUrl();

    // La limpieza de objectUrl se maneja a nivel de navegador, 
    // no necesitamos revocarlo explícitamente aquí ya que lo queremos persistir en la caché de la sesión.
    // El return () => {} se puede omitir si no hay más lógica de limpieza.
  }, [src, imageUrls, addUrl]);

  return { displayUrl, isLoading };
};
