import { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBranches, Branch } from "@/hooks/useBranches";
import { Combo, useGetComboAssignments, useAssignComboToBranch, useUnassignComboFromBranch } from "@/hooks/useCombos";
import { Search, Edit } from 'lucide-react';
import { ComboBranchPriceDialog } from './ComboBranchPriceDialog';
import { Button } from './ui/button';

interface ComboBranchesTabProps {
  combo: Combo | null;
}

export const ComboBranchesTab = ({ combo }: ComboBranchesTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const { data: allBranches, isLoading: isLoadingBranches } = useBranches();
  const { data: assignments, isLoading: isLoadingAssignments } = useGetComboAssignments(combo?.id || "");

  const { mutate: assignCombo } = useAssignComboToBranch();
  const { mutate: unassignCombo } = useUnassignComboFromBranch();

  const assignedBranchIds = useMemo(() => {
    return new Set(assignments?.map(a => a.branch_id));
  }, [assignments]);

  const handleAssignmentChange = (branchId: string, isAssigned: boolean) => {
    if (!combo) return;

    if (isAssigned) {
      assignCombo({ combo_id: combo.id, branch_id: branchId, is_active: true });
    } else {
      unassignCombo({ combo_id: combo.id, branch_id: branchId });
    }
  };

  const handleOpenPriceDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsPriceDialogOpen(true);
  };

  const filteredBranches = useMemo(() => {
    if (!allBranches) return [];
    return allBranches.filter(branch => 
      branch.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allBranches, searchTerm]);

  const isLoading = isLoadingBranches || isLoadingAssignments;

  return (
    <>
      <div className="space-y-4">
        <div className="relative py-4">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar sucursal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          {isLoading ? (
            <div className="text-center">Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sucursal</TableHead>
                  <TableHead className="text-right">Asignado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.map(branch => {
                  const isAssigned = assignedBranchIds.has(branch.id);
                  return (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={isAssigned}
                          onCheckedChange={(isChecked) => handleAssignmentChange(branch.id, isChecked)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" disabled={!isAssigned} onClick={() => handleOpenPriceDialog(branch)}>
                          <Edit className="w-4 h-4 mr-2" /> Precios
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <ComboBranchPriceDialog 
        isOpen={isPriceDialogOpen}
        onOpenChange={setIsPriceDialogOpen}
        combo={combo}
        branch={selectedBranch}
      />
    </>
  );
};
