import React, { useRef, useState } from 'react';
import { useUploader, UploadResult } from '@/hooks/useUploader';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ImageSettings } from '@/hooks/useImageCompressionSettings'; // Import ImageSettings

interface FileUploaderProps {
  onUploadComplete: (result: UploadResult) => void;
  path_components: string[];
  imageType: keyof ImageSettings; // Add imageType prop
  label?: string;
  disabled?: boolean;
}

const FilePreviewCard: React.FC<{ uploadFile: ReturnType<typeof useUploader>['files'][0]; onRemove: (id: string) => void }> = ({ uploadFile, onRemove }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (uploadFile.file) {
      const url = URL.createObjectURL(uploadFile.file);
      setImageUrl(url);
      
      return () => URL.revokeObjectURL(url);
    }
  }, [uploadFile.file]);

  if (!imageUrl) {
    return null; // Or a placeholder
  }

  return (
    <Card className="relative group overflow-hidden">
      <CardContent className="p-1">
        <div className="relative">
          <img src={imageUrl} alt={uploadFile.file.name} className="w-full h-24 object-cover rounded" />
          {uploadFile.status !== 'uploading' && uploadFile.status !== 'compressing' && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => onRemove(uploadFile.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="p-2 text-xs">
          <p className="truncate font-medium">{uploadFile.file.name}</p>
          {uploadFile.status === 'compressing' && (
            <>
              <p>Comprimiendo...</p>
              <Progress value={uploadFile.compressionProgress} className="h-2 mt-1" />
            </>
          )}
          {uploadFile.status === 'uploading' && (
            <>
              <p className="text-blue-500">Subiendo...</p>
              <Progress value={uploadFile.uploadProgress} className="h-2 mt-1" />
            </>
          )}
          {uploadFile.status === 'success' && <p className="text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Completado</p>}
          {uploadFile.status === 'error' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-red-500 flex items-center gap-1 w-full text-left">
                  <AlertTriangle className="w-3 h-3"/> Error
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Error en la Subida</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ocurrió un error al intentar subir el archivo "{uploadFile.file.name}".
                    <br /><br />
                    <strong>Detalles:</strong> {uploadFile.error || 'No se proporcionaron detalles.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction>Entendido</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
  path_components,
  imageType, // Destructure new prop
  label = 'Seleccionar Archivos',
  disabled = false,
}) => {
  const { files, isProcessing, addFiles, removeFile, clearFiles, processQueue } = useUploader();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
    addFiles(imageFiles);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = () => {
    processQueue(imageType, path_components, (result) => { // Pass imageType
      // This callback is fired by the hook for each successful upload
      onUploadComplete(result);
    });
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        className="w-full gap-2"
        disabled={disabled || isProcessing}
      >
        <UploadCloud className="w-4 h-4" />
        {label}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Archivos para subir:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {files.map(uploadFile => (
              <FilePreviewCard key={uploadFile.id} uploadFile={uploadFile} onRemove={removeFile} />
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={clearFiles}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isProcessing || files.every(f => f.status !== 'pending')}
            className="gap-2"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            {isProcessing ? "Procesando..." : `Confirmar y Subir ${files.filter(f => f.status === 'pending').length} archivo(s)`}
          </Button>
        </div>
      )}
    </div>
  );
};
