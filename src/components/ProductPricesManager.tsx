import React, { useState, useEffect } from 'react';
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
import { useProductBranchPrices, useUpdateBranchProduct } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useQueryClient } from "@tanstack/react-query";

interface ProductPricesManagerProps {
  productId: string;
}

const ProductPricesManager: React.FC<ProductPricesManagerProps> = ({ productId }) => {
  const { toast } = useToast();
  const { formatPrice } = usePriceFormat();
  const queryClient = useQueryClient();

  const { data: branchPrices, isLoading } = useProductBranchPrices(productId);
  const { mutate: updateBranchProduct, isPending: isUpdating } = useUpdateBranchProduct();

  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [uniformPrice, setUniformPrice] = useState<string>("");
  const [selectedBranchProductIds, setSelectedBranchProductIds] = useState<string[]>([]);

  useEffect(() => {
    if (branchPrices) {
      const initialPrices: Record<string, number> = {};
      branchPrices.forEach(bp => {
        initialPrices[bp.branch_product_id] = bp.selling_price;
      });
      setEditedPrices(initialPrices);
    }
  }, [branchPrices]);

  const handlePriceChange = (branchProductId: string, value: string) => {
    setEditedPrices(prev => ({
      ...prev,
      [branchProductId]: parseFloat(value) || 0,
    }));
  };

  const handleUniformPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUniformPrice(e.target.value);
  };

  const handleApplyUniformPrice = () => {
    const price = parseFloat(uniformPrice);
    if (isNaN(price)) {
      toast({ title: "Error", description: "Por favor, introduce un precio válido.", variant: "destructive" });
      return;
    }

    const newEditedPrices = { ...editedPrices };
    selectedBranchProductIds.forEach(id => {
      newEditedPrices[id] = price;
    });
    setEditedPrices(newEditedPrices);
    toast({ title: "Precio Unificado Aplicado", description: "El precio se ha aplicado a los productos seleccionados." });
  };

  const handleSelectBranchProduct = (branchProductId: string, isChecked: boolean) => {
    setSelectedBranchProductIds(prev => 
      isChecked ? [...prev, branchProductId] : prev.filter(id => id !== branchProductId)
    );
  };

  const handleSave = () => {
    const mutations = Object.keys(editedPrices).map(branchProductId => {
      const originalPrice = branchPrices?.find(bp => bp.branch_product_id === branchProductId)?.selling_price;
      const newPrice = editedPrices[branchProductId];
      if (originalPrice !== newPrice) {
        return new Promise<void>((resolve, reject) => {
          updateBranchProduct({
            id: branchProductId,
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
        queryClient.invalidateQueries({ queryKey: ['branch_products'] });
        queryClient.invalidateQueries({ queryKey: ['product_branch_prices', productId] });
      })
      .catch((error) => {
        toast({ title: "Error al Guardar Precios", description: error.message, variant: "destructive" });
      });
  };

  return (
    <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4 border p-4 rounded-lg">
            <Label htmlFor="uniform-price" className="whitespace-nowrap">Precio Unificado:</Label>
            <Input
              id="uniform-price"
              type="number"
              value={uniformPrice}
              onChange={handleUniformPriceChange}
              placeholder="Ej: 19.99"
              min="0"
              step="0.01"
              className="w-40"
            />
            <Button onClick={handleApplyUniformPrice} disabled={selectedBranchProductIds.length === 0 || isNaN(parseFloat(uniformPrice))}>
              Aplicar a Seleccionados
            </Button>
        </div>

          {isLoading ? (
            <div className="text-center">Cargando precios por sucursal...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Seleccionar</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Precio Actual</TableHead>
                  <TableHead>Nuevo Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchPrices?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Este producto no está asignado a ninguna sucursal.
                    </TableCell>
                  </TableRow>
                ) : (
                  branchPrices?.map(bp => (
                    <TableRow key={bp.branch_product_id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedBranchProductIds.includes(bp.branch_product_id)}
                          onCheckedChange={(checked) => handleSelectBranchProduct(bp.branch_product_id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{bp.branch_name}</TableCell>
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
                      <TableCell>{bp.is_active ? "Activo" : "Inactivo"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        <div className="flex justify-end mt-4">
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? "Guardando..." : "Guardar Precios"}
          </Button>
        </div>
    </div>
  );
};

export default ProductPricesManager;
