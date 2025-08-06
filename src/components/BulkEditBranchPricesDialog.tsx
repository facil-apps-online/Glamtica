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
import { useUpdateBranchProduct, BranchProduct } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useQueryClient } from "@tanstack/react-query";

interface BulkEditBranchPricesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  branchId: string;
  branchProducts: BranchProduct[];
  onSuccess: () => void;
}

const BulkEditBranchPricesDialog: React.FC<BulkEditBranchPricesDialogProps> = ({
  isOpen,
  onOpenChange,
  branchId,
  branchProducts,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { formatPrice } = usePriceFormat();
  const queryClient = useQueryClient();

  const { mutate: updateBranchProduct, isPending: isUpdating } = useUpdateBranchProduct();

  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [priceAdjustment, setPriceAdjustment] = useState<string>("");

  useEffect(() => {
    if (branchProducts) {
      const initialPrices: Record<string, number> = {};
      branchProducts.forEach(bp => {
        initialPrices[bp.branch_product_id] = bp.selling_price;
      });
      setEditedPrices(initialPrices);
    }
  }, [branchProducts]);

  const handlePriceChange = (branchProductId: string, value: string) => {
    setEditedPrices(prev => ({
      ...prev,
      [branchProductId]: parseFloat(value) || 0,
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
    branchProducts.forEach(bp => {
      newEditedPrices[bp.branch_product_id] = bp.selling_price + adjustmentValue;
    });
    setEditedPrices(newEditedPrices);
    toast({ title: "Ajuste Aplicado", description: "El ajuste de precio se ha aplicado a todos los productos.", variant: "success" });
  };

  const handleSave = () => {
    const mutations = branchProducts.map(bp => {
      const newPrice = editedPrices[bp.branch_product_id];
      if (bp.selling_price !== newPrice) {
        return new Promise<void>((resolve, reject) => {
          updateBranchProduct({
            id: bp.branch_product_id,
            updates: { selling_price: newPrice },
          }, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        });
      }
      return Promise.resolve();
    }).filter(Boolean);

    Promise.all(mutations)
      .then(() => {
        toast({ title: "Precios Actualizados", description: "Los precios de los productos han sido guardados.", variant: "success" });
        queryClient.invalidateQueries({ queryKey: ['branch_products', branchId] });
        onSuccess();
        onOpenChange(false);
      })
      .catch((error) => {
        toast({ title: "Error al Guardar Precios", description: error.message, variant: "destructive" });
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edición Masiva de Precios para Sucursal</DialogTitle>
          <DialogDescription>
            Ajusta los precios de venta de todos los productos en esta sucursal.
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

          {branchProducts.length === 0 ? (
            <div className="text-center">No hay productos para editar en esta sucursal.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Precio Actual</TableHead>
                  <TableHead>Nuevo Precio</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchProducts.map(bp => (
                  <TableRow key={bp.branch_product_id}>
                    <TableCell className="font-medium">{bp.name}</TableCell>
                    <TableCell>{formatPrice(bp.selling_price)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={editedPrices[bp.branch_product_id] || ''}
                        onChange={(e) => handlePriceChange(bp.branch_product_id, e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell>{bp.stock_quantity}</TableCell>
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

export default BulkEditBranchPricesDialog;
