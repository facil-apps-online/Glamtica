import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useGoogleDriveStorage } from './useGoogleDriveStorage';
import { useImageCompressionSettings, ImageSettings } from './useImageCompressionSettings'; // Import the new hook and types

export interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error';
  compressionProgress: number;
  uploadProgress: number;
  error?: string;
  result?: UploadResult;
}

export interface UploadResult {
  success: boolean;
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

const readFileAsBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = () => resolve(reader.result?.toString().split(',')[1] || '');
  reader.onerror = (error) => reject(error);
});

export const useUploader = () => {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { uploadFile: uploadToDrive, deleteFile: deleteFromDrive } = useGoogleDriveStorage();
  const { getSettingsForType } = useImageCompressionSettings(); // Use the new hook

  const addFiles = useCallback((newFiles: File[]) => {
    const filesToUpload: UploadFile[] = newFiles.map(file => ({
      id: uuidv4(),
      file,
      status: 'pending',
      compressionProgress: 0,
      uploadProgress: 0,
    }));
    setFiles(prev => [...prev, ...filesToUpload]);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const processQueue = useCallback(async (
    imageType: keyof ImageSettings, // Add this new parameter
    path_components: string[],
    onSingleUploadComplete: (result: UploadResult) => void
  ) => {
    setIsProcessing(true);

    const filesToProcess = files.filter(f => f.status === 'pending');

    const compressionOptions = getSettingsForType(imageType); // Get dynamic settings

    const uploadPromises = filesToProcess.map(uploadFile => (
      async () => {
        try {
          setFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, status: 'compressing' } : f));
          
          const options = {
            maxSizeMB: compressionOptions.maxSizeMB, // Use dynamic setting
            maxWidthOrHeight: compressionOptions.maxWidthOrHeight, // Use dynamic setting
            useWebWorker: true,
            onProgress: (p: number) => {
              setFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, compressionProgress: p } : f));
            },
          };
          const compressedFile = await imageCompression(uploadFile.file, options);
          
          setFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, status: 'uploading', compressionProgress: 100 } : f));

          const base64data = await readFileAsBase64(compressedFile);
          
          const result = await uploadToDrive({
            fileName: compressedFile.name,
            fileBase64: base64data,
            mimeType: compressedFile.type,
            path_components: path_components,
            onProgress: (p: number) => {
              setFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, uploadProgress: p } : f));
            },
          });

          setFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, status: 'success', uploadProgress: 100, result } : f));
          onSingleUploadComplete(result);
          return { status: 'fulfilled', value: result };
        } catch (e: any) {
          console.error('Upload failed for file:', uploadFile.file.name, e);
          setFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, status: 'error', error: e.message } : f));
          return { status: 'rejected', reason: e };
        }
      }
    )());

    const results = await Promise.allSettled(uploadPromises);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;

    setIsProcessing(false);

    let toastTitle = "Proceso de Subida Finalizado";
    let toastDescription = "";
    let toastVariant: "default" | "success" | "destructive" | null | undefined = "default";

    if (successCount === filesToProcess.length && errorCount === 0) {
      toastDescription = `Todos los ${successCount} archivos se subieron correctamente.`;
      toastVariant = "success";
    } else if (errorCount === filesToProcess.length && successCount === 0) {
      toastDescription = `Falló la subida de todos los ${errorCount} archivos.`;
      toastVariant = "destructive";
    } else {
      toastDescription = `Se subieron ${successCount} archivo(s) correctamente y ${errorCount} fallaron.`;
      toastVariant = (errorCount > 0) ? "destructive" : "success"; 
    }

    toast({ title: toastTitle, description: toastDescription, variant: toastVariant });

    setTimeout(() => {
      clearFiles();
    }, 2000);

  }, [files, toast, clearFiles, uploadToDrive, getSettingsForType]); // Add getSettingsForType to dependencies

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      await deleteFromDrive(fileId);
      console.log(`Archivo ${fileId} eliminado correctamente de Google Drive.`);
    } catch (e: any) {
      console.error(`Excepción al eliminar el archivo ${fileId} de Google Drive:`, e);
      // Re-throw the error so the calling component can handle it (e.g., decide not to proceed with DB deletion)
      throw e;
    }
  }, [deleteFromDrive]);

  return {
    files,
    isProcessing,
    addFiles,
    removeFile,
    clearFiles,
    processQueue,
    deleteFile,
  };
};
