import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccessManagementPage() {
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestión de Accesos</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Roles Especiales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta sección está en desarrollo.
          </p>
          <p className="mt-4">
            Aquí se gestionarán los accesos para los roles de `investor` y `app_super_admin`.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
