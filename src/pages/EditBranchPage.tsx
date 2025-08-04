import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BranchForm } from '@/components/BranchForm';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantById } from '@/hooks/useTenants';
import { useCountries } from '@/hooks/useLocalization';
import { useBranches } from '@/hooks/useBranches';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditBranchPage() {
  const navigate = useNavigate();
  const { branchId } = useParams<{ branchId: string }>();
  const { currentAssignment } = useAuth();
  const tenantId = currentAssignment?.tenant_id;
  const { data: tenant } = useTenantById(tenantId!);
  const { data: countries } = useCountries();
  const { data: branches, isLoading: isLoadingBranches } = useBranches(tenantId);

  const branchToEdit = branches?.find(b => b.id === branchId);
  const countryRestriction = countries?.find(c => c.id === tenant?.country_id)?.iso_code || '';

  if (!tenantId) {
    return <div className="p-4 mt-4">ID de Tenant no disponible.</div>;
  }

  if (isLoadingBranches) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!branchToEdit) {
    return <div className="p-4 mt-4">Sucursal no encontrada.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-primary">Editar Sucursal</h1>
      </div>
      <BranchForm
        branchToEdit={branchToEdit}
        onSuccess={() => navigate('/branches')}
        tenantId={tenantId}
        countryRestriction={countryRestriction}
      />
    </div>
  );
}