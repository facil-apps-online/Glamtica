import { useState, useEffect } from 'react';
import { useImageStore } from '@/lib/imageStore';
import { useAuth } from '@/contexts/AuthContext'; // Importar useAuth

export const useGoogleDriveImage = (src?: string) => {
  const [displayUrl, setDisplayUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const { imageUrls, addUrl } = useImageStore();
  const { session } = useAuth(); // Obtener la sesión del AuthContext

  useEffect(() => {
    const fetchAndSetUrl = async () => {
      if (!src) {
        setDisplayUrl(undefined);
        return;
      }

      // 1. Check cache first
      if (imageUrls[src]) {
        setDisplayUrl(imageUrls[src]);
        return;
      }

      // 2. Handle local blob URLs directly
      if (src.startsWith('blob:')) {
        setDisplayUrl(src);
        return;
      }

      // 3. Determine the fileId, whether src is a full URL or just the ID
      let fileId: string | null = null;
      if (src.includes('drive.google.com')) {
        try {
          const url = new URL(src);
          fileId = url.searchParams.get('id');
        } catch (e) {
          console.error("Invalid Google Drive URL:", src);
          fileId = null;
        }
      } else if (!src.startsWith('http') && !src.startsWith('/')) {
        // It's not a full URL, assume it's a fileId
        fileId = src;
      }

      // 4. If we have a fileId, fetch it via proxy. Otherwise, use src as a fallback.
      if (fileId) {
        setIsLoading(true);
        try {
          const proxyUrl = `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/proxy-google-drive-image?fileId=${fileId}`;
          
          // Usar el access_token de la sesión actual
          const token = session?.access_token; 
          const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

          const response = await fetch(proxyUrl, { headers });
          if (!response.ok) throw new Error(`Proxy fetch failed with status ${response.status}`);
          
          const blob = await response.blob();
          if (blob.size === 0) throw new Error("Proxy returned empty blob");

          const objectUrl = URL.createObjectURL(blob);
          addUrl(src, objectUrl); // Cache using the original src as key
          setDisplayUrl(objectUrl);
        } catch (error) {
          console.error('Error fetching Google Drive image via proxy:', error);
          setDisplayUrl(undefined); // Fallback to nothing on error
        } finally {
          setIsLoading(false);
        }
      } else {
        // If it's a regular URL (not G-Drive) or something else, use it directly
        setDisplayUrl(src);
      }
    };

    fetchAndSetUrl();

  }, [src, imageUrls, addUrl, session]); // Añadir 'session' a las dependencias

  return { displayUrl, isLoading };
};