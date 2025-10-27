import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Filter,
  CheckCircle2 // Añadir CheckCircle2
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"; // Importar componentes de acordeón
import { useBranchProducts } from "@/hooks/useProducts";
import { useBranchFilterStore } from "@/stores/branchFilterStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/hooks/useBranches";
import { usePurchases } from "@/hooks/usePurchases";
import { useSuppliers } from "@/hooks/useSuppliers";
import { PurchaseDialog } from "@/components/PurchaseDialog";
import { SupplierDialog } from "@/components/SupplierDialog";
import { useSettings } from "@/hooks/useSettings"; // Importar useSettings
import { useAuth } from "@/contexts/AuthContext"; // Importar useAuth

import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useCompletePurchase } from "@/hooks/useCompletePurchase"; // Importar useCompletePurchase
import { useScreenSize } from "@/hooks/useScreenSize";
import { MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";



export default function Inventory() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedBranchId, setBranchId } = useBranchFilterStore();
  const { data: branches, isLoading: isLoadingBranches } = useBranches();
  const { data: products, isLoading: isLoadingProducts } = useBranchProducts();
  const { data: purchases } = usePurchases();
  const { data: suppliers } = useSuppliers();
  const { formatPrice } = usePriceFormat();
  const { data: settings, isLoading: isLoadingSettings } = useSettings(); // Obtener la configuración
  const { currentAssignment } = useAuth(); // Obtener el currentAssignment para el tenantId
  const tenantId = currentAssignment?.tenant_id; // Asegurarse de que tenantId esté disponible
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';

  const completePurchaseMutation = useCompletePurchase();

  const handleCompletePurchase = (purchaseId: string) => {
    completePurchaseMutation.mutate({ purchase_id: purchaseId });
  };

  const purchaseIndependenceMode = settings?.purchase_independence_method || "independent"; // Obtener el modo de independencia de compras

  

  // Productos con stock bajo
  const lowStockProducts = products?.filter(product => {
    const stock = product.stock_quantity || 0;
    const minStock = product.min_stock || 0;
    return stock <= minStock && product.is_branch_active;
  });

  // Productos sin stock
  const outOfStockProducts = products?.filter(product => {
    const stock = product.stock_quantity || 0;
    return stock === 0 && product.is_branch_active;
  });

  // Valor total del inventario
  const totalInventoryValue = products?.reduce((total, product) => {
    const stock = product.stock_quantity || 0;
    const cost = product.cost_price || product.selling_price;
    return total + (stock * cost);
  }, 0) || 0;

  // Compras recientes (últimas 5)
  const recentPurchases = purchases?.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Inventario"
        subtitle="Control completo de productos, stock y proveedores por sucursal"
      >
        <div className="flex gap-4 items-center">
           {purchaseIndependenceMode !== "centralized" && ( // Mostrar solo si no es centralizado
             <div className="w-64">
              <Select onValueChange={setBranchId} value={selectedBranchId || ''}>
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
           )}
          {isMobile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/app/inventory/suppliers')}>
                  Proveedores
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/app/inventory/purchases')}>
                  Compras
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/app/inventory/transfers')}>
                  Traslados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button onClick={() => navigate('/app/inventory/suppliers')}>
                Proveedores
              </Button>
              <Button onClick={() => navigate('/app/inventory/purchases')}>
                Compras
              </Button>
              <Button onClick={() => navigate('/app/inventory/transfers')}>
                Traslados
              </Button>
            </>
          )}
        </div>
      </PageHeader>

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
                  {products?.filter(p => p.is_branch_active).length || 0}
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
                            Precio: {formatPrice(product.selling_price)}
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
              <CardTitle className="flex items-center gap-2 text-primary">
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
                <Accordion type="single" collapsible className="w-full">
                  {recentPurchases?.map((purchase) => (
                    <AccordionItem key={purchase.id} value={purchase.id}>
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="text-left">
                            <p className="font-medium">{purchase.supplier?.name || "Sin Proveedor"}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(purchase.purchase_date).toLocaleDateString()} - {formatPrice(purchase.total_amount)}
                            </p>
                            {purchase.invoice_number && (
                              <p className="text-xs text-muted-foreground">Factura: {purchase.invoice_number}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={purchase.status === 'completed' ? 'default' : 'secondary'}>
                              {purchase.status === 'completed' ? 'Finalizada' : 'Borrador'}
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="p-4 border-t mt-2">
                          <h4 className="font-semibold mb-2">Detalle de Productos:</h4>
                          {purchase.items && purchase.items.length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
                              {purchase.items.map((item: any, index: number) => (
                                <li key={index} className="text-sm">
                                  {item.products?.name || "Producto Desconocido"} (x{item.quantity}) - {formatPrice(item.cost_price)} c/u
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">No hay productos en esta compra.</p>
                          )}
                          {purchase.status === 'draft' && (
                            <div className="flex justify-end p-2"> {/* Nuevo div para el botón */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleCompletePurchase(purchase.id); }}
                                disabled={completePurchaseMutation.isPending}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Completar
                              </Button>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Proveedores Activos</CardTitle>
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
                      <h4 className="font-medium text-primary">{supplier.name}</h4>
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
                <CardTitle className="text-primary">Productos Más Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500 text-center py-8">
                  Funcionalidad en desarrollo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Análisis de Costos</CardTitle>
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