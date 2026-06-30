import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useGoogleDriveImage } from '@/hooks/useGoogleDriveImage';
import { Card } from '@/components/ui/card';
import { ImageIcon, Upload, X } from 'lucide-react';
import { useUpdateTenantSettings } from '@/hooks/useTenantSettings';

interface LogoUploaderProps {
  initialLogoUrl?: string | null;
  onSaveSuccess: () => void;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({ initialLogoUrl, onSaveSuccess }) => {

  const { tenant } = useAuth();

  const { toast } = useToast();

  const [isUploading, setIsUploading] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);



  const { displayUrl: currentLogoUrl, isLoading: isLogoLoading } = useGoogleDriveImage(initialLogoUrl);

  

  const { mutate: updateSettings } = useUpdateTenantSettings();



  useEffect(() => {

    if (selectedFile) {

      const objectUrl = URL.createObjectURL(selectedFile);

      setPreviewUrl(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);

    }

    setPreviewUrl(null);

  }, [selectedFile]);



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    if (e.target.files?.[0]) {

      setSelectedFile(e.target.files[0]);

    }

  };



  const readFileAsBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onloadend = () => resolve(reader.result?.toString().split(',')[1] || '');

    reader.onerror = (error) => reject(error);

  });



  const handleSave = async () => {

    if (!selectedFile || !tenant) return;



    setIsUploading(true);

    try {

      const base64data = await readFileAsBase64(selectedFile);

      const fileName = `tenant_logo_${tenant.id}.${selectedFile.name.split('.').pop()}`;

      

      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('google-drive-upload', {

        body: {

          tenantId: tenant.id,

          fileName: fileName,

          fileBase64: base64data,

          mimeType: selectedFile.type,

          uploadContext: 'TenantLogo',

          contextId: tenant.id

        }

      });



      if (uploadError || !uploadData.success) {

        throw new Error(uploadError?.message || uploadData.error || 'Error al subir el logo.');

      }



      // The deletion logic is now inside the google-drive-upload function's response handling

      if (uploadData.oldFileId) {
        const { error: deleteError } = await supabase.functions.invoke('google-drive-delete', {

          body: { 

            fileId: uploadData.oldFileId, 

            tenantId: tenant.id,

          }

        });

        if (deleteError) {

          console.error('Error deleting old logo from Google Drive:', deleteError.message);

        }

      }



      toast({ title: 'Éxito', description: 'Logo actualizado correctamente.', variant: 'success' });

      setSelectedFile(null);

      onSaveSuccess();



    } catch (error: any) {

      toast({ title: 'Error', description: error.message, variant: 'destructive' });

    } finally {

      setIsUploading(false);

    }

  };



  const finalImageUrl = previewUrl || currentLogoUrl;



  return (

    <Card className="p-4 space-y-4">

      <div className="w-48 h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 mx-auto">

        {isLogoLoading ? (

          <p>Cargando...</p>

        ) : finalImageUrl ? (

          <img src={finalImageUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />

        ) : (

          <div className="text-center text-muted-foreground">

            <ImageIcon className="mx-auto h-10 w-10" />

            <p className="text-sm mt-2">Logo del Salón</p>

          </div>

        )}

      </div>

      

      <input 

        type="file" 

        ref={fileInputRef} 

        onChange={handleFileChange} 

        accept="image/png, image/jpeg, image/svg+xml" 

        className="hidden" 

        onClick={(e) => { (e.target as HTMLInputElement).value = '' }}

      />



      <div className="flex justify-center gap-2">

        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>

          Cambiar Logo

        </Button>

        {selectedFile && (

          <>

            <Button type="button" onClick={handleSave} disabled={isUploading}>

              <Upload className="mr-2 h-4 w-4" />

              {isUploading ? 'Guardando...' : 'Guardar'}

            </Button>

            <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedFile(null)} disabled={isUploading}>

              <X className="h-4 w-4" />

            </Button>

          </>

        )}

      </div>

    </Card>

  );

};
