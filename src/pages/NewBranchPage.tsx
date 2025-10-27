import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BranchForm } from '@/components/BranchForm';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantById } from '@/hooks/useTenants';
import { useCountries } from '@/hooks/useLocalization';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NewBranchPage() {
  const navigate = useNavigate();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const { data: tenant } = useTenantById(tenantId!);
  const { data: countries } = useCountries();

  if (!tenantId) {
    return <div className="p-4 mt-4">ID de Tenant no disponible.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-primary">Añadir Nueva Sucursal</h1>
      </div>
      <BranchForm
        onSuccess={() => navigate('/branches')}
        tenantId={tenantId}
      />
    </div>
  );
}