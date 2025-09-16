import React from 'react';
import { PaymentMethodsCRUD } from './PaymentMethodsCRUD';
import { useAuth } from '@/contexts/AuthContext';

export const SalesTab = () => {
  const { currentAssignment } = useAuth();

  if (!currentAssignment) {
    return <div className="p-4 text-center">Cargando...</div>;
  }

  return (
    <div className="mt-4">
      {/* Pasamos el tenantId como prop */}
      <PaymentMethodsCRUD tenantId={currentAssignment.tenant_id} />
    </div>
  );
};