import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Power, PowerOff, Mail, FolderKanban, Send } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useTenantIntegrations, useDeleteIntegration } from '@/hooks/useTenantIntegrations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Provider = 'google_drive' | 'google_gmail';

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

const IntegrationCard = ({ title, icon, isConnected, accountEmail, onConnect, onDisconnect, isConnecting, isDisconnecting, onTest, isTesting }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4">
      <div className="flex items-center gap-4">
        {icon}
        <span className="font-semibold">{title}</span>
      </div>
      
      {isConnected ? (
        <div className="flex flex-col items-start sm:items-end gap-3">
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-muted-foreground">Conectado como:</span>
              <span className="font-bold text-foreground break-all">{accountEmail}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onTest && (
              <Button onClick={onTest} variant="secondary" size="sm" disabled={isTesting}>
                <Send className="mr-2 h-4 w-4" />
                {isTesting ? 'Encolando...' : 'Enviar Prueba'}
              </Button>
            )}
            <Button onClick={onDisconnect} variant="destructive" size="sm" disabled={isDisconnecting}>
              <PowerOff className="mr-2 h-4 w-4" />
              {isDisconnecting ? 'Desconectando...' : 'Desconectar'}
            </Button>
          </div>
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

const formatProviderName = (provider: Provider | string | null): string => {
  if (!provider) return '';
  if (provider === 'google_drive') return 'Google Drive';
  if (provider === 'google_gmail') return 'Gmail';
  return provider;
};

export const TenantIntegrationManager = ({ tenantId }: { tenantId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: integrations, isLoading, isError, error } = useTenantIntegrations(tenantId);
  const disconnectMutation = useDeleteIntegration();

  const [disconnectAlert, setDisconnectAlert] = useState<{
    isOpen: boolean;
    provider: Provider | null;
    accountEmail: string | null;
  }>({ isOpen: false, provider: null, accountEmail: null });

  const [connectingProvider, setConnectingProvider] = useState<Provider | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const { refetch: getDriveAuthUrl, isFetching: isFetchingDriveUrl } = useGoogleAuthUrl(tenantId, 'get_google_auth_url');
  const { refetch: getGmailAuthUrl, isFetching: isFetchingGmailUrl } = useGoogleAuthUrl(tenantId, 'get_gmail_auth_url');

  const googleDriveIntegration = integrations?.find(int => int.provider === 'google_drive');
  const gmailIntegration = integrations?.find(int => int.provider === 'google_gmail');

  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const { type, success, error } = event.data;
      if (type === 'google-auth-callback') {
        const providerName = formatProviderName(connectingProvider);
        if (success) {
          toast({ title: 'Éxito', description: `La integración con ${providerName} se ha completado.` });
          queryClient.invalidateQueries({ queryKey: ['tenantIntegrations', tenantId] });
          queryClient.resetQueries({ queryKey: ['get_google_auth_url', tenantId] });
          queryClient.resetQueries({ queryKey: ['get_gmail_auth_url', tenantId] });
        } else {
          toast({ title: 'Error de Autenticación', description: `No se pudo completar la integración con ${providerName}: ${error || 'Error desconocido.'}`, variant: 'destructive' });
        }
        setConnectingProvider(null);
      }
    };
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [queryClient, tenantId, toast, connectingProvider]);

  const handleConnect = useCallback(async (getAuthUrl: () => Promise<any>, provider: Provider) => {
    setConnectingProvider(provider);
    try {
      const { data: rpcResponse, error: rpcError } = await getAuthUrl();
      if (rpcError) throw new Error(rpcError.message);
      
      const result = Array.isArray(rpcResponse) ? rpcResponse[0] : rpcResponse;

      if (!result || !result.success) {
        throw new Error(result?.message || 'No se pudo obtener la URL de autorización.');
      }
      if (!result.url) {
        throw new Error('La URL de autorización no fue devuelta por el servidor.');
      }
      
      const width = 600, height = 700, left = window.screen.width / 2 - width / 2, top = window.screen.height / 2 - height / 2;
      window.open(result.url, 'googleAuth', `width=${width},height=${height},top=${top},left=${left}`);
    } catch (e: any) {
      console.error('[handleConnect] Excepción capturada:', e);
      toast({ title: 'Error de Conexión', description: e.message, variant: 'destructive' });
      setConnectingProvider(null);
    }
  }, [toast]);

  const handleDisconnectRequest = (provider: Provider, accountEmail: string | undefined) => {
    if (!accountEmail) return;
    setDisconnectAlert({ isOpen: true, provider, accountEmail });
  };

  const confirmDisconnect = () => {
    if (!disconnectAlert.provider) return;
    const providerToDisconnect = disconnectAlert.provider;
    disconnectMutation.mutate(
      { tenantId, provider: providerToDisconnect },
      {
        onSuccess: () => {
          toast({ title: 'Éxito', description: `La integración con ${formatProviderName(providerToDisconnect)} ha sido desconectada.` });
          queryClient.invalidateQueries({ queryKey: ['tenantIntegrations', tenantId] });
        },
        onError: (e: any) => {
          toast({ title: 'Error', description: e.message, variant: 'destructive' });
        },
        onSettled: () => {
          setDisconnectAlert({ isOpen: false, provider: null, accountEmail: null });
          queryClient.resetQueries({ queryKey: ['get_google_auth_url', tenantId] });
          queryClient.resetQueries({ queryKey: ['get_gmail_auth_url', tenantId] });
        },
      }
    );
  };

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    try {
      // Paso 1: Encolar el trabajo y obtener el ID del nuevo job.
      const { data: jobData, error: rpcError } = await supabase.rpc('enqueue_test_email');

      if (rpcError) throw rpcError;
      if (!jobData.success) throw new Error(jobData.message);

      toast({
        title: "Correo Encolado",
        description: "El trabajo ha sido creado. Invocando al trabajador...",
      });

      // Paso 2: Invocar a la Edge Function, pasándole el job recién creado.
      // La Edge Function espera un 'record', así que simulamos ese formato.
      const { error: functionError } = await supabase.functions.invoke('process-email-queue', {
        body: { record: jobData.job },
      });

      if (functionError) throw functionError;

      toast({
        title: "Trabajador Invocado",
        description: "El proceso de envío ha comenzado en segundo plano.",
      });

    } catch (error: any) {
      console.error("Error en el proceso de envío de prueba:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo completar el proceso de envío.",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) return <div className="p-4">Cargando integraciones...</div>;
  if (isError) return <div className="p-4 text-red-500">Error al cargar integraciones: {error?.message}</div>;

  return (
    <>
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
            onConnect={() => handleConnect(getDriveAuthUrl, 'google_drive')}
            onDisconnect={() => handleDisconnectRequest('google_drive', googleDriveIntegration?.account_email)}
            isConnecting={isFetchingDriveUrl}
            isDisconnecting={disconnectMutation.isPending && disconnectMutation.variables?.provider === 'google_drive'}
          />
          <IntegrationCard
            title="Gmail"
            icon={<Mail className="h-8 w-8 text-red-500" />}
            isConnected={!!gmailIntegration}
            accountEmail={gmailIntegration?.account_email}
            onConnect={() => handleConnect(getGmailAuthUrl, 'google_gmail')}
            onDisconnect={() => handleDisconnectRequest('google_gmail', gmailIntegration?.account_email)}
            isConnecting={isFetchingGmailUrl}
            isDisconnecting={disconnectMutation.isPending && disconnectMutation.variables?.provider === 'google_gmail'}
            onTest={handleSendTestEmail}
            isTesting={isSendingTest}
          />
        </CardContent>
      </Card>

      <AlertDialog open={disconnectAlert.isOpen} onOpenChange={(isOpen) => setDisconnectAlert({ ...disconnectAlert, isOpen })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desconectará la integración con <strong>{formatProviderName(disconnectAlert.provider)}</strong> para la cuenta <strong>{disconnectAlert.accountEmail}</strong>. 
              No podrás utilizar las funcionalidades asociadas hasta que vuelvas a conectarla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDisconnectAlert({ isOpen: false, provider: null, accountEmail: null })}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisconnect} disabled={disconnectMutation.isPending}>
              {disconnectMutation.isPending ? 'Desconectando...' : 'Sí, desconectar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
