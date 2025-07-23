import React from 'react';
import { useParams } from 'react-router-dom';

const CreateTenantAdmin: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();

  return (
    <div>
      <h1>Crear Administrador para Tenant: {tenantId}</h1>
      {/* Aquí irá el formulario */}
    </div>
  );
};

export default CreateTenantAdmin;
