
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
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useProducts, useToggleProductStatus, Product } from "@/hooks/useProducts";
import { useBrands } from "@/hooks/useBrands";
import { ProductDialog } from "@/components/ProductDialog";
import { ProductCommissionsDialog } from "@/components/ProductCommissionsDialog";
import { usePriceFormat } from "@/hooks/usePriceFormat";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const { data: products, isLoading } = useProducts();
  const { data: brands } = useBrands();
  const toggleStatusMutation = useToggleProductStatus();
  const { formatPrice } = usePriceFormat();

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;
    const matchesBrand = !filterBrand || product.brand_id === filterBrand;
    const matchesStatus = showInactive || product.is_active;

    return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
  });

  const categories = [...new Set(products?.map(p => p.category).filter(Boolean))];

  const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: productId,
        is_active: !currentStatus,
      });
    } catch (error) {
      console.error('Error toggling product status:', error);
    }
  };

  const getStockStatus = (product: Product) => {
    const stock = product.stock_quantity || 0;
    const minStock = product.min_stock || 0;
    const maxStock = product.max_stock || 100;

    if (stock <= minStock) return 'low';
    if (stock >= maxStock) return 'high';
    return 'normal';
  };

  const getStockBadge = (product: Product) => {
    const status = getStockStatus(product);
    const stock = product.stock_quantity || 0;

    switch (status) {
      case 'low':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            {stock} - Bajo
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {stock} - Alto
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {stock} - Normal
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-slate-600">Gestiona tu inventario de productos</p>
        </div>
        <ProductDialog />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Buscar por nombre, descripción o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <select 
                className="w-full px-3 py-2 border rounded-md"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Marca</label>
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
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mostrar inactivos</label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <span className="text-sm text-slate-600">
                  {showInactive ? 'Sí' : 'No'}
                </span>
              </div>
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
                <TableHead>Precio</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts?.map((product) => {
                const brand = brands?.find(b => b.id === product.brand_id);
                
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.sku && (
                          <div className="text-sm text-slate-500">SKU: {product.sku}</div>
                        )}
                        {product.description && (
                          <div className="text-sm text-slate-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {brand ? (
                        <Badge variant="outline">{brand.name}</Badge>
                      ) : (
                        <span className="text-slate-400">Sin marca</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.category ? (
                        <Badge variant="secondary">{product.category}</Badge>
                      ) : (
                        <span className="text-slate-400">Sin categoría</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(product.price)}
                    </TableCell>
                    <TableCell>
                      {product.cost_price ? formatPrice(product.cost_price) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStockBadge(product)}
                        <div className="text-xs text-slate-500">
                          Min: {product.min_stock || 0} | Max: {product.max_stock || 100}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={product.is_active || false}
                          onCheckedChange={() => handleToggleStatus(product.id, product.is_active || false)}
                          disabled={toggleStatusMutation.isPending}
                        />
                        <span className="text-sm">
                          {product.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ProductDialog
                          product={product}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <ProductCommissionsDialog
                          productId={product.id}
                          productName={product.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredProducts?.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No se encontraron productos
              </h3>
              <p className="text-slate-600">
                {products?.length === 0 
                  ? "Aún no has agregado productos. ¡Crea tu primer producto!"
                  : "Intenta cambiar los filtros para ver más productos."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
