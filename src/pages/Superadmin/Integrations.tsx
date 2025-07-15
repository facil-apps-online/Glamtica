import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

// Hook para obtener el estado de la integración
const useIntegrationStatus = (provider: 'google' | 'microsoft') => {
  // Esta lógica se implementará más adelante
  const isConnected = false;
  const accountEmail = null;
  return { isConnected, accountEmail };
};

// Hook para obtener la URL de autorización de Google
const useGoogleAuthUrl = () => {
  return useQuery({
    queryKey: ['googleAuthUrl'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_google_auth_url');
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: false, // Solo se ejecuta cuando lo llamamos manualmente
    retry: false,
  });
};

const IntegrationCard = ({ providerName, providerId, logoUrl }) => {
  const { isConnected, accountEmail } = useIntegrationStatus(providerId);
  const { refetch: getAuthUrl, isFetching } = useGoogleAuthUrl();
  const { toast } = useToast();

  const handleConnect = async () => {
    if (providerId !== 'google') {
      alert('Esta integración no está disponible todavía.');
      return;
    }

    try {
      const { data, error } = await getAuthUrl();
      if (error || !data.success) {
        throw new Error(error?.message || 'No se pudo obtener la URL de autorización.');
      }
      // Redirigir al usuario a la página de consentimiento de Google
      window.location.href = data.url;
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={logoUrl} alt={`${providerName} Logo`} className="h-10 w-10" />
          <div>
            <CardTitle>{providerName}</CardTitle>
            <CardDescription>Almacena las imágenes de la aplicación en tu propia cuenta.</CardDescription>
          </div>
        </div>
        {isConnected ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Conectado</span>
          </div>
        ) : (
          <Button onClick={handleConnect} disabled={isFetching}>
            {isFetching ? 'Generando...' : 'Conectar'}
          </Button>
        )}
      </CardHeader>
      {isConnected && (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Conectado como: <span className="font-semibold text-foreground">{accountEmail}</span>
          </p>
          <Button variant="link" className="p-0 h-auto text-red-600 hover:text-red-700 mt-2">
            Desconectar
          </Button>
        </CardContent>
      )}
    </Card>
  );
};

export default function IntegrationsPage() {
  return (
    <div className="w-full py-4 md:p-6 space-y-6">
      <div className="px-4 md:px-0">
        <h1 className="text-2xl md:text-3xl font-bold">Integraciones de Almacenamiento</h1>
        <p className="text-muted-foreground mt-2">
          Conecta tus cuentas de almacenamiento en la nube para guardar las imágenes y archivos de tus tenants.
        </p>
      </div>

      <div className="px-4 md:px-0 space-y-4">
        <IntegrationCard 
          providerName="Google Drive"
          providerId="google"
          logoUrl="https://www.google.com/drive/static/images/drive/logo-drive.png" 
        />
        <IntegrationCard 
          providerName="Microsoft OneDrive"
          providerId="microsoft"
          logoUrl="https://img.icons8.com/color/48/000000/onedrive.png"
        />
      </div>
    </div>
  );
}
