import React, { useState, useMemo } from "react";
import { Package, Edit, Link, PlusCircle, DollarSign, MoreHorizontal, Search, Plus } from "lucide-react";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { ManageProductInBranchDialog } from "@/components/ManageProductInBranchDialog";
import AddProductsToBranchDialog from "@/components/AddProductsToBranchDialog";
import BulkEditBranchPricesDialog from "@/components/BulkEditBranchPricesDialog";
import { useQueryClient } from "@tanstack/react-query";
import { useBranchProducts, useUpdateBranchProduct, BranchProduct } from "@/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useScreenSize } from "@/hooks/useScreenSize";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const ProductsTableSkeleton = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Producto</TableHead>
        <TableHead>Precio de Venta</TableHead>
        <TableHead>Stock</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-6 w-12" /></TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-8 w-8 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const ProductCardSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-full mt-2" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const BranchProductCard = ({ product, formatPrice, handleToggleStatus }) => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-base">{product.name}</CardTitle>
          {product.sku && <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ManageProductInBranchDialog product={product} trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Edit className="w-4 h-4 mr-2" />
                <span>Gestionar</span>
              </DropdownMenuItem>
            } />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Precio de Venta</span>
        <span>{formatPrice(product.selling_price)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Stock</span>
        <span>{product.stock_quantity}</span>
      </div>
       <div className="flex items-center justify-between rounded-md border p-3">
          <label className="text-sm font-medium">Activo en Sucursal</label>
          <Switch
            checked={product.is_branch_active}
            onCheckedChange={() => handleToggleStatus(product)}
          />
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
  const [searchTerm, setSearchTerm] = useState("");
  const { data: branchProducts, isLoading: isLoadingProducts } = useBranchProducts(branchId);
  const { mutate: updateBranchProduct } = useUpdateBranchProduct();
  const { formatPrice } = usePriceFormat();
  const queryClient = useQueryClient();
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';

  const handleToggleStatus = (product: BranchProduct) => {
    updateBranchProduct({ 
      id: product.branch_product_id, 
      updates: { is_active: !product.is_branch_active } 
    });
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['branch_products', branchId] });
  };

  const filteredProducts = useMemo(() => {
    if (!branchProducts) return [];
    return branchProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [branchProducts, searchTerm]);

  if (!branchId) {
    return (
      <EmptyState
        Icon={Link}
        title="Error: ID de sucursal no proporcionado"
        description="No se pueden cargar los productos sin un ID de sucursal válido."
      />
    );
  }

  const renderContent = () => {
    if (isLoadingProducts) {
      return isMobile ? <ProductCardSkeleton /> : <ProductsTableSkeleton />;
    }

    if (filteredProducts.length === 0) {
      return (
        <EmptyState
          Icon={Package}
          title={searchTerm ? "No se encontraron productos" : "No hay productos en esta sucursal"}
          description={searchTerm ? "Intenta con otro término de búsqueda." : "Asigna productos desde el catálogo para empezar a vender."}
          action={!searchTerm && (
            <Button onClick={() => setIsAddProductDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2"/>Añadir Productos
            </Button>
          )}
        />
      );
    }

    return isMobile ? (
      <div className="space-y-4">
        {filteredProducts.map((product: BranchProduct) => (
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
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProducts.map((product: BranchProduct) => (
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
              <TableCell className="text-right">
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <ManageProductInBranchDialog product={product} trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Edit className="w-4 h-4 mr-2" />
                        <span>Gestionar</span>
                      </DropdownMenuItem>
                    } />
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
                <Package className="h-5 w-5" />
                Productos
            </CardTitle>
            <CardDescription>Añade, edita y gestiona los productos disponibles en esta sucursal.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsBulkEditPricesDialogOpen(true)} disabled={!branchProducts || branchProducts.length === 0}>
              <DollarSign className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Editar Precios</span>
            </Button>
            <Button size="sm" onClick={() => setIsAddProductDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Añadir</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre o SKU..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {renderContent()}
        </CardContent>
      </Card>

      <AddProductsToBranchDialog
        isOpen={isAddProductDialogOpen}
        onOpenChange={setIsAddProductDialogOpen}
        branchId={branchId}
        onSuccess={handleSuccess}
      />
      {branchProducts && branchProducts.length > 0 && (
        <BulkEditBranchPricesDialog
          isOpen={isBulkEditPricesDialogOpen}
          onOpenChange={setIsBulkEditPricesDialogOpen}
          branchId={branchId}
          branchProducts={branchProducts}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default BranchProductsTabContent;
