import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, coreSupabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { UploadResult } from './useUploader';

// Arguments for the upload function
interface UploadArgs {
  fileName: string;
  fileBase64: string;
  mimeType: string;
  path_components: string[];
  onProgress?: (percentage: number) => void;
}

/**
 * A centralized hook for interacting with the Google Drive storage backend via Supabase Edge Functions.
 * It encapsulates upload and delete logic.
 */
export const useGoogleDriveStorage = () => {
  const { currentAssignment } = useAuth();
  const { toast } = useToast();
  const tenantId = currentAssignment?.tenant_id;
  const platformId = import.meta.env.VITE_PLATFORM_ID;

  // Mutation for uploading a file, now with XHR for progress tracking
  const { mutateAsync: uploadFile, isPending: isUploading } = useMutation<UploadResult, Error, UploadArgs>({
    mutationFn: async (args: UploadArgs) => {
      if (!tenantId || !platformId) {
        throw new Error('Authentication context not available for upload.');
      }

      const { onProgress, ...uploadData } = args;

      // Supabase-js uses fetch, which doesn't support upload progress.
      // We have to drop down to XMLHttpRequest to get this feature.
      return new Promise<UploadResult>(async (resolve, reject) => {
        const xhr = new XMLHttpRequest();
        // Get the session from the MAIN client, which handles auth
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          return reject(new Error('No active session found for upload.'));
        }

        // The function is on the coreSupabase instance, so we use its URL
        const url = `${coreSupabase.functionsUrl}/google-drive-upload`;
        xhr.open('POST', url, true);

        // Replicate headers that supabase-js's 'invoke' would add
        xhr.setRequestHeader('apikey', coreSupabase.supabaseKey);
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        xhr.setRequestHeader('Content-Type', 'application/json');

        // Progress event listener
        if (onProgress) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentage = Math.round((event.loaded / event.total) * 100);
              onProgress(percentage);
            }
          };
        }

        // Handle completion
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const jsonResponse = JSON.parse(xhr.responseText);
              if (jsonResponse.success) {
                resolve(jsonResponse as UploadResult);
              } else {
                reject(new Error(jsonResponse.error || 'Upload failed after completion.'));
              }
            } catch (e) {
              reject(new Error('Failed to parse server response.'));
            }
          } else {
            reject(new Error(`Server responded with status ${xhr.status}: ${xhr.statusText}`));
          }
        };

        // Handle errors
        xhr.onerror = () => {
          reject(new Error('A network error occurred during the upload.'));
        };

        const body = {
          platform_id: platformId,
          tenantId: tenantId,
          integration_owner_tenant_id: tenantId,
          ...uploadData,
        };

        xhr.send(JSON.stringify(body));
      });
    },
  });

  // Mutation for deleting a file
  const { mutateAsync: deleteFile, isPending: isDeleting } = useMutation<void, Error, string>({
    mutationFn: async (fileId: string) => {
      if (!tenantId) {
        throw new Error('Authentication context not available for deletion.');
      }
      const { error } = await coreSupabase.functions.invoke('google-drive-delete', {
        body: {
          fileId: fileId,
          integration_owner_tenant_id: tenantId,
        },
      });

      if (error) {
        throw new Error(error.message || 'Error al eliminar el archivo de Google Drive.');
      }
    },
    onError: (error) => {
      // Provide generic feedback for deletions that are not part of a larger flow.
      toast({
        title: 'Error de Almacenamiento',
        description: `No se pudo procesar la eliminación del archivo: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    uploadFile,
    isUploading,
    deleteFile,
    isDeleting,
  };
};
