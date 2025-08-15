import React, { useState } from "react";
import { Package, Edit, Link, PlusCircle, DollarSign } from "lucide-react";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useQueryClient } from "@tanstack/react-query";
import { Combo, useGetBranchCombos, useUpdateCombo, useUpdateBranchComboStatus } from "@/hooks/useCombos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ComboBranchPriceDialog } from "@/components/ComboBranchPriceDialog";
import { Badge } from "@/components/ui/badge";

interface BranchCombosTabContentProps {
  branchId: string;
}

const BranchCombosTabContent: React.FC<BranchCombosTabContentProps> = ({ branchId }) => {
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [selectedComboForPrices, setSelectedComboForPrices] = useState<Combo | null>(null);

  const { data: branchCombos, isLoading: isLoadingCombos } = useGetBranchCombos(branchId);
  const { mutate: updateBranchComboStatus } = useUpdateBranchComboStatus(); // Usar el nuevo hook
  const { formatPrice } = usePriceFormat();
  const queryClient = useQueryClient();

  const handleToggleStatus = (combo: Combo & { is_active_in_branch: boolean }) => {
    updateBranchComboStatus({ 
      combo_id: combo.id, 
      branch_id: branchId, 
      is_active: !combo.is_active_in_branch 
    });
  };

  const handleOpenPriceDialog = (combo: Combo) => {
    setSelectedComboForPrices(combo);
    setIsPriceDialogOpen(true);
  };

  const calculateBasePrice = (combo: Combo) => {
    if (!combo.combo_items) return 0;
    return combo.combo_items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateBranchTotalPrice = (combo: Combo & { is_active_in_branch: boolean }) => {
    if (!combo.items) return 0; // Usar combo.items que viene de ComboBranchDetails
    return combo.items.reduce((total, item) => total + (item.final_price * item.quantity), 0);
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
        {/* No hay botones de añadir/editar masivo aquí, se gestiona desde el catálogo principal */}
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
            {branchCombos?.map((combo: Combo & { is_active_in_branch: boolean }) => (
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
                    checked={combo.is_active_in_branch}
                    onCheckedChange={() => handleToggleStatus(combo)}
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
    </Card>
  );
};

export default BranchCombosTabContent;
