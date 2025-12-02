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
import { useMasterCombos, useAssignComboToBranch, useBranchServicesAndCombos } from "@/hooks/useServices"; // Importar useMasterCombos y useAssignComboToBranch

import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
// No necesitamos MasterService, usaremos un tipo genérico o definiremos MasterCombo
// import { MasterService } from "@/types/services"; 

interface AddCombosToBranchDialogProps { // Cambiar nombre de la interfaz
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  branchId: string;
  onSuccess: () => void;
}

import { MasterCombo } from "@/types/combos";

const AddCombosToBranchDialog: React.FC<AddCombosToBranchDialogProps> = ({
  isOpen,
  onOpenChange,
  branchId,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { data: masterCombos, isLoading: isLoadingMasterCombos } = useMasterCombos(); // Usar useMasterCombos
  const { data: branchServicesAndCombos, isLoading: isLoadingBranchCombos } = useBranchServicesAndCombos(branchId); // Usar isLoadingBranchCombos
  const { mutate: assignCombo, isPending: isAssigning } = useAssignComboToBranch(); // Usar useAssignComboToBranch

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCombos, setSelectedCombos] = useState<{
    combo_id: string;
    selling_price: number;
  }>({});

  const availableCombos = useMemo(() => { // Cambiar nombre de la variable
    if (isLoadingMasterCombos || isLoadingBranchCombos) return [];
    const assignedComboIds = new Set(branchServicesAndCombos?.filter(item => item.type === 'combo').map(bs => bs.id)); // Filtrar por 'combo'
    return masterCombos?.filter(mc => !assignedComboIds.has(mc.id)); // Filtrar masterCombos
  }, [masterCombos, branchServicesAndCombos, isLoadingMasterCombos, isLoadingBranchCombos]); // Actualizar dependencias

  const filteredCombos = availableCombos?.filter(combo => // Cambiar nombre de la variable
    combo.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  const handleSelectCombo = (combo: MasterCombo, isChecked: boolean) => { // Cambiar nombre de la función y tipo
    setSelectedCombos(prev => {
      const newSelected = { ...prev };
      if (isChecked) {
        newSelected[combo.id] = {
          combo_id: combo.id,
          selling_price: combo.base_price || 0, // Usar base_price del combo maestro si existe
        };
      } else {
        delete newSelected[combo.id];
      }
      return newSelected;
    });
  };

  const handlePriceChange = (comboId: string, value: string) => { // Cambiar nombre de la función
    setSelectedCombos(prev => ({
      ...prev,
      [comboId]: { ...prev[comboId], selling_price: parseFloat(value) || 0 },
    }));
  };

  // Eliminar handleDurationChange ya que los combos no tienen duración directa aquí
  // const handleDurationChange = (comboId: string, value: string) => {
  //   setSelectedCombos(prev => ({
  //     ...prev,
  //     [comboId]: { ...prev[comboId], duration_minutes: parseInt(value) || 0 },
  //   }));
  // };

  const handleSubmit = () => {
    if (Object.keys(selectedCombos).length === 0) { // Cambiar nombre del estado
      toast({ title: "Advertencia", description: "Selecciona al menos un combo para asignar.", variant: "warning" }); // Mensaje
      return;
    }

    const combosToAssign = Object.values(selectedCombos).map(combo => ({
      combo_id: combo.combo_id,
      branch_id: branchId,
      selling_price: combo.selling_price,
      is_active: true, // Default to active
    }));

    combosToAssign.forEach(assignmentPayload => { // Cambiar nombre de la variable
      assignCombo(assignmentPayload, { // Usar assignCombo
        onSuccess: () => {
          // Individual success toast might be too much for batch, consider a single one at the end
        },
        onError: (error) => {
          toast({ title: "Error al asignar combo", description: error.message, variant: "destructive" }); // Mensaje
        },
      });
    });

    toast({ title: "Combos Asignados", description: "Los combos seleccionados han sido asignados a la sucursal.", variant: "success" }); // Mensaje
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir Combos a la Sucursal</DialogTitle> {/* Título */}
          <DialogDescription>
            Selecciona combos del catálogo general para añadir a esta sucursal. {/* Descripción */}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar combo..." // Placeholder
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          {(isLoadingMasterCombos || isLoadingBranchCombos) ? ( // Cambiar isLoading
            <div className="text-center">Cargando combos disponibles...</div> // Mensaje
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Seleccionar</TableHead>
                  <TableHead>Combo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCombos.length === 0 ? ( // Cambiar nombre de la variable
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground"> {/* Colspan ajustado */}
                      No se encontraron combos disponibles o todos ya están asignados. {/* Mensaje */}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCombos.map(combo => ( // Cambiar nombre de la variable
                    <TableRow key={combo.id}>
                      <TableCell>
                        <Checkbox
                          checked={!!selectedCombos[combo.id]} // Cambiar nombre del estado
                          onCheckedChange={(checked) => handleSelectCombo(combo, !!checked)} // Cambiar nombre de la función
                        />
                      </TableCell>
                      <TableCell className="font-medium">{combo.name}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isAssigning || Object.keys(selectedCombos).length === 0}> {/* Cambiar nombre del estado */}
            {isAssigning ? "Asignando..." : "Asignar Combos"} {/* Mensaje */}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCombosToBranchDialog;
