import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

interface CompressionSettings {
  maxSizeMB: number;
  maxWidthOrHeight: number;
}

interface ImageSettings {
  catalogo: CompressionSettings;
  evidencias: CompressionSettings;
  firmas: CompressionSettings;
}

const ImageSettingsSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3 mt-2" />
    </CardHeader>
    <CardContent className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2 border-t pt-4">
          <Skeleton className="h-5 w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-24" />
      </div>
    </CardContent>
  </Card>
);

export function ImageSettingsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenantId, currentAssignment } = useAuth(); // Use useAuth to get tenantId and platformId
  const platformId = currentAssignment?.platform_id;


  const [settings, setSettings] = useState<ImageSettings | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tenant-settings-images', tenantId, platformId],
    queryFn: async () => {
      if (!tenantId || !platformId) {
        throw new Error('Tenant ID or Platform ID not available.');
      }
      const { data, error } = await supabase.functions.invoke('tenant-actions', {
        body: { 
          action: 'get_tenant_settings', 
          payload: { tenantId: tenantId, platformId: platformId } // Pass explicitly
        },
      });
      if (error) throw error;
      return data.settings_data.image_compression_settings as ImageSettings;
    },
    enabled: !!tenantId && !!platformId, // Only enable query if these are available
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: ImageSettings) => {
      if (!tenantId || !platformId) {
        throw new Error('Tenant ID or Platform ID not available.');
      }
      return supabase.functions.invoke('tenant-actions', {
        body: {
          action: 'update_image_compression_settings',
          payload: { 
            tenantId: tenantId, // Pass explicitly
            platformId: platformId, // Pass explicitly
            newImageSettings: newSettings 
          }
        }
      });
    },
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: 'La configuración de imágenes ha sido guardada.',
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['tenant-settings-images', tenantId, platformId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `No se pudo guardar la configuración: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (category: keyof ImageSettings, field: keyof CompressionSettings, value: string) => {
    if (!settings) return;
    const numericValue = parseFloat(value) || 0;
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [field]: numericValue,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (settings) {
      updateSettingsMutation.mutate(settings);
    }
  };

  if (isLoading) {
    return <ImageSettingsSkeleton />;
  }

  if (isError || !settings) {
    return <p className="text-red-500">Error al cargar la configuración de imágenes.</p>;
  }

  const categories: { key: keyof ImageSettings; label: string; description: string }[] = [
    { key: 'catalogo', label: 'Imágenes de Catálogo', description: 'Productos, servicios, combos y tratamientos.' },
    { key: 'evidencias', label: 'Imágenes de Evidencias', description: 'Fotos de resultados de atenciones y comprobantes de pago.' },
    { key: 'firmas', label: 'Imágenes de Firmas', description: 'Firmas de consentimientos informados y liquidación de comisiones.' },
  ];

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Compresión de Imágenes</CardTitle>
          <CardDescription>
            Define la calidad y el tamaño de las imágenes según su tipo. Esto afecta la velocidad de subida y el uso de almacenamiento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map(({ key, label, description }) => (
            <div key={key} className="space-y-3 border-t pt-4">
              <div>
                <h3 className="text-md font-medium">{label}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor={`${key}-maxSizeMB`}>Tamaño Máximo (MB)</Label>
                  <Input
                    id={`${key}-maxSizeMB`}
                    type="number"
                    step="0.1"
                    value={settings[key]?.maxSizeMB || ''}
                    onChange={(e) => handleInputChange(key, 'maxSizeMB', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`${key}-maxWidthOrHeight`}>Ancho/Alto Máximo (px)</Label>
                  <Input
                    id={`${key}-maxWidthOrHeight`}
                    type="number"
                    step="10"
                    value={settings[key]?.maxWidthOrHeight || ''}
                    onChange={(e) => handleInputChange(key, 'maxWidthOrHeight', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
