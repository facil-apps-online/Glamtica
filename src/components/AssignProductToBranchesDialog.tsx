import React, { useState, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useBranches } from "@/hooks/useBranches";
import { useAssignProductToBranch, MasterProduct, useProductBranchPrices } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

interface AssignProductToBranchesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: MasterProduct;
  onSuccess: () => void;
}

const AssignProductToBranchesDialog: React.FC<AssignProductToBranchesDialogProps> = ({
  isOpen,
  onOpenChange,
  product,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { data: allBranches, isLoading: isLoadingBranches } = useBranches();
  const { data: assignedBranchesData, isLoading: isLoadingAssignedBranches } = useProductBranchPrices(product.id);
  const { mutate: assignProduct, isPending: isAssigning } = useAssignProductToBranch();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

  const assignedBranchIds = useMemo(() => {
    return new Set(assignedBranchesData?.map(bp => bp.branch_id));
  }, [assignedBranchesData]);

  const availableBranches = useMemo(() => {
    if (!allBranches) return [];
    return allBranches.filter(branch => !assignedBranchIds.has(branch.id));
  }, [allBranches, assignedBranchIds]);

  const filteredBranches = useMemo(() => {
    return availableBranches.filter(branch =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableBranches, searchTerm]);

  const handleSelectBranch = (branchId: string, isChecked: boolean) => {
    setSelectedBranchIds(prev => 
      isChecked ? [...prev, branchId] : prev.filter(id => id !== branchId)
    );
  };

  const handleSubmit = () => {
    if (selectedBranchIds.length === 0) {
      toast({ title: "Advertencia", description: "Selecciona al menos una sucursal para asignar.", variant: "warning" });
      return;
    }

    const assignmentPayload = {
      product_id: product.id,
      branch_ids: selectedBranchIds,
      defaults: {
        selling_price: 0, // Default to 0 as per requirement
        stock_quantity: 0, // Default to 0 as per requirement
        is_active: true,
      },
    };

    assignProduct(assignmentPayload, {
      onSuccess: () => {
        toast({ title: "Producto Asignado", description: `El producto '${product.name}' ha sido asignado a las sucursales seleccionadas.`, variant: "success" });
        onSuccess();
        onOpenChange(false);
      },
      onError: (error) => {
        toast({ title: "Error de Asignación", description: error.message, variant: "destructive" });
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar "{product.name}" a Sucursales</DialogTitle>
          <DialogDescription>
            Selecciona las sucursales a las que deseas asignar este producto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar sucursal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          {(isLoadingBranches || isLoadingAssignedBranches) ? (
            <div className="text-center">Cargando sucursales...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Seleccionar</TableHead>
                  <TableHead>Nombre de Sucursal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No se encontraron sucursales disponibles para asignar.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBranches.map(branch => (
                    <TableRow key={branch.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedBranchIds.includes(branch.id)}
                          onCheckedChange={(checked) => handleSelectBranch(branch.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{branch.name}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isAssigning || selectedBranchIds.length === 0}>
            {isAssigning ? "Asignando..." : "Asignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignProductToBranchesDialog;
