import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useGeneralReport, useServiceReport, useUserPerformanceReport, useStockReport } from "@/hooks/useReports";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useToast } from "@/hooks/use-toast";
import { exportToXlsx } from "@/lib/xlsx";

export default function Reports() {
  const [dateFrom, setDateFrom] = useState(() => new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: generalReport, isLoading: isLoadingGeneral } = useGeneralReport(dateFrom, dateTo);
  const { data: serviceReport, isLoading: isLoadingService } = useServiceReport(dateFrom, dateTo);
  const { data: userPerformanceReport, isLoading: isLoadingUser } = useUserPerformanceReport(dateFrom, dateTo);
  const { data: stockReport, isLoading: isLoadingStock } = useStockReport();

  const { formatPrice } = usePriceFormat();
  const { toast } = useToast();

  const handleExportStock = () => {
    if (!stockReport || stockReport.length === 0) {
      toast({ title: "No hay datos para exportar", variant: "warning" });
      return;
    }
    exportToXlsx(stockReport, "Reporte de Stock", "reporte_stock.xlsx");
    toast({ title: "Exportación Exitosa" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Reportes y Análisis</h1>
          <p className="text-muted-foreground mt-2">Insights y métricas del negocio</p>
        </div>
        <div className="flex items-center gap-4">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardContent className="p-6">
          <p className="text-sm font-medium text-muted-foreground">Ingresos Totales</p>
          <p className="text-2xl font-bold">{formatPrice(generalReport?.totalRevenue || 0)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <p className="text-sm font-medium text-muted-foreground">Atenciones Finalizadas</p>
          <p className="text-2xl font-bold">{generalReport?.completedAttentions || 0}</p>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <p className="text-sm font-medium text-muted-foreground">Ticket Promedio</p>
          <p className="text-2xl font-bold">{formatPrice(generalReport?.averageTicket || 0)}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="services">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="users">Equipo</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
        </TabsList>
        <TabsContent value="services" className="pt-6">
          <Card>
            <CardHeader><CardTitle>Reporte de Servicios</CardTitle></CardHeader>
            <CardContent>
              {isLoadingService ? <p>Cargando...</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Servicio</TableHead><TableHead>Cantidad</TableHead><TableHead>Ingresos</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {serviceReport?.map((item, index) => (
                      <TableRow key={index}><TableCell>{item.name}</TableCell><TableCell>{item.count}</TableCell><TableCell>{formatPrice(item.revenue)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users" className="pt-6">
          <Card>
            <CardHeader><CardTitle>Reporte de Rendimiento por Usuario</CardTitle></CardHeader>
            <CardContent>
              {isLoadingUser ? <p>Cargando...</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>Atenciones</TableHead><TableHead>Ingresos por Servicios</TableHead><TableHead>Ingresos por Productos</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {userPerformanceReport?.map((item, index) => (
                      <TableRow key={index}><TableCell>{item.user_name}</TableCell><TableCell>{item.attentions_count}</TableCell><TableCell>{formatPrice(item.services_revenue)}</TableCell><TableCell>{formatPrice(item.products_revenue)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="stock" className="pt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Reporte de Stock</CardTitle>
              <Button variant="outline" size="sm" onClick={handleExportStock}><Download className="w-4 h-4 mr-2" />Exportar</Button>
            </CardHeader>
            <CardContent>
              {isLoadingStock ? <p>Cargando...</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Sucursal</TableHead><TableHead>Producto</TableHead><TableHead>Cantidad</TableHead><TableHead>Costo Unitario</TableHead><TableHead>Valor Total Stock</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {stockReport?.map((item, index) => (
                      <TableRow key={index}><TableCell>{item.branch_name}</TableCell><TableCell>{item.product_name}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{formatPrice(item.cost)}</TableCell><TableCell>{formatPrice(item.stock_value)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}