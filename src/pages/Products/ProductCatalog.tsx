import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Package, 
  Search, 
  Edit, 
  Share2, 
  DollarSign, 
  Tag, 
  ListFilter, 
  Plus, 
  Percent, 
  SlidersHorizontal,
  MoreHorizontal,
  FileEdit,
  Trash2
} from "lucide-react";
import { useMasterProducts, useUpdateMasterProduct, useDeleteMasterProduct, MasterProduct } from "@/hooks/useProducts";
import { useBrands } from "@/hooks/useBrands";
import { useProductCategories } from "@/hooks/useProductCategories";
import { MasterProductDialog } from "@/components/MasterProductDialog";
import AssignProductToBranchesDialog from "@/components/AssignProductToBranchesDialog";
import ManageProductPricesDialog from "@/components/ManageProductPricesDialog";
import { ManageProductCommissionsDialog } from "@/components/ManageProductCommissionsDialog";
import { UnitOfMeasureManagementDialog } from "@/components/UnitOfMeasureManagementDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProductCategoryManagementDialog } from "@/components/ProductCategoryManagementDialog";
import { BrandManagementDialog } from "@/components/BrandManagementDialog";
import { ProductImageCarousel } from "@/components/product/ProductImageCarousel";

const ProductCard = ({ product, brand, handleToggleStatus, handleOpenAssignProductDialog, handleOpenManagePricesDialog, handleOpenProductCommissionsDialog, navigate, handleDelete }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleNavigate = (e: React.MouseEvent<HTMLDivElement>) => {
    // Evita la navegación si el clic fue en un botón, switch, o menú
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('[role="switch"]') ||
      target.closest('[data-radix-dropdown-menu-content]') ||
      target.closest('[role="menuitem"]') ||
      target.closest('.embla') // Evita la navegación al hacer clic en el carrusel
    ) {
      return;
    }
    navigate(`/app/products/${product.id}`);
  };

  return (
  <Card className="overflow-hidden flex flex-col">
    <ProductImageCarousel images={product.product_images} productName={product.name} />
    <div onClick={handleNavigate} className="cursor-pointer transition-colors hover:bg-muted/50 flex-grow flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{product.name}</CardTitle>
            {product.sku && <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <MasterProductDialog 
                product={product} 
                onOpenChange={setIsDialogOpen}
                trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Edit className="w-4 h-4 mr-2" />
                  <span>Edición rápida</span>
                </DropdownMenuItem>
              } />
              <DropdownMenuItem onClick={() => navigate(`/app/products/${product.id}`)}>
                <FileEdit className="w-4 h-4 mr-2" />
                Edición Completa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleOpenAssignProductDialog(product)}>
                <Share2 className="w-4 h-4 mr-2" />
                Asignar a Sucursales
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenManagePricesDialog(product)}>
                <DollarSign className="w-4 h-4 mr-2" />
                Gestionar Precios
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenProductCommissionsDialog(product)}>
                <Percent className="w-4 h-4 mr-2" />
                Gestionar Comisiones
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Estás seguro de que quieres eliminar <strong>{product.name}</strong>? Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        <div className="flex justify-between items-start gap-4">
          <span className="text-muted-foreground">Descripción</span>
          <span className="text-sm text-right">{product.description || "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Marca</span>
          <span>{brand ? <Badge variant="outline">{brand.name}</Badge> : "N/A"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Categoría(s)</span>
          <div className="flex flex-wrap gap-1 justify-end">
            {product.product_categories && product.product_categories.length > 0 ? (
              product.product_categories.map(cat => (
                <Badge key={cat.id} variant="secondary">{cat.name}</Badge>
              ))
            ) : (
              <span className="text-sm">N/A</span>
            )}
          </div>
        </div>
      </CardContent>
      <div className="p-4 pt-0">
        <div className="flex items-center justify-between rounded-md border p-3">
          <label className="text-sm font-medium">Activo</label>
          <Switch
            checked={product.is_active || false}
            onCheckedChange={() => handleToggleStatus(product)}
          />
        </div>
      </div>
    </div>
  </Card>
  );
}

const ProductCardSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="aspect-square w-full" />
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-full">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="h-10 w-full mt-4 rounded-md border flex items-center justify-between p-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-6 w-12" />
      </div>
    </CardContent>
  </Card>
);



const ProductCatalog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmedSearchTerm, setConfirmedSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isAssignProductDialogOpen, setIsAssignProductDialogOpen] = useState(false);
  const [selectedProductForAssignment, setSelectedProductForAssignment] = useState<MasterProduct | null>(null);
  const [isManagePricesDialogOpen, setIsManagePricesDialogOpen] = useState(false);
  const [selectedProductForPrices, setSelectedProductForPrices] = useState<MasterProduct | null>(null);
  const [isProductCommissionsDialogOpen, setIsProductCommissionsDialogOpen] = useState(false);
  const [selectedProductForCommissions, setSelectedProductForCommissions] = useState<MasterProduct | null>(null);

  const { data: products, isLoading, refetch } = useMasterProducts(confirmedSearchTerm, showInactive, filterCategory, filterBrand);
  const { data: brands } = useBrands();
  const { data: productCategories } = useProductCategories();
  const { mutate: updateProduct } = useUpdateMasterProduct();
  const { mutate: deleteProduct } = useDeleteMasterProduct();
  const navigate = useNavigate();

  const handleToggleStatus = (product: MasterProduct) => {
    updateProduct({ id: product.id, updates: { is_active: !product.is_active } });
  };

  const handleOpenAssignProductDialog = (product: MasterProduct) => {
    setSelectedProductForAssignment(product);
    setIsAssignProductDialogOpen(true);
  };

  const handleAssignProductSuccess = () => {
    setIsAssignProductDialogOpen(false);
    refetch();
  };

  const handleOpenManagePricesDialog = (product: MasterProduct) => {
    setSelectedProductForPrices(product);
    setIsManagePricesDialogOpen(true);
  };

  const handleManagePricesSuccess = () => {
    setIsManagePricesDialogOpen(false);
    refetch();
  };

  const handleOpenProductCommissionsDialog = (product: MasterProduct) => {
    setSelectedProductForCommissions(product);
    setIsProductCommissionsDialogOpen(true);
  };

  const handleDelete = (productId: string) => {
    deleteProduct(productId);
  };

  const handleProductCommissionsSuccess = () => {
    refetch();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
          {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      );
    }

    if (products?.length === 0) {
      return (
        <EmptyState
          Icon={Package}
          title="No se encontraron productos"
          description="Intenta cambiar los filtros o crea un nuevo producto maestro."
          action={<MasterProductDialog trigger={<Button>Nuevo Producto</Button>} />}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
        {products?.map((product: MasterProduct) => {
          const brand = brands?.find(b => b.id === product.brand_id);
          return (
            <ProductCard
              key={product.id}
              product={product}
              brand={brand}
              handleToggleStatus={handleToggleStatus}
              handleOpenAssignProductDialog={handleOpenAssignProductDialog}
              handleOpenManagePricesDialog={handleOpenManagePricesDialog}
              handleOpenProductCommissionsDialog={handleOpenProductCommissionsDialog}
              navigate={navigate}
              handleDelete={handleDelete}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Productos" subtitle="Crea y edita los productos base de tu negocio.">
        <div className="flex items-center gap-2">
          <UnitOfMeasureManagementDialog trigger={<Button variant="outline" size="sm"><SlidersHorizontal className="w-4 h-4" /><span className="hidden sm:inline ml-2">UoM</span></Button>} />
          <ProductCategoryManagementDialog trigger={<Button variant="outline" size="sm"><ListFilter className="w-4 h-4" /><span className="hidden sm:inline ml-2">Categorías</span></Button>} />
          <BrandManagementDialog trigger={<Button variant="outline" size="sm"><Tag className="w-4 h-4" /><span className="hidden sm:inline ml-2">Marcas</span></Button>} />
          <MasterProductDialog trigger={<Button size="sm"><Plus className="w-4 h-4" /><span className="hidden sm:inline ml-2">Nuevo Producto</span></Button>} />
        </div>
      </PageHeader>

      <Card className="mt-4">
        <CardContent className="py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <Input
                placeholder="Buscar por nombre, descripción o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:col-span-3"
              />
              <Button onClick={() => setConfirmedSearchTerm(searchTerm)} className="md:col-span-1">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {productCategories?.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
              >
                <option value="">Todas las marcas</option>
                {brands?.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <span className="text-sm text-muted-foreground">Mostrar inactivos</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardContent className="p-0">
          {renderContent()}
        </CardContent>
      </Card>

      {selectedProductForAssignment && (
        <AssignProductToBranchesDialog
          isOpen={isAssignProductDialogOpen}
          onOpenChange={setIsAssignProductDialogOpen}
          product={selectedProductForAssignment}
          onSuccess={handleAssignProductSuccess}
        />
      )}
      {selectedProductForPrices && (
        <ManageProductPricesDialog
          isOpen={isManagePricesDialogOpen}
          onOpenChange={setIsManagePricesDialogOpen}
          product={selectedProductForPrices}
          onSuccess={handleManagePricesSuccess}
        />
      )}
      {selectedProductForCommissions && (
        <ManageProductCommissionsDialog
          isOpen={isProductCommissionsDialogOpen}
          onOpenChange={setIsProductCommissionsDialogOpen}
          productId={selectedProductForCommissions.id}
          productName={selectedProductForCommissions.name}
          onSuccess={handleProductCommissionsSuccess}
        />
      )}
    </div>
  );
};

export default ProductCatalog;
