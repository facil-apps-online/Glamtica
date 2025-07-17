import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Power, PowerOff, Mail, FolderKanban } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useTenantIntegrations, useDeleteIntegration } from '@/hooks/useTenantIntegrations';

// Hook genérico para obtener URLs de autorización de Google
const useGoogleAuthUrl = (tenantId: string, rpcName: 'get_google_auth_url' | 'get_gmail_auth_url') => {
  return useQuery({
    queryKey: [rpcName, tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase.rpc(rpcName, { p_tenant_id: tenantId });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: false,
    retry: false,
  });
};

// Componente para una única integración
const IntegrationCard = ({ title, icon, isConnected, accountEmail, onConnect, onDisconnect, isConnecting, isDisconnecting }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4">
      <div className="flex items-center gap-4">
        {icon}
        <span className="font-semibold">{title}</span>
      </div>
      
      {isConnected ? (
        <div className="flex flex-col items-start sm:items-end gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Conectado como: <span className="font-bold text-foreground">{accountEmail}</span>
          </div>
          <Button onClick={onDisconnect} variant="destructive" size="sm" disabled={isDisconnecting}>
            <PowerOff className="mr-2 h-4 w-4" />
            {isDisconnecting ? 'Desconectando...' : 'Desconectar'}
          </Button>
        </div>
      ) : (
        <Button onClick={onConnect} disabled={isConnecting}>
          <Power className="mr-2 h-4 w-4" />
          {isConnecting ? 'Generando...' : `Conectar con ${title}`}
        </Button>
      )}
    </div>
  );
};

export const TenantIntegrationManager = ({ tenantId }: { tenantId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: integrations, isLoading, isError, error } = useTenantIntegrations(tenantId);
  const disconnectMutation = useDeleteIntegration();
  const popupWindow = useRef<Window | null>(null);

  const { refetch: getDriveAuthUrl, isFetching: isFetchingDriveUrl } = useGoogleAuthUrl(tenantId, 'get_google_auth_url');
  const { refetch: getGmailAuthUrl, isFetching: isFetchingGmailUrl } = useGoogleAuthUrl(tenantId, 'get_gmail_auth_url');

  const googleDriveIntegration = integrations?.find(int => int.provider === 'google_drive');
  const gmailIntegration = integrations?.find(int => int.provider === 'google_gmail');

  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      // Validar el origen del evento por seguridad
      if (event.origin !== window.location.origin) {
        return;
      }

      const { type, success, error } = event.data;

      if (type === 'google-auth-callback') {
        if (popupWindow.current) {
          popupWindow.current.close();
          popupWindow.current = null;
        }

        if (success) {
          toast({ title: 'Éxito', description: 'La integración con Google se ha completado.' });
          queryClient.invalidateQueries({ queryKey: ['tenantIntegrations', tenantId] });
        } else {
          toast({ title: 'Error de Autenticación', description: error || 'No se pudo completar la integración.', variant: 'destructive' });
        }
      }
    };

    window.addEventListener('message', handleAuthMessage);

    return () => {
      window.removeEventListener('message', handleAuthMessage);
      if (popupWindow.current && !popupWindow.current.closed) {
        popupWindow.current.close();
      }
    };
  }, [queryClient, tenantId, toast]);

  const handleConnect = async (getAuthUrl: () => Promise<any>) => {
    try {
      const { data: rpcResponse, error: rpcError } = await getAuthUrl();

      if (rpcError) throw new Error(rpcError.message);
      if (!rpcResponse || !Array.isArray(rpcResponse) || rpcResponse.length === 0) throw new Error('Respuesta inválida desde el servidor.');
      
      const result = rpcResponse[0];
      if (!result.success) throw new Error(result.message || 'No se pudo obtener la URL de autorización.');
      if (!result.url) throw new Error('La URL de autorización no fue devuelta por el servidor.');

      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      popupWindow.current = window.open(
        result.url,
        'googleAuth',
        `width=${width},height=${height},top=${top},left=${left}`
      );

    } catch (e: any) {
      console.error('[handleConnect] Excepción capturada:', e);
      toast({ title: 'Error de Conexión', description: e.message, variant: 'destructive' });
    }
  };

  const handleDisconnect = (provider: string, accountEmail: string | undefined) => {
    if (!accountEmail) return;

    const confirmation = window.confirm(
      `¿Estás seguro de que quieres desconectar la integración con ${provider} para la cuenta "${accountEmail}"?`
    );

    if (confirmation) {
      disconnectMutation.mutate(
        { tenantId, provider },
        {
          onSuccess: () => {
            toast({ title: 'Éxito', description: `La integración con ${provider} ha sido desconectada.` });
          },
          onError: (e: any) => {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
          },
        }
      );
    }
  };

  if (isLoading) return <div className="p-4">Cargando integraciones...</div>;
  if (isError) return <div className="p-4 text-red-500">Error al cargar integraciones: {error?.message}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integraciones de Google</CardTitle>
        <CardDescription>Conecta los servicios de Google para ampliar la funcionalidad de la plataforma.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <IntegrationCard
          title="Google Drive"
          icon={<FolderKanban className="h-8 w-8 text-blue-500" />}
          isConnected={!!googleDriveIntegration}
          accountEmail={googleDriveIntegration?.account_email}
          onConnect={() => handleConnect(getDriveAuthUrl)}
          onDisconnect={() => handleDisconnect('google_drive', googleDriveIntegration?.account_email)}
          isConnecting={isFetchingDriveUrl}
          isDisconnecting={disconnectMutation.isPending && disconnectMutation.variables?.provider === 'google_drive'}
        />
        <IntegrationCard
          title="Gmail"
          icon={<Mail className="h-8 w-8 text-red-500" />}
          isConnected={!!gmailIntegration}
          accountEmail={gmailIntegration?.account_email}
          onConnect={() => handleConnect(getGmailAuthUrl)}
          onDisconnect={() => handleDisconnect('google_gmail', gmailIntegration?.account_email)}
          isConnecting={isFetchingGmailUrl}
          isDisconnecting={disconnectMutation.isPending && disconnectMutation.variables?.provider === 'google_gmail'}
        />
      </CardContent>
    </Card>
  );
};
