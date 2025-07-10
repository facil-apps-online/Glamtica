import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  ShoppingCart, 
  TrendingDown, 
  AlertTriangle,
  Plus,
  Search,
  Filter
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { usePurchases } from "@/hooks/usePurchases";
import { useSuppliers } from "@/hooks/useSuppliers";
import { PurchaseDialog } from "@/components/PurchaseDialog";
import { SupplierDialog } from "@/components/SupplierDialog";
import { usePriceFormat } from "@/hooks/usePriceFormat";

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: products } = useProducts();
  const { data: purchases } = usePurchases();
  const { data: suppliers } = useSuppliers();
  const { formatPrice } = usePriceFormat();

  // Productos con stock bajo
  const lowStockProducts = products?.filter(product => {
    const stock = product.stock_quantity || 0;
    const minStock = product.min_stock || 0;
    return stock <= minStock && product.is_active;
  });

  // Productos sin stock
  const outOfStockProducts = products?.filter(product => {
    const stock = product.stock_quantity || 0;
    return stock === 0 && product.is_active;
  });

  // Valor total del inventario
  const totalInventoryValue = products?.reduce((total, product) => {
    const stock = product.stock_quantity || 0;
    const cost = product.cost_price || product.price;
    return total + (stock * cost);
  }, 0) || 0;

  // Compras recientes (últimas 5)
  const recentPurchases = purchases?.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gestión de Inventario
          </h1>
          <p className="text-slate-600 mt-2">
            Control completo de productos, stock y proveedores
          </p>
        </div>
        <div className="flex gap-2">
          <SupplierDialog />
          <PurchaseDialog />
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(totalInventoryValue)}
                </p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Productos Activos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {products?.filter(p => p.is_active).length || 0}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-orange-600">
                  {lowStockProducts?.length || 0}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Sin Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {outOfStockProducts?.length || 0}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
          <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Productos con stock bajo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <TrendingDown className="w-5 h-5" />
                  Stock Bajo ({lowStockProducts?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockProducts?.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">
                    ¡Excelente! No hay productos con stock bajo.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lowStockProducts?.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-slate-600">
                            Stock: {product.stock_quantity} | Mínimo: {product.min_stock}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          Reabastecer
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Productos sin stock */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Sin Stock ({outOfStockProducts?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {outOfStockProducts?.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">
                    ¡Perfecto! No hay productos sin stock.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {outOfStockProducts?.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-slate-600">
                            Precio: {formatPrice(product.price)}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          Urgente
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Compras Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPurchases?.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">No hay compras registradas</p>
                  <PurchaseDialog 
                    trigger={
                      <Button className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Registrar Primera Compra
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPurchases?.map((purchase) => (
                    <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{purchase.supplier_name}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(purchase.purchase_date).toLocaleDateString()}
                        </p>
                        {purchase.invoice_number && (
                          <p className="text-sm text-slate-500">
                            Factura: {purchase.invoice_number}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatPrice(purchase.total_amount)}
                        </p>
                        <Badge variant={purchase.status === 'Completada' ? 'default' : 'secondary'}>
                          {purchase.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Proveedores Activos</CardTitle>
            </CardHeader>
            <CardContent>
              {suppliers?.filter(s => s.is_active).length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">No hay proveedores registrados</p>
                  <SupplierDialog 
                    trigger={
                      <Button className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Primer Proveedor
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suppliers?.filter(s => s.is_active).map((supplier) => (
                    <div key={supplier.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium">{supplier.name}</h4>
                      <p className="text-sm text-slate-600">
                        {supplier.identification_type}: {supplier.identification_number}
                      </p>
                      {supplier.phone && (
                        <p className="text-sm text-slate-500">{supplier.phone}</p>
                      )}
                      {supplier.email && (
                        <p className="text-sm text-slate-500">{supplier.email}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500 text-center py-8">
                  Funcionalidad en desarrollo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análisis de Costos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500 text-center py-8">
                  Funcionalidad en desarrollo
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}