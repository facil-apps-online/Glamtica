import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // Importar useAuth
import { useTenantIntegrations } from '@/hooks/useTenantIntegrations';

// Hook para obtener la URL de autorización de Google
const useGoogleAuthUrl = (tenantId: string) => {
  return useQuery({
    queryKey: ['googleAuthUrl', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase.rpc('get_google_auth_url', { p_tenant_id: tenantId });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: false,
    retry: false,
  });
};

export const TenantIntegrationManager = ({ tenantId }) => {
  const { refetch: getAuthUrl, isFetching } = useGoogleAuthUrl(tenantId);
  const { toast } = useToast();
  const { user, updateIntegrations } = useAuth(); // Obtener user y updateIntegrations del AuthContext
  const { data: tenantIntegrations, isLoading: isLoadingIntegrations, isError: isErrorIntegrations, error: errorIntegrations } = useTenantIntegrations(tenantId);

  // Obtener la integración de Google Drive de las integraciones específicas del tenant
  const googleDriveIntegration = tenantIntegrations?.find(integration => integration.provider === 'google_drive');

  const isConnected = !!googleDriveIntegration; // Si hay datos de integración, está conectado
  const accountEmail = googleDriveIntegration?.account_email || null;

  const handleConnect = async () => {
    try {
      const { data, error } = await getAuthUrl();
      if (error || !data.success) {
        throw new Error(error?.message || 'No se pudo obtener la URL de autorización.');
      }
      window.location.href = data.url;
      // Después de la redirección exitosa, actualizar las integraciones en el contexto
      // Esto se ejecutará cuando el usuario regrese de la autenticación de Google
      if (user) {
        await updateIntegrations(user.tenant_id, user.role);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integraciones de Almacenamiento</CardTitle>
        <CardDescription>Conecta una cuenta de Google Drive para almacenar los archivos de este tenant.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4">
          <div className="flex items-center gap-4">
            <img src="https://www.google.com/drive/static/images/drive/logo-drive.png" alt="Google Drive Logo" className="h-8 w-8" />
            <span className="font-semibold">Google Drive</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="text-sm text-muted-foreground">
                  Conectado como: <span className="font-bold text-foreground">{accountEmail}</span>
                </div>
              </div>
            ) : (
              <Button onClick={handleConnect} disabled={isFetching} className="w-full sm:w-auto">
                {isFetching ? 'Generando...' : 'Conectar'}
              </Button>
            )}
          </div>
        </div>

        {isLoadingIntegrations && <div className="p-4">Cargando otras integraciones...</div>}
        {isErrorIntegrations && <div className="p-4 text-red-500">Error al cargar otras integraciones: {errorIntegrations?.message}</div>}

        {tenantIntegrations && tenantIntegrations.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Otras Integraciones Vigentes</h3>
            {tenantIntegrations.map((integration) => (
              <div key={integration.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 gap-4">
                <div className="flex items-center gap-4">
                  {integration.provider === 'google_drive' ? (
                    <img src="https://www.google.com/drive/static/images/drive/logo-drive.png" alt="Google Drive Logo" className="h-6 w-6" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-gray-500" /> // Icono genérico para otros proveedores
                  )}
                  <span className="font-semibold capitalize">{integration.provider.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="text-sm text-muted-foreground">
                    Conectado como: <span className="font-bold text-foreground">{integration.account_email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tenantIntegrations && tenantIntegrations.length === 0 && !isLoadingIntegrations && !isErrorIntegrations && (
          <div className="mt-6 p-4 text-center text-muted-foreground border rounded-lg">
            No hay otras integraciones de almacenamiento vigentes para este tenant.
          </div>
        )}

      </CardContent>
    </Card>
  );
};
