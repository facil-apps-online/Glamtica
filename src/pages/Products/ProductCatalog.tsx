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
  DollarSign, 
  Tag, 
  ListFilter, 
  Plus, 
  Percent 
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
import { ManageProductCommissionsDialog } from "@/components/ManageProductCommissionsDialog"; // NEW IMPORT

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

  // NEW STATE FOR COMMISSIONS DIALOG
  const [isProductCommissionsDialogOpen, setIsProductCommissionsDialogOpen] = useState(false);
  const [selectedProductForCommissions, setSelectedProductForCommissions] = useState<MasterProduct | null>(null);

  const { data: products, isLoading } = useMasterProducts(confirmedSearchTerm, showInactive, filterCategory, filterBrand);
  const { data: brands } = useBrands();
  const { data: productCategories } = useProductCategories();
  const { mutate: updateProduct } = useUpdateMasterProduct();
  const { formatPrice } = usePriceFormat();

  const filteredProducts = products;

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

  // NEW HANDLERS FOR COMMISSIONS DIALOG
  const handleOpenProductCommissionsDialog = (product: MasterProduct) => {
    setSelectedProductForCommissions(product);
    setIsProductCommissionsDialogOpen(true);
  };

  const handleProductCommissionsSuccess = () => {
    setSelectedProductForCommissions(null);
    setIsProductCommissionsDialogOpen(false);
  };

  

  return (
    <div className="relative space-y-8"> {/* Añadir relative para posicionamiento absoluto del overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
      <div style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.3s ease-in-out' }}> {/* Contenido principal con opacidad */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Catálogo de Productos</h2>
            <p className="text-muted-foreground">Crea y edita los productos base de tu negocio.</p>
          </div>
          <div className="flex items-center gap-2">
            <ProductCategoryManagementDialog trigger={<Button size="sm"><ListFilter className="w-4 h-4 mr-2" />Categorías</Button>} />
            <BrandManagementDialog trigger={<Button size="sm"><Tag className="w-4 h-4 mr-2" />Marcas</Button>} />
            <MasterProductDialog trigger={<Button size="sm"><Plus className="w-4 h-4 mr-2" />Nuevo Producto</Button>} />
          </div>
        </div>

        {/* Filtros */}
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
            </div>
          </CardContent>
        </Card>

        {/* Tabla de productos */}
        <Card className="mt-8">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead colSpan={2}>Producto</TableHead>
                  <TableHead className="w-px">Marca</TableHead>
                  <TableHead className="w-px">Categoría</TableHead>
                  <TableHead className="w-px">Costo</TableHead>
                  <TableHead className="w-px">Activo</TableHead>
                  <TableHead className="w-px">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts?.map((product: MasterProduct) => {
                  const brand = brands?.find(b => b.id === product.brand_id);
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell colSpan={2}>
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
                          <Button variant="outline" size="sm" onClick={() => handleOpenProductCommissionsDialog(product)}>
                            <Percent className="w-4 h-4" />
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
        {/* NEW DIALOG INTEGRATION */}
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
    </div>
  );
};

export default ProductCatalog;