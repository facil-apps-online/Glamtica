import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  Filter
} from "lucide-react";
import { useAppointments } from "@/hooks/useAppointments";
import { useStylists } from "@/hooks/useStylists";
import { useProducts } from "@/hooks/useProducts";
import { usePriceFormat } from "@/hooks/usePriceFormat";

export default function Reports() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { data: appointments } = useAppointments();
  const { data: stylists } = useStylists();
  const { data: products } = useProducts();
  const { formatPrice } = usePriceFormat();

  // Calcular métricas básicas
  const totalRevenue = appointments?.reduce((sum, apt) => 
    sum + (apt.grand_total || apt.total_price), 0) || 0;

  const completedAppointments = appointments?.filter(apt => 
    apt.status === 'Completada' || apt.status === 'Pagada').length || 0;

  const averageTicket = completedAppointments > 0 ? totalRevenue / completedAppointments : 0;

  // Servicios más populares
  const serviceStats = appointments?.reduce((acc, apt) => {
    const serviceName = apt.services.name;
    if (!acc[serviceName]) {
      acc[serviceName] = { count: 0, revenue: 0 };
    }
    acc[serviceName].count++;
    acc[serviceName].revenue += apt.grand_total || apt.total_price;
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  const topServices = Object.entries(serviceStats || {})
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 5);

  // Rendimiento por estilista
  const stylistStats = appointments?.reduce((acc, apt) => {
    const stylistName = apt.stylists.name;
    if (!acc[stylistName]) {
      acc[stylistName] = { appointments: 0, revenue: 0 };
    }
    acc[stylistName].appointments++;
    acc[stylistName].revenue += apt.grand_total || apt.total_price;
    return acc;
  }, {} as Record<string, { appointments: number; revenue: number }>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Reportes y Análisis
          </h1>
          <p className="text-slate-600 mt-2">
            Insights y métricas del negocio
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar Reporte
        </Button>
      </div>

      {/* Filtros de fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Fecha Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Fecha Hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-800">
                  {formatPrice(totalRevenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Citas Completadas</p>
                <p className="text-2xl font-bold text-blue-800">
                  {completedAppointments}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Ticket Promedio</p>
                <p className="text-2xl font-bold text-purple-800">
                  {formatPrice(averageTicket)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Estilistas Activos</p>
                <p className="text-2xl font-bold text-orange-800">
                  {stylists?.filter(s => s.is_active).length || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="stylists">Estilistas</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Servicios Más Populares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topServices.map(([serviceName, stats], index) => (
                  <div key={serviceName} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{serviceName}</p>
                        <p className="text-sm text-slate-600">{stats.count} servicios realizados</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatPrice(stats.revenue)}</p>
                      <p className="text-sm text-slate-500">
                        {formatPrice(stats.revenue / stats.count)} promedio
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stylists" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Estilista</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stylistStats || {}).map(([stylistName, stats]) => (
                  <div key={stylistName} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{stylistName}</p>
                        <p className="text-sm text-slate-600">{stats.appointments} citas atendidas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatPrice(stats.revenue)}</p>
                      <p className="text-sm text-slate-500">
                        {formatPrice(stats.revenue / stats.appointments)} por cita
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">
                  Análisis de productos en desarrollo
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  Próximamente: productos más vendidos, márgenes de ganancia, rotación de inventario
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendencias de Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">
                    Gráficos de tendencias en desarrollo
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análisis Temporal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">
                    Análisis por períodos en desarrollo
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}