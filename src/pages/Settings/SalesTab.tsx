import React from 'react';
import { PaymentMethodsCRUD } from './PaymentMethodsCRUD';
import { useAuth } from '@/contexts/AuthContext';
import SalesSettings from './SalesSettings'; // Importar el nuevo componente

export const SalesTab = () => {
  const { currentAssignment } = useAuth();

  if (!currentAssignment) {
    return <div className="p-4 text-center">Cargando...</div>;
  }

  return (
    <div className="mt-4 space-y-8">
      {/* Componente para la nueva configuración de ventas */}
      <SalesSettings tenantId={currentAssignment.tenant_id} />

      {/* Sección existente de métodos de pago */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Métodos de Pago</h3>
        <PaymentMethodsCRUD tenantId={currentAssignment.tenant_id} />
      </div>
    </div>
  );
};