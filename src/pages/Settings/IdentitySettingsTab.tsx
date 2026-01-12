import React, { useState, useEffect, useRef } from 'react';
import { useTenantSettingsData } from '@/hooks/useTenantSettingsData';
import { LogoUploader } from '@/components/LogoUploader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Palette } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { TenantSlugForm } from '@/components/TenantSlugForm';
import { SocialNetworkManager } from '@/components/SocialNetworkManager';
import { GenericRichTextEditor } from '@/components/ui/GenericRichTextEditor';
import { Button } from '@/components/ui/button';
import { useUpdateTenantDescription } from '@/hooks/useTenantDescription';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';

const IdentitySkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-7 w-1/3" />
      <Skeleton className="h-4 w-2/3 mt-1" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
      <div className="space-y-2 mt-6">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
    </CardContent>
  </Card>
);

export function IdentitySettingsTab() {
  const { tenantId } = useAuth();
  const { data: settingsData, isLoading } = useTenantSettingsData(tenantId || '');
  const queryClient = useQueryClient();
  const { mutateAsync: updateTenantDescription, isPending: isUpdating } = useUpdateTenantDescription();
  const [description, setDescription] = useState('');
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    if (settingsData?.tenant?.description) {
      setDescription(settingsData.tenant.description);
    }
  }, [settingsData]);

  const handleSaveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['tenantSettingsData', tenantId] });
  };

  const handleSaveDescription = async () => {
    try {
      await updateTenantDescription({ description });
      toast.success('Descripción guardada con éxito.');
      handleSaveSuccess();
    } catch (error) {
      toast.error('Error al guardar la descripción.');
      console.error(error);
    }
  };

  if (isLoading) {
    return <IdentitySkeleton />;
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Palette className="h-5 w-5" />
            Identidad Visual
          </CardTitle>
          <CardDescription>
            Gestiona el logo de tu marca para que aparezca en tus recibos, encuestas y micrositio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogoUploader 
            initialLogoUrl={settingsData?.tenant?.logo_url}
            onSaveSuccess={handleSaveSuccess}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Descripción del Negocio</CardTitle>
          <CardDescription>
            Esta descripción aparecerá en tu micrositio. Habla sobre tu negocio, tu estilo y lo que te hace único.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GenericRichTextEditor
            ref={quillRef}
            value={description}
            onChange={setDescription}
            placeholder="Describe tu estudio aquí..."
          />
          <Button onClick={handleSaveDescription} disabled={isUpdating} className="mt-4">
            {isUpdating ? 'Guardando...' : 'Guardar Descripción'}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Redes Sociales</CardTitle>
          <CardDescription>
            Añade y gestiona los enlaces a las redes sociales de tu negocio para que aparezcan en tu micrositio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SocialNetworkManager tenantId={tenantId} />
        </CardContent>
      </Card>
      
      <TenantSlugForm 
        tenant={settingsData?.tenant || null} 
        countries={settingsData?.countries || []} 
      />
    </div>
  );
}
