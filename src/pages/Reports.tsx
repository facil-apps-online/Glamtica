import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, Download, Filter } from "lucide-react";
import { useAppointments } from "@/hooks/useAppointments";
import { useSchedulableUsers } from "@/hooks/useSchedulableUsers";

import { usePriceFormat } from "@/hooks/usePriceFormat";

export default function Reports() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { data: appointments } = useAppointments();
  const { data: users } = useSchedulableUsers();
  
  const { formatPrice } = usePriceFormat();

  const totalRevenue = appointments?.reduce((sum, apt) => sum + (apt.grand_total || apt.total_amount), 0) || 0;
  const completedAppointments = appointments?.filter(apt => apt.status === 'Completada' || apt.status === 'Pagada').length || 0;
  const averageTicket = completedAppointments > 0 ? totalRevenue / completedAppointments : 0;

  const serviceStats = appointments?.reduce((acc, apt) => {
    apt.attention_services.forEach(service => {
      const serviceName = service.services.name;
      if (!acc[serviceName]) {
        acc[serviceName] = { count: 0, revenue: 0 };
      }
      acc[serviceName].count++;
      acc[serviceName].revenue += service.service_price;
    });
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  const topServices = Object.entries(serviceStats || {}).sort(([,a], [,b]) => b.count - a.count).slice(0, 5);

  const userStats = appointments?.reduce((acc, apt) => {
    apt.attention_services.forEach(service => {
      const userName = `${service.users.first_name || ''} ${service.users.last_name || ''}`.trim();
      if (!acc[userName]) {
        acc[userName] = { appointments: 0, revenue: 0 };
      }
      acc[userName].appointments++;
      acc[userName].revenue += service.service_price;
    });
    return acc;
  }, {} as Record<string, { appointments: number; revenue: number }>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Reportes y Análisis</h1>
          <p className="text-muted-foreground mt-2">Insights y métricas del negocio</p>
        </div>
        <Button variant="outline"><Download className="w-4 h-4 mr-2" />Exportar</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6">
          <p className="text-sm font-medium text-muted-foreground">Ingresos Totales</p>
          <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <p className="text-sm font-medium text-muted-foreground">Citas Completadas</p>
          <p className="text-2xl font-bold">{completedAppointments}</p>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <p className="text-sm font-medium text-muted-foreground">Ticket Promedio</p>
          <p className="text-2xl font-bold">{formatPrice(averageTicket)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <p className="text-sm font-medium text-muted-foreground">Equipo Activo</p>
          <p className="text-2xl font-bold">{users?.filter(u => u.is_active).length || 0}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="services">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="users">Equipo</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>
        <TabsContent value="services" className="pt-6">
          <Card>
            <CardHeader><CardTitle>Servicios Más Populares</CardTitle></CardHeader>
            <CardContent>
              {topServices.map(([serviceName, stats]) => (
                <div key={serviceName} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                  <div>
                    <p className="font-medium">{serviceName}</p>
                    <p className="text-sm text-muted-foreground">{stats.count} veces</p>
                  </div>
                  <p className="font-semibold">{formatPrice(stats.revenue)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users" className="pt-6">
          <Card>
            <CardHeader><CardTitle>Rendimiento por Usuario</CardTitle></CardHeader>
            <CardContent>
              {Object.entries(userStats || {}).map(([userName, stats]) => (
                <div key={userName} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                  <div>
                    <p className="font-medium">{userName}</p>
                    <p className="text-sm text-muted-foreground">{stats.appointments} servicios</p>
                  </div>
                  <p className="font-semibold">{formatPrice(stats.revenue)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}