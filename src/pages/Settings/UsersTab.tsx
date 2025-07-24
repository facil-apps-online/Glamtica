import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { TenantUsersManager } from '@/pages/Superadmin/TenantUsersManager';

export function UsersTab() {
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;

  if (!tenantId) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-primary">Gestionar Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No se pudo identificar al tenant actual.</p>
        </CardContent>
      </Card>
    );
  }

  return <TenantUsersManager tenantId={tenantId} />;
}
