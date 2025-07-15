import { useState, useEffect } from 'react';

export const useGoogleDriveImage = (src?: string) => {
  const [displayUrl, setDisplayUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchAndSetUrl = async () => {
      if (!src) {
        setDisplayUrl(undefined);
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
          const response = await fetch(proxyUrl);

          if (!response.ok) {
            throw new Error(`Proxy fetch failed with status ${response.status}`);
          }
          
          const blob = await response.blob();
          if (blob.size === 0) {
            setDisplayUrl(undefined);
            return;
          }

          objectUrl = URL.createObjectURL(blob);
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

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  return { displayUrl, isLoading };
};
