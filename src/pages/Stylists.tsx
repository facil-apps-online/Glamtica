
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, User, DollarSign, Clock, Calendar, Edit, Phone, Mail, CalendarCheck, UserX } from "lucide-react";
import { useStylists } from "@/hooks/useStylists";
import { StylistDialog } from "@/components/StylistDialog";
import { StylistScheduleDialog } from "@/components/StylistScheduleDialog";
import { TimeOffRequestDialog } from "@/components/TimeOffRequestDialog";
import { TimeOffRequestsList } from "@/components/TimeOffRequestsList";

export default function Stylists() {
  const { data: stylists, isLoading } = useStylists();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Cargando estilistas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Estilistas y Barberos
          </h1>
          <p className="text-slate-600 mt-2">
            Gestiona el equipo del salón, horarios y permisos
          </p>
        </div>
        <StylistDialog />
      </div>

      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="team">Equipo</TabsTrigger>
          <TabsTrigger value="requests">Solicitudes de Permisos</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stylists?.map((stylist) => (
              <Card key={stylist.id} className="bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{stylist.name}</CardTitle>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {stylist.specialties?.map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Badge variant={stylist.is_active ? "default" : "secondary"}>
                      {stylist.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {stylist.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <span className="text-sm">{stylist.phone}</span>
                      </div>
                    )}
                    {stylist.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span className="text-sm">{stylist.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm">
                        Comisión: <span className="font-semibold">{stylist.commission_rate}%</span>
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-500">Citas Hoy</p>
                        <p className="font-semibold">0</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm text-slate-500">Ganancia Hoy</p>
                        <p className="font-semibold text-green-600">$0</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
                      <StylistScheduleDialog
                        stylistId={stylist.id}
                        stylistName={stylist.name}
                        trigger={
                          <Button variant="outline" size="sm" className="flex-1">
                            <CalendarCheck className="w-4 h-4 mr-1" />
                            Horarios
                          </Button>
                        }
                      />
                      <TimeOffRequestDialog
                        stylistId={stylist.id}
                        trigger={
                          <Button variant="outline" size="sm" className="flex-1">
                            <UserX className="w-4 h-4 mr-1" />
                            Permisos
                          </Button>
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <StylistDialog 
                        stylist={stylist}
                        trigger={
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        }
                      />
                      <Button variant="outline" size="sm">
                        <Calendar className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {stylists?.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No hay estilistas</h3>
              <p className="text-slate-600 mb-4">Comienza agregando tu primer estilista</p>
              <StylistDialog />
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Gestión de Solicitudes de Permisos</h3>
            <p className="text-slate-600">Revisa y aprueba las solicitudes de permisos del equipo</p>
          </div>
          
          {stylists?.map((stylist) => (
            <div key={stylist.id} className="space-y-4">
              <div className="flex items-center gap-3 border-b pb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-medium text-slate-900">{stylist.name}</h4>
              </div>
              <TimeOffRequestsList stylistId={stylist.id} canApprove={true} />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
