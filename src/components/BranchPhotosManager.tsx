import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBranchPhotos, useUploadBranchPhoto, useSetPrimaryBranchPhoto, useDeleteBranchPhoto, BranchPhoto } from '@/hooks/useBranchPhotos';
import { useGoogleDriveImage } from '@/hooks/useGoogleDriveImage';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Star, Trash2, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BranchPhotosManagerProps {
  branchId: string;
}

const PhotoCard = ({ photo, onSetPrimary, onDelete, isProcessing }: { photo: BranchPhoto, onSetPrimary: () => void, onDelete: () => void, isProcessing: boolean }) => {
  const { displayUrl, isLoading } = useGoogleDriveImage(photo.google_drive_file_id);

  return (
    <Card className="overflow-hidden group relative">
      <div className="aspect-video bg-gray-100 flex items-center justify-center">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <img src={displayUrl} alt={photo.file_name || 'Branch photo'} className="h-full w-full object-cover" />
        )}
      </div>
      {photo.is_primary && <Badge className="absolute top-2 right-2">Principal</Badge>}
      <CardContent className="p-2">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="w-full" disabled={photo.is_primary || isProcessing} onClick={onSetPrimary}>
            <Star className="w-4 h-4 mr-2" />
            Principal
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" disabled={isProcessing}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. La foto será eliminada permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

const BranchPhotosManager: React.FC<BranchPhotosManagerProps> = ({ branchId }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: photos, isLoading, error } = useBranchPhotos(branchId);
  const uploadMutation = useUploadBranchPhoto(branchId);
  const setPrimaryMutation = useSetPrimaryBranchPhoto(branchId);
  const deleteMutation = useDeleteBranchPhoto(branchId);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({ title: "Archivo demasiado grande", description: "Por favor, sube imágenes de menos de 5MB.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      uploadMutation.mutate({
        fileBase64: base64.split(',')[1],
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      }, {
        onSuccess: () => {
          toast({ title: "Éxito", description: "La foto ha sido subida.", variant: "success" });
        },
        onError: (err) => {
          toast({ title: "Error al subir", description: err.message, variant: "destructive" });
        },
        onSettled: () => {
          if(fileInputRef.current) fileInputRef.current.value = "";
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSetPrimary = (photoId: string) => {
    setPrimaryMutation.mutate(photoId, {
      onSuccess: () => toast({ title: "Éxito", description: "La foto principal ha sido actualizada.", variant: "success" }),
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  const handleDelete = (photoId: string) => {
    deleteMutation.mutate(photoId, {
      onSuccess: () => toast({ title: "Éxito", description: "La foto ha sido eliminada.", variant: "success" }),
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  const isProcessing = setPrimaryMutation.isPending || deleteMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionar Fotos de la Sucursal</CardTitle>
        <CardDescription>
          Sube, ordena y selecciona la foto principal para esta sucursal. Esta foto se mostrará en tu micrositio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Subir Foto
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-video w-full" />)}
          </div>
        ) : error ? (
          <p className="text-red-500 text-center">Error al cargar las fotos: {error.message}</p>
        ) : photos && photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map(photo => (
              <PhotoCard 
                key={photo.id} 
                photo={photo} 
                onSetPrimary={() => handleSetPrimary(photo.id)}
                onDelete={() => handleDelete(photo.id)}
                isProcessing={isProcessing}
              />
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500">
              No hay fotos para esta sucursal. ¡Sube la primera!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchPhotosManager;
