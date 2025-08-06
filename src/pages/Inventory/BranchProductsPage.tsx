
import { useState } from "react";
import { useBranchFilterStore } from "@/stores/branchFilterStore";
import { useBranches } from "@/hooks/useBranches";
import { useBranchProducts, useUpdateBranchProduct, BranchProduct } from "@/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Edit, Link, Store } from "lucide-react";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { ManageProductInBranchDialog } from "@/components/ManageProductInBranchDialog";

const BranchProductsPage = () => {
  const { selectedBranchId, setSelectedBranchId } = useBranchFilterStore();
  const { data: branches, isLoading: isLoadingBranches } = useBranches();
  const { data: branchProducts, isLoading: isLoadingProducts } = useBranchProducts();
  const { mutate: updateBranchProduct } = useUpdateBranchProduct();
  const { formatPrice } = usePriceFormat();

  const handleToggleStatus = (product: BranchProduct) => {
    updateBranchProduct({ 
      id: product.branch_product_id, 
      updates: { is_active: !product.is_branch_active } 
    });
  };

  const renderContent = () => {
    if (!selectedBranchId || selectedBranchId === 'all') {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Link className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Selecciona una sucursal</h3>
          <p>Por favor, elige una sucursal para ver y gestionar sus productos.</p>
        </div>
      );
    }

    if (isLoadingProducts) {
      return <div className="text-center p-8">Cargando productos de la sucursal...</div>;
    }

    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Precio de Venta</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado en Sucursal</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchProducts?.map((product: BranchProduct) => (
                <TableRow key={product.branch_product_id}>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    {product.sku && <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>}
                  </TableCell>
                  <TableCell>{formatPrice(product.selling_price)}</TableCell>
                  <TableCell>{product.stock_quantity}</TableCell>
                  <TableCell>
                    <Switch
                      checked={product.is_branch_active}
                      onCheckedChange={() => handleToggleStatus(product)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ManageProductInBranchDialog product={product} trigger={
                        <Button variant="outline" size="sm"><Edit className="w-4 h-4" /></Button>
                      } />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {branchProducts?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay productos en esta sucursal</h3>
              <p>Asigna productos desde el catálogo para empezar a vender.</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Productos por Sucursal</h1>
      <div className="flex justify-between items-center mb-4">
        <div className="w-64">
          <Select onValueChange={setSelectedBranchId} value={selectedBranchId || ''}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una sucursal..." />
            </SelectTrigger>
            <SelectContent>
              {isLoadingBranches ? (
                <SelectItem value="loading" disabled>Cargando sucursales...</SelectItem>
              ) : (
                branches?.map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default BranchProductsPage;
