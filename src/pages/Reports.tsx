import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useGeneralReport, useServiceReport, useUserPerformanceReport, useStockReport } from "@/hooks/useReports";
import { usePriceFormat } from "@/hooks/usePriceFormat";
import { useToast } from "@/hooks/use-toast";
import { exportToXlsx } from "@/lib/xlsx";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";
import { format as formatDate } from "date-fns";
import DatePickerButtonInput from "@/components/DatePickerButtonInput";
import { useScreenSize } from "@/hooks/useScreenSize";

registerLocale("es", es);

export default function Reports() {
  const [dateFrom, setDateFrom] = useState<Date>(new Date(new Date().setDate(1)));
  const [dateTo, setDateTo] = useState<Date>(new Date());

  const screenSize = useScreenSize();
  const isMobile = screenSize === 'mobile';

  const formattedDateFrom = formatDate(dateFrom, 'yyyy-MM-dd');
  const formattedDateTo = formatDate(dateTo, 'yyyy-MM-dd');

  const { data: generalReport } = useGeneralReport(formattedDateFrom, formattedDateTo);
  const { data: serviceReport, isLoading: isLoadingService } = useServiceReport(formattedDateFrom, formattedDateTo);
  const { data: userPerformanceReport, isLoading: isLoadingUser } = useUserPerformanceReport(formattedDateFrom, formattedDateTo);
  const { data: stockReport, isLoading: isLoadingStock } = useStockReport(formattedDateFrom, formattedDateTo);

  const { formatPrice } = usePriceFormat();
  const { toast } = useToast();

  const handleExportStock = () => {
    if (!stockReport || stockReport.length === 0) {
      toast({ title: "No hay datos para exportar", variant: "warning" });
      return;
    }
    exportToXlsx(stockReport, "Reporte de Stock", "reporte_stock.xlsx");
    toast({ title: "Exportación Exitosa", variant: "success" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes y Análisis"
        subtitle="Insights y métricas del negocio"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-card border rounded-lg">
        <div>
          <Label>Desde</Label>
          <DatePicker
            selected={dateFrom}
            onChange={(date) => setDateFrom(date as Date)}
            selectsStart
            startDate={dateFrom}
            endDate={dateTo}
            locale="es"
            dateFormat="dd/MM/yyyy"
            popperPlacement="bottom-start"
            customInput={<DatePickerButtonInput />}
            wrapperClassName="w-full"
          />
        </div>
        <div>
          <Label>Hasta</Label>
          <DatePicker
            selected={dateTo}
            onChange={(date) => setDateTo(date as Date)}
            selectsEnd
            startDate={dateFrom}
            endDate={dateTo}
            minDate={dateFrom}
            locale="es"
            dateFormat="dd/MM/yyyy"
            popperPlacement="bottom-start"
            customInput={<DatePickerButtonInput />}
            wrapperClassName="w-full"
          />
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
                isMobile ? (
                  <div className="space-y-4">
                    {serviceReport?.map((item, index) => (
                      <Card key={index}>
                        <CardHeader><CardTitle>{item.name}</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between"><span>Cantidad:</span> <strong>{item.count}</strong></div>
                          <div className="flex justify-between"><span>Ingresos:</span> <strong>{formatPrice(item.revenue)}</strong></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Servicio</TableHead><TableHead>Cantidad</TableHead><TableHead>Ingresos</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {serviceReport?.map((item, index) => (
                        <TableRow key={index}><TableCell>{item.name}</TableCell><TableCell>{item.count}</TableCell><TableCell>{formatPrice(item.revenue)}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="pt-6">
          <Card>
            <CardHeader><CardTitle>Reporte de Rendimiento por Usuario</CardTitle></CardHeader>
            <CardContent>
              {isLoadingUser ? <p>Cargando...</p> : (
                isMobile ? (
                  <div className="space-y-4">
                    {userPerformanceReport?.map((item, index) => (
                      <Card key={index}>
                        <CardHeader><CardTitle>{item.user_name}</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between"><span>Atenciones:</span> <strong>{item.attentions_count}</strong></div>
                          <div className="flex justify-between"><span>Ingresos por Servicios:</span> <strong>{formatPrice(item.services_revenue)}</strong></div>
                          <div className="flex justify-between"><span>Ingresos por Productos:</span> <strong>{formatPrice(item.products_revenue)}</strong></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>Atenciones</TableHead><TableHead>Ingresos por Servicios</TableHead><TableHead>Ingresos por Productos</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {userPerformanceReport?.map((item, index) => (
                        <TableRow key={index}><TableCell>{item.user_name}</TableCell><TableCell>{item.attentions_count}</TableCell><TableCell>{formatPrice(item.services_revenue)}</TableCell><TableCell>{formatPrice(item.products_revenue)}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
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
                isMobile ? (
                  <div className="space-y-4">
                    {stockReport?.map((item, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle>{item.product_name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{item.branch_name}</p>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between"><span>Cantidad:</span> <strong>{item.quantity}</strong></div>
                          <div className="flex justify-between"><span>Costo Unitario:</span> <strong>{formatPrice(item.cost)}</strong></div>
                          <div className="flex justify-between"><span>Valor Total Stock:</span> <strong>{formatPrice(item.stock_value)}</strong></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Sucursal</TableHead><TableHead>Producto</TableHead><TableHead>Cantidad</TableHead><TableHead>Costo Unitario</TableHead><TableHead>Valor Total Stock</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {stockReport?.map((item, index) => (
                        <TableRow key={index}><TableCell>{item.branch_name}</TableCell><TableCell>{item.product_name}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{formatPrice(item.cost)}</TableCell><TableCell>{formatPrice(item.stock_value)}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}