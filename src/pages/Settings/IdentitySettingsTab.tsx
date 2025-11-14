import React from 'react';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { LogoUploader } from '@/components/LogoUploader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Palette } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

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
    </CardContent>
  </Card>
);

export function IdentitySettingsTab() {
  const { tenantId, refreshUser } = useAuth();
  const { data: settings, isLoading } = useTenantSettings();
  const queryClient = useQueryClient();

  const handleSaveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['tenant_settings', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
  };

  if (isLoading) {
    return <IdentitySkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Palette className="h-5 w-5" />
          Identidad Visual
        </CardTitle>
        <CardDescription>
          Gestiona el logo de tu marca. Este logo aparecerá en diferentes partes de la aplicación.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LogoUploader 
          initialLogoUrl={settings?.logo_url}
          onSaveSuccess={handleSaveSuccess}
        />
      </CardContent>
    </Card>
  );
}
