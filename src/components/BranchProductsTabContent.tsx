import React, { useState } from "react";
import { Package, Edit, Link, PlusCircle, DollarSign } from "lucide-react";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { ManageProductInBranchDialog } from "@/components/ManageProductInBranchDialog";
import AddProductsToBranchDialog from "@/components/AddProductsToBranchDialog";
import BulkEditBranchPricesDialog from "@/components/BulkEditBranchPricesDialog";
import { useQueryClient } from "@tanstack/react-query";
import { useBranchProducts, useUpdateBranchProduct, BranchProduct } from "@/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useScreenSize } from "@/hooks/useScreenSize";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

const BranchProductCard = ({ product, formatPrice, handleToggleStatus }) => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle>{product.name}</CardTitle>
          {product.sku && <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>}
        </div>
        <Switch
          checked={product.is_branch_active}
          onCheckedChange={() => handleToggleStatus(product)}
        />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Precio de Venta</span>
        <span>{formatPrice(product.selling_price)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Stock</span>
        <span>{product.stock_quantity}</span>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
              <span className="ml-2">Acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <ManageProductInBranchDialog product={product} trigger={
                <div className="flex items-center w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  <span>Gestionar</span>
                </div>
              } />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardContent>
  </Card>
);

interface BranchProductsTabContentProps {
  branchId: string;
}

const BranchProductsTabContent: React.FC<BranchProductsTabContentProps> = ({ branchId }) => {
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isBulkEditPricesDialogOpen, setIsBulkEditPricesDialogOpen] = useState(false);
  const { data: branchProducts, isLoading: isLoadingProducts } = useBranchProducts(branchId);
  const { mutate: updateBranchProduct } = useUpdateBranchProduct();
  const { formatPrice } = usePriceFormat();
  const queryClient = useQueryClient();
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'mobile';

  const handleToggleStatus = (product: BranchProduct) => {
    updateBranchProduct({ 
      id: product.branch_product_id, 
      updates: { is_active: !product.is_branch_active } 
    });
  };

  const handleAddProductSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['branch_products', branchId] });
  };

  const handleBulkEditPricesSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['branch_products', branchId] });
  };

  if (!branchId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Link className="mx-auto h-12 w-12 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error: ID de sucursal no proporcionado</h3>
        <p>No se pueden cargar los productos sin un ID de sucursal válido.</p>
      </div>
    );
  }

  if (isLoadingProducts) {
    return <div className="text-center p-8">Cargando productos de la sucursal...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Productos de la Sucursal</CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsBulkEditPricesDialogOpen(true)} disabled={!branchProducts || branchProducts.length === 0}>
            <DollarSign className="mr-2 h-4 w-4" />
            Editar Precios Masivamente
          </Button>
          <Button size="sm" onClick={() => setIsAddProductDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Productos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isMobile ? (
          <div className="space-y-4 p-4">
            {branchProducts?.map((product: BranchProduct) => (
              <BranchProductCard 
                key={product.branch_product_id} 
                product={product} 
                formatPrice={formatPrice} 
                handleToggleStatus={handleToggleStatus} 
              />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Precio de Venta</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado en Sucursal</TableHead>
                
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
                  
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {branchProducts?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay productos en esta sucursal</h3>
            <p>Asigna productos desde el catálogo para empezar a vender.</p>
          </div>
        )}
      </CardContent>
      <AddProductsToBranchDialog
        isOpen={isAddProductDialogOpen}
        onOpenChange={setIsAddProductDialogOpen}
        branchId={branchId}
        onSuccess={handleAddProductSuccess}
      />
      {branchProducts && branchProducts.length > 0 && (
        <BulkEditBranchPricesDialog
          isOpen={isBulkEditPricesDialogOpen}
          onOpenChange={setIsBulkEditPricesDialogOpen}
          branchId={branchId}
          branchProducts={branchProducts}
          onSuccess={handleBulkEditPricesSuccess}
        />
      )}
    </Card>
  );
};


export default BranchProductsTabContent;