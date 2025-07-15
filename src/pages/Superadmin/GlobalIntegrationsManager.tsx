import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // Importar useAuth

// Definir el ID global para el superadministrador (debe coincidir con useTenantIntegrations)
const SUPERADMIN_GLOBAL_TENANT_ID = '00000000-0000-0000-0000-000000000000';

// Hook para obtener la URL de autorización de Google para el superadministrador
const useGoogleAuthUrlForSuperadmin = () => {
  return useQuery({
    queryKey: ['googleAuthUrlSuperadmin', SUPERADMIN_GLOBAL_TENANT_ID],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_google_auth_url', { p_tenant_id: SUPERADMIN_GLOBAL_TENANT_ID });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: false,
    retry: false,
  });
};

export const GlobalIntegrationsManager = () => {
  const { refetch: getAuthUrl, isFetching } = useGoogleAuthUrlForSuperadmin();
  const { toast } = useToast();
  const { user, integrations, updateIntegrations } = useAuth(); // Obtener user, integrations y updateIntegrations del AuthContext

  // Obtener la integración de Google Drive del AuthContext
  const googleDriveIntegration = integrations?.find(integration => integration.provider === 'google_drive' && integration.tenant_id === SUPERADMIN_GLOBAL_TENANT_ID);

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
        <CardTitle>Integración de Almacenamiento Global (Superadmin)</CardTitle>
        <CardDescription>Conecta una cuenta de Google Drive para almacenar los archivos globales del sistema (ej. avatares de superadmin).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4">
          <div className="flex items-center gap-4">
            <img src="https://www.google.com/drive/static/images/drive/logo-drive.png" alt="Google Drive Logo" className="h-8 w-8" />
            <span className="font-semibold">Google Drive</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {user && user.role === 'super_admin' ? (
              isConnected ? (
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
              )
            ) : (
              <div className="text-sm text-muted-foreground">Solo el superadministrador puede gestionar esta integración.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};