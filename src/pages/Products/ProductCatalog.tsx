
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Package, 
  Search, 
  Edit, 
  Store, 
  Share2, 
  DollarSign 
} from "lucide-react";
import { useMasterProducts, useUpdateMasterProduct, MasterProduct } from "@/hooks/useProducts";
import { useBrands } from "@/hooks/useBrands";
import { useProductCategories } from "@/hooks/useProductCategories";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { MasterProductDialog } from "@/components/MasterProductDialog";
import { ManageProductInBranchDialog } from "@/components/ManageProductInBranchDialog";
import { ProductCategoryManagementDialog } from "@/components/ProductCategoryManagementDialog";
import { BrandManagementDialog } from "@/components/BrandManagementDialog";
import AssignProductToBranchesDialog from "@/components/AssignProductToBranchesDialog";
import ManageProductPricesDialog from "@/components/ManageProductPricesDialog";

const ProductCatalog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isAssignProductDialogOpen, setIsAssignProductDialogOpen] = useState(false);
  const [selectedProductForAssignment, setSelectedProductForAssignment] = useState<MasterProduct | null>(null);
  const [isManagePricesDialogOpen, setIsManagePricesDialogOpen] = useState(false);
  const [selectedProductForPrices, setSelectedProductForPrices] = useState<MasterProduct | null>(null);

  const { data: products, isLoading } = useMasterProducts();
  const { data: brands } = useBrands();
  const { data: productCategories } = useProductCategories();
  const { mutate: updateProduct } = useUpdateMasterProduct();
  const { formatPrice } = usePriceFormat();

  const filteredProducts = products?.filter((product: MasterProduct) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;
    const matchesBrand = !filterBrand || product.brand_id === filterBrand;
    const matchesStatus = showInactive || product.is_active;

    return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
  });

  const handleToggleStatus = (product: MasterProduct) => {
    updateProduct({ id: product.id, updates: { is_active: !product.is_active } });
  };

  const handleOpenAssignProductDialog = (product: MasterProduct) => {
    setSelectedProductForAssignment(product);
    setIsAssignProductDialogOpen(true);
  };

  const handleAssignProductSuccess = () => {
    setSelectedProductForAssignment(null);
    setIsAssignProductDialogOpen(false);
  };

  const handleOpenManagePricesDialog = (product: MasterProduct) => {
    setSelectedProductForPrices(product);
    setIsManagePricesDialogOpen(true);
  };

  const handleManagePricesSuccess = () => {
    setSelectedProductForPrices(null);
    setIsManagePricesDialogOpen(false);
  };

  if (isLoading) {
    return <div className="text-center p-8">Cargando catálogo...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Catálogo General de Productos</h2>
          <p className="text-muted-foreground">Crea y edita los productos base de tu negocio.</p>
        </div>
        <div className="flex items-center gap-2">
          <ProductCategoryManagementDialog />
          <BrandManagementDialog />
          <MasterProductDialog />
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filtros del Catálogo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <Input
                placeholder="Buscar por nombre, descripción o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select 
                className="w-full px-3 py-2 border rounded-md"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {productCategories?.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
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
        </CardContent>
      </Card>

      {/* Tabla de productos */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Estado General</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts?.map((product: MasterProduct) => {
                const brand = brands?.find(b => b.id === product.brand_id);
                
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      {product.sku && <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>}
                    </TableCell>
                    <TableCell>{brand ? <Badge variant="outline">{brand.name}</Badge> : "N/A"}</TableCell>
                    <TableCell>{product.category ? <Badge variant="secondary">{product.category}</Badge> : "N/A"}</TableCell>
                    <TableCell>{product.cost_price ? formatPrice(product.cost_price) : "N/A"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={product.is_active || false}
                        onCheckedChange={() => handleToggleStatus(product)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MasterProductDialog product={product} trigger={
                          <Button variant="outline" size="sm"><Edit className="w-4 h-4" /></Button>
                        } />
                        <Button variant="outline" size="sm" onClick={() => handleOpenAssignProductDialog(product)}>
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleOpenManagePricesDialog(product)}>
                          <DollarSign className="w-4 h-4" />
                        </Button>
                        
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredProducts?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron productos en el catálogo</h3>
              <p>Intenta cambiar los filtros o crea un nuevo producto maestro.</p>
            </div>
          )}
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
    </div>
  );
};

export default ProductCatalog;
