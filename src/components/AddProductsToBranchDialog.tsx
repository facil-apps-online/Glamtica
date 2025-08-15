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
import { 
  useMasterProducts, 
  useAssignProductToBranch, 
  useBranchProducts, 
  MasterProduct 
} from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

interface AddProductsToBranchDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  branchId: string;
  onSuccess: () => void;
}

const AddProductsToBranchDialog: React.FC<AddProductsToBranchDialogProps> = ({
  isOpen,
  onOpenChange,
  branchId,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { data: masterProducts, isLoading: isLoadingMasterProducts } = useMasterProducts();
  const { data: branchProducts, isLoading: isLoadingBranchProducts } = useBranchProducts(branchId);
  const { mutate: assignProduct, isPending: isAssigning } = useAssignProductToBranch();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<{
    product_id: string;
    selling_price: number;
  }>({});

  const availableProducts = useMemo(() => {
    if (isLoadingMasterProducts || isLoadingBranchProducts) return [];
    const assignedProductIds = new Set(branchProducts?.map(bp => bp.id));
    return masterProducts?.filter(mp => !assignedProductIds.has(mp.id));
  }, [masterProducts, branchProducts, isLoadingMasterProducts, isLoadingBranchProducts]);

  const filteredProducts = availableProducts?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectProduct = (product: MasterProduct, isChecked: boolean) => {
    setSelectedProducts(prev => {
      const newSelected = { ...prev };
      if (isChecked) {
        newSelected[product.id] = {
          product_id: product.id,
          selling_price: product.cost_price || 0, // Default to cost price or 0
          stock_quantity: 0,
        };
      } else {
        delete newSelected[product.id];
      }
      return newSelected;
    });
  };

  const handlePriceChange = (productId: string, value: string) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: { ...prev[productId], selling_price: parseFloat(value) || 0 },
    }));
  };

  

  const handleSubmit = () => {
    if (Object.keys(selectedProducts).length === 0) {
      toast({ title: "Advertencia", description: "Selecciona al menos un producto para asignar.", variant: "warning" });
      return;
    }

    const productsToAssign = Object.values(selectedProducts).map(prod => ({
      product_id: prod.product_id,
      branch_ids: [branchId],
      defaults: {
        selling_price: prod.selling_price,
        stock_quantity: prod.stock_quantity,
        is_active: true, // Default to active
      },
    }));

    // Assign products one by one or in a batch if the API supports it
    // For now, let's assume assignProduct handles a single product assignment per call
    // If it supports batch, we can modify this.
    productsToAssign.forEach(assignmentPayload => {
      assignProduct(assignmentPayload, {
        onSuccess: () => {
          // Individual success toast might be too much for batch, consider a single one at the end
        },
        onError: (error) => {
          toast({ title: "Error al asignar producto", description: error.message, variant: "destructive" });
        },
      });
    });

    toast({ title: "Productos Asignados", description: "Los productos seleccionados han sido asignados a la sucursal.", variant: "success" });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] lg:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir Productos a la Sucursal</DialogTitle>
          <DialogDescription>
            Selecciona productos del catálogo general para añadir a esta sucursal.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          {(isLoadingMasterProducts || isLoadingBranchProducts) ? (
            <div className="text-center">Cargando productos disponibles...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Seleccionar</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="w-[150px]">Precio de Venta</TableHead>
                  
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No se encontraron productos disponibles o todos ya están asignados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={!!selectedProducts[product.id]}
                          onCheckedChange={(checked) => handleSelectProduct(product, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={selectedProducts[product.id]?.selling_price || ''}
                          onChange={(e) => handlePriceChange(product.id, e.target.value)}
                          disabled={!selectedProducts[product.id]}
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isAssigning || Object.keys(selectedProducts).length === 0}>
            {isAssigning ? "Asignando..." : "Asignar Productos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductsToBranchDialog;
