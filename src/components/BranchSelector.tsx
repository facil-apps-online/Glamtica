import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches } from '@/hooks/useBranches';
import { useBranchFilterStore } from '@/stores/branchFilterStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from './ui/skeleton';
import { Store } from 'lucide-react';

interface BranchSelectorProps {
  onSelectBranch?: (branchId: string) => void;
  selectedValue?: string;
  showInactive?: boolean;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({ onSelectBranch, selectedValue, showInactive = false }) => {
  const { currentAssignment, loading: authLoading } = useAuth();
  const { data: branches, isLoading } = useBranches(currentAssignment?.tenant_id || '', !showInactive);
  const { selectedBranchId: globalBranchId, setBranchId: setGlobalBranchId } = useBranchFilterStore();

  const isControlled = onSelectBranch !== undefined;

  const value = isControlled ? selectedValue : globalBranchId;
  const handleValueChange = isControlled ? onSelectBranch : setGlobalBranchId;

  if (authLoading || isLoading) {
    return <Skeleton className="h-10 w-48" />;
  }

  return (
    <Select
      value={value || ''}
      onValueChange={handleValueChange}
    >
      <SelectTrigger 
        className="w-10 h-10 p-0 sm:w-auto sm:px-3 flex items-center justify-center sm:justify-start max-w-[150px] sm:max-w-xs"
      >
        <Store className="h-4 w-4 sm:mr-2" />
        <div className="hidden sm:inline-block">
          <SelectValue placeholder="Seleccionar sucursal..." />
        </div>
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
