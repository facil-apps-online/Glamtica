import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Función para llamar a la Edge Function que cifra los secretos
const encryptCredentials = async (credentials: Record<string, any>) => {
  const { data, error } = await supabase.functions.invoke('encrypt-secret', {
    body: { dataToEncrypt: JSON.stringify(credentials) },
  });

  if (error) {
    throw new Error(`Error al encriptar las credenciales: ${error.message}`);
  }
  return data;
};

// Función para llamar a la nueva RPC que guarda la integración
const saveTenantIntegrationRpc = async ({
  tenantId,
  providerSlug,
  encrypted_credentials,
  nonce,
  environment,
  userRole,
}: {
  tenantId: string;
  providerSlug: string;
  encrypted_credentials: string;
  nonce: string;
  environment: 'test' | 'production';
  userRole: string;
}) => {
  const { error } = await supabase.rpc('upsert_tenant_integration', {
    p_tenant_id: tenantId,
    p_provider_slug: providerSlug,
    p_encrypted_credentials: encrypted_credentials,
    p_nonce: nonce,
    p_environment: environment,
    p_user_role: userRole,
  });

  if (error) {
    throw new Error(`Error al guardar la integración: ${error.message}`);
  }
};

export const useSaveIntegration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentAssignment } = useAuth(); // Usar currentAssignment para obtener el rol

  return useMutation({
    mutationFn: async ({
      tenantId,
      provider,
      credentials,
      environment,
    }: {
      tenantId: string;
      provider: any;
      credentials: Record<string, any>;
      environment: 'test' | 'production';
    }) => {
      if (!currentAssignment?.role_name) {
        throw new Error('No se pudo determinar el rol del usuario desde la asignación actual.');
      }

      // 1. Encriptar las credenciales
      const { encryptedData, iv: nonce } = await encryptCredentials(credentials);

      // 2. Guardar en la base de datos a través de la RPC segura
      await saveTenantIntegrationRpc({
        tenantId,
        providerSlug: provider.slug,
        encrypted_credentials: encryptedData,
        nonce,
        environment,
        userRole: currentAssignment.role_name,
      });
    },
    onSuccess: (_, { provider, tenantId }) => {
      toast({
        title: 'Éxito',
        description: `La integración con ${provider.name} se ha guardado correctamente.`,
        variant: 'success',
      });
      // Invalidar la query para que la lista de integraciones se actualice
      queryClient.invalidateQueries(['tenantIntegrations', tenantId]);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
