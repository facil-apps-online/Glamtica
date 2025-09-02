import React, { useState } from "react";
import { Package, Edit, Link, PlusCircle, DollarSign } from "lucide-react";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useQueryClient } from "@tanstack/react-query";
// Importar los hooks correctos de useServices
import { useBranchServicesAndCombos, useUpdateBranchCombo } from "@/hooks/useServices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ComboBranchPriceDialog } from "@/components/ComboBranchPriceDialog";
import { Badge } from "@/components/ui/badge";
// Importar los nuevos diálogos
import AddCombosToBranchDialog from "@/components/AddCombosToBranchDialog";
import BulkEditBranchComboPricesDialog from "@/components/BulkEditBranchComboPricesDialog";

interface BranchCombosTabContentProps {
  branchId: string;
}

const BranchCombosTabContent: React.FC<BranchCombosTabContentProps> = ({ branchId }) => {
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [selectedComboForPrices, setSelectedComboForPrices] = useState<any | null>(null); // Usar any temporalmente
  // Nuevos estados para los diálogos
  const [isAddComboDialogOpen, setIsAddComboDialogOpen] = useState(false);
  const [isBulkEditPricesDialogOpen, setIsBulkEditPricesDialogOpen] = useState(false);

  // Usar useBranchServicesAndCombos y filtrar los combos
  const { data: branchServicesAndCombos, isLoading: isLoadingCombos } = useBranchServicesAndCombos(branchId);
  const branchCombos = branchServicesAndCombos?.filter(item => item.type === 'combo') || [];

  // Usar el hook useUpdateBranchCombo
  const { mutate: updateBranchCombo } = useUpdateBranchCombo();
  const { formatPrice } = usePriceFormat();
  const queryClient = useQueryClient();

  const handleToggleStatus = (combo: any, currentBranchId: string) => { // Usar any temporalmente
    updateBranchCombo({ 
      id: combo.id, // Usar combo.id (el ID del combo maestro) para la mutación
      branchId: currentBranchId, // Pasar el branchId correcto
      updates: { is_active_in_branch: !combo.is_branch_active } 
    });
  };

  const handleOpenPriceDialog = (combo: any) => { // Usar any temporalmente
    setSelectedComboForPrices(combo);
    setIsPriceDialogOpen(true);
  };

  const calculateBasePrice = (combo: any) => { // Usar any temporalmente
    if (!combo.combo_items) return 0;
    return combo.combo_items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0);
  };

  const calculateBranchTotalPrice = (combo: any) => { // Usar any temporalmente
    if (!combo.items) return 0;
    return combo.items.reduce((total: number, item: any) => total + (item.final_price * item.quantity), 0);
  };

  const handleAddComboSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['branch_services_and_combos', branchId] });
  };

  const handleBulkEditPricesSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['branch_services_and_combos', branchId] });
  };

  if (!branchId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Link className="mx-auto h-12 w-12 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error: ID de sucursal no proporcionado</h3>
        <p>No se pueden cargar los combos sin un ID de sucursal válido.</p>
      </div>
    );
  }

  if (isLoadingCombos) {
    return <div className="text-center p-8">Cargando combos de la sucursal...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Combos de la Sucursal</CardTitle>
        <div className="flex items-center gap-2">
          {/* <Button size="sm" variant="outline" onClick={() => setIsBulkEditPricesDialogOpen(true)} disabled={!branchCombos || branchCombos.length === 0}>
            <DollarSign className="mr-2 h-4 w-4" />
            Editar Precios Masivamente
          </Button> */}
          <Button size="sm" onClick={() => setIsAddComboDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Combos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Combo</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Nº de Ítems</TableHead>
              <TableHead>Precio Base</TableHead>
              <TableHead>Precio en Sucursal</TableHead>
              <TableHead>Activo en Sucursal</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branchCombos?.map((combo: any) => ( // Usar any temporalmente
              <TableRow key={combo.id}>
                <TableCell>
                  <div className="font-medium">{combo.name}</div>
                  {combo.description && <div className="text-sm text-muted-foreground">{combo.description}</div>}
                </TableCell>
                <TableCell>{combo.sku || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{combo.items?.length || 0} Ítems</Badge>
                </TableCell>
                <TableCell>{formatPrice(calculateBasePrice(combo))}</TableCell>
                <TableCell>{formatPrice(calculateBranchTotalPrice(combo))}</TableCell>
                <TableCell>
                  <Switch
                    checked={combo.is_branch_active}
                    onCheckedChange={() => handleToggleStatus(combo, branchId)}
                  />
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleOpenPriceDialog(combo)}>
                    <Edit className="mr-2 h-4 w-4" /> Editar Precios
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {branchCombos?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay combos asignados a esta sucursal</h3>
            <p>Asigna combos desde el catálogo principal para gestionarlos aquí.</p>
          </div>
        )}
      </CardContent>
      
      {selectedComboForPrices && (
        <ComboBranchPriceDialog
          isOpen={isPriceDialogOpen}
          onOpenChange={setIsPriceDialogOpen}
          combo={selectedComboForPrices}
          branch={{ id: branchId, name: "" }} // TODO: Pasar el nombre de la sucursal real
        />
      )}

      <AddCombosToBranchDialog
        isOpen={isAddComboDialogOpen}
        onOpenChange={setIsAddComboDialogOpen}
        branchId={branchId}
        onSuccess={handleAddComboSuccess}
      />

      {/* {branchCombos && branchCombos.length > 0 && (
        <BulkEditBranchComboPricesDialog
          isOpen={isBulkEditPricesDialogOpen}
          onOpenChange={setIsBulkEditPricesDialogOpen}
          branchId={branchId}
          branchCombos={branchCombos.map(combo => ({
            id: combo.id,
            name: combo.name,
            selling_price: combo.selling_price,
            is_branch_active: combo.is_active_in_branch,
            branch_combo_id: combo.branch_combo_id,
          }))}
          onSuccess={handleBulkEditPricesSuccess}
        />
      )} */}
    </Card>
  );
};

export default BranchCombosTabContent;
