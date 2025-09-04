
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Store } from "lucide-react";
import { useBranches } from "@/hooks/useBranches";
import { 
  MasterProduct, 
  BranchProduct, 
  useBranchProducts, 
  useAssignProductToBranch, 
  useUpdateBranchProduct, 
  useRemoveProductFromBranch 
} from "@/hooks/useProducts";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useToast } from "@/hooks/use-toast";

interface ManageProductInBranchDialogProps {
  product: MasterProduct; // El producto maestro que estamos gestionando
  trigger?: React.ReactNode;
}

export const ManageProductInBranchDialog = ({ product, trigger }: ManageProductInBranchDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [sellingPrice, setSellingPrice] = useState<number | string>("");
  const [stockQuantity, setStockQuantity] = useState<number | string>("");
  const [minStock, setMinStock] = useState<number | string>("");
  const [maxStock, setMaxStock] = useState<number | string>("");
  const [isActiveInBranch, setIsActiveInBranch] = useState(false);
  const [assignToAll, setAssignToAll] = useState(false);

  const { data: branches, isLoading: isLoadingBranches } = useBranches();
  const { data: branchProducts, isLoading: isLoadingBranchProducts, refetch: refetchBranchProducts } = useBranchProducts();
  const { mutate: assignProduct, isPending: isAssigning } = useAssignProductToBranch();
  const { mutate: updateBranchProduct, isPending: isUpdatingBranchProduct } = useUpdateBranchProduct();
  const { mutate: removeProductFromBranch, isPending: isRemoving } = useRemoveProductFromBranch();
  const { formatPrice } = usePriceFormat();
  const { toast } = useToast();

  const productInSelectedBranch = branchProducts?.find(
    (bp) => bp.product_id === product.id && bp.branch_id === selectedBranchId
  );

  useEffect(() => {
    if (productInSelectedBranch) {
      setSellingPrice(productInSelectedBranch.selling_price);
      setStockQuantity(productInSelectedBranch.stock_quantity);
      setMinStock(productInSelectedBranch.min_stock || "");
      setMaxStock(productInSelectedBranch.max_stock || "");
      setIsActiveInBranch(productInSelectedBranch.is_branch_active);
    } else {
      // Resetear campos si el producto no está en la sucursal seleccionada
      setSellingPrice("");
      setStockQuantity("");
      setMinStock("");
      setMaxStock("");
      setIsActiveInBranch(true); // Por defecto activo al asignar
    }
  }, [selectedBranchId, productInSelectedBranch]);

  useEffect(() => {
    if (open) {
      refetchBranchProducts();
    }
  }, [open, refetchBranchProducts]);

  const handleAssignOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId || !sellingPrice) {
      toast({ title: "Error", description: "Por favor, complete todos los campos requeridos.", variant: "destructive" });
      return;
    }

    const commonData = {
      selling_price: Number(sellingPrice),
      stock_quantity: Number(stockQuantity),
      min_stock: Number(minStock),
      max_stock: Number(maxStock),
      is_active: isActiveInBranch,
    };

    try {
      if (productInSelectedBranch) {
        // Actualizar producto existente en la sucursal
        await updateBranchProduct({
          id: productInSelectedBranch.branch_product_id,
          updates: commonData,
        });
        toast({ title: "Producto Actualizado", description: "El producto ha sido actualizado en la sucursal.", variant: "success" });
      } else {
        // Asignar nuevo producto a la(s) sucursal(es)
        const targetBranchIds = assignToAll ? (branches?.map(b => b.id) || []) : [selectedBranchId];

        if (targetBranchIds.length === 0) {
          toast({ title: "Error", description: "No hay sucursales para asignar el producto.", variant: "destructive" });
          return;
        }

        await assignProduct({
          product_id: product.id,
          branch_ids: targetBranchIds,
          defaults: commonData,
        });
        toast({ title: "Producto Asignado", description: `El producto ha sido asignado a ${targetBranchIds.length} sucursal(es).`, variant: "success" });
      }
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo guardar el producto en la sucursal.", variant: "destructive" });
    }
  };

  const handleRemoveFromBranch = async () => {
    if (productInSelectedBranch && confirm(`¿Estás seguro de que quieres desvincular ${product.name} de esta sucursal?`)) {
      try {
        await removeProductFromBranch(productInSelectedBranch.branch_product_id);
        toast({ title: "Producto Desvinculado", description: "El producto ha sido desvinculado de la sucursal.", variant: "success" });
        setOpen(false);
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "No se pudo desvincular el producto.", variant: "destructive" });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button variant="outline" size="sm"><Store className="w-4 h-4" /></Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gestionar "{product.name}" en Sucursal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAssignOrUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="branch_select">Seleccionar Sucursal</Label>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId} disabled={isLoadingBranches}>
              <SelectTrigger id="branch_select">
                <SelectValue placeholder="Elige una sucursal" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingBranches ? (
                  <SelectItem value="loading" disabled>Cargando sucursales...</SelectItem>
                ) : (
                  branches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedBranchId && selectedBranchId !== 'all' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="selling_price">Precio de Venta</Label>
                  <Input id="selling_price" type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Stock Actual</Label>
                  <Input id="stock_quantity" type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} disabled />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_stock">Stock Mínimo</Label>
                  <Input id="min_stock" type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_stock">Stock Máximo</Label>
                  <Input id="max_stock" type="number" value={maxStock} onChange={(e) => setMaxStock(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="is_active_in_branch" checked={isActiveInBranch} onCheckedChange={setIsActiveInBranch} />
                <Label htmlFor="is_active_in_branch">Activo en esta sucursal</Label>
              </div>

              {!productInSelectedBranch && (
                <div className="flex items-center space-x-2">
                  <Checkbox id="assignToAll" checked={assignToAll} onCheckedChange={() => setAssignToAll(!assignToAll)} />
                  <Label htmlFor="assignToAll">Asignar a TODAS las sucursales</Label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                {productInSelectedBranch && (
                  <Button type="button" variant="destructive" onClick={handleRemoveFromBranch} disabled={isRemoving}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Desvincular de Sucursal
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isAssigning || isUpdatingBranchProduct}>
                  {productInSelectedBranch ? "Actualizar" : "Asignar"}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
