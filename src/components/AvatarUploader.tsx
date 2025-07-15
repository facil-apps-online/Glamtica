import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useUpdateProfile } from '@/hooks/useProfileSettings';
import { ImageCropDialog } from '@/components/ImageCropDialog';
import { useGoogleDriveImage } from '@/hooks/useGoogleDriveImage';

interface AvatarUploaderProps {
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarUploader = React.memo(({
  size = 'md'
}: AvatarUploaderProps) => {
  const avatarSizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-20 w-20',
    lg: 'h-32 w-32',
  };
  const currentAvatarSizeClass = avatarSizeClasses[size];
  const { user, integrations } = useAuth();
  const { toast } = useToast();
  const updateProfileMutation = useUpdateProfile();
  const [uploading, setUploading] = useState(false);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isCropDialogOpen, setCropDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (croppedPreviewUrl) {
        URL.revokeObjectURL(croppedPreviewUrl);
      }
    };
  }, [croppedPreviewUrl]);

  const googleDriveIntegration = integrations?.find(integration => integration.provider === 'google_drive');

  const { displayUrl: userAvatarDisplayUrl } = useGoogleDriveImage(user?.avatarUrl);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setCropDialogOpen(true);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    setCroppedImage(croppedBlob);
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    setCroppedPreviewUrl(URL.createObjectURL(croppedBlob));
  };

  const readFileAsBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (base64data) {
          resolve(base64data);
        } else {
          reject(new Error('Failed to convert blob to base64.'));
        }
      };
      reader.onerror = (error) => {
        reject(new Error(`Blob reading error: ${error}`));
      };
    });
  };

  const handleUpload = async () => {
    if (!croppedImage) {
      toast({ title: 'Error', description: 'No hay ninguna imagen recortada para subir.', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Error', description: 'Usuario no autenticado.', variant: 'destructive' });
      return;
    }
    if (!googleDriveIntegration) {
      toast({ title: 'Error', description: 'La integración con Google Drive no está configurada.', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      const fileName = `avatar_${user.id}.png`;
      const base64data = await readFileAsBase64(croppedImage);

      const { data, error: uploadError } = await supabase.functions.invoke(
        'google-drive-upload-avatar',
        {
          body: {
            tenantId: googleDriveIntegration.tenant_id,
            userId: user.id,
            fileName: fileName,
            fileBase64: base64data,
            mimeType: 'image/png',
          },
        }
      );

      if (uploadError) throw uploadError;
      if (!data.success) throw new Error(data.error || 'Google Drive upload failed.');

      updateProfileMutation.mutate(
        {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          avatarUrl: data.avatarUrl,
        },
        {
          onSuccess: () => {
            toast({ title: 'Éxito', description: 'Avatar actualizado en Google Drive.' });
            if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
            setCroppedPreviewUrl(null);
            setCroppedImage(null);
          },
          onError: (e: any) => {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
          },
        }
      );

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (croppedPreviewUrl) {
      URL.revokeObjectURL(croppedPreviewUrl);
    }
    setCroppedPreviewUrl(null);
    setCroppedImage(null);
  };

  const getInitials = () => {
    if (user?.firstName) {
      return `${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}`.toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || '?';
  };

  return (
    <>
      <div className="flex items-center gap-6 flex-col md:flex-row">
        <Avatar className={currentAvatarSizeClass}>
          <AvatarImage
            src={croppedPreviewUrl || userAvatarDisplayUrl}
            alt="Avatar"
            onLoad={(e) => {
              if (croppedPreviewUrl && e.currentTarget.src === croppedPreviewUrl) {
                URL.revokeObjectURL(croppedPreviewUrl);
              }
            }}
          />
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
        <div className="space-y-2 flex flex-col items-center md:items-start">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg"
            className="hidden"
            onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            Cambiar Avatar
          </Button>
          {croppedPreviewUrl && (
            <div className="flex gap-2">
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button variant="ghost" onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>

      <ImageCropDialog
        isOpen={isCropDialogOpen}
        onClose={() => setCropDialogOpen(false)}
        imageSrc={sourceImage}
        onCropComplete={handleCropComplete}
      />
    </>
  );
});