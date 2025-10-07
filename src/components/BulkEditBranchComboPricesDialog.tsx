import React, { useState, useEffect } from 'react';
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
import { useBulkUpdateBranchComboPrices, useUpdateBranchCombo } from "@/hooks/useServices"; // Importar useBulkUpdateBranchComboPrices y useUpdateBranchCombo
import { useToast } from "@/hooks/use-toast";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useQueryClient } from "@tanstack/react-query";

// Definir un tipo para BranchCombo, similar a BranchService pero para combos
interface BranchCombo {
  id: string; // ID del combo maestro
  name: string;
  selling_price: number;
  is_branch_active: boolean;
  branch_combo_id: string; // ID de la relación combo-sucursal
  // Añadir otras propiedades relevantes de un combo en sucursal si las hay
}

interface BulkEditBranchComboPricesDialogProps { // Cambiar nombre de la interfaz
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  branchId: string;
  branchCombos: BranchCombo[]; // Cambiar a branchCombos
  onSuccess: () => void;
}

const BulkEditBranchComboPricesDialog: React.FC<BulkEditBranchComboPricesDialogProps> = ({
  isOpen,
  onOpenChange,
  branchId,
  branchCombos, // Cambiar a branchCombos
  onSuccess,
}) => {
  const { toast } = useToast();
  const { formatPrice } = usePriceFormat();
  const queryClient = useQueryClient();

  const { mutate: bulkUpdatePrices, isPending: isUpdating } = useBulkUpdateBranchComboPrices(); // Usar useBulkUpdateBranchComboPrices

  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [priceAdjustment, setPriceAdjustment] = useState<string>("");

  useEffect(() => {
    if (branchCombos) { // Cambiar a branchCombos
      const initialPrices: Record<string, number> = {};
      branchCombos.forEach(bc => { // Cambiar a bc y branchCombos
        initialPrices[bc.branch_combo_id] = bc.selling_price; // Usar branch_combo_id
      });
      setEditedPrices(initialPrices);
    }
  }, [branchCombos]); // Cambiar a branchCombos

  const handlePriceChange = (branchComboId: string, value: string) => { // Cambiar a branchComboId
    setEditedPrices(prev => ({
      ...prev,
      [branchComboId]: parseFloat(value) || 0,
    }));
  };

  const handleAdjustmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPriceAdjustment(e.target.value);
  };

  const handleApplyAdjustment = () => {
    const adjustmentValue = parseFloat(priceAdjustment);
    if (isNaN(adjustmentValue)) {
      toast({ title: "Error", description: "Por favor, introduce un valor numérico válido para el ajuste.", variant: "destructive" });
      return;
    }

    const newEditedPrices = { ...editedPrices };
    branchCombos.forEach(bc => { // Cambiar a bc y branchCombos
      newEditedPrices[bc.branch_combo_id] = bc.selling_price + adjustmentValue; // Usar branch_combo_id
    });
    setEditedPrices(newEditedPrices);
    toast({ title: "Ajuste Aplicado", description: "El ajuste de precio se ha aplicado a todos los combos.", variant: "success" }); // Mensaje
  };

  const handleSave = () => {
    const updatesPayload = Object.keys(editedPrices).map(branchComboId => ({
      combo_id: branchCombos.find(bc => bc.branch_combo_id === branchComboId)?.id || '', // Obtener el combo_id maestro
      selling_price: editedPrices[branchComboId],
    }));

    bulkUpdatePrices({ branchId, updates: updatesPayload }, { // Usar bulkUpdatePrices
      onSuccess: () => {
        toast({ title: "Precios Actualizados", description: "Los precios de los combos han sido guardados.", variant: "success" }); // Mensaje
        queryClient.invalidateQueries({ queryKey: ['branch_services_and_combos', branchId] }); // Invalidar la query correcta
        onSuccess();
        onOpenChange(false);
      },
      onError: (error) => {
        toast({ title: "Error al Guardar Precios", description: error.message, variant: "destructive" });
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edición Masiva de Precios para Combos en Sucursal</DialogTitle> {/* Título */}
          <DialogDescription>
            Ajusta los precios de venta de todos los combos en esta sucursal. {/* Descripción */}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Label htmlFor="price-adjustment" className="whitespace-nowrap">Ajuste Global (+/-):</Label>
            <Input
              id="price-adjustment"
              type="number"
              value={priceAdjustment}
              onChange={handleAdjustmentChange}
              placeholder="Ej: 5.00 o -2.50"
              step="0.01"
              className="w-40"
            />
            <Button onClick={handleApplyAdjustment}>
              Aplicar Ajuste
            </Button>
          </div>

          {branchCombos.length === 0 ? (
            <div className="text-center">No hay combos para editar en esta sucursal.</div> // Mensaje
          ) : (
            <Table>
              <TableHeader>
                <TableRow key="header-row">
                  <TableHead key="th-combo">Combo</TableHead>
                  <TableHead key="th-precio-actual">Precio Actual</TableHead>
                  <TableHead key="th-nuevo-precio">Nuevo Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchCombos.map(bc => (
                  <TableRow key={bc.branch_combo_id}> {/* Usar branch_combo_id */}
                    <TableCell className="font-medium">{bc.name}</TableCell>
                    <TableCell>{formatPrice(bc.selling_price)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={editedPrices[bc.branch_combo_id] || ''}
                        onChange={(e) => handlePriceChange(bc.branch_combo_id, e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditBranchComboPricesDialog;
