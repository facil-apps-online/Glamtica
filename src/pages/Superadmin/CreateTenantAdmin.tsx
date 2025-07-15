import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function CreateTenantAdmin() {
  const { tenantId } = useParams();

  useEffect(() => {
    console.log("CreateTenantAdmin: Rendered. Tenant ID:", tenantId);
  }, [tenantId]);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Crear Administrador para Tenant: {tenantId}</h1>
      <p>Contenido de la página para crear un administrador de tenant.</p>
    </div>
  );
}
