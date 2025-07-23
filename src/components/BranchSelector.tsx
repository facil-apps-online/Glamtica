import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches } from '@/hooks/useBranches';
import { useBranchFilterStore } from '@/stores/branchFilterStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from './ui/skeleton';

export const BranchSelector: React.FC = () => {
  const { currentAssignment } = useAuth();
  const { data: branches, isLoading } = useBranches(currentAssignment?.tenant_id || '');
  const { selectedBranchId, setBranchId } = useBranchFilterStore();

  if (isLoading) {
    return <Skeleton className="h-10 w-48" />;
  }

  return (
    <Select
      value={selectedBranchId}
      onValueChange={(value) => setBranchId(value)}
    >
      <SelectTrigger className="w-full md:w-48">
        <SelectValue placeholder="Seleccionar sucursal..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas las Sucursales</SelectItem>
        {branches?.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
