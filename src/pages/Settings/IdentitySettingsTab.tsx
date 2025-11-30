import React from 'react';
import { useTenantSettingsData } from '@/hooks/useTenantSettingsData';
import { LogoUploader } from '@/components/LogoUploader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Palette } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { TenantSlugForm } from '@/components/TenantSlugForm';

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

  const handleSaveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['tenantSettingsData', tenantId] });
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
      
      <TenantSlugForm 
        tenant={settingsData?.tenant || null} 
        countries={settingsData?.countries || []} 
      />
    </div>
  );
}
